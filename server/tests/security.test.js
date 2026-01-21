/**
 * Security Testing Suite
 * Tests authentication, authorization, and API security
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import pool from '../database/connection.js';

describe('Security Tests', () => {
  let testUserId;
  let authToken;

  beforeAll(async () => {
    // Create test user
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, user_type, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      ['security-test@example.com', passwordHash, 'customer', 'Test', 'User']
    );
    testUserId = result.insertId;
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUserId) {
      await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
    }
    await pool.end();
  });

  describe('Authentication Security', () => {
    it('should prevent user enumeration on login', async () => {
      // Test with non-existent user
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' });

      // Test with existing user but wrong password
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'security-test@example.com', password: 'wrong' });

      // Both should return same error message
      expect(response1.status).toBe(401);
      expect(response2.status).toBe(401);
      expect(response1.body.error).toBe(response2.body.error);
    });

    it('should enforce rate limiting on login', async () => {
      // Make multiple login attempts
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({ email: 'security-test@example.com', password: 'wrong' })
        );
      }

      const responses = await Promise.all(attempts);
      
      // Should get rate limited after 5 attempts
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should prevent user enumeration on registration', async () => {
      // Try to register with existing email
      const response = await request(app)
        .post('/api/auth/register/customer')
        .send({
          email: 'security-test@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
        });

      // Should not reveal that email exists
      expect(response.status).toBe(400);
      expect(response.body.error).not.toContain('already registered');
    });

    it('should enforce password complexity', async () => {
      const response = await request(app)
        .post('/api/auth/register/customer')
        .send({
          email: 'newuser@example.com',
          password: 'short', // Too short
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit registration attempts', async () => {
      const attempts = [];
      for (let i = 0; i < 4; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/register/customer')
            .send({
              email: `test${i}@example.com`,
              password: 'TestPassword123!',
              firstName: 'Test',
              lastName: 'User',
              phone: '1234567890',
            })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should rate limit password reset requests', async () => {
      const attempts = [];
      for (let i = 0; i < 4; i++) {
        attempts.push(
          request(app)
            .post('/api/password-reset/request')
            .send({ email: 'security-test@example.com' })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Password Reset Security', () => {
    it('should prevent enumeration on password reset', async () => {
      // Test with non-existent email
      const response = await request(app)
        .post('/api/password-reset/request')
        .send({ email: 'nonexistent@example.com' });

      // Should return same message regardless of email existence
      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });

    it('should enforce rate limiting on password reset', async () => {
      const attempts = [];
      for (let i = 0; i < 4; i++) {
        attempts.push(
          request(app)
            .post('/api/password-reset/request')
            .send({ email: 'security-test@example.com' })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization', () => {
    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security-test@example.com',
          password: 'TestPassword123!',
        });
      authToken = response.body.token;
    });

    it('should require authentication for protected routes', async () => {
      const response = await request(app).get('/api/users/profile');
      expect(response.status).toBe(401);
    });

    it('should validate JWT tokens', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer invalid-token`);
      expect(response.status).toBe(401);
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation', () => {
    it('should sanitize email input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com<script>alert("xss")</script>',
          password: 'password',
        });
      // Should normalize email and reject invalid format
      expect(response.status).toBe(400);
    });

    it('should prevent SQL injection', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin' OR '1'='1",
          password: 'password',
        });
      // Should handle safely (either reject or return generic error)
      expect([400, 401]).toContain(response.status);
    });
  });
});
