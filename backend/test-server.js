require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    }
  });
});

// Basic test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Mock authentication endpoints
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: '1',
        email: req.body.email || 'test@example.com',
        name: req.body.name || 'Test User'
      },
      token: 'mock-jwt-token-for-testing'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: '1',
        email: req.body.email || 'test@example.com',
        name: 'Test User'
      },
      token: 'mock-jwt-token-for-testing'
    }
  });
});

// Mock scheduling endpoints
app.get('/api/scheduling/posts', (req, res) => {
  res.json({
    success: true,
    data: {
      posts: [
        {
          id: '1',
          content: 'Test post content',
          platforms: ['twitter'],
          scheduledDate: '2026-03-14',
          status: 'scheduled'
        }
      ]
    }
  });
});

// Mock user endpoints
app.get('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString()
      }
    }
  });
});

// Mock social media endpoints
app.get('/api/social-media/accounts', (req, res) => {
  res.json({
    success: true,
    data: {
      accounts: [
        {
          id: '1',
          platform: 'twitter',
          accountName: '@testuser',
          username: 'testuser'
        }
      ]
    }
  });
});

// Mock analytics endpoints
app.get('/api/analytics/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalPosts: 10,
      scheduledPosts: 3,
      publishedPosts: 7,
      engagementRate: 4.5
    }
  });
});

// Catch-all for other API routes
app.use('/api/*', (req, res) => {
  res.json({
    success: true,
    message: `Mock response for ${req.method} ${req.originalUrl}`,
    data: {}
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
