# Testing Documentation for Beauty Book (Lume CRM)

## Overview

This document describes the testing strategy and implementation for the Beauty Book salon management platform. Our testing philosophy focuses on **critical functionality and business logic** rather than trivial UI components.

## Testing Philosophy

- **Test critical paths**: Authentication, security, API endpoints, and business logic
- **Skip trivial components**: Simple presentational components, third-party wrappers, and configuration files
- **Target coverage**: 60-70% overall, with higher coverage (80-90%) for critical security features
- **Fast execution**: All tests complete in under 2 minutes

## Test Structure

```
server/__tests__/
├── auth/              # Authentication & Security (Critical - 90%+ coverage)
│   ├── registration.test.js
│   ├── login.test.js
│   ├── jwt.test.js
│   └── mfa.test.js
├── api/               # API Endpoints (High Priority - 80%+ coverage)
│   ├── appointments.test.js
│   └── services.test.js
├── validation/        # Input Validation (Medium Priority - 75%+ coverage)
│   └── schemas.test.js
└── utils/            # Utilities (Medium Priority - 70%+ coverage)
    ├── tokens.test.js
    └── dates.test.js
```

## Test Categories

### 1. Authentication & Security (Critical - 12+ tests)

**Priority**: Highest - These tests are essential for exam requirements.

#### Registration Tests (`registration.test.js`)
- ✅ Valid customer registration
- ✅ Valid salon owner registration
- ✅ Duplicate email rejection
- ✅ Invalid email format rejection
- ✅ Password length validation
- ✅ Password hashing verification
- ✅ Missing required fields rejection
- ✅ Salon categories creation

#### Login Tests (`login.test.js`)
- ✅ Successful login with correct credentials
- ✅ Rejection with incorrect password
- ✅ Rejection with non-existent email
- ✅ Invalid email format rejection
- ✅ Missing password rejection
- ✅ Timing attack prevention

#### JWT Tests (`jwt.test.js`)
- ✅ Token generation with correct payload
- ✅ Token expiration handling
- ✅ Valid token acceptance
- ✅ Expired token rejection
- ✅ Invalid signature rejection
- ✅ Non-existent user rejection

#### MFA Tests (`mfa.test.js`)
- ✅ MFA secret generation
- ✅ Encrypted secret storage
- ✅ Valid TOTP token verification
- ✅ Invalid token rejection
- ✅ MFA enable/disable
- ✅ MFA status checking
- ✅ Encryption/decryption functionality

### 2. API Endpoints (High Priority - 10+ tests)

#### Appointments API (`appointments.test.js`)
- ✅ Create appointment with valid data
- ✅ Reject unauthenticated requests
- ✅ Reject unauthorized user types
- ✅ Validate date/time formats
- ✅ Reject non-existent services
- ✅ Set correct price/duration from service
- ✅ Filter appointments by status
- ✅ Update appointment status

#### Services API (`services.test.js`)
- ✅ Create service (salon owner only)
- ✅ Reject customer creation attempts
- ✅ Validate required fields
- ✅ Reject negative prices
- ✅ Reject invalid durations
- ✅ Filter active services
- ✅ Authorization checks

### 3. Validation (Medium Priority - 5+ tests)

#### Schema Validation (`schemas.test.js`)
- ✅ Email format validation
- ✅ Email normalization
- ✅ Password length validation
- ✅ Integer validation with constraints
- ✅ Date format validation
- ✅ String sanitization (trim)
- ✅ XSS prevention

### 4. Utilities (Medium Priority - 5+ tests)

#### Token Utilities (`tokens.test.js`)
- ✅ Token generation with payload
- ✅ Token expiration
- ✅ Token verification
- ✅ Invalid token rejection
- ✅ Custom claims preservation

#### Date Utilities (`dates.test.js`)
- ✅ ISO 8601 date validation
- ✅ Time format validation
- ✅ Time slot calculations
- ✅ Date comparisons
- ✅ Business hours validation

## Running Tests

### Install Dependencies

```bash
cd server
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests for CI/CD

```bash
npm run test:ci
```

## Coverage Targets

| Category | Target Coverage | Current Status |
|----------|----------------|----------------|
| Authentication & Security | 90%+ | ✅ |
| API Endpoints | 80%+ | ✅ |
| Validation | 75%+ | ✅ |
| Utilities | 70%+ | ✅ |
| **Overall** | **60-70%** | ✅ |

## Test Execution Time

- **Target**: < 2 minutes
- **Current**: ~90 seconds (all tests)
- **CI/CD**: ~2 minutes (including setup)

## CI/CD Integration

Tests automatically run on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Tests must pass before deployment

See `.github/workflows/ci-cd.yml` for full CI/CD configuration.

## Best Practices

### AAA Pattern
All tests follow the **Arrange-Act-Assert** pattern:

```javascript
it('should do something', async () => {
  // Arrange - Set up test data
  const testData = { email: 'test@example.com' };
  
  // Act - Execute the code being tested
  const response = await request(app)
    .post('/api/endpoint')
    .send(testData);
  
  // Assert - Verify the results
  expect(response.status).toBe(200);
});
```

### Test Naming
- Use descriptive names: `should reject login with incorrect password`
- One assertion per test
- Group related tests in `describe` blocks

### Mocking
- Mock external dependencies (database, external APIs)
- Use test fixtures for common data
- Clean up test data after each test

## What We DON'T Test

❌ Simple presentational components  
❌ Third-party library wrappers  
❌ Configuration files  
❌ Mock data and fixtures  
❌ Simple getters/setters  
❌ Trivial UI interactions  

## Exam Requirements Checklist

✅ **30-40 meaningful tests** - 35+ tests implemented  
✅ **CI/CD fails if tests fail** - Configured in GitHub Actions  
✅ **Can run and explain tests live** - Well-documented and organized  
✅ **Coverage report available** - Generated with `npm run test:coverage`  
✅ **Tests complete in <2 minutes** - ~90 seconds execution time  

## Troubleshooting

### Database Connection Issues
Ensure test database is set up:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lume_db_test;"
```

### Environment Variables
Set required environment variables:
```bash
export JWT_SECRET=test-jwt-secret
export MFA_ENCRYPTION_KEY=test-mfa-encryption-key-32-chars-long
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=lume_db_test
```

### Test Failures
1. Check database connection
2. Verify environment variables
3. Ensure test data cleanup is working
4. Check for port conflicts

## Future Enhancements

- [ ] Add integration tests for complete user flows
- [ ] Add performance tests for critical endpoints
- [ ] Add load testing for high-traffic scenarios
- [ ] Expand MFA test coverage
- [ ] Add tests for rate limiting

## Contact

For questions about testing, refer to the main README or contact the development team.
