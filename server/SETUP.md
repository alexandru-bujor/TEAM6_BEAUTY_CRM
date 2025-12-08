# Backend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update:
   - Database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
   - JWT_SECRET (use a strong random string)
   - FRONTEND_URL (your frontend URL, default: http://localhost:5173)

3. **Setup Database**
   
   Option A: Using MySQL command line
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   
   Option B: Using the migration script
   ```bash
   npm run migrate
   ```

4. **Create Uploads Directory**
   ```bash
   mkdir uploads
   ```

5. **Start Server**
   ```bash
   # Development (with auto-reload)
   npm run dev
   
   # Production
   npm start
   ```

## Database Setup

### Manual Setup

1. Open MySQL:
   ```bash
   mysql -u root -p
   ```

2. Create database:
   ```sql
   CREATE DATABASE lume_db;
   USE lume_db;
   ```

3. Import schema:
   ```sql
   SOURCE database/schema.sql;
   ```

### Using Migration Script

The migration script will:
- Connect to MySQL
- Create the database if it doesn't exist
- Create all tables and relationships

Run: `npm run migrate`

## Environment Variables

Required variables in `.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lume_db
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

## Testing the API

1. **Health Check**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Register Customer**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register/customer \
     -H "Content-Type: application/json" \
     -d '{
       "email": "customer@test.com",
       "password": "password123",
       "firstName": "John",
       "lastName": "Doe",
       "phone": "1234567890",
       "location": "New York, NY"
     }'
   ```

3. **Login**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "customer@test.com",
       "password": "password123"
     }'
   ```

## API Base URL

All API endpoints are prefixed with `/api`:

- Authentication: `/api/auth/*`
- Salons: `/api/salons/*`
- Services: `/api/services/*`
- Employees: `/api/employees/*`
- Appointments: `/api/appointments/*`
- Users: `/api/users/*`

## Frontend Integration

Update your frontend to use the backend API:

1. Create an API client (e.g., `src/lib/api.ts`):
   ```typescript
   const API_BASE_URL = 'http://localhost:3001/api';
   
   export const api = {
     get: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`),
     post: (endpoint: string, data: any) => 
       fetch(`${API_BASE_URL}${endpoint}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data)
       }),
     // ... etc
   };
   ```

2. Store JWT token after login and include in requests:
   ```typescript
   const token = localStorage.getItem('token');
   fetch(`${API_BASE_URL}/endpoint`, {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Port Already in Use
- Change PORT in `.env`
- Or kill the process using port 3001

### CORS Errors
- Update FRONTEND_URL in `.env` to match your frontend URL
- Ensure CORS middleware is configured correctly

### JWT Errors
- Ensure JWT_SECRET is set in `.env`
- Check token expiration
- Verify token is included in Authorization header

## Next Steps

1. Update frontend to connect to backend API
2. Replace mock data with API calls
3. Add error handling
4. Implement file uploads for images
5. Add email verification (optional)
6. Add phone verification (optional)

