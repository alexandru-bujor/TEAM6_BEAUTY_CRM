import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import salonRoutes from './routes/salons.js';
import serviceRoutes from './routes/services.js';
import employeeRoutes from './routes/employees.js';
import appointmentRoutes from './routes/appointments.js';
import userRoutes from './routes/users.js';
import verificationRoutes from './routes/verification.js';
import adminRoutes from './routes/admin.js';
import passwordResetRoutes from './routes/passwordReset.js';
import mfaRoutes from './routes/mfa.js';

// Import security middleware
import { securityHeaders, customSecurityHeaders } from './middleware/securityHeaders.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { logger } from './middleware/secureLogger.js';

// Import migration function
import { runMigrations } from './database/migrate.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
// In development, allow all origins. In production, use specific origins.
const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }
  : {
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };

// Security headers (must be early in middleware chain)
app.use(securityHeaders);
app.use(customSecurityHeaders);

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });
  next();
});

// General API rate limiting
app.use('/api', apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lume API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    requestId: req.id,
  });
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';
  
  res.status(err.status || 500).json({
    error: message,
    requestId: req.id,
  });
});

// Start server with migrations
async function startServer() {
  try {
    // Run migrations before starting server
    console.log('🔄 Running database migrations...');
    const migrationSuccess = await runMigrations();
    
    if (!migrationSuccess) {
      console.warn('⚠️  Migration had issues, but continuing server startup...');
      console.warn('⚠️  If this is the first run, please check your database configuration');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

