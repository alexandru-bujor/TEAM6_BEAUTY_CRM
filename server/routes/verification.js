import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { verificationLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../middleware/secureLogger.js';

const router = express.Router();

// Test route to verify verification routes are loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Verification routes are working!' });
});

// Generate a 6-digit verification code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email verification code
router.post('/send-email', verificationLimiter, [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Generate verification code
    const code = generateCode();

    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Get user ID if authenticated, otherwise use email as identifier
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Not authenticated, continue without userId
      }
    }

    // If no userId, try to find user by email
    if (!userId) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      if (users.length > 0) {
        userId = users[0].id;
      }
    }

    // Invalidate previous codes for this email (even if no user_id)
    if (userId) {
      await pool.execute(
        'UPDATE verification_codes SET used = TRUE WHERE user_id = ? AND type = "email"',
        [userId]
      );
    }

    // Store code with email for verification during registration
    await pool.execute(
      'INSERT INTO verification_codes (user_id, code, type, email, expires_at) VALUES (?, ?, "email", ?, ?)',
      [userId, code, email, expiresAt]
    );

    // Log to console instead of sending email
    console.log('\n📧 EMAIL VERIFICATION CODE');
    console.log('═══════════════════════════════════════');
    console.log(`Email: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Expires at: ${expiresAt.toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');

    res.json({
      message: 'Verification code sent (check console)',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Send phone verification code
router.post('/send-phone', verificationLimiter, [
  body('phone').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;

    // Generate verification code
    const code = generateCode();

    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Get user ID if authenticated
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Not authenticated, continue without userId
      }
    }

    // If no userId, try to find user by phone
    if (!userId) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      );
      if (users.length > 0) {
        userId = users[0].id;
      }
    }

    // Invalidate previous codes for this phone (even if no user_id)
    if (userId) {
      await pool.execute(
        'UPDATE verification_codes SET used = TRUE WHERE user_id = ? AND type = "phone"',
        [userId]
      );
    }

    // Store code with phone for verification during registration
    await pool.execute(
      'INSERT INTO verification_codes (user_id, code, type, phone, expires_at) VALUES (?, ?, "phone", ?, ?)',
      [userId, code, phone, expiresAt]
    );

    // Log to console instead of sending SMS
    console.log('\n📱 PHONE VERIFICATION CODE');
    console.log('═══════════════════════════════════════');
    console.log(`Phone: ${phone}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Expires at: ${expiresAt.toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');

    res.json({
      message: 'Verification code sent (check console)',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify email code
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    // Find user (may not exist during registration)
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    let userId = null;
    if (users.length > 0) {
      userId = users[0].id;
    }

    // Check verification code by email and code
    const [codes] = await pool.execute(
      `SELECT * FROM verification_codes 
       WHERE email = ? AND code = ? AND type = 'email' 
       AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (codes.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark code as used
    await pool.execute(
      'UPDATE verification_codes SET used = TRUE WHERE id = ?',
      [codes[0].id]
    );

    // Update user email_verified status if user exists
    if (userId) {
      await pool.execute(
        'UPDATE users SET email_verified = TRUE WHERE id = ?',
        [userId]
      );
    }

    res.json({ message: 'Email verified successfully', verified: true });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Verify phone code
router.post('/verify-phone', [
  body('phone').notEmpty().trim(),
  body('code').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code } = req.body;

    // Find user (may not exist during registration)
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    let userId = null;
    if (users.length > 0) {
      userId = users[0].id;
    }

    // Check verification code by phone and code
    const [codes] = await pool.execute(
      `SELECT * FROM verification_codes 
       WHERE phone = ? AND code = ? AND type = 'phone' 
       AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (codes.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark code as used
    await pool.execute(
      'UPDATE verification_codes SET used = TRUE WHERE id = ?',
      [codes[0].id]
    );

    // Update user phone_verified status if user exists
    if (userId) {
      await pool.execute(
        'UPDATE users SET phone_verified = TRUE WHERE id = ?',
        [userId]
      );
    }

    res.json({ message: 'Phone verified successfully', verified: true });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ error: 'Failed to verify phone' });
  }
});

export default router;

