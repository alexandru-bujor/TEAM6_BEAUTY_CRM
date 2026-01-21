import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Get client IP address
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

// Hash function for privacy (synchronous)
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8);
};

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs (increased for booking flow)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const userId = req.user?.id || 'anonymous';
    return `api:${ip}:${userId}`;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === '/health') return true;
    // Skip rate limiting for authenticated users on GET requests (they're less likely to abuse)
    if (req.user && req.method === 'GET') return true;
    return false;
  },
  // Skip successful requests to avoid penalizing normal usage
  skipSuccessfulRequests: true,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = req.body?.email || 'unknown';
    const emailHash = hashString(email);
    return `auth:${ip}:${emailHash}`;
  },
  skipSuccessfulRequests: false, // Count all attempts, including successful ones
  handler: (req, res) => {
    // Log suspicious activity
    const ip = getClientIp(req);
    console.warn(`[SECURITY] Rate limit exceeded for authentication - IP: ${ip}, Path: ${req.path}`);
    
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again after 15 minutes.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

// Rate limiter for registration endpoints
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    return `register:${ip}`;
  },
  handler: (req, res) => {
    const ip = getClientIp(req);
    console.warn(`[SECURITY] Rate limit exceeded for registration - IP: ${ip}`);
    
    res.status(429).json({
      error: 'Too many registration attempts. Please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

// Rate limiter for password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = req.body?.email || 'unknown';
    const emailHash = hashString(email);
    return `pwdreset:${ip}:${emailHash}`;
  },
  handler: (req, res) => {
    const ip = getClientIp(req);
    console.warn(`[SECURITY] Rate limit exceeded for password reset - IP: ${ip}`);
    
    res.status(429).json({
      error: 'Too many password reset requests. Please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

// Rate limiter for verification code requests
export const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 verification code requests per 15 minutes
  message: 'Too many verification code requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const identifier = req.body?.email || req.body?.phone || 'unknown';
    const identifierHash = hashString(identifier);
    return `verify:${ip}:${identifierHash}`;
  },
  handler: (req, res) => {
    const ip = getClientIp(req);
    console.warn(`[SECURITY] Rate limit exceeded for verification - IP: ${ip}`);
    
    res.status(429).json({
      error: 'Too many verification code requests. Please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});
