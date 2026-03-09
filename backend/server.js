const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { logger } = require('./middleware/errorHandler');

require('dotenv').config();
const { envValidator } = require('./config/envValidator');
const { errorHandler, notFoundHandler, requestIdMiddleware } = require('./middleware/errorHandler');

// Validate environment variables
try {
  envValidator.validateEnvironment();
} catch (error) {
  logger.error('Environment validation failed', error);
  process.exit(1);
}

// Get validated configuration
const config = envValidator.getConfig();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const socialMediaRoutes = require('./routes/socialMedia');
const schedulingRoutes = require('./routes/scheduling');
const analyticsRoutes = require('./routes/analytics');

// Import services
const schedulerService = require('./services/schedulerService');

const app = express();

// Request ID middleware (should be first)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:19006", // Expo development
  config.frontendUrl // Production frontend from environment variable
].filter(Boolean); // Remove any undefined/null values

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === 'production' ? config.rateLimit.max : config.rateLimit.max * 10, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});
app.use('/api/', limiter);

// Logging middleware
if (config.env === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      requestId: req.id,
      scheduler: schedulerService.getStatus()
    }
  });
});

// Scheduler status endpoint
app.get('/api/scheduler/status', (req, res) => {
  const status = schedulerService.getStatus();
  res.json({
    success: true,
    data: status,
    requestId: req.id
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.warn(`🛑 ${signal} received, shutting down gracefully...`, { signal });
  
  // Stop scheduler
  schedulerService.stop();
  
  // Close server
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`, {
    port: config.port,
    environment: config.env,
    timezone: config.scheduler.timezone
  });
  
  // Start scheduler service if enabled
  if (config.scheduler.enabled) {
    schedulerService.start();
  } else {
    logger.info('Scheduler is disabled');
  }
});

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', new Error(String(reason)), { promise });
  gracefulShutdown('unhandledRejection');
});

module.exports = app;
