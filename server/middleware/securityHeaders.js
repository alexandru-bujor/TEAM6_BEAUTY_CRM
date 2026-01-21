import helmet from 'helmet';
import crypto from 'crypto';

/**
 * Security headers middleware
 * Implements OWASP recommended security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Set to true if you need COEP
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: process.env.NODE_ENV === 'production',
  },
  ieNoOpen: true,
  noSniff: true, // X-Content-Type-Options: nosniff
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * Additional custom security headers
 */
export const customSecurityHeaders = (req, res, next) => {
  // Remove X-Powered-By header (redundant with helmet, but extra safety)
  res.removeHeader('X-Powered-By');
  
  // Add Permissions-Policy header (formerly Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  
  // Add X-Request-ID for request tracking (useful for security monitoring)
  if (!req.headers['x-request-id']) {
    req.id = crypto.randomBytes(16).toString('hex');
    res.setHeader('X-Request-ID', req.id);
  } else {
    req.id = req.headers['x-request-id'];
  }
  
  next();
};
