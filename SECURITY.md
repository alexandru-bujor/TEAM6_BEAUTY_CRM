# Security Documentation

## Overview

This document outlines the comprehensive security measures implemented in the Lume Beauty CRM application, covering authentication, authorization, API security, and infrastructure security.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
3. [Credential Storage](#credential-storage)
4. [Rate Limiting](#rate-limiting)
5. [Password Reset](#password-reset)
6. [Cookie Security](#cookie-security)
7. [Security Headers](#security-headers)
8. [Logging & Monitoring](#logging--monitoring)
9. [OWASP Top 10 Compliance](#owasp-top-10-compliance)
10. [Security Testing](#security-testing)
11. [Hosting & Infrastructure](#hosting--infrastructure)

---

## Authentication & Authorization

### Implementation

- **JWT Tokens**: Used for stateless authentication
- **Token Expiration**: Configurable (default: 7 days)
- **Token Validation**: All protected routes validate JWT tokens
- **Role-Based Access Control**: Customer, Salon Owner, and Admin roles

### Security Features

- **Enumeration Prevention**: Generic error messages prevent user enumeration
- **Timing Attack Prevention**: Constant-time password comparison
- **Rate Limiting**: Strict limits on authentication endpoints
- **Secure Token Generation**: Cryptographically secure random tokens

### Error Messages

All authentication endpoints return generic error messages:
- Login: "Invalid email or password" (regardless of whether user exists)
- Registration: "Registration failed. Please check your information and try again."
- Password Reset: "If an account with that email exists, a password reset link has been sent."

---

## Multi-Factor Authentication (MFA)

### Implementation

MFA is implemented using TOTP (Time-based One-Time Password) with the following security measures:

### Secret Storage

- **Encryption**: MFA secrets are encrypted at rest using AES-256-GCM
- **Encryption Key**: Stored in `MFA_ENCRYPTION_KEY` environment variable (minimum 32 characters)
- **Storage Location**: Database table `user_mfa` with encrypted fields:
  - `secret_encrypted`: Encrypted secret
  - `secret_iv`: Initialization vector
  - `secret_auth_tag`: Authentication tag

### Security Requirements

1. **Never Exposed**: MFA secrets are never exposed in:
   - Logs
   - Client-side code
   - API responses (except during initial setup)
   - Error messages

2. **Encryption Details**:
   - Algorithm: AES-256-GCM
   - Key Derivation: SHA-256 hash of `MFA_ENCRYPTION_KEY`
   - IV: Random 16 bytes per encryption

### Setup Process

1. User requests MFA setup
2. Server generates TOTP secret
3. Secret is encrypted and stored
4. QR code is generated for user's authenticator app
5. User verifies with a token to enable MFA

### API Endpoints

- `POST /api/mfa/setup` - Generate MFA secret and QR code
- `POST /api/mfa/enable` - Enable MFA after verification
- `POST /api/mfa/disable` - Disable MFA (requires token)
- `GET /api/mfa/status` - Check MFA status

---

## Credential Storage

### Password Hashing

- **Algorithm**: bcrypt
- **Salt Rounds**: 12 (configurable, minimum recommended: 10)
- **Storage**: Passwords are hashed before storage in `password_hash` column

### Security Requirements

- **Never Stored**: Plaintext passwords are never:
  - Stored in database
  - Logged
  - Transmitted in error messages
  - Exposed in API responses

### Password Requirements

- Minimum length: 8 characters
- Validation: Enforced on registration and password reset
- Complexity: Can be enhanced with additional rules

---

## Rate Limiting

### Implementation

Rate limiting is implemented using `express-rate-limit` with in-memory storage.

### Limits by Endpoint

| Endpoint | Limit | Window | Notes |
|----------|-------|--------|-------|
| General API | 100 requests | 15 minutes | Per IP + User ID |
| Authentication | 5 attempts | 15 minutes | Per IP + Email hash |
| Registration | 3 attempts | 1 hour | Per IP |
| Password Reset | 3 requests | 1 hour | Per IP + Email hash |
| Verification Codes | 5 requests | 15 minutes | Per IP + Identifier hash |

### Rate Limit Headers

Responses include rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

### Handling

When rate limit is exceeded:
- HTTP 429 status code
- Error message with retry time
- Security event logged

---

## Password Reset

### Implementation

Password reset uses secure, single-use tokens with strict limits.

### Token Security

- **Generation**: Cryptographically secure random 32-byte tokens
- **Storage**: Tokens are hashed (SHA-256) before storage
- **Expiration**: 1 hour
- **Single-Use**: Tokens are marked as used after password reset
- **Rate Limiting**: 3 requests per hour per IP + email

### Process

1. User requests password reset
2. Server generates secure token
3. Token is hashed and stored with expiration
4. Reset link sent to user (in production via email)
5. User submits new password with token
6. Token is validated and marked as used
7. Password is updated

### Security Features

- **Enumeration Prevention**: Same response for existing/non-existing emails
- **Token Validation**: Checks expiration and usage status
- **Rate Limiting**: Prevents abuse
- **Automatic Cleanup**: Expired tokens are not usable

---

## Cookie Security

### Configuration

If cookies are used for authentication (optional), they are configured with:

- **HttpOnly**: `true` - Prevents JavaScript access
- **Secure**: `true` (production) - HTTPS only
- **SameSite**: `strict` - CSRF protection
- **Domain**: Configurable via `COOKIE_DOMAIN` environment variable
- **Path**: `/`
- **MaxAge**: Configurable (default: 7 days)

### Implementation

See `server/middleware/secureCookies.js` for cookie utilities.

---

## Security Headers

### Implemented Headers

All responses include the following security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict policy | XSS protection |
| `X-Content-Type-Options` | `nosniff` | MIME type sniffing protection |
| `X-Frame-Options` | `DENY` | Clickjacking protection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HSTS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer control |
| `Permissions-Policy` | Restricted | Feature policy |
| `X-Request-ID` | Unique ID | Request tracking |

### Configuration

Headers are configured in `server/middleware/securityHeaders.js` using Helmet.js.

---

## Logging & Monitoring

### Secure Logging

- **No Sensitive Data**: Passwords, tokens, and secrets are never logged
- **Redaction**: Automatic redaction of sensitive patterns
- **Structured Logging**: JSON format for parsing
- **Log Levels**: debug, info, warn, error, security

### Security Events

Security events are logged to:
1. Application logs (with redaction)
2. Database table `security_events` (for analysis)

### Monitored Events

- Failed login attempts
- Rate limit violations
- Password reset requests
- MFA setup/enable/disable
- Suspicious activity patterns

### Monitoring

- **Suspicious Activity Detection**: Automatic detection of:
  - Multiple failed logins from same IP
  - Rapid requests from same IP
  - Unusual access patterns

### Alerting

Security events are categorized by severity:
- `low`: Informational
- `medium`: Warning
- `high`: Requires attention
- `critical`: Immediate action required

---

## OWASP Top 10 Compliance

### A01:2021 – Broken Access Control

- ✅ Role-based access control (RBAC)
- ✅ JWT token validation on all protected routes
- ✅ Authorization checks in middleware
- ✅ User ID validation to prevent IDOR

### A02:2021 – Cryptographic Failures

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ MFA secrets encrypted at rest (AES-256-GCM)
- ✅ Secure token generation
- ✅ HTTPS enforced in production

### A03:2021 – Injection

- ✅ Parameterized queries (prepared statements)
- ✅ Input validation with express-validator
- ✅ SQL injection prevention
- ✅ XSS protection via CSP headers

### A04:2021 – Insecure Design

- ✅ Security by design principles
- ✅ Threat modeling considerations
- ✅ Secure defaults
- ✅ Defense in depth

### A05:2021 – Security Misconfiguration

- ✅ Security headers configured
- ✅ Error handling without information leakage
- ✅ Secure defaults
- ✅ Environment-based configuration

### A06:2021 – Vulnerable Components

- ✅ Regular dependency updates
- ✅ Security advisories monitoring
- ✅ Minimal dependency footprint

### A07:2021 – Authentication Failures

- ✅ Strong password requirements
- ✅ Rate limiting on authentication
- ✅ MFA support
- ✅ Secure session management
- ✅ Enumeration prevention

### A08:2021 – Software and Data Integrity

- ✅ Input validation
- ✅ Secure file uploads (if implemented)
- ✅ Integrity checks

### A09:2021 – Security Logging Failures

- ✅ Comprehensive security logging
- ✅ Sensitive data redaction
- ✅ Security event tracking
- ✅ Monitoring and alerting

### A10:2021 – Server-Side Request Forgery (SSRF)

- ✅ Input validation
- ✅ URL validation (if applicable)
- ✅ Network isolation considerations

---

## Security Testing

### Automated Testing

Security tests are located in `server/tests/security.test.js` and cover:

- Authentication security
- Rate limiting
- Enumeration prevention
- Security headers
- Password reset security
- Authorization
- Input validation

### Running Tests

```bash
cd server
npm test
```

### OWASP ZAP Integration

For automated security scanning:

1. Install OWASP ZAP
2. Configure ZAP to scan the API endpoints
3. Review and address findings
4. Document results

### Manual Testing

Regular manual security testing should include:

- Penetration testing
- Vulnerability assessments
- Code reviews
- Dependency audits

---

## Hosting & Infrastructure

### Environment Variables

Required security-related environment variables:

```env
# JWT
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d

# MFA Encryption
MFA_ENCRYPTION_KEY=<at-least-32-characters>

# Database
DB_HOST=<database-host>
DB_USER=<database-user>
DB_PASSWORD=<strong-password>
DB_NAME=lume_db

# Application
NODE_ENV=production
FRONTEND_URL=<frontend-url>
COOKIE_DOMAIN=<cookie-domain>

# Logging
LOG_LEVEL=info
ENABLE_SECURITY_LOGGING=true
```

### Security Best Practices

1. **Firewalls**: Restrict access to necessary ports only
2. **Isolation**: Separate application and database servers
3. **Patching**: Regular security updates
4. **Backups**: Encrypted backups with regular testing
5. **Monitoring**: 24/7 monitoring and alerting
6. **Access Control**: Least privilege principle
7. **HTTPS**: Enforce HTTPS in production
8. **WAF**: Consider Web Application Firewall

### Deployment Checklist

- [ ] All environment variables set
- [ ] HTTPS enabled
- [ ] Security headers verified
- [ ] Rate limiting active
- [ ] Database credentials secure
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Firewall rules applied

---

## Incident Response

### Security Incident Procedure

1. **Detection**: Identify security event
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze the incident
4. **Remediation**: Fix vulnerabilities
5. **Recovery**: Restore services
6. **Documentation**: Document incident and lessons learned

### Contact

For security issues, contact the security team immediately.

---

## Updates

This document is updated as security measures evolve. Last updated: [Current Date]
