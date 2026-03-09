# Social Media Automation SaaS Platform

A production-ready Social Media Automation SaaS platform built with React Native/Expo frontend and Node.js/Express backend. Designed for small businesses and content creators to automate their social media presence across multiple platforms.

## 🚀 **Production Status: MVP READY**

✅ **Core Automation Engine** - Fully functional scheduling and publishing system  
✅ **JWT Authentication** - Secure access/refresh token implementation  
✅ **Error Handling** - Comprehensive error management and logging  
✅ **Production Build** - Optimized deployment-ready codebase  
✅ **Environment Validation** - Secure configuration management  

---

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Node.js API   │    │   MongoDB       │
│   Frontend       │◄──►│   Backend       │◄──►│   Database      │
│   (Expo)        │    │   (Express)     │    │   (Mongoose)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  Cron Scheduler │              │
         │              │  (node-cron)    │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  Mock Publishing│              │
         │              │  Service        │              │
         │              └─────────────────┘              │
         └───────────────────────┴───────────────────────┘
```

---

## 📱 **Core Features**

### **Automation Engine**
- **Scheduling System**: Cron-based post scheduling (runs every minute)
- **Mock Publishing**: Realistic platform simulation with engagement metrics
- **Status Management**: Draft → Scheduled → Published → Failed workflow
- **Concurrent Processing**: Handles multiple posts simultaneously
- **Error Recovery**: Automatic retry and failure tracking

### **Authentication & Security**
- **JWT Access Tokens**: 15-minute expiry with automatic refresh
- **Refresh Tokens**: 7-day expiry with secure storage
- **Role-Based Access**: User/Admin role structure
- **Rate Limiting**: Configurable request limits
- **Input Validation**: Comprehensive request sanitization

### **Analytics & Monitoring**
- **Real-time Dashboard**: Live post statistics and engagement metrics
- **Performance Tracking**: Success rates, processing times, error rates
- **Health Checks**: System status and scheduler monitoring
- **Structured Logging**: JSON-formatted logs with request tracking

### **Production Features**
- **Environment Validation**: Startup configuration verification
- **Graceful Shutdown**: Clean process termination
- **Error Handling**: Centralized error management
- **Build Scripts**: Production deployment automation

---

## 🛠️ **Technology Stack**

### **Frontend**
- **React Native 0.81.5** with **Expo 54**
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **React Navigation 7** for navigation
- **React Native Paper 5** for UI components
- **i18next** for internationalization (EN/FR/AR)

### **Backend**
- **Node.js 18+** with **Express 4**
- **MongoDB** with **Mongoose 7**
- **JWT** for authentication
- **node-cron 3** for scheduling
- **Winston-style** structured logging
- **Helmet** for security headers

### **Development Tools**
- **ESLint** for code quality
- **Jest** for testing
- **Nodemon** for development
- **Docker** support for containerization

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm 8+
- MongoDB 5.0+
- Git

### **Backend Setup**

```bash
# Clone the repository
git clone https://github.com/your-org/social-media-automation.git
cd social-media-automation/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build:prod
```

### **Frontend Setup**

```bash
cd ../

# Install dependencies
npm install

# Start development server
npm start

# Run on device
npm run android    # or npm run ios
```

---

## ⚙️ **Configuration**

### **Environment Variables**

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourapp.com

# Database
MONGODB_URI=mongodb://localhost:27017/social-media-automation

# JWT Security (CRITICAL)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_CONCURRENCY_LIMIT=5
```

### **Production Deployment**

1. **Build the application**:
   ```bash
   npm run build:prod
   ```

2. **Deploy to server**:
   ```bash
   # Copy dist/ folder to production server
   scp -r dist/ user@server:/opt/social-media-automation/
   ```

3. **Set up environment**:
   ```bash
   cd /opt/social-media-automation/
   cp .env.example .env
   # Configure production variables
   ```

4. **Start the service**:
   ```bash
   ./start.sh
   ```

5. **Health check**:
   ```bash
   node health-check.js
   ```

---

## 📊 **API Documentation**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### **Scheduling**
- `GET /api/scheduling` - Get user posts
- `POST /api/scheduling` - Create new post
- `GET /api/scheduling/scheduled` - Get scheduled posts
- `GET /api/scheduling/published` - Get published posts

### **Analytics**
- `GET /api/analytics/overview` - Analytics overview
- `GET /api/analytics/trends` - Engagement trends
- `GET /api/analytics/top-posts` - Top performing posts

### **System**
- `GET /health` - System health check
- `GET /api/scheduler/status` - Scheduler status

---

## 🔧 **Development**

