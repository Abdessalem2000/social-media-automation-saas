/**
 * Test Server with Mock Database
 * For testing without MongoDB dependency
 */

require('dotenv').config({ path: '.env.test' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import mock models
const {
  User: MockUser,
  Post: MockPost,
  RefreshToken: MockRefreshToken,
  SocialMediaAccount: MockSocialMediaAccount
} = require('./test-mock-db');

// Mock the actual models
const originalRequire = require;
require = function(id) {
  if (id === '../models/User') return MockUser;
  if (id === '../models/Post') return MockPost;
  if (id === '../models/RefreshToken') return MockRefreshToken;
  if (id === '../models/SocialMediaAccount') return MockSocialMediaAccount;
  if (id === './services/schedulerService') return {
    start: () => console.log('Mock scheduler started'),
    stop: () => console.log('Mock scheduler stopped'),
    getStats: () => ({
      isRunning: true,
      uptime: process.uptime(),
      nextRun: 'Every minute',
      processedJobs: 0,
      failedJobs: 0,
      memory: process.memoryUsage()
    })
  };
  return originalRequire(id);
};

// Import configuration and middleware
const { envValidator } = require('./config/envValidator');
const { errorHandler, notFoundHandler, requestIdMiddleware } = require('./middleware/errorHandler');

// Override environment validation for test
envValidator.validateEnvironment = () => {
  console.log('🔍 Using test environment with mock database');
};

// Get validated configuration
const config = envValidator.getConfig();

// Mock the actual models before importing routes
require = function(id) {
  if (id.includes('../models/User')) return MockUser;
  if (id.includes('../models/Post')) return MockPost;
  if (id.includes('../models/RefreshToken')) return MockRefreshToken;
  if (id.includes('../models/SocialMediaAccount')) return MockSocialMediaAccount;
  if (id.includes('./services/schedulerService')) return {
    start: () => console.log('Mock scheduler started'),
    stop: () => console.log('Mock scheduler stopped'),
    getStats: () => ({
      isRunning: true,
      uptime: process.uptime(),
      nextRun: 'Every minute',
      processedJobs: 0,
      failedJobs: 0,
      memory: process.memoryUsage()
    })
  };
  return originalRequire(id);
};

// Import routes after mocking
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: '1.0.0',
      memory: process.memoryUsage(),
      requestId: req.requestId,
      database: {
        status: 'Mock',
        type: 'In-Memory Test Database'
      },
      scheduler: schedulerService.getStats()
    }
  };

  res.json(healthCheck);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Scheduler status endpoint
app.get('/api/scheduler/status', (req, res) => {
  const stats = schedulerService.getStats();
  res.json({
    success: true,
    data: stats,
    requestId: req.requestId
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port || 3002;
const server = app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
  console.log(`💾 Database: Mock (In-Memory)`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ Test server closed successfully');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.log('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;
