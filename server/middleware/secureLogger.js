/**
 * Secure logging utility
 * Ensures no sensitive data (passwords, tokens, secrets) is logged
 */

// Patterns to detect and redact sensitive information
const SENSITIVE_PATTERNS = [
  /password["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
  /password_hash["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
  /token["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
  /secret["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
  /api[_-]?key["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
  /authorization["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
  /bearer\s+([^\s"']+)/gi,
  /jwt["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
  /mfa[_-]?secret["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
  /reset[_-]?token["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
];

// Redact sensitive information from strings
const redactSensitive = (data) => {
  if (typeof data !== 'string') {
    return data;
  }
  
  let redacted = data;
  SENSITIVE_PATTERNS.forEach((pattern) => {
    redacted = redacted.replace(pattern, (match, value) => {
      return match.replace(value, '[REDACTED]');
    });
  });
  
  return redacted;
};

// Recursively redact sensitive data from objects
const redactObject = (obj, depth = 0) => {
  if (depth > 10) {
    return '[MAX_DEPTH]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return redactSensitive(obj);
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1));
  }
  
  const redacted = {};
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'password_hash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'jwt',
    'mfaSecret',
    'mfa_secret',
    'resetToken',
    'reset_token',
    'otp',
    'verificationCode',
    'verification_code',
  ];
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactObject(value, depth + 1);
    }
  }
  
  return redacted;
};

// Secure logger class
class SecureLogger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enableSecurityLogging = process.env.ENABLE_SECURITY_LOGGING !== 'false';
  }
  
  // Format log entry
  format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const redactedMeta = redactObject(meta);
    
    return {
      timestamp,
      level,
      message,
      ...redactedMeta,
    };
  }
  
  // Log info message
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      const entry = this.format('info', message, meta);
      console.log(JSON.stringify(entry));
    }
  }
  
  // Log warning message
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      const entry = this.format('warn', message, meta);
      console.warn(JSON.stringify(entry));
    }
  }
  
  // Log error message
  error(message, error = null, meta = {}) {
    if (this.shouldLog('error')) {
      const errorMeta = {
        ...meta,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            }
          : undefined,
      };
      const entry = this.format('error', message, errorMeta);
      console.error(JSON.stringify(entry));
    }
  }
  
  // Log security event
  security(event, details = {}) {
    if (this.enableSecurityLogging) {
      const entry = this.format('security', event, {
        ...details,
        category: 'security',
      });
      console.warn(JSON.stringify(entry));
    }
  }
  
  // Log authentication event
  auth(event, details = {}) {
    if (this.enableSecurityLogging) {
      const entry = this.format('auth', event, {
        ...details,
        category: 'authentication',
      });
      console.warn(JSON.stringify(entry));
    }
  }
  
  // Check if should log at this level
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }
  
  // Log request (for middleware)
  request(req, res, responseTime) {
    const meta = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      requestId: req.id,
    };
    
    // Only log non-sensitive request data
    if (req.method !== 'POST' || !['/api/auth/login', '/api/auth/register'].includes(req.path)) {
      this.info('HTTP Request', meta);
    } else {
      // For auth endpoints, log minimal info
      this.info('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        requestId: req.id,
      });
    }
  }
  
  // Get client IP
  getClientIp(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Export redaction functions for use in other modules
export { redactSensitive, redactObject };
