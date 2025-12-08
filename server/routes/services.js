import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken, requireSalonOwner } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all services for a salon
router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    const { activeOnly } = req.query;

    let sql = 'SELECT * FROM services WHERE salon_id = ?';
    const params = [salonId];

    if (activeOnly === 'true') {
      sql += ' AND is_active = TRUE';
    }

    sql += ' ORDER BY category, name';

    const [services] = await pool.execute(sql, params);

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get single service
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await pool.execute(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(services[0]);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Get salon owner's services
router.get('/owner/my-services', authenticateToken, requireSalonOwner, async (req, res) => {
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

    const [services] = await pool.execute(
      'SELECT * FROM services WHERE salon_id = ? ORDER BY category, name',
      [salonId]
    );

    res.json(services);
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create service (salon owner only)
router.post('/', authenticateToken, requireSalonOwner, [
  body('name').notEmpty().trim(),
  body('category').notEmpty().trim(),
  body('duration').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
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

    const { name, category, duration, price, description, image, is_active } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO services (salon_id, name, category, duration, price, description, image, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [salonId, name, category, duration, price, description || null, image || null, is_active !== false]
    );

    const [newService] = await pool.execute(
      'SELECT * FROM services WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newService[0]);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service (salon owner only)
router.put('/:id', authenticateToken, requireSalonOwner, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify service belongs to user's salon
    const [services] = await pool.execute(
      `SELECT s.id FROM services s
       JOIN salons sa ON s.salon_id = sa.id
       WHERE s.id = ? AND sa.owner_id = ?`,
      [id, req.user.id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const { name, category, duration, price, description, image, is_active } = req.body;

    await pool.execute(
      `UPDATE services 
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           duration = COALESCE(?, duration),
           price = COALESCE(?, price),
           description = COALESCE(?, description),
           image = COALESCE(?, image),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, category, duration, price, description, image, is_active, id]
    );

    const [updatedService] = await pool.execute(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    res.json(updatedService[0]);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service (salon owner only)
router.delete('/:id', authenticateToken, requireSalonOwner, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify service belongs to user's salon
    const [services] = await pool.execute(
      `SELECT s.id FROM services s
       JOIN salons sa ON s.salon_id = sa.id
       WHERE s.id = ? AND sa.owner_id = ?`,
      [id, req.user.id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await pool.execute('DELETE FROM services WHERE id = ?', [id]);

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;

