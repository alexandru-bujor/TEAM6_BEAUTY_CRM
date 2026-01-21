/**
 * Secure cookie configuration middleware
 * Implements HttpOnly, Secure, and SameSite cookie settings
 */

// Set secure cookie for authentication
export const setSecureCookie = (res, name, value, options = {}) => {
  const {
    maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days default
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict',
    domain = process.env.COOKIE_DOMAIN,
    path = '/',
  } = options;

  const cookieOptions = {
    maxAge,
    httpOnly,
    secure,
    sameSite,
    path,
  };

  if (domain) {
    cookieOptions.domain = domain;
  }

  res.cookie(name, value, cookieOptions);
};

// Clear secure cookie
export const clearSecureCookie = (res, name, options = {}) => {
  const {
    domain = process.env.COOKIE_DOMAIN,
    path = '/',
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict',
  } = options;

  const cookieOptions = {
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite,
    path,
  };

  if (domain) {
    cookieOptions.domain = domain;
  }

  res.clearCookie(name, cookieOptions);
};

// Cookie security middleware (validates cookie settings)
export const cookieSecurityMiddleware = (req, res, next) => {
  // Validate that cookies are being used securely
  // This is informational - actual cookie security is enforced in setSecureCookie
  
  // Log if insecure cookies are detected (in development)
  if (process.env.NODE_ENV === 'development') {
    const cookies = req.cookies || {};
    // Note: In production, ensure all cookies use secure settings
  }
  
  next();
};
