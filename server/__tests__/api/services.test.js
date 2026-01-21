import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import servicesRouter from '../../routes/services.js';
import pool from '../../database/connection.js';

const app = express();
app.use(express.json());
app.use('/api/services', servicesRouter);

describe('Services API', () => {
  let salonOwnerId, customerId, salonId;
  let salonOwnerToken, customerToken;

  beforeAll(async () => {
    // Create test salon owner
    const ownerPasswordHash = await bcrypt.hash('OwnerPass123!', 10);
    const [ownerResult] = await pool.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
       VALUES (?, ?, 'salon_owner', ?, ?, ?)`,
      ['serviceowner@test.com', ownerPasswordHash, 'Test', 'Owner', '1234567890']
    );
    salonOwnerId = ownerResult.insertId;
    salonOwnerToken = jwt.sign({ userId: salonOwnerId }, process.env.JWT_SECRET);

    // Create test customer
    const customerPasswordHash = await bcrypt.hash('CustomerPass123!', 10);
    const [customerResult] = await pool.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
       VALUES (?, ?, 'customer', ?, ?, ?)`,
      ['servicecustomer@test.com', customerPasswordHash, 'Test', 'Customer', '1234567890']
    );
    customerId = customerResult.insertId;
    customerToken = jwt.sign({ userId: customerId }, process.env.JWT_SECRET);

    // Create test salon
    const [salonResult] = await pool.execute(
      `INSERT INTO salons (owner_id, salon_name, email, phone, address, city, state, zip_code, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [salonOwnerId, 'Service Test Salon', 'salon@test.com', '1234567890', '123 Main St', 'NYC', 'NY', '10001']
    );
    salonId = salonResult.insertId;
  });

  afterEach(async () => {
    await pool.execute('DELETE FROM services WHERE salon_id = ? AND name LIKE ?', [salonId, 'Test%']);
  });

  afterAll(async () => {
    await pool.execute('DELETE FROM salons WHERE id = ?', [salonId]);
    await pool.execute('DELETE FROM users WHERE id IN (?, ?)', [salonOwnerId, customerId]);
    await pool.end();
  });

  describe('POST /api/services', () => {
    it('should create service with valid data (salon owner only)', async () => {
      // Arrange
      const serviceData = {
        name: 'Test Haircut',
        category: 'Hair Services',
        duration: 30,
        price: 50.00,
        description: 'Test service description',
      };

      // Act
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${salonOwnerToken}`)
        .send(serviceData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(serviceData.name);
      expect(response.body.category).toBe(serviceData.category);
      expect(response.body.duration).toBe(serviceData.duration);
      expect(parseFloat(response.body.price)).toBe(serviceData.price);
    });

    it('should reject service creation by customer', async () => {
      // Arrange
      const serviceData = {
        name: 'Test Service',
        category: 'Hair Services',
        duration: 30,
        price: 50.00,
      };

      // Act
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(serviceData);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should reject service creation without authentication', async () => {
      // Arrange
      const serviceData = {
        name: 'Test Service',
        category: 'Hair Services',
        duration: 30,
        price: 50.00,
      };

      // Act
      const response = await request(app)
        .post('/api/services')
        .send(serviceData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should reject service with missing required fields', async () => {
      // Arrange
      const serviceData = {
        category: 'Hair Services',
        duration: 30,
        // Missing name and price
      };

      // Act
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${salonOwnerToken}`)
        .send(serviceData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject service with negative price', async () => {
      // Arrange
      const serviceData = {
        name: 'Test Service',
        category: 'Hair Services',
        duration: 30,
        price: -10.00,
      };

      // Act
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${salonOwnerToken}`)
        .send(serviceData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject service with invalid duration', async () => {
      // Arrange
      const serviceData = {
        name: 'Test Service',
        category: 'Hair Services',
        duration: 0, // Invalid duration
        price: 50.00,
      };

      // Act
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${salonOwnerToken}`)
        .send(serviceData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/services/owner/my-services', () => {
    it('should return services for salon owner', async () => {
      // Arrange - Create a service first
      await pool.execute(
        `INSERT INTO services (salon_id, name, category, duration, price, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [salonId, 'Test Service 1', 'Hair Services', 30, 50.00]
      );

      // Act
      const response = await request(app)
        .get('/api/services/owner/my-services')
        .set('Authorization', `Bearer ${salonOwnerToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should reject access by customer', async () => {
      // Act
      const response = await request(app)
        .get('/api/services/owner/my-services')
        .set('Authorization', `Bearer ${customerToken}`);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/services/salon/:salonId', () => {
    it('should return services for a salon', async () => {
      // Arrange - Create services
      await pool.execute(
        `INSERT INTO services (salon_id, name, category, duration, price, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [salonId, 'Test Service Public', 'Hair Services', 30, 50.00]
      );

      // Act
      const response = await request(app)
        .get(`/api/services/salon/${salonId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter active services only when activeOnly=true', async () => {
      // Arrange - Create active and inactive services
      await pool.execute(
        `INSERT INTO services (salon_id, name, category, duration, price, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [salonId, 'Active Service', 'Hair Services', 30, 50.00]
      );
      await pool.execute(
        `INSERT INTO services (salon_id, name, category, duration, price, is_active)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [salonId, 'Inactive Service', 'Hair Services', 30, 50.00]
      );

      // Act
      const response = await request(app)
        .get(`/api/services/salon/${salonId}?activeOnly=true`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.every(s => s.is_active === 1)).toBe(true);
    });
  });
});
