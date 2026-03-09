# Social Media Automation SaaS - Backend API

<div align="center">

![Social Media Automation](https://img.shields.io/badge/Social%20Media-Automation-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18-blue?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7.5-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

</div>

## 📋 Project Overview

Social Media Automation SaaS is a comprehensive backend API that enables users to schedule, manage, and publish content across multiple social media platforms. The system provides enterprise-grade reliability with idempotency protection, distributed locking, and robust error handling.

### 🎯 Key Features

- **Multi-Platform Support**: Facebook, Instagram, Twitter, TikTok, LinkedIn
- **Content Scheduling**: Advanced cron-based scheduling with timezone support
- **Idempotency Protection**: Prevents duplicate posts and ensures data consistency
- **Distributed Locking**: Atomic operations with automatic cleanup
- **Analytics & Insights**: Comprehensive post performance metrics
- **User Management**: Secure authentication with JWT tokens
- **Error Handling**: Centralized logging with graceful shutdown
- **Rate Limiting**: Configurable API protection
- **Health Monitoring**: Real-time system status endpoints

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Controllers   │    │    Models        │    │   Services      │
│                 │    │                 │    │                 │
│ • Auth          │    │ • User          │    │ • Scheduler     │
│ • Users         │    │ • Post          │    │ • Publishing   │
│ • Social Media  │    │ • Social Media  │    │ • Analytics     │
│ • Scheduling   │    │ • Refresh Token │    │                 │
│ • Analytics     │    │                 │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                        ┌─────────────────┐
                        │  Middleware     │
                        │                 │
                        │ • Auth          │
                        │ • Error Handler │
                        │ • Rate Limit    │
                        │ • Security      │
                        └─────────────────┘
```

### Data Flow

1. **Request** → **Middleware** → **Controllers** → **Services** → **Models** → **Database**
2. **Scheduler** runs independently with distributed locking
3. **Publishing Service** handles platform-specific API calls
4. **Error Handler** provides centralized logging and response formatting

## 🛠️ Tech Stack

### Backend Technologies

| Category | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 18.x | JavaScript runtime |
| **Framework** | Express.js | 4.18.2 | Web framework |
| **Database** | MongoDB | 7.5+ | Document storage |
| **ODM** | Mongoose | 7.5.0 | Object modeling |
| **Authentication** | JWT | 9.0.2 | Token-based auth |
| **Security** | Helmet | 7.1.0 | HTTP headers |
| **Rate Limiting** | express-rate-limit | 7.1.5 | API protection |
| **Validation** | express-validator | 7.0.1 | Input validation |
| **Logging** | Morgan | 1.10.0 | HTTP request logging |
| **Scheduling** | node-cron | 3.0.3 | Cron jobs |
| **Environment** | dotenv | 16.3.1 | Config management |

### Development Tools

| Tool | Purpose |
|-------|---------|
| **ESLint** | Code linting and formatting |
| **Jest** | Unit and integration testing |
| **Nodemon** | Auto-restart in development |
| **Docker** | Containerization and deployment |

## 🚀 Installation

### Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** 5.0 or higher
- **npm** 8.x or higher

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/social-media-automation.git
   cd social-media-automation/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Docker Setup

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

## ⚙️ Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/social-media-automation` |
| `JWT_ACCESS_SECRET` | JWT access token secret | `your-32-char-secret` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `your-64-char-secret` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TZ` | `UTC` | Server timezone |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `SCHEDULER_ENABLED` | `true` | Enable/disable scheduler |

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `POST` | `/register` | User registration |
| `POST` | `/login` | User login |
| `POST` | `/refresh` | Refresh access token |
| `POST` | `/logout` | User logout |

### Users (`/api/users`)

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/profile` | Get user profile |
| `PUT` | `/profile` | Update user profile |
| `PUT` | `/preferences` | Update user preferences |
| `PUT` | `/password` | Change password |
| `DELETE` | `/account` | Delete account |

### Social Media (`/api/social-media`)

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/` | Get connected accounts |
| `POST` | `/connect` | Connect new account |
| `DELETE` | `/:accountId` | Disconnect account |
| `POST` | `/:accountId/sync` | Sync account data |
| `GET` | `/:platform/authenticate-url` | Get OAuth URL |

### Scheduling (`/api/scheduling`)

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/` | Get all posts |
| `POST` | `/` | Create new post |
| `GET` | `/scheduled` | Get scheduled posts |
| `GET` | `/published` | Get published posts |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/overview` | Get analytics overview |
| `GET` | `/trends` | Get engagement trends |
| `GET` | `/top-posts` | Get top performing posts |
| `GET` | `/platform/:platform` | Get platform-specific analytics |

### System

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/health` | System health check |
| `GET` | `/api/scheduler/status` | Scheduler status |

## 🚀 Deployment Guide

### Production Deployment

1. **Environment Setup**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=mongodb://your-production-db
   export JWT_ACCESS_SECRET=your-production-secret
   ```

2. **Build Application**
   ```bash
   npm run build:prod
   ```

3. **Start Server**
   ```bash
   npm start
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Environment-Specific Considerations

- **Development**: Hot reload, verbose logging, relaxed rate limits
- **Production**: Optimized builds, structured logging, strict rate limits
- **Testing**: In-memory database, mock services

## 🔒 Security Features

### Authentication & Authorization

- **JWT-based authentication** with access/refresh token pattern
- **Password hashing** using bcryptjs with salt rounds
- **Token expiration** with configurable TTL
- **Secure headers** with Helmet middleware
- **CORS protection** with configurable origins

### Rate Limiting

- **Sliding window** rate limiting
- **Configurable limits** per environment
- **Automatic IP blocking** for excessive requests
- **Custom error responses** with retry information

### Data Protection

- **Input validation** using express-validator
- **SQL injection prevention** through Mongoose ODM
- **XSS protection** with Helmet CSP headers
- **Environment variable validation** on startup

## 📊 Monitoring & Logging

### Health Checks

- **System health** endpoint with uptime and memory usage
- **Scheduler status** endpoint with processing statistics
- **Database connectivity** checks
- **External service** health monitoring

### Logging Strategy

- **Structured logging** with request correlation IDs
- **Error categorization** with stack traces
- **Performance metrics** with response times
- **Security event** logging for audit trails

## 🧪 Testing

### Test Suite

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Categories

- **Unit Tests**: Individual function and method testing
- **Integration Tests**: API endpoint testing
- **Scheduler Tests**: Cron job and locking mechanism
- **Security Tests**: Authentication and authorization flows

## 🔄 Idempotency & Reliability

### Duplicate Prevention

The scheduler implements **enterprise-grade idempotency protection**:

- **Distributed Locking**: Atomic database-level locks prevent concurrent processing
- **Attempt Tracking**: Unique IDs prevent batch reprocessing
- **Status Verification**: Double-check post status before publishing
- **Automatic Cleanup**: Expired lock recovery and orphaned lock cleanup
- **Crash Recovery**: Graceful restart with lock cleanup

### Lock Management

```javascript
// Lock acquisition is atomic and process-specific
const lockAcquired = await Post.updateOne({
  _id: postId,
  $or: [
    { processingLock: { $exists: false } },
    { 'processingLock.lockExpiresAt': { $lt: now } }
  ]
}, {
  $set: {
    processingLock: {
      locked: true,
      lockedBy: processId,
      lockExpiresAt: expiration
    }
  }
});
```

## 📈 Performance & Scaling

### Concurrency Control

- **Configurable batch sizes** for post processing
- **Parallel processing** with controlled limits (5 concurrent posts)
- **Memory optimization** with streaming for large datasets
- **Database indexing** optimized for query patterns

### Caching Strategy

- **In-memory caching** for frequently accessed data
- **Database connection pooling** for optimal performance
- **Response compression** for API responses
- **Static asset optimization** with proper headers

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Standards

- **ESLint configuration** with strict rules
- **Prettier formatting** for consistent style
- **TypeScript types** for better IDE support
- **Comprehensive testing** with >80% coverage

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kentache Abdessalem**  
📧 Email: [kentacheabdou1@gmail.com](mailto:kentacheabdou1@gmail.com)  
🌐 Portfolio: [https://portfolio-gamma-rouge-94.vercel.app](https://portfolio-gamma-rouge-94.vercel.app)  
🔗 GitHub: [Your GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- **Express.js** team for the excellent web framework
- **MongoDB** for the flexible database solution
- **JWT** maintainers for secure authentication
- **Node.js** community for the robust runtime environment

---

<div align="center">

**⭐ Star this repository if it helped you!**

Made with ❤️ by [Kentache Abdessalem](https://portfolio-gamma-rouge-94.vercel.app)

</div>
