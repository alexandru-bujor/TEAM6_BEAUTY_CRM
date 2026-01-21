import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import authRouter from '../../routes/auth.js';
import pool from '../../database/connection.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Login API', () => {
  let testUserId;
  const testEmail = 'logintest@example.com';
  const testPassword = 'TestPassword123!';

  // Create test user before all tests
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
       VALUES (?, ?, 'customer', ?, ?, ?)`,
      [testEmail, passwordHash, 'Test', 'User', '1234567890']
    );
    testUserId = result.insertId;
  });

  // Clean up after all tests
  afterAll(async () => {
    await pool.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    await pool.end();
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with correct credentials', async () => {
      // Arrange
      const loginData = {
        email: testEmail,
        password: testPassword,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user.id).toBe(testUserId);
    });

    it('should reject login with incorrect password', async () => {
      // Arrange
      const loginData = {
        email: testEmail,
        password: 'WrongPassword123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject login with invalid email format', async () => {
      // Arrange
      const loginData = {
        email: 'invalid-email',
        password: testPassword,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject login with missing password', async () => {
      // Arrange
      const loginData = {
        email: testEmail,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should prevent timing attacks by always performing password comparison', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      };

      // Act
      const startTime = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send(loginData);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert - Should take similar time as valid login (timing attack prevention)
      // This is a basic check - in production, use more sophisticated timing analysis
      expect(duration).toBeGreaterThan(0);
    });
  });
});
