# Render Deployment Guide

## 🚀 Quick Setup

### 1. Create Render Web Service

1. **Log in to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure deployment settings** (see below)

### 2. Deployment Configuration

#### **Basic Settings**
- **Name**: `social-media-automation-api`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `master`

#### **Build Settings**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `backend` (if backend is in subfolder)

#### **Advanced Settings**
- **Instance Type**: `Free` or `Starter` (for production)
- **Auto-Deploy**: `Yes` (for automatic updates)
- **Health Check Path**: `/health`

### 3. Environment Variables

Add these environment variables in Render Dashboard:

#### **Required Variables**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/social-media-automation
JWT_ACCESS_SECRET=your-32-character-secret-key
JWT_REFRESH_SECRET=your-64-character-secret-key
FRONTEND_URL=https://your-app-name.onrender.com
```

#### **Optional Variables**
```bash
PORT=3001
TZ=UTC
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
SCHEDULER_ENABLED=true
```

### 4. MongoDB Setup

#### **Option 1: MongoDB Atlas (Recommended)**
1. **Create [MongoDB Atlas](https://cloud.mongodb.com) account**
2. **Create a free cluster**
3. **Add your Render IP to whitelist**
4. **Get connection string** and add to environment variables

#### **Option 2: Render MongoDB**
1. **Create MongoDB service on Render**
2. **Use the provided connection string**
3. **Add to environment variables**

### 5. Frontend URL Configuration

After deploying your frontend:
1. **Get your frontend URL** (e.g., `https://your-app.onrender.com`)
2. **Update FRONTEND_URL** environment variable
3. **Redeploy** to apply changes

---

## 📋 Deployment Checklist

### ✅ Pre-Deployment Verification

- [ ] **Repository is clean** (no uncommitted changes)
- [ ] **Environment variables documented** in `.env.example`
- [ ] **Health check endpoint** working (`GET /health`)
- [ ] **Start script** correct (`npm start`)
- [ ] **Port configuration** uses `process.env.PORT`
- [ ] **MongoDB connection** string ready
- [ ] **JWT secrets** generated and secure

### ✅ Render Configuration

- [ ] **Web Service created** with correct settings
- [ ] **Build command**: `npm install`
- [ ] **Start command**: `npm start`
- [ ] **Root directory**: `backend` (if applicable)
- [ ] **Health check path**: `/health`
- [ ] **Auto-deploy** enabled (optional)

### ✅ Environment Variables Set

- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` (MongoDB connection string)
- [ ] `JWT_ACCESS_SECRET` (32+ characters)
- [ ] `JWT_REFRESH_SECRET` (64+ characters)
- [ ] `FRONTEND_URL` (your frontend URL)

---

## 🔧 Troubleshooting

### Common Issues

#### **1. Build Fails**
```bash
# Check logs in Render Dashboard
# Verify package.json is correct
# Ensure all dependencies are in package.json
```

#### **2. Server Doesn't Start**
```bash
# Check environment variables
# Verify PORT configuration
# Check MongoDB connection string
```

#### **3. Health Check Fails**
```bash
# Verify /health endpoint exists
# Check server is listening on correct port
# Ensure no errors in startup
```

#### **4. Database Connection Issues**
```bash
# Verify MongoDB URI format
# Check IP whitelist (MongoDB Atlas)
# Ensure database credentials are correct
```

#### **5. CORS Issues**
```bash
# Update FRONTEND_URL environment variable
# Verify frontend URL is correct
# Check CORS configuration in server.js
```

### Debug Commands

#### **Check Server Logs**
```bash
# In Render Dashboard:
# 1. Go to your service
# 2. Click "Logs" tab
# 3. Check for error messages
```

#### **Test Health Endpoint**
```bash
curl https://your-service-name.onrender.com/health
```

#### **Check Environment Variables**
```bash
# Add temporary endpoint to debug
app.get('/debug-env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
  });
});
```

---

## 🚀 Post-Deployment

### 1. Verify Deployment

```bash
# Test health endpoint
curl https://your-service-name.onrender.com/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "production",
    "version": "1.0.0",
    "memory": {...},
    "scheduler": {...}
  }
}
```

### 2. Test API Endpoints

```bash
# Test user registration
curl -X POST https://your-service-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test login
curl -X POST https://your-service-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Monitor Performance

- **Check Render Dashboard** for metrics
- **Monitor MongoDB Atlas** for database performance
- **Set up alerts** for downtime or errors

---

## 📊 Scaling Considerations

### When to Upgrade

- **CPU usage > 80%** consistently
- **Memory usage > 80%** consistently
- **Response times > 2 seconds**
- **Database connections maxed out**

### Scaling Options

1. **Upgrade Render Instance**
   - Free → Starter → Standard
   - More CPU, RAM, and bandwidth

2. **Database Scaling**
   - Upgrade MongoDB Atlas tier
   - Add read replicas
   - Optimize queries

3. **Caching Layer**
   - Add Redis for session storage
   - Cache frequent API responses
   - Implement CDN for static assets

---

## 🔒 Security Best Practices

### 1. Environment Variables
- **Use strong secrets** for JWT keys
- **Rotate secrets regularly**
- **Never commit secrets to git**

### 2. Database Security
- **Use MongoDB Atlas security features**
- **Enable IP whitelisting**
- **Use SSL connections**

### 3. API Security
- **Enable rate limiting**
- **Validate all inputs**
- **Use HTTPS only**

### 4. Monitoring
- **Set up error alerts**
- **Monitor suspicious activity**
- **Regular security audits**

---

## 📞 Support

### Render Support
- **Documentation**: [Render Docs](https://render.com/docs)
- **Status Page**: [Render Status](https://status.render.com)
- **Support**: support@render.com

### Project Support
- **Author**: Kentache Abdessalem
- **Email**: kentacheabdou1@gmail.com
- **Portfolio**: https://portfolio-gamma-rouge-94.vercel.app

---

## 🎉 Success!

Your Social Media Automation SaaS backend is now deployed on Render! 🚀

**Next Steps:**
1. Deploy your frontend application
2. Connect frontend to backend API
3. Test the complete application
4. Set up monitoring and alerts
5. Scale as needed

**Remember to:**
- Monitor your deployment regularly
- Keep dependencies updated
- Backup your database
- Test new features before deploying
