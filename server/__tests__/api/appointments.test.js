import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import appointmentsRouter from '../../routes/appointments.js';
import pool from '../../database/connection.js';

const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentsRouter);

describe('Appointments API', () => {
  let customerId, salonOwnerId, salonId, serviceId, employeeId;
  let customerToken, salonOwnerToken;

  beforeAll(async () => {
    // Create test customer
    const customerPasswordHash = await bcrypt.hash('CustomerPass123!', 10);
    const [customerResult] = await pool.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
       VALUES (?, ?, 'customer', ?, ?, ?)`,
      ['appointmentcustomer@test.com', customerPasswordHash, 'Test', 'Customer', '1234567890']
    );
    customerId = customerResult.insertId;
    customerToken = jwt.sign({ userId: customerId }, process.env.JWT_SECRET);

    // Create test salon owner
    const ownerPasswordHash = await bcrypt.hash('OwnerPass123!', 10);
    const [ownerResult] = await pool.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
       VALUES (?, ?, 'salon_owner', ?, ?, ?)`,
      ['appointmentowner@test.com', ownerPasswordHash, 'Test', 'Owner', '1234567890']
    );
    salonOwnerId = ownerResult.insertId;
    salonOwnerToken = jwt.sign({ userId: salonOwnerId }, process.env.JWT_SECRET);

    // Create test salon
    const [salonResult] = await pool.execute(
      `INSERT INTO salons (owner_id, salon_name, email, phone, address, city, state, zip_code, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [salonOwnerId, 'Test Salon', 'salon@test.com', '1234567890', '123 Main St', 'NYC', 'NY', '10001']
    );
    salonId = salonResult.insertId;

    // Create test service
    const [serviceResult] = await pool.execute(
      `INSERT INTO services (salon_id, name, category, duration, price, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [salonId, 'Haircut', 'Hair Services', 30, 50.00]
    );
    serviceId = serviceResult.insertId;

    // Create test employee
    const [employeeResult] = await pool.execute(
      `INSERT INTO employees (salon_id, name, role, is_active)
       VALUES (?, ?, ?, TRUE)`,
      [salonId, 'Test Stylist', 'Stylist']
    );
    employeeId = employeeResult.insertId;
  });

  afterEach(async () => {
    await pool.execute('DELETE FROM appointments WHERE customer_id = ? OR salon_id = ?', [customerId, salonId]);
  });

  afterAll(async () => {
    await pool.execute('DELETE FROM employees WHERE salon_id = ?', [salonId]);
    await pool.execute('DELETE FROM services WHERE salon_id = ?', [salonId]);
    await pool.execute('DELETE FROM salons WHERE id = ?', [salonId]);
    await pool.execute('DELETE FROM users WHERE id IN (?, ?)', [customerId, salonOwnerId]);
    await pool.end();
  });

  describe('POST /api/appointments', () => {
    it('should create appointment with valid data', async () => {
      // Arrange
      const appointmentData = {
        salon_id: salonId,
        service_id: serviceId,
        employee_id: employeeId,
        appointment_date: '2024-12-31',
        appointment_time: '14:00',
        notes: 'Test appointment',
      };

      // Act
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.salon_id).toBe(salonId);
      expect(response.body.service_id).toBe(serviceId);
      expect(response.body.customer_id).toBe(customerId);
      expect(response.body.status).toBe('pending');
    });

    it('should reject appointment creation without authentication', async () => {
      // Arrange
      const appointmentData = {
        salon_id: salonId,
        service_id: serviceId,
        appointment_date: '2024-12-31',
        appointment_time: '14:00',
      };

      // Act
      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should reject appointment creation by salon owner', async () => {
      // Arrange
      const appointmentData = {
        salon_id: salonId,
        service_id: serviceId,
        appointment_date: '2024-12-31',
        appointment_time: '14:00',
      };

      // Act
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${salonOwnerToken}`)
        .send(appointmentData);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should reject appointment with invalid date format', async () => {
      // Arrange
      const appointmentData = {
        salon_id: salonId,
        service_id: serviceId,
        appointment_date: 'invalid-date',
        appointment_time: '14:00',
      };

      // Act
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject appointment with invalid time format', async () => {
      // Arrange
      const appointmentData = {
        salon_id: salonId,
        service_id: serviceId,
        appointment_date: '2024-12-31',
        appointment_time: '25:00', // Invalid time
      };

      // Act
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject appointment with non-existent service', async () => {
      // Arrange
      const appointmentData = {
        salon_id: salonId,
        service_id: 99999, // Non-existent service
        appointment_date: '2024-12-31',
        appointment_time: '14:00',
      };

      // Act
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Service not found');
    });

    it('should set correct price and duration from service', async () => {
      // Arrange
      const appointmentData = {
        salon_id: salonId,
        service_id: serviceId,
        appointment_date: '2024-12-31',
        appointment_time: '14:00',
      };

      // Act
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData);

      // Assert
      expect(response.status).toBe(201);
      expect(parseFloat(response.body.price)).toBe(50.00);
      expect(response.body.duration).toBe(30);
    });
  });

  describe('GET /api/appointments', () => {
    it('should return appointments for authenticated customer', async () => {
      // Arrange - Create an appointment first
      await pool.execute(
        `INSERT INTO appointments (customer_id, salon_id, service_id, appointment_date, appointment_time, duration, price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [customerId, salonId, serviceId, '2024-12-31', '14:00', 30, 50.00]
      );

      // Act
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].customer_id).toBe(customerId);
    });

    it('should return appointments for salon owner', async () => {
      // Arrange - Create an appointment first
      await pool.execute(
        `INSERT INTO appointments (customer_id, salon_id, service_id, appointment_date, appointment_time, duration, price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [customerId, salonId, serviceId, '2024-12-31', '14:00', 30, 50.00]
      );

      // Act
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${salonOwnerToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].salon_id).toBe(salonId);
    });

    it('should filter appointments by status', async () => {
      // Arrange - Create appointments with different statuses
      await pool.execute(
        `INSERT INTO appointments (customer_id, salon_id, service_id, appointment_date, appointment_time, duration, price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [customerId, salonId, serviceId, '2024-12-31', '14:00', 30, 50.00]
      );
      await pool.execute(
        `INSERT INTO appointments (customer_id, salon_id, service_id, appointment_date, appointment_time, duration, price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
        [customerId, salonId, serviceId, '2024-12-30', '15:00', 30, 50.00]
      );

      // Act
      const response = await request(app)
        .get('/api/appointments?status=pending')
        .set('Authorization', `Bearer ${customerToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.every(apt => apt.status === 'pending')).toBe(true);
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    let appointmentId;

    beforeEach(async () => {
      // Create appointment for testing
      const [result] = await pool.execute(
        `INSERT INTO appointments (customer_id, salon_id, service_id, appointment_date, appointment_time, duration, price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [customerId, salonId, serviceId, '2024-12-31', '14:00', 30, 50.00]
      );
      appointmentId = result.insertId;
    });

    it('should update appointment status', async () => {
      // Arrange
      const statusData = { status: 'confirmed' };

      // Act
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${salonOwnerToken}`)
        .send(statusData);

      // Assert
      expect(response.status).toBe(200);
      
      // Verify status was updated
      const [appointments] = await pool.execute(
        'SELECT status FROM appointments WHERE id = ?',
        [appointmentId]
      );
      expect(appointments[0].status).toBe('confirmed');
    });

    it('should reject invalid status', async () => {
      // Arrange
      const statusData = { status: 'invalid_status' };

      // Act
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${salonOwnerToken}`)
        .send(statusData);

      // Assert
      expect(response.status).toBe(400);
    });
  });
});
