import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const [users] = await pool.execute(
      'SELECT id, email, user_type, first_name, last_name FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

export const requireSalonOwner = (req, res, next) => {
  if (req.user && req.user.user_type === 'salon_owner') {
    next();
  } else {
    return res.status(403).json({ error: 'Salon owner access required' });
  }
};

export const requireCustomer = (req, res, next) => {
  if (req.user && req.user.user_type === 'customer') {
    next();
  } else {
    return res.status(403).json({ error: 'Customer access required' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.user_type === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

