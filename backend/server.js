const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configuration and middleware
const { envValidator } = require('./config/envValidator');
const { errorHandler, notFoundHandler, requestIdMiddleware } = require('./middleware/errorHandler');

// Validate environment variables
try {
  envValidator.validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  console.error('Please check your .env file and fix the issues above.');
  process.exit(1);
}

// Get validated configuration
const config = envValidator.getConfig();

// const connectDB = require('./config/database');

// Connect to database (commented out for now)
// connectDB();

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
app.use(cors({
  origin: config.frontendUrl,
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
  console.log(`🛑 ${signal} received, shutting down gracefully...`);
  
  // Stop the scheduler
  schedulerService.stop();
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`🔗 API base: http://localhost:${config.port}/api`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`📅 Timezone: ${config.scheduler.timezone}`);
  
  // Start the scheduler service if enabled
  if (config.scheduler.enabled) {
    schedulerService.start();
  } else {
    console.log('⏸️  Scheduler is disabled');
  }
});

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;
