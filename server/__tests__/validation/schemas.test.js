import { body, validationResult } from 'express-validator';
import express from 'express';
import request from 'supertest';

const app = express();
app.use(express.json());

describe('Input Validation', () => {
  describe('Email Validation', () => {
    it('should accept valid email addresses', async () => {
      // Arrange
      app.post('/api/test', [
        body('email').isEmail().normalizeEmail(),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/test')
        .send({ email: 'test@example.com' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });

    it('should reject invalid email addresses', async () => {
      // Arrange
      app.post('/api/test2', [
        body('email').isEmail().normalizeEmail(),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/test2')
        .send({ email: 'invalid-email' });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should normalize email addresses', async () => {
      // Arrange
      app.post('/api/test3', [
        body('email').isEmail().normalizeEmail(),
      ], (req, res) => {
        res.json({ email: req.body.email });
      });

      // Act
      const response = await request(app)
        .post('/api/test3')
        .send({ email: 'Test@EXAMPLE.COM' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('Password Validation', () => {
    it('should accept passwords with minimum 8 characters', async () => {
      // Arrange
      app.post('/api/password-test', [
        body('password').isLength({ min: 8 }),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/password-test')
        .send({ password: 'Password123!' });

      // Assert
      expect(response.status).toBe(200);
    });

    it('should reject passwords shorter than 8 characters', async () => {
      // Arrange
      app.post('/api/password-test2', [
        body('password').isLength({ min: 8 }),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/password-test2')
        .send({ password: 'Short1!' });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('Integer Validation', () => {
    it('should accept valid integers', async () => {
      // Arrange
      app.post('/api/int-test', [
        body('id').isInt({ min: 1 }),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/int-test')
        .send({ id: 123 });

      // Assert
      expect(response.status).toBe(200);
    });

    it('should reject non-integer values', async () => {
      // Arrange
      app.post('/api/int-test2', [
        body('id').isInt({ min: 1 }),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/int-test2')
        .send({ id: 'not-a-number' });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should enforce minimum value constraint', async () => {
      // Arrange
      app.post('/api/int-test3', [
        body('id').isInt({ min: 1 }),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/int-test3')
        .send({ id: 0 });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('Date Validation', () => {
    it('should accept valid ISO 8601 dates', async () => {
      // Arrange
      app.post('/api/date-test', [
        body('date').isISO8601().toDate(),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/date-test')
        .send({ date: '2024-12-31' });

      // Assert
      expect(response.status).toBe(200);
    });

    it('should reject invalid date formats', async () => {
      // Arrange
      app.post('/api/date-test2', [
        body('date').isISO8601().toDate(),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/date-test2')
        .send({ date: '31-12-2024' });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('String Sanitization', () => {
    it('should trim whitespace from strings', async () => {
      // Arrange
      app.post('/api/trim-test', [
        body('name').notEmpty().trim(),
      ], (req, res) => {
        res.json({ name: req.body.name });
      });

      // Act
      const response = await request(app)
        .post('/api/trim-test')
        .send({ name: '  Test Name  ' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Name');
    });

    it('should reject empty strings after trimming', async () => {
      // Arrange
      app.post('/api/trim-test2', [
        body('name').notEmpty().trim(),
      ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        res.json({ valid: true });
      });

      // Act
      const response = await request(app)
        .post('/api/trim-test2')
        .send({ name: '   ' });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('XSS Prevention', () => {
    it('should handle potentially malicious input safely', async () => {
      // Arrange
      app.post('/api/xss-test', [
        body('input').notEmpty().trim().escape(),
      ], (req, res) => {
        res.json({ input: req.body.input });
      });

      // Act
      const response = await request(app)
        .post('/api/xss-test')
        .send({ input: '<script>alert("xss")</script>' });

      // Assert
      expect(response.status).toBe(200);
      // Input should be escaped/sanitized
      expect(response.body.input).not.toContain('<script>');
    });
  });
});
