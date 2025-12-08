import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken, requireSalonOwner } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all employees for a salon
router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    const { activeOnly } = req.query;

    let sql = `
      SELECT 
        e.*,
        GROUP_CONCAT(DISTINCT es.specialty) as specialties,
        GROUP_CONCAT(DISTINCT es2.day_of_week) as schedule
      FROM employees e
      LEFT JOIN employee_specialties es ON e.id = es.employee_id
      LEFT JOIN employee_schedules es2 ON e.id = es2.employee_id
      WHERE e.salon_id = ?
    `;

    const params = [salonId];

    if (activeOnly === 'true') {
      sql += ' AND e.is_active = TRUE';
    }

    sql += ' GROUP BY e.id ORDER BY e.name';

    const [employees] = await pool.execute(sql, params);

    const formattedEmployees = employees.map(emp => ({
      ...emp,
      specialties: emp.specialties ? emp.specialties.split(',') : [],
      schedule: emp.schedule ? emp.schedule.split(',') : []
    }));

    res.json(formattedEmployees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [employees] = await pool.execute(
      `SELECT 
        e.*,
        GROUP_CONCAT(DISTINCT es.specialty) as specialties,
        GROUP_CONCAT(DISTINCT es2.day_of_week) as schedule
      FROM employees e
      LEFT JOIN employee_specialties es ON e.id = es.employee_id
      LEFT JOIN employee_schedules es2 ON e.id = es2.employee_id
      WHERE e.id = ?
      GROUP BY e.id`,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = employees[0];
    employee.specialties = employee.specialties ? employee.specialties.split(',') : [];
    employee.schedule = employee.schedule ? employee.schedule.split(',') : [];

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Get salon owner's employees
router.get('/owner/my-employees', authenticateToken, requireSalonOwner, async (req, res) => {
  try {
    // Get salon ID
    const [salons] = await pool.execute(
      'SELECT id FROM salons WHERE owner_id = ?',
      [req.user.id]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salonId = salons[0].id;

    const [employees] = await pool.execute(
      `SELECT 
        e.*,
        GROUP_CONCAT(DISTINCT es.specialty) as specialties,
        GROUP_CONCAT(DISTINCT es2.day_of_week) as schedule
      FROM employees e
      LEFT JOIN employee_specialties es ON e.id = es.employee_id
      LEFT JOIN employee_schedules es2 ON e.id = es2.employee_id
      WHERE e.salon_id = ?
      GROUP BY e.id ORDER BY e.name`,
      [salonId]
    );

    const formattedEmployees = employees.map(emp => ({
      ...emp,
      specialties: emp.specialties ? emp.specialties.split(',') : [],
      schedule: emp.schedule ? emp.schedule.split(',') : []
    }));

    res.json(formattedEmployees);
  } catch (error) {
    console.error('Get my employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Create employee (salon owner only)
router.post('/', authenticateToken, requireSalonOwner, [
  body('name').notEmpty().trim(),
  body('role').notEmpty().trim(),
  body('email').optional().isEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get salon ID
    const [salons] = await pool.execute(
      'SELECT id FROM salons WHERE owner_id = ?',
      [req.user.id]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salonId = salons[0].id;

    const { name, role, email, phone, bio, image, experience, specialties, schedule, is_active } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create employee
      const [result] = await connection.execute(
        `INSERT INTO employees (salon_id, name, role, email, phone, bio, image, experience, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [salonId, name, role, email || null, phone || null, bio || null, image || null, experience || 0, is_active !== false]
      );

      const employeeId = result.insertId;

      // Add specialties
      if (specialties && Array.isArray(specialties) && specialties.length > 0) {
        const specialtyValues = specialties.map(spec => [employeeId, spec]);
        await connection.query(
          'INSERT INTO employee_specialties (employee_id, specialty) VALUES ?',
          [specialtyValues]
        );
      }

      // Add schedule
      if (schedule && Array.isArray(schedule) && schedule.length > 0) {
        const scheduleValues = schedule.map(day => [employeeId, day]);
        await connection.query(
          'INSERT INTO employee_schedules (employee_id, day_of_week) VALUES ?',
          [scheduleValues]
        );
      }

      await connection.commit();
      connection.release();

      // Get created employee
      const [newEmployee] = await connection.execute(
        `SELECT 
          e.*,
          GROUP_CONCAT(DISTINCT es.specialty) as specialties,
          GROUP_CONCAT(DISTINCT es2.day_of_week) as schedule
        FROM employees e
        LEFT JOIN employee_specialties es ON e.id = es.employee_id
        LEFT JOIN employee_schedules es2 ON e.id = es2.employee_id
        WHERE e.id = ?
        GROUP BY e.id`,
        [employeeId]
      );

      const employee = newEmployee[0];
      employee.specialties = employee.specialties ? employee.specialties.split(',') : [];
      employee.schedule = employee.schedule ? employee.schedule.split(',') : [];

      res.status(201).json(employee);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee (salon owner only)
router.put('/:id', authenticateToken, requireSalonOwner, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify employee belongs to user's salon
    const [employees] = await pool.execute(
      `SELECT e.id FROM employees e
       JOIN salons sa ON e.salon_id = sa.id
       WHERE e.id = ? AND sa.owner_id = ?`,
      [id, req.user.id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { name, role, email, phone, bio, image, experience, specialties, schedule, is_active } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update employee
      await connection.execute(
        `UPDATE employees 
         SET name = COALESCE(?, name),
             role = COALESCE(?, role),
             email = COALESCE(?, email),
             phone = COALESCE(?, phone),
             bio = COALESCE(?, bio),
             image = COALESCE(?, image),
             experience = COALESCE(?, experience),
             is_active = COALESCE(?, is_active)
         WHERE id = ?`,
        [name, role, email, phone, bio, image, experience, is_active, id]
      );

      // Update specialties if provided
      if (specialties !== undefined) {
        await connection.execute(
          'DELETE FROM employee_specialties WHERE employee_id = ?',
          [id]
        );

        if (Array.isArray(specialties) && specialties.length > 0) {
          const specialtyValues = specialties.map(spec => [id, spec]);
          await connection.query(
            'INSERT INTO employee_specialties (employee_id, specialty) VALUES ?',
            [specialtyValues]
          );
        }
      }

      // Update schedule if provided
      if (schedule !== undefined) {
        await connection.execute(
          'DELETE FROM employee_schedules WHERE employee_id = ?',
          [id]
        );

        if (Array.isArray(schedule) && schedule.length > 0) {
          const scheduleValues = schedule.map(day => [id, day]);
          await connection.query(
            'INSERT INTO employee_schedules (employee_id, day_of_week) VALUES ?',
            [scheduleValues]
          );
        }
      }

      await connection.commit();
      connection.release();

      // Get updated employee
      const [updatedEmployee] = await pool.execute(
        `SELECT 
          e.*,
          GROUP_CONCAT(DISTINCT es.specialty) as specialties,
          GROUP_CONCAT(DISTINCT es2.day_of_week) as schedule
        FROM employees e
        LEFT JOIN employee_specialties es ON e.id = es.employee_id
        LEFT JOIN employee_schedules es2 ON e.id = es2.employee_id
        WHERE e.id = ?
        GROUP BY e.id`,
        [id]
      );

      const employee = updatedEmployee[0];
      employee.specialties = employee.specialties ? employee.specialties.split(',') : [];
      employee.schedule = employee.schedule ? employee.schedule.split(',') : [];

      res.json(employee);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee (salon owner only)
router.delete('/:id', authenticateToken, requireSalonOwner, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify employee belongs to user's salon
    const [employees] = await pool.execute(
      `SELECT e.id FROM employees e
       JOIN salons sa ON e.salon_id = sa.id
       WHERE e.id = ? AND sa.owner_id = ?`,
      [id, req.user.id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await pool.execute('DELETE FROM employees WHERE id = ?', [id]);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;

