# Security Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

This will install:
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `speakeasy` - MFA/TOTP
- `qrcode` - QR code generation

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory with:

```env
# Required Security Variables
JWT_SECRET=your-very-long-and-secure-jwt-secret-key-minimum-32-characters
MFA_ENCRYPTION_KEY=your-very-long-mfa-encryption-key-minimum-32-characters

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lume_db

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Important:** 
- `JWT_SECRET` must be at least 32 characters
- `MFA_ENCRYPTION_KEY` must be at least 32 characters
- Use strong, random values in production

### 3. Run Database Migrations

```bash
npm run migrate
```

This will create the new security tables:
- `password_reset_tokens`
- `user_mfa`
- `security_events`

### 4. Verify Installation

Run the security audit:

```bash
npm run security-audit
```

### 5. Test Security Features

Run security tests:

```bash
npm test
```

## Security Features Enabled

Once setup is complete, the following security features are automatically enabled:

✅ **Rate Limiting**
- Authentication: 5 attempts per 15 minutes
- Registration: 3 attempts per hour
- Password Reset: 3 requests per hour

✅ **Security Headers**
- Content-Security-Policy
- X-Frame-Options
- Strict-Transport-Security
- And more...

✅ **Secure Logging**
- Automatic redaction of sensitive data
- Security event tracking

✅ **MFA Support**
- TOTP-based authentication
- Encrypted secret storage

✅ **Password Reset**
- Secure token generation
- Rate limiting
- Single-use tokens

✅ **Enumeration Prevention**
- Generic error messages
- Timing attack prevention

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique secrets (32+ characters)
- [ ] Enable HTTPS
- [ ] Configure database SSL
- [ ] Set up firewall rules
- [ ] Enable monitoring
- [ ] Configure backups
- [ ] Review security headers
- [ ] Run security audit
- [ ] Perform penetration testing

## Troubleshooting

### MFA_ENCRYPTION_KEY Error

If you see: "MFA_ENCRYPTION_KEY must be at least 32 characters long"

**Solution:** Set a longer encryption key in your `.env` file (minimum 32 characters).

### Rate Limiting Too Strict

If rate limiting is blocking legitimate users:

**Solution:** Adjust limits in `server/middleware/rateLimiter.js` (not recommended for production).

### Security Headers Blocking Resources

If CSP headers are blocking legitimate resources:

**Solution:** Adjust CSP policy in `server/middleware/securityHeaders.js`.

## Support

For detailed security information, see `SECURITY.md`.

For implementation details, see `SECURITY_IMPLEMENTATION_SUMMARY.md`.
