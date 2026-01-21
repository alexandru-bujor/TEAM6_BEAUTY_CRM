import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken, requireCustomer } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, email, user_type, first_name, last_name, phone, location, 
       date_of_birth, bio, profile_image, email_verified, phone_verified, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get customer favorites if customer
    let favorites = [];
    if (req.user.user_type === 'customer') {
      const [favoriteSalons] = await pool.execute(
        `SELECT s.* FROM salons s
         JOIN customer_favorites cf ON s.id = cf.salon_id
         WHERE cf.customer_id = ?`,
        [req.user.id]
      );
      favorites = favoriteSalons;
    }

    res.json({ user: users[0], favorites });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      location,
      date_of_birth,
      bio,
      profile_image
    } = req.body;

    // Check if email is being changed
    let emailChanged = false;
    if (email) {
      const [currentUser] = await pool.execute(
        'SELECT email FROM users WHERE id = ?',
        [req.user.id]
      );
      if (currentUser.length > 0 && currentUser[0].email !== email) {
        emailChanged = true;
      }
    }

    // Build the UPDATE query dynamically
    const updateFields = [];
    const updateValues = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
      // Reset email verification if email is changed
      if (emailChanged) {
        updateFields.push('email_verified = FALSE');
      }
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    if (date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(date_of_birth || null);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    if (profile_image !== undefined) {
      updateFields.push('profile_image = ?');
      updateValues.push(profile_image);
    }

    if (updateFields.length > 0) {
      updateValues.push(req.user.id);
      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const [updatedUser] = await pool.execute(
      `SELECT id, email, user_type, first_name, last_name, phone, location, 
       date_of_birth, bio, profile_image, email_verified, phone_verified
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get customer dashboard stats
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'customer') {
      return res.status(403).json({ error: 'Customer access required' });
    }

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(CASE WHEN a.status = 'confirmed' AND a.appointment_date >= CURDATE() THEN 1 END) as upcoming,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
        COUNT(DISTINCT cf.salon_id) as favorite_salons,
        AVG(r.rating) as avg_rating
      FROM users u
      LEFT JOIN appointments a ON u.id = a.customer_id
      LEFT JOIN customer_favorites cf ON u.id = cf.customer_id
      LEFT JOIN reviews r ON u.id = r.customer_id
      WHERE u.id = ?`,
      [req.user.id]
    );

    res.json(stats[0]);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get salon owner dashboard stats
router.get('/salon-dashboard/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'salon_owner') {
      return res.status(403).json({ error: 'Salon owner access required' });
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

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(CASE WHEN a.appointment_date = CURDATE() THEN 1 END) as today_appointments,
        SUM(CASE WHEN a.status = 'completed' AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN a.price ELSE 0 END) as weekly_revenue,
        SUM(CASE WHEN a.status = 'completed' AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN a.price ELSE 0 END) as monthly_revenue,
        COUNT(DISTINCT a.customer_id) as total_customers,
        AVG(r.rating) as average_rating,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN s.is_active = TRUE THEN 1 END) as active_services,
        COUNT(CASE WHEN e.is_active = TRUE THEN 1 END) as total_staff
      FROM salons sa
      LEFT JOIN appointments a ON sa.id = a.salon_id
      LEFT JOIN services s ON sa.id = s.salon_id
      LEFT JOIN employees e ON sa.id = e.salon_id
      LEFT JOIN reviews r ON sa.id = r.salon_id
      WHERE sa.id = ?`,
      [salonId]
    );

    res.json(stats[0]);
  } catch (error) {
    console.error('Get salon dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Add/Remove favorite salon (customer only)
router.post('/favorites/:salonId', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { salonId } = req.params;

    // Check if salon exists
    const [salons] = await pool.execute(
      'SELECT id FROM salons WHERE id = ? AND status = "approved"',
      [salonId]
    );

    if (salons.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    // Check if already favorited
    const [existing] = await pool.execute(
      'SELECT id FROM customer_favorites WHERE customer_id = ? AND salon_id = ?',
      [req.user.id, salonId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Salon already in favorites' });
    }

    await pool.execute(
      'INSERT INTO customer_favorites (customer_id, salon_id) VALUES (?, ?)',
      [req.user.id, salonId]
    );

    res.json({ message: 'Salon added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

router.delete('/favorites/:salonId', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { salonId } = req.params;

    await pool.execute(
      'DELETE FROM customer_favorites WHERE customer_id = ? AND salon_id = ?',
      [req.user.id, salonId]
    );

    res.json({ message: 'Salon removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

export default router;

