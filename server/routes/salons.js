import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken, requireSalonOwner } from '../middleware/auth.js';
import { query, validationResult } from 'express-validator';

const router = express.Router();

// Get all salons (with filters and pagination)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('city').optional().trim(),
  query('category').optional().trim(),
  query('minRating').optional().isFloat({ min: 0, max: 5 }),
  query('priceRange').optional().isIn(['$', '$$', '$$$', '$$$$']),
  query('partnersOnly').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 12,
      search,
      city,
      category,
      minRating,
      priceRange,
      partnersOnly
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT 
        s.*,
        GROUP_CONCAT(DISTINCT sc.category) as categories,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.rating) as avg_rating
      FROM salons s
      LEFT JOIN salon_categories sc ON s.id = sc.salon_id
      LEFT JOIN reviews r ON s.id = r.salon_id
      WHERE s.status = 'approved'
    `;

    const params = [];

    if (search) {
      sql += ` AND (s.salon_name LIKE ? OR s.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (city) {
      sql += ` AND s.city = ?`;
      params.push(city);
    }

    if (category) {
      sql += ` AND EXISTS (
        SELECT 1 FROM salon_categories sc2 
        WHERE sc2.salon_id = s.id AND sc2.category = ?
      )`;
      params.push(category);
    }

    if (priceRange) {
      sql += ` AND s.price_range = ?`;
      params.push(priceRange);
    }

    if (partnersOnly === 'true') {
      sql += ` AND s.is_partner = TRUE`;
    }

    sql += ` GROUP BY s.id`;

    if (minRating) {
      sql += ` HAVING avg_rating >= ?`;
      params.push(parseFloat(minRating));
    }

    sql += ` ORDER BY avg_rating DESC, s.total_reviews DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [salons] = await pool.execute(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(DISTINCT s.id) as total FROM salons s WHERE s.status = 'approved'`;
    const countParams = [];

    if (search) {
      countSql += ` AND (s.salon_name LIKE ? OR s.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (city) {
      countSql += ` AND s.city = ?`;
      countParams.push(city);
    }

    if (category) {
      countSql += ` AND EXISTS (
        SELECT 1 FROM salon_categories sc2 
        WHERE sc2.salon_id = s.id AND sc2.category = ?
      )`;
      countParams.push(category);
    }

    if (priceRange) {
      countSql += ` AND s.price_range = ?`;
      countParams.push(priceRange);
    }

    if (partnersOnly === 'true') {
      countSql += ` AND s.is_partner = TRUE`;
    }

    const [countResult] = await pool.execute(countSql, countParams);
    const total = countResult[0].total;

    // Format response
    const formattedSalons = salons.map(salon => ({
      ...salon,
      categories: salon.categories ? salon.categories.split(',') : [],
      rating: parseFloat(salon.avg_rating) || 0,
      reviewCount: salon.review_count || 0
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

// Get single salon by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [salons] = await pool.execute(
      `SELECT 
        s.*,
        GROUP_CONCAT(DISTINCT sc.category) as categories,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.rating) as avg_rating,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name
      FROM salons s
      LEFT JOIN salon_categories sc ON s.id = sc.salon_id
      LEFT JOIN reviews r ON s.id = r.salon_id
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = ? AND s.status = 'approved'
      GROUP BY s.id`,
      [id]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = salons[0];
    salon.categories = salon.categories ? salon.categories.split(',') : [];
    salon.rating = parseFloat(salon.avg_rating) || 0;
    salon.reviewCount = salon.review_count || 0;

    res.json(salon);
  } catch (error) {
    console.error('Get salon error:', error);
    res.status(500).json({ error: 'Failed to fetch salon' });
  }
});

// Get salon owner's salon
router.get('/owner/my-salon', authenticateToken, requireSalonOwner, async (req, res) => {
  try {
    const [salons] = await pool.execute(
      `SELECT 
        s.*,
        GROUP_CONCAT(DISTINCT sc.category) as categories
      FROM salons s
      LEFT JOIN salon_categories sc ON s.id = sc.salon_id
      WHERE s.owner_id = ?
      GROUP BY s.id`,
      [req.user.id]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = salons[0];
    salon.categories = salon.categories ? salon.categories.split(',') : [];

    res.json(salon);
  } catch (error) {
    console.error('Get my salon error:', error);
    res.status(500).json({ error: 'Failed to fetch salon' });
  }
});

// Update salon (owner only)
router.put('/owner/my-salon', authenticateToken, requireSalonOwner, async (req, res) => {
  try {
    const {
      salon_name,
      contact_name,
      phone,
      address,
      city,
      state,
      zip_code,
      description,
      price_range,
      categories
    } = req.body;

    // Get salon ID
    const [salons] = await pool.execute(
      'SELECT id FROM salons WHERE owner_id = ?',
      [req.user.id]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salonId = salons[0].id;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update salon
      await connection.execute(
        `UPDATE salons 
         SET salon_name = COALESCE(?, salon_name),
             contact_name = COALESCE(?, contact_name),
             phone = COALESCE(?, phone),
             address = COALESCE(?, address),
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             zip_code = COALESCE(?, zip_code),
             description = COALESCE(?, description),
             price_range = COALESCE(?, price_range)
         WHERE id = ?`,
        [salon_name, contact_name, phone, address, city, state, zip_code, description, price_range, salonId]
      );

      // Update categories if provided
      if (categories && Array.isArray(categories)) {
        await connection.execute(
          'DELETE FROM salon_categories WHERE salon_id = ?',
          [salonId]
        );

        if (categories.length > 0) {
          const categoryValues = categories.map(cat => [salonId, cat]);
          await connection.query(
            'INSERT INTO salon_categories (salon_id, category) VALUES ?',
            [categoryValues]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({ message: 'Salon updated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update salon error:', error);
    res.status(500).json({ error: 'Failed to update salon' });
  }
});

export default router;

