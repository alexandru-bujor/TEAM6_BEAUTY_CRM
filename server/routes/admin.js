import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all pending salons (for approval)
router.get('/salons/pending', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [salons] = await pool.execute(
      `SELECT 
        s.*,
        u.email as owner_email,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.phone as owner_phone,
        GROUP_CONCAT(DISTINCT sc.category) as categories
      FROM salons s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN salon_categories sc ON s.id = sc.salon_id
      WHERE s.status = 'pending'
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM salons WHERE status = ?',
      ['pending']
    );
    const total = countResult[0].total;

    // Format response
    const formattedSalons = salons.map(salon => ({
      ...salon,
      categories: salon.categories ? salon.categories.split(',') : [],
    }));

    res.json({
      salons: formattedSalons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get pending salons error:', error);
    res.status(500).json({ error: 'Failed to fetch pending salons' });
  }
});

// Get all salons with any status (admin view)
router.get('/salons', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'suspended']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT 
        s.*,
        u.email as owner_email,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        GROUP_CONCAT(DISTINCT sc.category) as categories
      FROM salons s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN salon_categories sc ON s.id = sc.salon_id
    `;

    const params = [];
    if (status) {
      sql += ` WHERE s.status = ?`;
      params.push(status);
    }

    sql += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [salons] = await pool.execute(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM salons';
    const countParams = [];
    if (status) {
      countSql += ' WHERE status = ?';
      countParams.push(status);
    }
    const [countResult] = await pool.execute(countSql, countParams);
    const total = countResult[0].total;

    // Format response
    const formattedSalons = salons.map(salon => ({
      ...salon,
      categories: salon.categories ? salon.categories.split(',') : [],
    }));

    res.json({
      salons: formattedSalons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get salons error:', error);
    res.status(500).json({ error: 'Failed to fetch salons' });
  }
});

// Approve a salon
router.patch('/salons/:id/approve', [
  param('id').isInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Check if salon exists
    const [salons] = await pool.execute(
      'SELECT id, status, salon_name FROM salons WHERE id = ?',
      [id]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = salons[0];

    if (salon.status === 'approved') {
      return res.status(400).json({ error: 'Salon is already approved' });
    }

    // Update salon status
    await pool.execute(
      'UPDATE salons SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', id]
    );

    res.json({ 
      message: 'Salon approved successfully',
      salon: {
        id: parseInt(id),
        status: 'approved',
        salon_name: salon.salon_name
      }
    });
  } catch (error) {
    console.error('Approve salon error:', error);
    res.status(500).json({ error: 'Failed to approve salon' });
  }
});

// Reject a salon
router.patch('/salons/:id/reject', [
  param('id').isInt(),
  body('reason').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Check if salon exists
    const [salons] = await pool.execute(
      'SELECT id, status, salon_name FROM salons WHERE id = ?',
      [id]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = salons[0];

    if (salon.status === 'rejected') {
      return res.status(400).json({ error: 'Salon is already rejected' });
    }

    // Update salon status
    await pool.execute(
      'UPDATE salons SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['rejected', id]
    );

    // TODO: Send rejection email to salon owner with reason

    res.json({ 
      message: 'Salon rejected successfully',
      salon: {
        id: parseInt(id),
        status: 'rejected',
        salon_name: salon.salon_name,
        reason: reason || null
      }
    });
  } catch (error) {
    console.error('Reject salon error:', error);
    res.status(500).json({ error: 'Failed to reject salon' });
  }
});

// Suspend a salon
router.patch('/salons/:id/suspend', [
  param('id').isInt(),
  body('reason').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Check if salon exists
    const [salons] = await pool.execute(
      'SELECT id, status, salon_name FROM salons WHERE id = ?',
      [id]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    // Update salon status
    await pool.execute(
      'UPDATE salons SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['suspended', id]
    );

    res.json({ 
      message: 'Salon suspended successfully',
      salon: {
        id: parseInt(id),
        status: 'suspended',
        salon_name: salons[0].salon_name,
        reason: reason || null
      }
    });
  } catch (error) {
    console.error('Suspend salon error:', error);
    res.status(500).json({ error: 'Failed to suspend salon' });
  }
});

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        (SELECT COUNT(*) FROM salons WHERE status = 'pending') as pending_salons,
        (SELECT COUNT(*) FROM salons WHERE status = 'approved') as approved_salons,
        (SELECT COUNT(*) FROM salons WHERE status = 'rejected') as rejected_salons,
        (SELECT COUNT(*) FROM salons WHERE status = 'suspended') as suspended_salons,
        (SELECT COUNT(*) FROM salons) as total_salons,
        (SELECT COUNT(*) FROM users WHERE user_type = 'customer') as total_customers,
        (SELECT COUNT(*) FROM users WHERE user_type = 'salon_owner') as total_salon_owners,
        (SELECT COUNT(*) FROM appointments) as total_appointments
      `
    );

    res.json(stats[0]);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

export default router;

