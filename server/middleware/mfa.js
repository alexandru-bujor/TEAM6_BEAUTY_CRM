import speakeasy from 'speakeasy';
import crypto from 'crypto';
import pool from '../database/connection.js';

/**
 * MFA (Multi-Factor Authentication) Utilities
 * MFA secrets are encrypted at rest using AES-256-GCM
 */

// Encryption key (should be stored in environment variable)
const getEncryptionKey = () => {
  const key = process.env.MFA_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('MFA_ENCRYPTION_KEY must be at least 32 characters long');
  }
  return crypto.createHash('sha256').update(key).digest();
};

// Encrypt MFA secret
export const encryptMfaSecret = (secret) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};

// Decrypt MFA secret
export const decryptMfaSecret = (encryptedData) => {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Generate MFA secret for a user
export const generateMfaSecret = async (userId, email) => {
  const secret = speakeasy.generateSecret({
    name: `Lume (${email})`,
    issuer: 'Lume Beauty CRM',
    length: 32,
  });
  
  // Encrypt the secret before storing
  const encrypted = encryptMfaSecret(secret.base32);
  
  // Store encrypted secret in database
  await pool.execute(
    `INSERT INTO user_mfa (user_id, secret_encrypted, secret_iv, secret_auth_tag, enabled, created_at)
     VALUES (?, ?, ?, ?, FALSE, NOW())
     ON DUPLICATE KEY UPDATE
     secret_encrypted = VALUES(secret_encrypted),
     secret_iv = VALUES(secret_iv),
     secret_auth_tag = VALUES(secret_auth_tag),
     enabled = FALSE`,
    [userId, encrypted.encrypted, encrypted.iv, encrypted.authTag]
  );
  
  return {
    secret: secret.base32, // Return plain secret for QR code generation only
    qrCodeUrl: secret.otpauth_url,
  };
};

// Verify MFA token
export const verifyMfaToken = async (userId, token) => {
  try {
    // Get encrypted secret from database
    const [mfaRecords] = await pool.execute(
      'SELECT secret_encrypted, secret_iv, secret_auth_tag FROM user_mfa WHERE user_id = ? AND enabled = TRUE',
      [userId]
    );
    
    if (mfaRecords.length === 0) {
      return { valid: false, error: 'MFA not enabled for this user' };
    }
    
    const mfaRecord = mfaRecords[0];
    
    // Decrypt the secret
    const decryptedSecret = decryptMfaSecret({
      encrypted: mfaRecord.secret_encrypted,
      iv: mfaRecord.secret_iv,
      authTag: mfaRecord.secret_auth_tag,
    });
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });
    
    if (verified) {
      // Log successful MFA verification
      await pool.execute(
        'UPDATE user_mfa SET last_used_at = NOW() WHERE user_id = ?',
        [userId]
      );
    }
    
    return { valid: verified };
  } catch (error) {
    console.error('MFA verification error:', error);
    return { valid: false, error: 'MFA verification failed' };
  }
};

// Enable MFA for a user (after they verify with a token)
export const enableMfa = async (userId, verificationToken) => {
  const verification = await verifyMfaToken(userId, verificationToken);
  
  if (!verification.valid) {
    return { success: false, error: 'Invalid verification token' };
  }
  
  // Enable MFA
  await pool.execute(
    'UPDATE user_mfa SET enabled = TRUE WHERE user_id = ?',
    [userId]
  );
  
  return { success: true };
};

// Disable MFA for a user
export const disableMfa = async (userId) => {
  await pool.execute(
    'UPDATE user_mfa SET enabled = FALSE WHERE user_id = ?',
    [userId]
  );
  
  return { success: true };
};

// Check if MFA is enabled for a user
export const isMfaEnabled = async (userId) => {
  try {
    const [mfaRecords] = await pool.execute(
      'SELECT enabled FROM user_mfa WHERE user_id = ?',
      [userId]
    );
    
    return mfaRecords.length > 0 && mfaRecords[0].enabled === 1;
  } catch (error) {
    // If table doesn't exist or query fails, assume MFA is not enabled
    console.error('Error checking MFA status:', error);
    return false;
  }
};
