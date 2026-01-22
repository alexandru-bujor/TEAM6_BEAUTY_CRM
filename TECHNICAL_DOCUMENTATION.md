# Technical Documentation - Lume Beauty CRM

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features & Functionalities](#2-features--functionalities)
3. [Security Implementations](#3-security-implementations)
4. [Database Schema](#4-database-schema)
5. [Backend Architecture](#5-backend-architecture)
6. [Testing Strategy](#6-testing-strategy)
7. [Logging & Monitoring](#7-logging--monitoring)
8. [Error Handling](#8-error-handling)
9. [Health Checks](#9-health-checks)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Dependencies & Libraries](#11-dependencies--libraries)
12. [Environment Configuration](#12-environment-configuration)

---

## 1. PROJECT OVERVIEW

### Project Name
**Lume Beauty CRM** (also referred to as TEAM6_BEAUTY_CRM)

### Purpose
A comprehensive Customer Relationship Management (CRM) platform designed specifically for beauty salons. The platform enables salon owners to manage their business operations, including appointments, services, employees, and customer relationships. Customers can discover salons, book appointments, and manage their beauty service bookings.

### Tech Stack Summary

#### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 7.2.6
- **UI Library**: Radix UI components with Tailwind CSS 3.4.17
- **State Management**: React Query (TanStack Query) 5.83.0
- **Routing**: React Router DOM 6.30.1
- **Form Handling**: React Hook Form 7.61.1 with Zod 3.25.76 validation
- **Styling**: Tailwind CSS with custom components

#### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.18.2
- **Database**: MySQL 8.0 (via mysql2 3.6.5)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **MFA**: speakeasy 2.0.0 (TOTP implementation)

#### Development Tools
- **Testing**: Jest 29.7.0 with Supertest 6.3.3
- **Linting**: ESLint 9.32.0
- **CI/CD**: GitHub Actions

### Architecture Overview

The application follows a **three-tier architecture**:

1. **Presentation Layer (Frontend)**
   - React SPA with component-based architecture
   - API client abstraction layer
   - Protected routes with authentication guards
   - Responsive UI with modern design patterns

2. **Application Layer (Backend API)**
   - RESTful API built with Express.js
   - Route-based organization
   - Middleware-based request processing
   - Service layer for business logic
   - Database abstraction layer

3. **Data Layer (Database)**
   - MySQL relational database
   - Connection pooling for performance
   - Schema migrations for version control
   - Indexed tables for query optimization

**Communication Flow**:
- Frontend communicates with backend via REST API
- JWT tokens stored in localStorage for authentication
- API requests include Bearer token in Authorization header
- Backend validates tokens and enforces role-based access control

---

## 2. FEATURES & FUNCTIONALITIES

### User-Facing Features

#### Customer Features
- **User Registration**: Customer account creation with email, password, and personal information
- **Salon Discovery**: Browse and search salons with filters (location, category, price range, rating)
- **Appointment Booking**: Multi-step booking process:
  - Service selection
  - Specialist/employee selection
  - Date and time selection
  - Review and confirmation
- **Appointment Management**: View, reschedule, and cancel appointments
- **Profile Management**: Update personal information, preferences, and profile image
- **Favorites**: Save favorite salons for quick access
- **Reviews**: Leave reviews and ratings for completed appointments

#### Salon Owner Features
- **Salon Registration**: Register salon with business information (requires admin approval)
- **Salon Dashboard**: View business statistics and analytics
- **Service Management**: Create, update, and manage salon services
- **Employee Management**: Add, update, and manage staff members with specialties and schedules
- **Appointment Management**: View, confirm, and manage customer appointments
- **Salon Profile**: Update salon information, images, and business details
- **Analytics**: View appointment statistics and business metrics

#### Admin Features
- **Salon Approval**: Review and approve/reject salon registration requests
- **User Management**: View and manage all users (customers, salon owners)
- **Salon Management**: Approve, reject, or suspend salons
- **Dashboard Statistics**: View platform-wide metrics
- **Security Monitoring**: Access security event logs

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register/customer` - Register new customer
- `POST /api/auth/register/salon` - Register new salon owner
- `POST /api/auth/login` - User login (supports MFA)
- `GET /api/auth/me` - Get current authenticated user

#### Multi-Factor Authentication (`/api/mfa`)
- `POST /api/mfa/setup` - Generate MFA secret and QR code
- `POST /api/mfa/enable` - Enable MFA after verification
- `POST /api/mfa/disable` - Disable MFA (requires token)
- `GET /api/mfa/status` - Check MFA status

#### Password Reset (`/api/password-reset`)
- `POST /api/password-reset/request` - Request password reset
- `POST /api/password-reset/verify-token` - Verify reset token
- `POST /api/password-reset/reset` - Reset password with token

#### Salons (`/api/salons`)
- `GET /api/salons` - Get all approved salons (with filters and pagination)
- `GET /api/salons/filter-stats` - Get filter statistics
- `GET /api/salons/:id` - Get salon by ID
- `GET /api/salons/owner/my-salon` - Get salon owner's salon (authenticated)
- `PUT /api/salons/owner/my-salon` - Update salon (owner only)

#### Services (`/api/services`)
- `GET /api/services/salon/:salonId` - Get services by salon
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/owner/my-services` - Get owner's services
- `POST /api/services` - Create service (owner only)
- `PUT /api/services/:id` - Update service (owner only)
- `DELETE /api/services/:id` - Delete service (owner only)

#### Employees (`/api/employees`)
- `GET /api/employees/salon/:salonId` - Get employees by salon
- `GET /api/employees/:id` - Get employee by ID
- `GET /api/employees/owner/my-employees` - Get owner's employees
- `POST /api/employees` - Create employee (owner only)
- `PUT /api/employees/:id` - Update employee (owner only)
- `DELETE /api/employees/:id` - Delete employee (owner only)

#### Appointments (`/api/appointments`)
- `GET /api/appointments` - Get appointments (filtered by user type)
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment (customer only)
- `PUT /api/appointments/:id` - Update appointment (customer only)
- `PATCH /api/appointments/:id/status` - Update appointment status
- `DELETE /api/appointments/:id` - Cancel appointment (customer only)

#### Users (`/api/users`)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard/stats` - Get customer dashboard stats
- `GET /api/users/salon-dashboard/stats` - Get salon dashboard stats
- `POST /api/users/favorites/:salonId` - Add favorite salon
- `DELETE /api/users/favorites/:salonId` - Remove favorite salon

#### Verification (`/api/verification`)
- `POST /api/verification/send-email` - Send email verification code
- `POST /api/verification/send-phone` - Send phone verification code
- `POST /api/verification/verify-email` - Verify email code
- `POST /api/verification/verify-phone` - Verify phone code

#### Admin (`/api/admin`)
- `GET /api/admin/salons/pending` - Get pending salon approvals
- `GET /api/admin/salons` - Get all salons with status filter
- `PATCH /api/admin/salons/:id/approve` - Approve salon
- `PATCH /api/admin/salons/:id/reject` - Reject salon
- `PATCH /api/admin/salons/:id/suspend` - Suspend salon
- `GET /api/admin/stats` - Get admin dashboard statistics

#### Health Check
- `GET /health` - Health check endpoint

---

## 3. SECURITY IMPLEMENTATIONS

### Authentication Mechanisms

#### JWT (JSON Web Tokens)
- **Library**: `jsonwebtoken` v9.0.2
- **Token Structure**: Contains `userId` in payload
- **Expiration**: Configurable via `JWT_EXPIRES_IN` (default: 7 days)
- **Issuer**: `lume-beauty-crm`
- **Audience**: `lume-beauty-crm-users`
- **Storage**: Tokens stored in localStorage on frontend
- **Transmission**: Sent via `Authorization: Bearer <token>` header

**Token Generation**:
```javascript
jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'lume-beauty-crm',
    audience: 'lume-beauty-crm-users',
  }
);
```

**Token Validation**: All protected routes use `authenticateToken` middleware that:
- Extracts token from Authorization header
- Verifies token signature and expiration
- Validates user exists in database
- Attaches user object to request

### Authorization and Role-Based Access Control

#### User Roles
- **customer**: Can book appointments, view salons, manage profile
- **salon_owner**: Can manage salon, services, employees, appointments
- **admin**: Can approve salons, manage users, view platform stats

#### Authorization Middleware
- `authenticateToken`: Validates JWT and loads user
- `requireSalonOwner`: Ensures user is salon owner
- `requireCustomer`: Ensures user is customer
- `requireAdmin`: Ensures user is admin

**Implementation**: Middleware checks `req.user.user_type` and returns 403 Forbidden if role doesn't match.

### Password Hashing

#### Algorithm and Configuration
- **Library**: `bcryptjs` v2.4.3
- **Salt Rounds**: 
  - Customer registration: 10 rounds
  - Salon owner registration: 12 rounds (higher security)
  - Password reset: 12 rounds
- **Storage**: Hashed passwords stored in `users.password_hash` column

**Security Features**:
- Passwords never stored in plaintext
- Constant-time comparison to prevent timing attacks
- Generic error messages to prevent user enumeration

### Multi-Factor Authentication (MFA)

#### Implementation Method
- **Type**: TOTP (Time-based One-Time Password)
- **Library**: `speakeasy` v2.0.0
- **Token Length**: 6 digits
- **Time Window**: 30 seconds per token
- **Tolerance**: 2 time steps (60 seconds) for clock drift

#### MFA Secret Storage

**Location**: Database table `user_mfa`

**Encryption**:
- **Algorithm**: AES-256-GCM
- **Encryption Key**: Stored in `MFA_ENCRYPTION_KEY` environment variable (minimum 32 characters)
- **Key Derivation**: SHA-256 hash of encryption key
- **IV (Initialization Vector)**: Random 16 bytes per encryption
- **Auth Tag**: GCM authentication tag for integrity

**Database Fields**:
- `secret_encrypted`: Encrypted MFA secret (TEXT)
- `secret_iv`: Initialization vector (VARCHAR(32), hex-encoded)
- `secret_auth_tag`: Authentication tag (VARCHAR(32), hex-encoded)
- `enabled`: Boolean flag indicating if MFA is active
- `last_used_at`: Timestamp of last successful MFA verification

**Security Guarantees**:
- Secrets never exposed in logs
- Secrets never sent to client (except during initial setup for QR code)
- Secrets encrypted at rest
- Decryption only occurs during token verification

#### MFA Verification Flow

1. **Setup Phase**:
   - User requests MFA setup (`POST /api/mfa/setup`)
   - Server generates TOTP secret using speakeasy
   - Secret is encrypted and stored in database
   - QR code generated from `otpauth_url` and returned to client
   - User scans QR code with authenticator app (Google Authenticator, Authy, etc.)

2. **Enable Phase**:
   - User enters 6-digit token from authenticator app
   - Server verifies token against encrypted secret
   - If valid, MFA is enabled (`enabled = TRUE`)

3. **Login Flow**:
   - User provides email and password
   - If MFA is enabled, login response includes `requiresMfa: true`
   - User provides MFA token
   - Server verifies token and completes authentication

4. **Disable Phase**:
   - User must provide valid MFA token to disable
   - Server verifies token before disabling

### Cookie Security Settings

**Implementation**: `server/middleware/secureCookies.js`

**Configuration**:
- **httpOnly**: `true` - Prevents JavaScript access (XSS protection)
- **secure**: `true` in production, `false` in development - HTTPS only in production
- **sameSite**: `strict` - CSRF protection
- **domain**: Configurable via `COOKIE_DOMAIN` environment variable
- **path**: `/`
- **maxAge**: Configurable (default: 7 days)

**Note**: Currently, the application uses JWT tokens in localStorage rather than cookies. Cookie utilities are available for future use.

### CORS Configuration

**Implementation**: `server/server.js`

**Development**:
```javascript
{
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
```

**Production**:
```javascript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
```

### Rate Limiting Implementations

**Library**: `express-rate-limit` v7.1.5

#### Rate Limiters

1. **General API Limiter** (`apiLimiter`)
   - **Window**: 15 minutes
   - **Max Requests**: 200 per IP + User ID
   - **Key Generator**: `api:${ip}:${userId}`
   - **Skip Conditions**: Health checks, authenticated GET requests
   - **Skip Successful**: Yes (only counts failed requests)

2. **Authentication Limiter** (`authLimiter`)
   - **Window**: 15 minutes
   - **Max Requests**: 5 per IP + Email hash
   - **Key Generator**: `auth:${ip}:${emailHash}`
   - **Skip Successful**: No (counts all attempts)
   - **Handler**: Logs suspicious activity

3. **Registration Limiter** (`registrationLimiter`)
   - **Window**: 1 hour
   - **Max Requests**: 3 per IP
   - **Key Generator**: `register:${ip}`

4. **Password Reset Limiter** (`passwordResetLimiter`)
   - **Window**: 1 hour
   - **Max Requests**: 3 per IP + Email hash
   - **Key Generator**: `pwdreset:${ip}:${emailHash}`

5. **Verification Code Limiter** (`verificationLimiter`)
   - **Window**: 15 minutes
   - **Max Requests**: 5 per IP + Identifier hash
   - **Key Generator**: `verify:${ip}:${identifierHash}`

**Response Headers**:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

**Rate Limit Exceeded Response**:
- HTTP 429 status code
- Error message with retry time
- Security event logged

### Input Validation and Sanitization

**Library**: `express-validator` v7.0.1

**Validation Rules Applied**:
- Email: `.isEmail().normalizeEmail()` - Validates format and normalizes
- Password: `.isLength({ min: 8 })` - Minimum 8 characters
- Integers: `.isInt()` with optional min/max constraints
- Dates: `.isISO8601().toDate()` - Validates ISO 8601 format
- Time: `.matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)` - HH:MM format
- Strings: `.notEmpty().trim()` - Removes whitespace
- Enums: `.isIn([...])` - Validates against allowed values

**Validation Flow**:
1. Validation rules defined per route
2. `validationResult(req)` checks for errors
3. Errors returned as 400 Bad Request with details
4. Validated data sanitized (trimmed, normalized)

### XSS and CSRF Protection Measures

#### XSS Protection
- **Content Security Policy (CSP)**: Implemented via Helmet.js
  - `defaultSrc: ["'self'"]` - Only allow same-origin resources
  - `scriptSrc: ["'self'"]` - No inline scripts
  - `styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]` - Limited inline styles
  - `imgSrc: ["'self'", "data:", "https:"]` - Allow images from trusted sources
- **Input Sanitization**: All user input validated and sanitized
- **Output Encoding**: React automatically escapes content

#### CSRF Protection
- **SameSite Cookies**: `strict` mode (if cookies used)
- **CORS Configuration**: Restricted origins in production
- **Token-Based Auth**: JWT tokens reduce CSRF risk
- **State Verification**: Request validation on state-changing operations

### Security Headers Implemented

**Library**: `helmet` v7.1.0

**Headers Set**:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict policy | XSS protection |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking protection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HSTS enforcement |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer control |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=()` | Feature restrictions |
| `X-Request-ID` | Unique ID per request | Request tracking |
| `X-Powered-By` | Removed | Hide server technology |

**Implementation**: `server/middleware/securityHeaders.js`

---

## 4. DATABASE SCHEMA

### Database Type and Version
- **Type**: MySQL
- **Version**: 8.0
- **Connection**: Connection pooling via `mysql2` library
- **Pool Configuration**:
  - Connection limit: 10
  - Keep-alive enabled
  - Queue limit: 0 (unlimited)

### Complete Schema Documentation

#### Tables Overview

| Table Name | Purpose | Key Relationships |
|------------|---------|-------------------|
| `users` | User accounts (customers, salon owners, admins) | Referenced by salons, appointments, reviews |
| `salons` | Salon business information | Owned by users, has services, employees, appointments |
| `salon_categories` | Many-to-many salon categories | Links salons to categories |
| `services` | Services offered by salons | Belongs to salons, referenced by appointments |
| `employees` | Staff members at salons | Belongs to salons, referenced by appointments |
| `employee_specialties` | Employee specialties | Many-to-many with employees |
| `employee_schedules` | Employee working days | Belongs to employees |
| `appointments` | Customer appointments | Links customers, salons, services, employees |
| `reviews` | Customer reviews | Links customers, salons, appointments |
| `customer_favorites` | Customer favorite salons | Links customers to salons |
| `verification_codes` | Email/phone verification codes | Optional link to users |
| `password_reset_tokens` | Password reset tokens | Belongs to users |
| `user_mfa` | MFA secrets and settings | One-to-one with users |
| `security_events` | Security event logs | Optional link to users |

#### Detailed Table Schemas

##### users
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('customer', 'salon_owner', 'admin') NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    location VARCHAR(255),
    date_of_birth DATE,
    bio TEXT,
    profile_image VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type)
);
```

**Fields**:
- `id`: Primary key, auto-increment
- `email`: Unique email address
- `password_hash`: bcrypt hashed password
- `user_type`: Role enum (customer, salon_owner, admin)
- `first_name`, `last_name`: User name
- `phone`: Contact phone number
- `location`: User location
- `date_of_birth`: Birth date
- `bio`: User biography
- `profile_image`: URL to profile image
- `email_verified`, `phone_verified`: Verification flags
- `created_at`, `updated_at`: Timestamps

**Indexes**: `email`, `user_type`

##### salons
```sql
CREATE TABLE salons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    salon_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    description TEXT,
    profile_image VARCHAR(500),
    cover_image VARCHAR(500),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    is_individual_stylist BOOLEAN DEFAULT FALSE,
    is_partner BOOLEAN DEFAULT FALSE,
    price_range ENUM('$', '$$', '$$$', '$$$$') DEFAULT '$$',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    INDEX idx_city (city),
    INDEX idx_rating (rating)
);
```

**Fields**:
- `id`: Primary key
- `owner_id`: Foreign key to users (salon owner)
- `salon_name`: Business name
- `contact_name`: Contact person name
- `email`, `phone`: Contact information
- `address`, `city`, `state`, `zip_code`: Location
- `description`: Business description
- `profile_image`, `cover_image`: Image URLs
- `rating`: Average rating (0.00-5.00)
- `total_reviews`: Count of reviews
- `status`: Approval status
- `is_individual_stylist`: Individual vs. salon flag
- `is_partner`: Partner salon flag
- `price_range`: Price category
- `latitude`, `longitude`: GPS coordinates

**Foreign Keys**: `owner_id` → `users.id` (CASCADE delete)
**Indexes**: `owner_id`, `status`, `city`, `rating`

##### salon_categories
```sql
CREATE TABLE salon_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salon_id),
    INDEX idx_category (category),
    UNIQUE KEY unique_salon_category (salon_id, category)
);
```

**Purpose**: Many-to-many relationship between salons and service categories
**Unique Constraint**: Prevents duplicate category assignments per salon

##### services
```sql
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salon_id),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);
```

**Fields**:
- `duration`: Service duration in minutes
- `price`: Service price (decimal with 2 decimal places)
- `is_active`: Soft delete flag

##### employees
```sql
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    bio TEXT,
    image VARCHAR(500),
    rating DECIMAL(3,2) DEFAULT 0.00,
    experience INT DEFAULT 0 COMMENT 'Years of experience',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salon_id),
    INDEX idx_is_active (is_active)
);
```

##### employee_specialties
```sql
CREATE TABLE employee_specialties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    UNIQUE KEY unique_employee_specialty (employee_id, specialty)
);
```

##### employee_schedules
```sql
CREATE TABLE employee_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    UNIQUE KEY unique_employee_day (employee_id, day_of_week)
);
```

##### appointments
```sql
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    salon_id INT NOT NULL,
    service_id INT NOT NULL,
    employee_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_customer (customer_id),
    INDEX idx_salon (salon_id),
    INDEX idx_date (appointment_date),
    INDEX idx_status (status)
);
```

**Note**: `employee_id` is nullable (appointments can be without specific employee)

##### reviews
```sql
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    salon_id INT NOT NULL,
    appointment_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_salon (salon_id),
    INDEX idx_customer (customer_id),
    UNIQUE KEY unique_appointment_review (appointment_id)
);
```

**Constraint**: One review per appointment (enforced by unique constraint)

##### customer_favorites
```sql
CREATE TABLE customer_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    salon_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (customer_id, salon_id),
    INDEX idx_customer (customer_id)
);
```

##### verification_codes
```sql
CREATE TABLE verification_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    code VARCHAR(10) NOT NULL,
    type ENUM('email', 'phone') NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_code (code),
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);
```

**Purpose**: Stores email and phone verification codes
**Expiration**: Codes expire at `expires_at` timestamp

##### password_reset_tokens
```sql
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
);
```

**Security**: Tokens stored as SHA-256 hashes, not plaintext

##### user_mfa
```sql
CREATE TABLE user_mfa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    secret_encrypted TEXT NOT NULL,
    secret_iv VARCHAR(32) NOT NULL,
    secret_auth_tag VARCHAR(32) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_enabled (enabled)
);
```

**Security**: MFA secrets encrypted at rest using AES-256-GCM

##### security_events
```sql
CREATE TABLE security_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(50) NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_user (user_id),
    INDEX idx_ip (ip_address),
    INDEX idx_created (created_at),
    INDEX idx_severity (severity)
);
```

**Purpose**: Audit log for security events
**Details**: JSON field stores additional event data

### Relationships and Foreign Keys

**Cascade Behaviors**:
- `ON DELETE CASCADE`: Deleting a user deletes their salons, appointments, reviews, etc.
- `ON DELETE SET NULL`: Deleting an employee sets `appointment.employee_id` to NULL

**Key Relationships**:
- Users → Salons (one-to-many)
- Salons → Services (one-to-many)
- Salons → Employees (one-to-many)
- Salons → Appointments (one-to-many)
- Users → Appointments (one-to-many, as customer)
- Appointments → Services (many-to-one)
- Appointments → Employees (many-to-one, optional)
- Users → Reviews (one-to-many)
- Salons → Reviews (one-to-many)

### Indexes Implemented

**Performance Indexes**:
- Email lookups: `users.email`
- User type filtering: `users.user_type`
- Salon status filtering: `salons.status`
- Location searches: `salons.city`
- Rating sorting: `salons.rating`
- Appointment queries: `appointments.customer_id`, `appointments.salon_id`, `appointments.appointment_date`, `appointments.status`
- Security event queries: `security_events.event_type`, `security_events.ip_address`, `security_events.created_at`

### Migration Strategy

**Implementation**: `server/database/migrate.js`

**Process**:
1. Check if database exists, create if not
2. Check if `users` table exists (indicates initial migration needed)
3. If initial migration needed, execute `schema.sql`
4. Run schema checker to apply any updates (`schema_checker.js`)

**Migration Commands**:
```bash
npm run migrate  # Run migrations manually
```

**Automatic Migration**: Migrations run automatically on server startup

**Schema Updates**: `schema_checker.js` handles incremental schema updates without data loss

---

## 5. BACKEND ARCHITECTURE

### Project Structure and Folder Organization

```
server/
├── __tests__/              # Test files
│   ├── api/                # API endpoint tests
│   ├── auth/               # Authentication tests
│   ├── utils/              # Utility tests
│   └── validation/         # Validation tests
├── database/               # Database layer
│   ├── connection.js       # Database connection pool
│   ├── schema.sql          # Database schema
│   ├── migrate.js          # Migration runner
│   └── schema_checker.js   # Schema update checker
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   ├── mfa.js             # MFA utilities
│   ├── rateLimiter.js     # Rate limiting
│   ├── securityHeaders.js # Security headers
│   ├── secureCookies.js   # Cookie utilities
│   ├── secureLogger.js    # Secure logging
│   └── monitoring.js      # Security monitoring
├── routes/                 # API routes
│   ├── admin.js           # Admin endpoints
│   ├── appointments.js    # Appointment endpoints
│   ├── auth.js            # Authentication endpoints
│   ├── employees.js       # Employee endpoints
│   ├── mfa.js             # MFA endpoints
│   ├── passwordReset.js   # Password reset endpoints
│   ├── salons.js          # Salon endpoints
│   ├── services.js        # Service endpoints
│   ├── users.js           # User endpoints
│   └── verification.js    # Verification endpoints
├── scripts/                # Utility scripts
│   ├── create-admin.js    # Admin user creation
│   └── security-audit.js  # Security audit tool
├── server.js              # Main server file
├── jest.config.js         # Jest configuration
└── jest.setup.js          # Jest setup file
```

### API Architecture

**Type**: RESTful API

**Conventions**:
- Resource-based URLs (`/api/salons`, `/api/appointments`)
- HTTP methods: GET (read), POST (create), PUT (update), PATCH (partial update), DELETE (delete)
- Status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 429 (rate limited), 500 (server error)
- JSON request/response bodies
- Bearer token authentication

### Middleware Implementations

#### Request Processing Order

1. **Security Headers** (`securityHeaders`, `customSecurityHeaders`)
   - Sets security headers on all responses
   - Generates request IDs

2. **CORS** (`cors`)
   - Handles cross-origin requests
   - Configures allowed origins

3. **Body Parsing** (`express.json`, `express.urlencoded`)
   - Parses JSON and URL-encoded bodies
   - 10MB size limit

4. **Request Logging** (custom middleware)
   - Logs all requests with timing
   - Redacts sensitive data

5. **Rate Limiting** (`apiLimiter`)
   - Applies to all `/api/*` routes
   - IP and user-based limiting

6. **Route-Specific Middleware**
   - Authentication (`authenticateToken`)
   - Authorization (`requireSalonOwner`, `requireCustomer`, `requireAdmin`)
   - Route-specific rate limiters

7. **Error Handling** (global error handler)
   - Catches unhandled errors
   - Returns appropriate error responses
   - Logs errors securely

### Service Layer Organization

**Current Implementation**: Business logic is embedded in route handlers. Future refactoring could extract services.

**Pattern**: Route handlers directly interact with database via connection pool.

**Example Flow**:
```
Request → Route Handler → Database Query → Response
```

### Controller/Route Structure

**Pattern**: One file per resource domain

**Route File Structure**:
```javascript
import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply middleware
router.use(authenticateToken); // If all routes need auth

// Route definitions
router.get('/', async (req, res) => { /* ... */ });
router.post('/', [validation], async (req, res) => { /* ... */ });

export default router;
```

### Dependency Injection Patterns

**Current Approach**: Direct imports and module-level dependencies

**Dependencies**:
- Database: `pool` imported from `connection.js`
- Middleware: Imported as needed
- Environment: `process.env` accessed directly

**Future Enhancement**: Could implement dependency injection container for better testability.

---

## 6. TESTING STRATEGY

### Testing Frameworks Used

- **Framework**: Jest 29.7.0
- **HTTP Testing**: Supertest 6.3.3
- **Test Environment**: Node.js with ES modules

### Types of Tests Implemented

#### Unit Tests
- **Authentication Logic**: JWT generation, validation, password hashing
- **MFA Functions**: Secret generation, encryption/decryption, token verification
- **Validation**: Input sanitization, schema validation
- **Utilities**: Token utilities, date/time handling

#### Integration Tests
- **API Endpoints**: Full request/response cycle
- **Database Operations**: CRUD operations with real database
- **Authentication Flow**: Registration, login, token validation
- **Authorization**: Role-based access control

#### End-to-End Tests
- **Not Currently Implemented**: E2E tests would require frontend integration

### Test Coverage Metrics

**Coverage Targets**:
- Authentication & Security: 90%+ (target met)
- API Endpoints: 80%+ (target met)
- Validation: 75%+ (target met)
- Utilities: 70%+ (target met)
- **Overall**: 60-70% (target met)

**Coverage Reports**: Generated with `npm run test:coverage`
- Format: LCOV, HTML, text
- Location: `server/coverage/`

### Testing Conventions and Patterns

#### Test File Organization
```
__tests__/
├── auth/
│   ├── registration.test.js
│   ├── login.test.js
│   ├── jwt.test.js
│   └── mfa.test.js
├── api/
│   ├── appointments.test.js
│   └── services.test.js
├── validation/
│   └── schemas.test.js
└── utils/
    ├── tokens.test.js
    └── dates.test.js
```

#### Test Naming Convention
- Describe blocks: Feature or module name
- Test cases: `should [expected behavior]`
- Example: `should reject login with incorrect password`

#### AAA Pattern (Arrange-Act-Assert)
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

### Mock/Stub Strategies

**Database**: Uses real test database (`lume_db_test`)
- Tests run against actual MySQL database
- Test data cleaned up after each test
- Transactions used for isolation when possible

**Environment Variables**: Mocked in `jest.setup.js`
- Test-specific JWT secret
- Test-specific MFA encryption key
- NODE_ENV set to 'test'

**External Services**: Not currently mocked (no external API dependencies)

### CI/CD Test Execution

**Platform**: GitHub Actions

**Test Job Configuration**:
- Runs on: `ubuntu-latest`
- MySQL service: `mysql:8.0` (test database)
- Node.js version: 18
- Steps:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run database migrations
  5. Run tests with coverage
  6. Upload coverage reports

**Test Command**: `npm run test:ci`
- Includes `--ci` flag
- Generates coverage report
- Uses 2 max workers for parallel execution

**Failure Behavior**: CI/CD pipeline fails if tests fail (prevents deployment)

**Coverage Upload**: Coverage reports uploaded to Codecov (if configured)

### Test Execution Time

- **Target**: < 2 minutes
- **Current**: ~90 seconds (all tests)
- **CI/CD**: ~2 minutes (including setup)

---

## 7. LOGGING & MONITORING

### Logging Library/Framework Used

**Implementation**: Custom secure logger (`server/middleware/secureLogger.js`)

**Features**:
- Structured JSON logging
- Automatic sensitive data redaction
- Multiple log levels
- Security event logging

### Log Levels and When They're Used

**Log Levels**:
- **debug**: Detailed debugging information (not currently used)
- **info**: General informational messages (request logging)
- **warn**: Warning messages (rate limit warnings, suspicious activity)
- **error**: Error messages (exceptions, failures)
- **security**: Security events (authentication, MFA, password resets)

**Log Level Configuration**: `LOG_LEVEL` environment variable (default: 'info')

### What Events Are Logged

#### Request Logging
- All HTTP requests (method, path, status code, response time)
- Client IP address
- User agent
- Request ID

#### Authentication Events
- Successful logins
- Failed login attempts
- Registration attempts
- Password reset requests
- MFA setup/enable/disable

#### Security Events
- Rate limit violations
- Suspicious activity patterns
- Failed authentication attempts
- Security policy violations

#### Error Events
- Unhandled exceptions
- Database errors
- Validation errors
- API errors

### Log Storage Location

**Application Logs**: Console output (stdout/stderr)
- Format: JSON
- Can be redirected to log files or log aggregation services
- In production, should be collected by log management system

**Security Events**: Database table `security_events`
- Persistent storage for security audit trail
- Queryable for analysis
- Includes event type, user ID, IP address, severity, details

### Log Rotation Policies

**Not Currently Implemented**: Log rotation handled by system or log management service

**Recommendations**:
- Use log rotation tools (logrotate, etc.)
- Set maximum log file size
- Retain logs for compliance period
- Archive old logs

### Monitoring Tools Integrated

**Current Implementation**:
- Custom security monitoring middleware (`server/middleware/monitoring.js`)
- Detects suspicious patterns:
  - Multiple failed logins from same IP
  - Rapid requests from same IP

**Security Event Detection**:
- Failed login attempts: Logged to `security_events` table
- Rate limit violations: Logged and monitored
- Suspicious activity: Detected and logged with severity levels

**Future Enhancements**:
- Integration with monitoring services (Datadog, New Relic, etc.)
- Real-time alerting
- Dashboard for security metrics
- Performance monitoring

---

## 8. ERROR HANDLING

### Global Error Handling Strategy

**Implementation**: Global error handler in `server/server.js`

**Error Handler**:
```javascript
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    requestId: req.id,
  });
  
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';
  
  res.status(err.status || 500).json({
    error: message,
    requestId: req.id,
  });
});
```

**Features**:
- Catches all unhandled errors
- Logs errors with context (path, method, IP, request ID)
- Returns generic message in production (prevents information leakage)
- Returns detailed message in development
- Includes request ID for tracking

### Error Response Formats

**Standard Error Response**:
```json
{
  "error": "Error message",
  "requestId": "unique-request-id"
}
```

**Validation Error Response**:
```json
{
  "errors": [
    {
      "msg": "Validation error message",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

**Rate Limit Error Response**:
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

### Custom Error Classes/Types

**Not Currently Implemented**: All errors are standard JavaScript Error objects

**Future Enhancement**: Could implement custom error classes:
```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.status = 400;
  }
}
```

### Client-Side vs Server-Side Error Handling

#### Server-Side
- All errors caught by global error handler
- Errors logged securely (sensitive data redacted)
- Generic error messages returned to client
- Request ID included for support tracking

#### Client-Side
**Implementation**: `src/lib/api.ts`

**Error Handling**:
- 401 Unauthorized: Token removed, redirect to login
- 403 Forbidden: Error message displayed
- Other errors: Error message from response or generic message

**Example**:
```typescript
if (response.status === 401) {
  removeToken();
  window.location.href = '/#/register?type=customer';
}
```

### Error Logging Practices

**Secure Logging**:
- Sensitive data automatically redacted
- Passwords, tokens, secrets never logged
- Error stack traces only in development
- Request context included (path, method, IP, user ID)

**Log Format**:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "error",
  "message": "Error message",
  "error": {
    "name": "Error",
    "message": "Error message",
    "stack": "..." // Only in development
  },
  "path": "/api/endpoint",
  "method": "POST",
  "ip": "127.0.0.1",
  "requestId": "unique-id"
}
```

### User-Facing Error Messages Approach

**Principles**:
1. **Generic Messages**: Don't reveal system internals
2. **Actionable**: Tell user what they can do
3. **Consistent**: Same error type = same message
4. **Secure**: No information leakage

**Examples**:
- Login failure: "Invalid email or password" (doesn't reveal if user exists)
- Registration failure: "Registration failed. Please check your information and try again."
- Not found: "Resource not found"
- Unauthorized: "Access denied"
- Rate limited: "Too many requests. Please try again after X seconds."

---

## 9. HEALTH CHECKS

### Health Check Endpoints

**Endpoint**: `GET /health`

**Implementation**: `server/server.js`

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lume API is running' });
});
```

### What Each Health Check Monitors

**Current Implementation**: Basic health check
- Server is running
- Endpoint is accessible

**Future Enhancements**: Could include:
- Database connectivity
- External service availability
- Memory usage
- Disk space
- Response time

### Response Formats

**Success Response**:
```json
{
  "status": "ok",
  "message": "Lume API is running"
}
```

**Future Enhanced Response** (example):
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": "100MB",
    "free": "900MB"
  }
}
```

### Frequency and Timeout Settings

**Not Currently Configured**: Health checks are on-demand

**Recommendations**:
- External monitoring services should check every 30-60 seconds
- Timeout: 5 seconds
- Failure threshold: 3 consecutive failures

### Integration with Monitoring Tools

**Current**: No external monitoring integration

**Recommended Integrations**:
- Uptime monitoring services (UptimeRobot, Pingdom, etc.)
- Application Performance Monitoring (APM) tools
- Load balancer health checks
- Kubernetes liveness/readiness probes

---

## 10. CI/CD PIPELINE

### CI/CD Platform Used

**Platform**: GitHub Actions

**Workflow File**: `.github/workflows/ci-cd.yml`

### Pipeline Stages and Their Purposes

#### Stage 1: Test
**Purpose**: Run all tests and ensure code quality

**Steps**:
1. **Checkout code**: Get latest code from repository
2. **Setup MySQL service**: Start MySQL 8.0 container for testing
3. **Setup Node.js**: Install Node.js 18 with npm caching
4. **Install dependencies**: Run `npm ci` in server directory
5. **Run migrations**: Set up test database schema
6. **Run tests**: Execute Jest tests with coverage
7. **Upload coverage**: Send coverage reports to Codecov

**Triggers**: Push to `main` or `develop`, pull requests to `main` or `develop`

**Failure Behavior**: Pipeline fails if tests fail

#### Stage 2: Build
**Purpose**: Build frontend application

**Steps**:
1. **Checkout code**: Get latest code
2. **Setup Node.js**: Install Node.js 18
3. **Install dependencies**: Run `npm ci` for frontend
4. **Build frontend**: Run `npm run build`
5. **Check build artifacts**: Verify `dist` directory exists

**Triggers**: Only on push to `main` (after tests pass)

**Condition**: `needs: test` (runs after test stage)

#### Stage 3: Deploy
**Purpose**: Deployment notification (placeholder)

**Steps**:
1. **Deploy notification**: Logs deployment readiness

**Triggers**: Only on push to `main` (after build)

**Condition**: `needs: [test, build]` (runs after both stages)

**Note**: Actual deployment steps would be added here (e.g., deploy to hosting service)

### Deployment Environments

**Current Configuration**:
- **Development**: Local development
- **Test**: CI/CD test environment (MySQL container)
- **Production**: Not configured (placeholder)

**Environment Variables in CI/CD**:
```yaml
DB_HOST: localhost
DB_USER: root
DB_PASSWORD: test_password
DB_NAME: lume_db_test
JWT_SECRET: test-jwt-secret-key-for-ci-cd-pipeline
MFA_ENCRYPTION_KEY: test-mfa-encryption-key-32-chars-long
NODE_ENV: test
```

### Automated Checks

#### Linting
**Not Currently Configured**: ESLint available but not run in CI/CD

**Recommendation**: Add linting step:
```yaml
- name: Run linter
  run: npm run lint
```

#### Testing
- **Framework**: Jest
- **Command**: `npm run test:ci`
- **Coverage**: Generated and uploaded
- **Failure**: Pipeline fails if tests fail

#### Security Scans
**Not Currently Configured**

**Recommendations**:
- Dependency vulnerability scanning (npm audit, Snyk, etc.)
- Code security scanning (SonarQube, etc.)
- Secret scanning (GitHub Secret Scanning, etc.)

### Deployment Strategy

**Current**: Not implemented (placeholder stage)

**Recommended Strategies**:
- **Blue-Green Deployment**: Run two identical environments, switch traffic
- **Rolling Deployment**: Gradually replace instances
- **Canary Deployment**: Deploy to subset of users first

### Environment Variables Management

**CI/CD**: Environment variables set in workflow file (for test environment)

**Production**: Should use:
- GitHub Secrets (for sensitive values)
- Environment-specific configuration files
- Secrets management services (AWS Secrets Manager, HashiCorp Vault, etc.)

**Required Variables**:
- Database credentials
- JWT secret
- MFA encryption key
- Frontend URL
- Cookie domain

### Build and Deployment Process

**Build Process**:
1. Install dependencies (`npm ci`)
2. Run tests
3. Build frontend (`npm run build`)
4. Verify build artifacts

**Deployment Process** (to be implemented):
1. Run tests (must pass)
2. Build application
3. Deploy to staging (optional)
4. Run smoke tests (optional)
5. Deploy to production
6. Verify deployment
7. Monitor for issues

---

## 11. DEPENDENCIES & LIBRARIES

### Security-Relevant Libraries

#### Authentication/Authorization Libraries

**jsonwebtoken** (v9.0.2)
- **Purpose**: JWT token generation and verification
- **Security**: Cryptographically secure token signing
- **Usage**: User authentication, session management

**bcryptjs** (v2.4.3)
- **Purpose**: Password hashing
- **Security**: bcrypt algorithm with configurable salt rounds
- **Usage**: Password storage, password verification

**speakeasy** (v2.0.0)
- **Purpose**: TOTP (Time-based One-Time Password) generation
- **Security**: RFC 6238 compliant TOTP implementation
- **Usage**: Multi-factor authentication

#### Encryption/Hashing Libraries

**crypto** (Node.js built-in)
- **Purpose**: Cryptographic operations
- **Security**: AES-256-GCM encryption for MFA secrets
- **Usage**: MFA secret encryption, token hashing, random byte generation

#### Security Middleware

**helmet** (v7.1.0)
- **Purpose**: Security headers middleware
- **Security**: Sets various security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Usage**: Applied to all requests

**express-rate-limit** (v7.1.5)
- **Purpose**: Rate limiting middleware
- **Security**: Prevents brute force attacks, DDoS
- **Usage**: Applied to authentication and API endpoints

**cors** (v2.8.5)
- **Purpose**: Cross-Origin Resource Sharing
- **Security**: Controls which origins can access API
- **Usage**: Configured per environment (strict in production)

#### Validation Libraries

**express-validator** (v7.0.1)
- **Purpose**: Input validation and sanitization
- **Security**: Prevents injection attacks, validates input
- **Usage**: All user input validated before processing

**zod** (v3.25.76) - Frontend
- **Purpose**: Schema validation
- **Security**: Type-safe validation, prevents invalid data
- **Usage**: Frontend form validation

### Other Security-Critical Dependencies

**mysql2** (v3.6.5)
- **Purpose**: MySQL database driver
- **Security**: Supports prepared statements (SQL injection prevention)
- **Usage**: All database queries use parameterized queries

**dotenv** (v16.3.1)
- **Purpose**: Environment variable management
- **Security**: Loads secrets from environment (not committed to code)
- **Usage**: Configuration management

### Version Management Strategy

**Package Managers**:
- **Backend**: npm (package-lock.json)
- **Frontend**: npm (package-lock.json)

**Lock Files**: Both `package-lock.json` files committed to repository
- Ensures consistent dependency versions
- Prevents unexpected updates

**Update Strategy**:
- Regular dependency audits recommended
- Security updates applied promptly
- Major version updates tested thoroughly

**Security Advisories**:
- Monitor npm security advisories
- Use `npm audit` to check for vulnerabilities
- Update vulnerable dependencies immediately

### Dependency Versions

**Backend Dependencies** (from `server/package.json`):
```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.5",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "multer": "^1.4.5-lts.1",
  "express-validator": "^7.0.1",
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0",
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.3"
}
```

**Frontend Dependencies** (from `package.json`):
- React ecosystem: React 18.3.1, React DOM 18.3.1
- UI components: Radix UI components (various versions)
- Form handling: React Hook Form 7.61.1, Zod 3.25.76
- State management: TanStack Query 5.83.0
- Routing: React Router DOM 6.30.1
- Styling: Tailwind CSS 3.4.17

---

## 12. ENVIRONMENT CONFIGURATION

### Required Environment Variables

#### Database Configuration
```env
DB_HOST=localhost          # Database host
DB_USER=root              # Database user
DB_PASSWORD=your_password # Database password
DB_NAME=lume_db           # Database name
DB_PORT=3306              # Database port (optional, default: 3306)
```

#### Authentication
```env
JWT_SECRET=your-strong-random-secret-key        # JWT signing secret (minimum 32 characters)
JWT_EXPIRES_IN=7d                               # JWT expiration (default: 7d)
```

#### Multi-Factor Authentication
```env
MFA_ENCRYPTION_KEY=your-32-character-encryption-key  # MFA secret encryption key (minimum 32 characters)
```

#### Application Configuration
```env
NODE_ENV=production                    # Environment (development, production, test)
PORT=3001                              # Server port (default: 3001)
FRONTEND_URL=https://your-frontend.com # Frontend URL for CORS
COOKIE_DOMAIN=.yourdomain.com          # Cookie domain (optional)
```

#### Logging
```env
LOG_LEVEL=info                         # Log level (debug, info, warn, error)
ENABLE_SECURITY_LOGGING=true           # Enable security event logging
```

### Configuration Management Approach

**Development**:
- `.env` file in `server/` directory (not committed to git)
- Loaded via `dotenv` package
- Example values in documentation

**Production**:
- Environment variables set in hosting platform
- Never committed to repository
- Managed via secrets management service

**CI/CD**:
- Environment variables set in GitHub Actions workflow
- Test-specific values for CI/CD pipeline

### Secrets Management

**Current Approach**: Environment variables

**Best Practices**:
- Never commit secrets to repository
- Use strong, random secrets
- Rotate secrets regularly
- Use different secrets per environment
- Store secrets in secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)

**Secret Generation**:
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# MFA Encryption Key (32+ characters)
openssl rand -base64 32
```

### Different Environment Setups

#### Development Environment
```env
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=dev_password
DB_NAME=lume_db_dev
JWT_SECRET=dev-jwt-secret-key
MFA_ENCRYPTION_KEY=dev-mfa-encryption-key-32-chars
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

**Characteristics**:
- Relaxed CORS (allows all origins)
- Detailed error messages
- Debug logging enabled
- Local database

#### Staging Environment
```env
NODE_ENV=staging
DB_HOST=staging-db.example.com
DB_USER=staging_user
DB_PASSWORD=staging_password
DB_NAME=lume_db_staging
JWT_SECRET=staging-jwt-secret-key
MFA_ENCRYPTION_KEY=staging-mfa-encryption-key-32-chars
FRONTEND_URL=https://staging.example.com
LOG_LEVEL=info
```

**Characteristics**:
- Production-like configuration
- Separate database
- Testing environment for QA

#### Production Environment
```env
NODE_ENV=production
DB_HOST=production-db.example.com
DB_USER=prod_user
DB_PASSWORD=strong-production-password
DB_NAME=lume_db
JWT_SECRET=strong-random-production-secret
MFA_ENCRYPTION_KEY=strong-random-production-key-32-chars
FRONTEND_URL=https://app.example.com
COOKIE_DOMAIN=.example.com
LOG_LEVEL=warn
ENABLE_SECURITY_LOGGING=true
```

**Characteristics**:
- Strict CORS (specific origins only)
- Generic error messages
- Security logging enabled
- HTTPS required
- Secure cookie settings

#### Test Environment (CI/CD)
```env
NODE_ENV=test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=test_password
DB_NAME=lume_db_test
JWT_SECRET=test-jwt-secret-key-for-ci-cd-pipeline
MFA_ENCRYPTION_KEY=test-mfa-encryption-key-32-chars-long
```

**Characteristics**:
- Isolated test database
- Test-specific secrets
- Fast test execution

### Environment Variable Validation

**Not Currently Implemented**: Environment variables are not validated on startup

**Recommendation**: Add validation:
```javascript
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'MFA_ENCRYPTION_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

## Document Information

**Last Updated**: Generated from codebase analysis
**Version**: 1.0
**Maintained By**: Development Team

---

## Appendix: Quick Reference

### Key Files
- **Server Entry**: `server/server.js`
- **Database Schema**: `server/database/schema.sql`
- **Auth Middleware**: `server/middleware/auth.js`
- **MFA Implementation**: `server/middleware/mfa.js`
- **Security Headers**: `server/middleware/securityHeaders.js`
- **Rate Limiting**: `server/middleware/rateLimiter.js`
- **Logging**: `server/middleware/secureLogger.js`
- **CI/CD Config**: `.github/workflows/ci-cd.yml`

### Common Commands
```bash
# Backend
cd server
npm install
npm run migrate
npm run dev
npm test
npm run test:coverage

# Frontend
npm install
npm run dev
npm run build

# Database
npm run migrate
```

### Important URLs
- **API Base**: `http://localhost:3001/api`
- **Health Check**: `http://localhost:3001/health`
- **Frontend**: `http://localhost:5173` (dev) or configured `FRONTEND_URL` (prod)

---

*End of Technical Documentation*
