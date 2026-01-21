import jwt from 'jsonwebtoken';
import request from 'supertest';
import { authenticateToken } from '../../middleware/auth.js';
import express from 'express';
import pool from '../../database/connection.js';

describe('JWT Authentication', () => {
  let testUserId;
  const testEmail = 'jwttest@example.com';

  beforeAll(async () => {
    // Create test user
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name)
       VALUES (?, ?, 'customer', ?, ?)`,
      [testEmail, 'hashed', 'Test', 'User']
    );
    testUserId = result.insertId;
  });

  afterAll(async () => {
    await pool.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    await pool.end();
  });

  describe('Token Generation', () => {
    it('should generate valid JWT token with correct payload', () => {
      // Arrange
      const userId = 123;
      const secret = process.env.JWT_SECRET;

      // Act
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
      const decoded = jwt.verify(token, secret);
      expect(decoded.userId).toBe(userId);
      expect(decoded.iss).toBe('lume-beauty-crm');
      expect(decoded.aud).toBe('lume-beauty-crm-users');
    });

    it('should include expiration in token', () => {
      // Arrange
      const userId = 123;
      const secret = process.env.JWT_SECRET;

      // Act
      const token = jwt.sign(
        { userId },
        secret,
        { expiresIn: '1h' }
      );

      // Assert
      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('Token Validation', () => {
    it('should accept valid token in Authorization header', async () => {
      // Arrange
      const app = express();
      app.use(express.json());
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ user: req.user });
      });

      const token = jwt.sign(
        { userId: testUserId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(testUserId);
    });

    it('should reject request without token', async () => {
      // Arrange
      const app = express();
      app.use(express.json());
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ user: req.user });
      });

      // Act
      const response = await request(app)
        .get('/protected');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Access token required');
    });

    it('should reject expired token', async () => {
      // Arrange
      const app = express();
      app.use(express.json());
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ user: req.user });
      });

      const token = jwt.sign(
        { userId: testUserId },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired token
      );

      // Act
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Token expired');
    });

    it('should reject token with invalid signature', async () => {
      // Arrange
      const app = express();
      app.use(express.json());
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ user: req.user });
      });

      const token = jwt.sign(
        { userId: testUserId },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should reject token for non-existent user', async () => {
      // Arrange
      const app = express();
      app.use(express.json());
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ user: req.user });
      });

      const token = jwt.sign(
        { userId: 99999 }, // Non-existent user ID
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('User not found');
    });
  });
});
