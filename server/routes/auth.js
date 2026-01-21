import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { authLimiter, registrationLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../middleware/secureLogger.js';
import { isMfaEnabled, verifyMfaToken } from '../middleware/mfa.js';

const router = express.Router();

// Generate JWT token with secure settings
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'lume-beauty-crm',
      audience: 'lume-beauty-crm-users',
    }
  );
};

// Register Customer
router.post('/register/customer', registrationLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid registration data' });
    }

    const { email, password, firstName, lastName, phone, location } = req.body;

    // Check if user already exists (prevent enumeration)
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      // Generic error message to prevent enumeration
      logger.security('Registration attempt with existing email', {
        email: email,
        ip: req.ip,
      });
      return res.status(400).json({ error: 'Registration failed. Please check your information and try again.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone, location)
       VALUES (?, ?, 'customer', ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, phone, location || null]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      message: 'Customer registered successfully',
      token,
      user: {
        id: result.insertId,
        email,
        user_type: 'customer',
        first_name: firstName,
        last_name: lastName
      }
    });
  } catch (error) {
    logger.error('Registration error', error, { email: req.body.email });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Register Salon Owner
router.post('/register/salon', registrationLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('salonName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('state').notEmpty().trim(),
  body('zipCode').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid registration data' });
    }

    const {
      email,
      password,
      salonName,
      contactName,
      phone,
      address,
      city,
      state,
      zipCode,
      isIndividualStylist,
      categories
    } = req.body;

    // Check if user already exists (prevent enumeration)
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      // Generic error message to prevent enumeration
      logger.security('Salon registration attempt with existing email', {
        email: email,
        ip: req.ip,
      });
      return res.status(400).json({ error: 'Registration failed. Please check your information and try again.' });
    }

    // Hash password with increased salt rounds for better security
    const passwordHash = await bcrypt.hash(password, 12);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      const [userResult] = await connection.execute(
        `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
         VALUES (?, ?, 'salon_owner', ?, ?, ?)`,
        [email, passwordHash, contactName || salonName, '', phone]
      );

      const userId = userResult.insertId;

      // Create salon
      const [salonResult] = await connection.execute(
        `INSERT INTO salons (owner_id, salon_name, contact_name, email, phone, address, city, state, zip_code, is_individual_stylist, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [userId, salonName, contactName || null, email, phone, address, city, state, zipCode, isIndividualStylist || false]
      );

      const salonId = salonResult.insertId;

      // Add categories
      if (categories && Array.isArray(categories) && categories.length > 0) {
        const categoryValues = categories.map(cat => [salonId, cat]);
        await connection.query(
          'INSERT INTO salon_categories (salon_id, category) VALUES ?',
          [categoryValues]
        );
      }

      await connection.commit();
      connection.release();

      const token = generateToken(userId);

      res.status(201).json({
        message: 'Salon registration submitted for approval',
        token,
        user: {
          id: userId,
          email,
          user_type: 'salon_owner',
          first_name: contactName || salonName
        },
        salon: {
          id: salonId,
          salon_name: salonName,
          status: 'pending'
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    logger.error('Salon registration error', error, { email: req.body.email });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const { email, password, mfaToken } = req.body;

    // Find user (always perform password check to prevent timing attacks)
    const [users] = await pool.execute(
      'SELECT id, email, password_hash, user_type, first_name, last_name, phone FROM users WHERE email = ?',
      [email]
    );

    // Always perform bcrypt comparison to prevent timing attacks
    const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.here';
    const userHash = users.length > 0 ? users[0].password_hash : dummyHash;
    const isValidPassword = await bcrypt.compare(password, userHash);

    // Generic error message to prevent enumeration
    if (users.length === 0 || !isValidPassword) {
      logger.auth('Failed login attempt', {
        email: email,
        ip: req.ip,
        reason: users.length === 0 ? 'user_not_found' : 'invalid_password',
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if MFA is enabled (with error handling)
    let mfaEnabled = false;
    try {
      mfaEnabled = await isMfaEnabled(user.id);
    } catch (error) {
      console.error('Error checking MFA:', error);
      // Continue with login if MFA check fails
    }
    
    if (mfaEnabled) {
      if (!mfaToken) {
        return res.status(200).json({
          requiresMfa: true,
          message: 'MFA token required',
        });
      }

      const mfaVerification = await verifyMfaToken(user.id, mfaToken);
      if (!mfaVerification.valid) {
        logger.auth('Failed MFA verification', {
          userId: user.id,
          email: email,
          ip: req.ip,
        });
        return res.status(401).json({ error: 'Invalid MFA token' });
      }
    }

    const token = generateToken(user.id);

    // Log successful login
    logger.auth('Successful login', {
      userId: user.id,
      email: email,
      ip: req.ip,
      userType: user.user_type,
    });

    // Get salon info if salon owner
    let salon = null;
    if (user.user_type === 'salon_owner') {
      const [salons] = await pool.execute(
        'SELECT id, salon_name, status FROM salons WHERE owner_id = ?',
        [user.id]
      );
      salon = salons[0] || null;
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || null
      },
      salon
    });
  } catch (error) {
    logger.error('Login error', error, { email: req.body.email });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, email, user_type, first_name, last_name, phone, location, 
       date_of_birth, bio, profile_image, email_verified, phone_verified
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get salon info if salon owner
    let salon = null;
    if (user.user_type === 'salon_owner') {
      const [salons] = await pool.execute(
        `SELECT s.*, 
         GROUP_CONCAT(sc.category) as categories
         FROM salons s
         LEFT JOIN salon_categories sc ON s.id = sc.salon_id
         WHERE s.owner_id = ?
         GROUP BY s.id`,
        [user.id]
      );
      salon = salons[0] || null;
      if (salon && salon.categories) {
        salon.categories = salon.categories.split(',');
      }
    }

    res.json({ user, salon });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;

