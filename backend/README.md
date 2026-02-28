# Social Media Automation Backend

A modern, secure RESTful API backend for the Social Media Automation application.

## 🚀 Features

- **Authentication & Authorization** with JWT
- **Social Media Platform Integration** (Facebook, Instagram, Twitter, TikTok, LinkedIn)
- **Post Scheduling & Management**
- **Analytics & Insights**
- **User Management**
- **Rate Limiting & Security**
- **Data Validation** with Express Validator
- **MongoDB Integration** with Mongoose

## 📋 Prerequisites

- Node.js 16+
- MongoDB 4.4+
- npm or yarn

## 🛠️ Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration

4. Start MongoDB (make sure it's running on your system)

5. Start the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🗄️ Database Models

### User
- Authentication and user management
- Profile information and preferences
- Role-based access control

### SocialMediaAccount
- Connected social media accounts
- Platform-specific data and tokens
- Sync status and profile metrics

### Post
- Content creation and management
- Scheduling and publishing
- Performance metrics and analytics

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/preferences` - Update preferences
- `PUT /api/users/password` - Change password

### Social Media
- `GET /api/social-media` - Get connected accounts
- `POST /api/social-media/connect` - Connect new account
- `DELETE /api/social-media/:accountId` - Disconnect account
- `POST /api/social-media/:accountId/sync` - Sync account data
- `GET /api/social-media/:platform/auth-url` - Get platform auth URL

### Scheduling
- `GET /api/scheduling` - Get all posts
- `POST /api/scheduling` - Create new post
- `GET /api/scheduling/scheduled` - Get scheduled posts
- `GET /api/scheduling/published` - Get published posts

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/trends` - Get engagement trends
- `GET /api/analytics/top-posts` - Get top performing posts
- `GET /api/analytics/platform/:platform` - Platform-specific analytics

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation and sanitization
- Helmet.js for security headers

## 📊 Environment Variables

See `.env.example` for all available configuration options:

- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `FRONTEND_URL` - Frontend application URL
- Social media API keys and secrets
- Email configuration for notifications

## 🚦 Development

The API runs on `http://localhost:3001` by default.

Health check endpoint: `http://localhost:3001/health`

## 📝 API Documentation

All API endpoints return JSON responses with the following structure:

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## 🔗 Integration with Frontend

The backend is designed to work seamlessly with the React Native frontend:

- CORS configured for frontend URL
- JWT tokens for authentication
- RESTful API structure
- Consistent error handling
- Real-time sync capabilities
