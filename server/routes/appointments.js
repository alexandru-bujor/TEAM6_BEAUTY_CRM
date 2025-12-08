import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken, requireSalonOwner, requireCustomer } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get appointments (customer or salon owner)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, date, salonId, customerId } = req.query;
    let sql = '';
    const params = [];

    if (req.user.user_type === 'customer') {
      sql = `
        SELECT 
          a.*,
          s.salon_name,
          s.address as salon_address,
          s.city as salon_city,
          s.state as salon_state,
          s.phone as salon_phone,
          sv.name as service_name,
          sv.category as service_category,
          e.name as employee_name,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          u.phone as customer_phone,
          u.email as customer_email
        FROM appointments a
        JOIN salons s ON a.salon_id = s.id
        JOIN services sv ON a.service_id = sv.id
        LEFT JOIN employees e ON a.employee_id = e.id
        JOIN users u ON a.customer_id = u.id
        WHERE a.customer_id = ?
      `;
      params.push(req.user.id);
    } else if (req.user.user_type === 'salon_owner') {
      // Get salon ID
      const [salons] = await pool.execute(
        'SELECT id FROM salons WHERE owner_id = ?',
        [req.user.id]
      );

      if (salons.length === 0) {
        return res.status(404).json({ error: 'Salon not found' });
      }

      const salonId = salons[0].id;

      sql = `
        SELECT 
          a.*,
          s.salon_name,
          s.address as salon_address,
          s.city as salon_city,
          s.state as salon_state,
          s.phone as salon_phone,
          sv.name as service_name,
          sv.category as service_category,
          e.name as employee_name,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          u.phone as customer_phone,
          u.email as customer_email
        FROM appointments a
        JOIN salons s ON a.salon_id = s.id
        JOIN services sv ON a.service_id = sv.id
        LEFT JOIN employees e ON a.employee_id = e.id
        JOIN users u ON a.customer_id = u.id
        WHERE a.salon_id = ?
      `;
      params.push(salonId);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [appointments] = await pool.execute(sql, params);

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get single appointment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [appointments] = await pool.execute(
      `SELECT 
        a.*,
        s.salon_name,
        s.address as salon_address,
        s.city as salon_city,
        s.state as salon_state,
        s.phone as salon_phone,
        sv.name as service_name,
        sv.category as service_category,
        e.name as employee_name,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.phone as customer_phone,
        u.email as customer_email
      FROM appointments a
      JOIN salons s ON a.salon_id = s.id
      JOIN services sv ON a.service_id = sv.id
      LEFT JOIN employees e ON a.employee_id = e.id
      JOIN users u ON a.customer_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check authorization
    const appointment = appointments[0];
    if (req.user.user_type === 'customer' && appointment.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (req.user.user_type === 'salon_owner') {
      const [salons] = await pool.execute(
        'SELECT id FROM salons WHERE owner_id = ?',
        [req.user.id]
      );
      if (salons.length === 0 || salons[0].id !== appointment.salon_id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create appointment (customer only)
router.post('/', authenticateToken, requireCustomer, [
  body('salon_id').isInt(),
  body('service_id').isInt(),
  body('appointment_date').isISO8601().toDate(),
  body('appointment_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { salon_id, service_id, employee_id, appointment_date, appointment_time, notes } = req.body;

    // Get service details
    const [services] = await pool.execute(
      'SELECT duration, price FROM services WHERE id = ? AND salon_id = ? AND is_active = TRUE',
      [service_id, salon_id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found or not available' });
    }

    const service = services[0];

    // Check if employee exists and belongs to salon (if provided)
    if (employee_id) {
      const [employees] = await pool.execute(
        'SELECT id FROM employees WHERE id = ? AND salon_id = ? AND is_active = TRUE',
        [employee_id, salon_id]
      );

      if (employees.length === 0) {
        return res.status(404).json({ error: 'Employee not found or not available' });
      }
    }

    // Create appointment
    const [result] = await pool.execute(
      `INSERT INTO appointments 
       (customer_id, salon_id, service_id, employee_id, appointment_date, appointment_time, duration, price, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        req.user.id,
        salon_id,
        service_id,
        employee_id || null,
        appointment_date,
        appointment_time,
        service.duration,
        service.price,
        notes || null
      ]
    );

    const [newAppointment] = await pool.execute(
      `SELECT 
        a.*,
        s.salon_name,
        sv.name as service_name,
        e.name as employee_name
      FROM appointments a
      JOIN salons s ON a.salon_id = s.id
      JOIN services sv ON a.service_id = sv.id
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newAppointment[0]);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment status (salon owner or customer)
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Get appointment
    const [appointments] = await pool.execute(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = appointments[0];

    // Check authorization
    if (req.user.user_type === 'customer' && appointment.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (req.user.user_type === 'salon_owner') {
      const [salons] = await pool.execute(
        'SELECT id FROM salons WHERE owner_id = ?',
        [req.user.id]
      );
      if (salons.length === 0 || salons[0].id !== appointment.salon_id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // Update status
    await pool.execute(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Appointment status updated successfully' });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// Update appointment (customer can reschedule)
router.put('/:id', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, employee_id, notes } = req.body;

    // Get appointment
    const [appointments] = await pool.execute(
      'SELECT * FROM appointments WHERE id = ? AND customer_id = ?',
      [id, req.user.id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = appointments[0];

    // Only allow updates if status is pending or confirmed
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Cannot update appointment in current status' });
    }

    // Verify employee if provided
    if (employee_id) {
      const [employees] = await pool.execute(
        'SELECT id FROM employees WHERE id = ? AND salon_id = ? AND is_active = TRUE',
        [employee_id, appointment.salon_id]
      );

      if (employees.length === 0) {
        return res.status(404).json({ error: 'Employee not found or not available' });
      }
    }

    await pool.execute(
      `UPDATE appointments 
       SET appointment_date = COALESCE(?, appointment_date),
           appointment_time = COALESCE(?, appointment_time),
           employee_id = COALESCE(?, employee_id),
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [appointment_date, appointment_time, employee_id, notes, id]
    );

    const [updatedAppointment] = await pool.execute(
      `SELECT 
        a.*,
        s.salon_name,
        sv.name as service_name,
        e.name as employee_name
      FROM appointments a
      JOIN salons s ON a.salon_id = s.id
      JOIN services sv ON a.service_id = sv.id
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.id = ?`,
      [id]
    );

    res.json(updatedAppointment[0]);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Delete appointment (customer only, if pending)
router.delete('/:id', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { id } = req.params;

    // Get appointment
    const [appointments] = await pool.execute(
      'SELECT * FROM appointments WHERE id = ? AND customer_id = ?',
      [id, req.user.id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = appointments[0];

    // Only allow deletion if status is pending
    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending appointments' });
    }

    await pool.execute('DELETE FROM appointments WHERE id = ?', [id]);

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;

