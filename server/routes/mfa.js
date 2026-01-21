import express from 'express';
import qrcode from 'qrcode';
import pool from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { generateMfaSecret, verifyMfaToken, enableMfa, disableMfa, isMfaEnabled } from '../middleware/mfa.js';
import { logger } from '../middleware/secureLogger.js';

const router = express.Router();

// All MFA routes require authentication
router.use(authenticateToken);

// Generate MFA secret and QR code
router.post('/setup', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if MFA is already enabled
    const alreadyEnabled = await isMfaEnabled(userId);
    if (alreadyEnabled) {
      return res.status(400).json({ error: 'MFA is already enabled for this account' });
    }

    // Get user email for QR code label
    const [users] = await pool.execute(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userEmail = users[0].email;

    // Generate MFA secret
    const mfaData = await generateMfaSecret(userId, userEmail);

    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(mfaData.qrCodeUrl);

    // Log security event
    logger.security('MFA setup initiated', {
      userId: userId,
      ip: req.ip,
    });

    res.json({
      secret: mfaData.secret, // Only returned during setup
      qrCode: qrCodeDataUrl,
      manualEntryKey: mfaData.secret,
    });
  } catch (error) {
    logger.error('MFA setup error', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
});

// Verify and enable MFA
router.post('/enable', [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { token } = req.body;

    // Verify token and enable MFA
    const result = await enableMfa(userId, token);

    if (!result.success) {
      logger.security('MFA enable failed - invalid token', {
        userId: userId,
        ip: req.ip,
      });
      return res.status(400).json({ error: result.error });
    }

    // Log security event
    logger.security('MFA enabled', {
      userId: userId,
      ip: req.ip,
    });

    res.json({
      message: 'MFA has been enabled successfully',
      enabled: true,
    });
  } catch (error) {
    logger.error('MFA enable error', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to enable MFA' });
  }
});

// Disable MFA
router.post('/disable', [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { token } = req.body;

    // Verify token before disabling
    const verification = await verifyMfaToken(userId, token);
    if (!verification.valid) {
      logger.security('MFA disable failed - invalid token', {
        userId: userId,
        ip: req.ip,
      });
      return res.status(400).json({ error: 'Invalid MFA token' });
    }

    // Disable MFA
    await disableMfa(userId);

    // Log security event
    logger.security('MFA disabled', {
      userId: userId,
      ip: req.ip,
    });

    res.json({
      message: 'MFA has been disabled successfully',
      enabled: false,
    });
  } catch (error) {
    logger.error('MFA disable error', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

// Check MFA status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const enabled = await isMfaEnabled(userId);

    res.json({
      enabled: enabled,
    });
  } catch (error) {
    logger.error('MFA status error', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to get MFA status' });
  }
});

export default router;
