import pool from '../database/connection.js';
import { logger } from './secureLogger.js';

/**
 * Security monitoring and alerting
 * Logs suspicious activities to database for analysis
 */

// Log security event to database
export const logSecurityEvent = async (eventType, details = {}) => {
  try {
    const {
      userId = null,
      ip = null,
      userAgent = null,
      severity = 'medium',
      ...otherDetails
    } = details;

    await pool.execute(
      `INSERT INTO security_events 
       (event_type, user_id, ip_address, user_agent, details, severity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        eventType,
        userId,
        ip,
        userAgent,
        JSON.stringify(otherDetails),
        severity,
      ]
    );

    // Also log to application logs
    logger.security(eventType, details);
  } catch (error) {
    // Don't fail the request if logging fails
    logger.error('Failed to log security event', error);
  }
};

// Check for suspicious patterns
export const detectSuspiciousActivity = async (req, userId = null) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
  const userAgent = req.headers['user-agent'];

  try {
    // Check for multiple failed login attempts from same IP
    const [failedLogins] = await pool.execute(
      `SELECT COUNT(*) as count FROM security_events
       WHERE event_type = 'failed_login' 
       AND ip_address = ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
      [ip]
    );

    if (failedLogins[0].count >= 5) {
      await logSecurityEvent('suspicious_activity', {
        userId,
        ip,
        userAgent,
        severity: 'high',
        reason: 'multiple_failed_logins',
        count: failedLogins[0].count,
      });
      return { suspicious: true, reason: 'multiple_failed_logins' };
    }

    // Check for rapid requests from same IP
    const [rapidRequests] = await pool.execute(
      `SELECT COUNT(*) as count FROM security_events
       WHERE ip_address = ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
      [ip]
    );

    if (rapidRequests[0].count >= 100) {
      await logSecurityEvent('suspicious_activity', {
        userId,
        ip,
        userAgent,
        severity: 'high',
        reason: 'rapid_requests',
        count: rapidRequests[0].count,
      });
      return { suspicious: true, reason: 'rapid_requests' };
    }

    return { suspicious: false };
  } catch (error) {
    logger.error('Failed to detect suspicious activity', error);
    return { suspicious: false };
  }
};

// Middleware to monitor requests
export const monitoringMiddleware = async (req, res, next) => {
  // Skip monitoring for health checks
  if (req.path === '/health') {
    return next();
  }

  // Detect suspicious activity
  const suspicious = await detectSuspiciousActivity(req, req.user?.id);

  if (suspicious.suspicious) {
    // Log but don't block (rate limiting will handle it)
    logger.warn('Suspicious activity detected', {
      ip: req.ip,
      path: req.path,
      reason: suspicious.reason,
    });
  }

  next();
};

// Get security events for admin dashboard
export const getSecurityEvents = async (filters = {}) => {
  try {
    const {
      limit = 100,
      offset = 0,
      severity = null,
      eventType = null,
      userId = null,
    } = filters;

    let query = `SELECT * FROM security_events WHERE 1=1`;
    const params = [];

    if (severity) {
      query += ` AND severity = ?`;
      params.push(severity);
    }

    if (eventType) {
      query += ` AND event_type = ?`;
      params.push(eventType);
    }

    if (userId) {
      query += ` AND user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [events] = await pool.execute(query, params);

    return events.map(event => ({
      ...event,
      details: event.details ? JSON.parse(event.details) : {},
    }));
  } catch (error) {
    logger.error('Failed to get security events', error);
    throw error;
  }
};
