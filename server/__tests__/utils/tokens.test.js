import jwt from 'jsonwebtoken';

describe('JWT Token Utilities', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  const userId = 123;

  describe('Token Generation', () => {
    it('should generate token with correct payload structure', () => {
      // Arrange & Act
      const token = jwt.sign(
        { userId },
        secret,
        {
          expiresIn: '7d',
          issuer: 'lume-beauty-crm',
          audience: 'lume-beauty-crm-users',
        }
      );

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.decode(token);
      expect(decoded).toHaveProperty('userId');
      expect(decoded.userId).toBe(userId);
    });

    it('should include expiration time in token', () => {
      // Arrange & Act
      const token = jwt.sign(
        { userId },
        secret,
        { expiresIn: '1h' }
      );

      // Assert
      const decoded = jwt.decode(token);
      expect(decoded).toHaveProperty('exp');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should include issuer and audience in token', () => {
      // Arrange & Act
      const token = jwt.sign(
        { userId },
        secret,
        {
          issuer: 'lume-beauty-crm',
          audience: 'lume-beauty-crm-users',
        }
      );

      // Assert
      const decoded = jwt.decode(token);
      expect(decoded.iss).toBe('lume-beauty-crm');
      expect(decoded.aud).toBe('lume-beauty-crm-users');
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', () => {
      // Arrange
      const token = jwt.sign({ userId }, secret, { expiresIn: '1h' });

      // Act
      const decoded = jwt.verify(token, secret);

      // Assert
      expect(decoded.userId).toBe(userId);
    });

    it('should reject token with wrong secret', () => {
      // Arrange
      const token = jwt.sign({ userId }, secret, { expiresIn: '1h' });

      // Act & Assert
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('should reject expired token', () => {
      // Arrange
      const token = jwt.sign({ userId }, secret, { expiresIn: '-1h' });

      // Act & Assert
      expect(() => {
        jwt.verify(token, secret);
      }).toThrow('jwt expired');
    });

    it('should reject malformed token', () => {
      // Arrange
      const malformedToken = 'not.a.valid.token';

      // Act & Assert
      expect(() => {
        jwt.verify(malformedToken, secret);
      }).toThrow();
    });
  });

  describe('Token Payload', () => {
    it('should preserve custom claims in token', () => {
      // Arrange
      const customClaims = {
        userId: 123,
        userType: 'customer',
        email: 'test@example.com',
      };

      // Act
      const token = jwt.sign(customClaims, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret);

      // Assert
      expect(decoded.userId).toBe(customClaims.userId);
      expect(decoded.userType).toBe(customClaims.userType);
      expect(decoded.email).toBe(customClaims.email);
    });

    it('should not include sensitive data in token', () => {
      // Arrange
      const payload = {
        userId: 123,
        password: 'should-not-be-in-token',
      };

      // Act
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      const decoded = jwt.decode(token);

      // Assert
      expect(decoded).not.toHaveProperty('password');
      // Note: In production, ensure sensitive data is never included
    });
  });
});