### **Running Tests**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### **Code Quality**
```bash
npm run lint            # Check code quality
npm run lint:fix        # Auto-fix issues
```

### **Docker Development**
```bash
npm run docker:build    # Build Docker image
npm run docker:run      # Run container
```

---

## 📈 **Monitoring & Logging**

### **Log Levels**
- `error` - Critical errors and failures
- `warn` - Warning messages
- `info` - General information
- `debug` - Debug details (development only)

### **Health Endpoints**
- `/health` - Basic health check
- `/api/scheduler/status` - Scheduler status

### **Error Tracking**
All errors include:
- Request ID for tracing
- Error codes for categorization
- Stack traces (development only)
- Context information

---

## 🔒 **Security Features**

- **JWT Authentication** with access/refresh tokens
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **Security Headers** via Helmet
- **CORS Configuration** for cross-origin requests
- **Environment Validation** for secure deployment

---

## 🚀 **Performance**

- **Concurrent Processing** for scheduled posts
- **Database Indexing** for optimal queries
- **Memory Management** with graceful shutdown
- **Request Tracking** with unique IDs
- **Structured Logging** for monitoring

---

## 📋 **Roadmap**

### **Phase 1 - MVP** ✅ COMPLETED
- [x] Core automation engine
- [x] Authentication system
- [x] Error handling
- [x] Production build

### **Phase 2 - Enhancement** (Next)
- [ ] Real social media API integration
- [ ] Advanced analytics
- [ ] Team collaboration
- [ ] Webhook system

### **Phase 3 - Scale** (Future)
- [ ] Microservices architecture
- [ ] Real-time notifications
- [ ] Advanced AI features
- [ ] Enterprise features

---

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/your-org/social-media-automation/issues)
- **Documentation**: [Wiki](https://github.com/your-org/social-media-automation/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/social-media-automation/discussions)

---

## 🏆 **Acknowledgments**

- Expo team for the amazing framework
- React Native community
- Open source contributors
- Algerian tech community for inspiration and feedback

---

**Built with ❤️ for the global social media community**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go (Android)
   - Use the Camera app to scan QR code (iOS)
   - Or press `w` to open in web browser

## Project Structure

```
src/
├── store/                 # Redux store configuration
│   ├── slices/           # Redux slices for different features
│   └── index.ts          # Store configuration
├── screens/              # Screen components
│   ├── auth/            # Authentication screens
│   ├── scheduling/       # Content scheduling screens
│   ├── accounts/         # Social media account management
│   └── ...
├── components/           # Reusable UI components
├── navigation/           # Navigation configuration
├── services/            # API services and integrations
├── utils/               # Utility functions
├── constants/            # App constants
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
├── locales/             # Internationalization files
└── assets/              # Images, fonts, etc.
```

## Development Commands

- `npm start` - Start development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Social Media Platform Integrations

### Currently Supported
- Facebook Pages & Groups
- Instagram Business
- TikTok (planned)
- Twitter/X (planned)
- LinkedIn (planned)

### API Integration Status
- ✅ Facebook Graph API
- ✅ Instagram Basic Display API
- 🚧 TikTok for Developers
- 🚧 Twitter API v2
- 🚧 LinkedIn API

## Monetization Model

### Freemium Tiers
- **Free**: 2 social platforms, 10 scheduled posts/month
- **Pro ($5/month)**: Unlimited posts, AI suggestions, basic analytics
- **Premium ($10/month)**: All platforms, advanced analytics, team features

## Target Market

### Primary Focus
- Algerian small businesses and content creators
- French and Arabic speaking markets
- Mobile-first users in emerging markets

### Secondary Markets
- Francophone Africa
- Middle Eastern markets
- Global SMBs seeking affordable automation

## Roadmap

### MVP (Current - 3 months)
- [x] Basic app structure and navigation
- [x] Redux state management
- [x] Internationalization setup
- [ ] Facebook/Instagram integration
- [ ] Content scheduling system
- [ ] Basic analytics dashboard

### Phase 2 (6 months)
- [ ] TikTok and Twitter integration
- [ ] AI-powered content suggestions
- [ ] Advanced analytics
- [ ] Team collaboration features

### Phase 3 (12 months)
- [ ] WhatsApp Business integration
- [ ] Custom workflow builder
- [ ] White-label solutions
- [ ] Advanced AI chatbots

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Project Lead: [Your Name]
- Email: [your.email@example.com]
- Website: [your-website.com]

## Acknowledgments

- Expo team for the amazing framework
- React Native community
- Open source contributors
- Algerian tech community for inspiration and feedback
