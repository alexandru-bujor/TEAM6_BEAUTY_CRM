import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register Customer
router.post('/register/customer', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, location } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
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
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Register Salon Owner
router.post('/register/salon', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
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
      return res.status(400).json({ errors: errors.array() });
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

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

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
    console.error('Salon registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(e => e.msg).join(', ');
      return res.status(400).json({ error: errorMessages });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email, password_hash, user_type, first_name, last_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

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
    console.error('Login error:', error);
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

