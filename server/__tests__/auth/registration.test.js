import request from 'supertest';
import express from 'express';
import authRouter from '../../routes/auth.js';
import pool from '../../database/connection.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Registration API', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await pool.execute("DELETE FROM users WHERE email LIKE 'test%@example.com'");
    await pool.execute("DELETE FROM salons WHERE email LIKE 'test%@example.com'");
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/register/customer', () => {
    it('should register a new customer with valid data', async () => {
      // Arrange
      const userData = {
        email: 'testcustomer@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        location: 'New York',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register/customer')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.user_type).toBe('customer');
      expect(response.body.user.first_name).toBe(userData.firstName);
    });

    it('should reject registration with duplicate email', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
      };

      // Create first user
      await request(app)
        .post('/api/auth/register/customer')
        .send(userData);

      // Act - Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register/customer')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Registration failed');
    });

    it('should reject registration with invalid email format', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register/customer')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject registration with password less than 8 characters', async () => {
      // Arrange
      const userData = {
        email: 'shortpass@example.com',
        password: 'Short1!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register/customer')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should hash password before storing in database', async () => {
      // Arrange
      const userData = {
        email: 'hashtest@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
      };

      // Act
      await request(app)
        .post('/api/auth/register/customer')
        .send(userData);

      // Assert - Check password is hashed
      const [users] = await pool.execute(
        'SELECT password_hash FROM users WHERE email = ?',
        [userData.email]
      );
      
      expect(users.length).toBe(1);
      expect(users[0].password_hash).not.toBe(userData.password);
      expect(users[0].password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should reject registration with missing required fields', async () => {
      // Arrange
      const userData = {
        email: 'missing@example.com',
        password: 'SecurePass123!',
        // Missing firstName, lastName, phone
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register/customer')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/register/salon', () => {
    it('should register a new salon owner with valid data', async () => {
      // Arrange
      const salonData = {
        email: 'testsalon@example.com',
        password: 'SecurePass123!',
        salonName: 'Test Salon',
        contactName: 'Jane Owner',
        phone: '1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        categories: ['Hair Services', 'Nail Services'],
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register/salon')
        .send(salonData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('salon');
      expect(response.body.user.user_type).toBe('salon_owner');
      expect(response.body.salon.status).toBe('pending');
    });

    it('should reject salon registration with duplicate email', async () => {
      // Arrange
      const salonData = {
        email: 'duplicatesalon@example.com',
        password: 'SecurePass123!',
        salonName: 'Test Salon',
        phone: '1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      // Create first salon
      await request(app)
        .post('/api/auth/register/salon')
        .send(salonData);

      // Act - Try to register again
      const response = await request(app)
        .post('/api/auth/register/salon')
        .send(salonData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should create salon with categories in database', async () => {
      // Arrange
      const salonData = {
        email: 'saloncategories@example.com',
        password: 'SecurePass123!',
        salonName: 'Category Salon',
        phone: '1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        categories: ['Hair Services', 'Skincare'],
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register/salon')
        .send(salonData);

      // Assert
      expect(response.status).toBe(201);
      
      // Check categories were saved
      const [categories] = await pool.execute(
        'SELECT category FROM salon_categories WHERE salon_id = ?',
        [response.body.salon.id]
      );
      
      expect(categories.length).toBe(2);
      expect(categories.map(c => c.category)).toContain('Hair Services');
      expect(categories.map(c => c.category)).toContain('Skincare');
    });
  });
});
