import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../database/connection.js';
import { body, validationResult } from 'express-validator';
import { passwordResetLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../middleware/secureLogger.js';

const router = express.Router();

// Generate secure password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash reset token for storage
const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Request password reset
router.post('/request', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const { email } = req.body;

    // Always return success message (prevent enumeration)
    // Check if user exists without revealing it
    const [users] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length > 0) {
      const user = users[0];
      
      // Generate reset token
      const resetToken = generateResetToken();
      const hashedToken = hashResetToken(resetToken);
      
      // Set expiration (1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Invalidate previous tokens for this user
      await pool.execute(
        'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE',
        [user.id]
      );
      
      // Store reset token
      await pool.execute(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, NOW())`,
        [user.id, hashedToken, expiresAt]
      );
      
      // Log security event
      logger.security('Password reset requested', {
        userId: user.id,
        email: email,
        ip: req.ip,
      });
      
      // In production, send email with reset link
      // For now, log the token (in production, this should be sent via email)
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔐 PASSWORD RESET TOKEN (DEV ONLY)`);
        console.log(`Email: ${email}`);
        console.log(`Token: ${resetToken}`);
        console.log(`Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
        console.log(`Expires at: ${expiresAt.toLocaleString()}\n`);
      }
    }
    
    // Always return the same message (prevent enumeration)
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    logger.error('Password reset request error', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify reset token
router.post('/verify-token', [
  body('token').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const { token } = req.body;
    const hashedToken = hashResetToken(token);

    // Check if token exists and is valid
    const [tokens] = await pool.execute(
      `SELECT prt.*, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = ? 
       AND prt.used = FALSE 
       AND prt.expires_at > NOW()`,
      [hashedToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({
      valid: true,
      message: 'Token is valid',
    });
  } catch (error) {
    logger.error('Password reset token verification error', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Reset password with token
router.post('/reset', passwordResetLimiter, [
  body('token').notEmpty().trim(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const hashedToken = hashResetToken(token);

    // Find valid token
    const [tokens] = await pool.execute(
      `SELECT prt.*, u.id as user_id, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = ? 
       AND prt.used = FALSE 
       AND prt.expires_at > NOW()`,
      [hashedToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetToken = tokens[0];

    // Check rate limit per user
    const [recentResets] = await pool.execute(
      `SELECT COUNT(*) as count FROM password_reset_tokens 
       WHERE user_id = ? AND used = TRUE AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [resetToken.user_id]
    );

    if (recentResets[0].count >= 3) {
      logger.security('Password reset rate limit exceeded', {
        userId: resetToken.user_id,
        ip: req.ip,
      });
      return res.status(429).json({ 
        error: 'Too many password reset attempts. Please try again later.' 
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12); // Increased salt rounds

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, resetToken.user_id]
    );

    // Mark token as used
    await pool.execute(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
      [resetToken.id]
    );

    // Invalidate all other reset tokens for this user
    await pool.execute(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE AND id != ?',
      [resetToken.user_id, resetToken.id]
    );

    // Log security event
    logger.security('Password reset completed', {
      userId: resetToken.user_id,
      email: resetToken.email,
      ip: req.ip,
    });

    res.json({
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    logger.error('Password reset error', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
