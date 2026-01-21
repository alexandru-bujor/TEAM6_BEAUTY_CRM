import speakeasy from 'speakeasy';
import {
  generateMfaSecret,
  verifyMfaToken,
  enableMfa,
  disableMfa,
  isMfaEnabled,
  encryptMfaSecret,
  decryptMfaSecret,
} from '../../middleware/mfa.js';
import pool from '../../database/connection.js';
import bcrypt from 'bcryptjs';

describe('MFA (Multi-Factor Authentication)', () => {
  let testUserId;
  const testEmail = 'mfatest@example.com';

  beforeAll(async () => {
    // Create test user
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name)
       VALUES (?, ?, 'customer', ?, ?)`,
      [testEmail, passwordHash, 'Test', 'User']
    );
    testUserId = result.insertId;
  });

  afterEach(async () => {
    // Clean up MFA records after each test
    await pool.execute('DELETE FROM user_mfa WHERE user_id = ?', [testUserId]);
  });

  afterAll(async () => {
    await pool.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    await pool.end();
  });

  describe('MFA Secret Generation', () => {
    it('should generate MFA secret for user', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;

      // Act
      const result = await generateMfaSecret(userId, email);

      // Assert
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toContain('otpauth://');
    });

    it('should store encrypted secret in database', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;

      // Act
      await generateMfaSecret(userId, email);

      // Assert
      const [mfaRecords] = await pool.execute(
        'SELECT secret_encrypted, secret_iv, secret_auth_tag FROM user_mfa WHERE user_id = ?',
        [userId]
      );

      expect(mfaRecords.length).toBe(1);
      expect(mfaRecords[0].secret_encrypted).toBeDefined();
      expect(mfaRecords[0].secret_iv).toBeDefined();
      expect(mfaRecords[0].secret_auth_tag).toBeDefined();
    });
  });

  describe('MFA Token Verification', () => {
    it('should verify valid TOTP token', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;
      const { secret } = await generateMfaSecret(userId, email);
      
      // Enable MFA
      await pool.execute(
        'UPDATE user_mfa SET enabled = TRUE WHERE user_id = ?',
        [userId]
      );

      // Generate valid token
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Act
      const result = await verifyMfaToken(userId, token);

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should reject invalid TOTP token', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;
      await generateMfaSecret(userId, email);
      
      // Enable MFA
      await pool.execute(
        'UPDATE user_mfa SET enabled = TRUE WHERE user_id = ?',
        [userId]
      );

      // Act
      const result = await verifyMfaToken(userId, '000000');

      // Assert
      expect(result.valid).toBe(false);
    });

    it('should reject token when MFA is not enabled', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;
      await generateMfaSecret(userId, email);
      // MFA not enabled

      // Act
      const result = await verifyMfaToken(userId, '123456');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MFA not enabled');
    });
  });

  describe('MFA Enable/Disable', () => {
    it('should enable MFA after verification', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;
      const { secret } = await generateMfaSecret(userId, email);
      
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Act
      const result = await enableMfa(userId, token);

      // Assert
      expect(result.success).toBe(true);
      
      const [mfaRecords] = await pool.execute(
        'SELECT enabled FROM user_mfa WHERE user_id = ?',
        [userId]
      );
      expect(mfaRecords[0].enabled).toBe(1);
    });

    it('should reject enabling MFA with invalid token', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;
      await generateMfaSecret(userId, email);

      // Act
      const result = await enableMfa(userId, '000000');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid verification token');
    });

    it('should disable MFA for user', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;
      const { secret } = await generateMfaSecret(userId, email);
      
      // Enable first
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });
      await enableMfa(userId, token);

      // Act
      const result = await disableMfa(userId);

      // Assert
      expect(result.success).toBe(true);
      
      const [mfaRecords] = await pool.execute(
        'SELECT enabled FROM user_mfa WHERE user_id = ?',
        [userId]
      );
      expect(mfaRecords[0].enabled).toBe(0);
    });
  });

  describe('MFA Status Check', () => {
    it('should return true when MFA is enabled', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;
      const { secret } = await generateMfaSecret(userId, email);
      
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });
      await enableMfa(userId, token);

      // Act
      const enabled = await isMfaEnabled(userId);

      // Assert
      expect(enabled).toBe(true);
    });

    it('should return false when MFA is not enabled', async () => {
      // Arrange
      const userId = testUserId;
      const email = testEmail;
      await generateMfaSecret(userId, email);
      // Not enabled

      // Act
      const enabled = await isMfaEnabled(userId);

      // Assert
      expect(enabled).toBe(false);
    });
  });

  describe('MFA Encryption', () => {
    it('should encrypt and decrypt MFA secret correctly', () => {
      // Arrange
      const originalSecret = 'TEST_SECRET_12345678901234567890';

      // Act
      const encrypted = encryptMfaSecret(originalSecret);
      const decrypted = decryptMfaSecret(encrypted);

      // Assert
      expect(encrypted.encrypted).not.toBe(originalSecret);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(decrypted).toBe(originalSecret);
    });

    it('should produce different encrypted values for same secret', () => {
      // Arrange
      const secret = 'TEST_SECRET_12345678901234567890';

      // Act
      const encrypted1 = encryptMfaSecret(secret);
      const encrypted2 = encryptMfaSecret(secret);

      // Assert
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });
});
