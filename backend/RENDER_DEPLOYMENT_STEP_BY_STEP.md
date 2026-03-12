# 🚀 Render Deployment - Step by Step Guide

## 📋 **Pre-Deployment Checklist**

### **1. Required Accounts & Services**
- [ ] **Render Account**: [Sign up here](https://render.com)
- [ ] **GitHub Account**: Already connected ✅
- [ ] **MongoDB Atlas**: [Create free cluster](https://cloud.mongodb.com)

### **2. Project Requirements**
- [ ] **GitHub Repository**: https://github.com/Abdessalem2000/social-media-automation-saas ✅
- [ ] **Backend Ready**: Production-ready ✅
- [ ] **Environment Variables**: Documented ✅

---

## 🎯 **Step 1: Set Up MongoDB Atlas**

### **Create MongoDB Cluster**
1. **Go to** [MongoDB Atlas](https://cloud.mongodb.com)
2. **Sign up** or **Log in**
3. **Create New Project**: "Social Media Automation"
4. **Create Cluster**: 
   - **Plan**: M0 Sandbox (Free)
   - **Cloud Provider**: AWS
   - **Region**: Choose closest to you
5. **Wait for cluster creation** (2-5 minutes)

### **Configure Database Access**
1. **Database Access** → **Add New Database User**
   - **Username**: `socialmedia_user`
   - **Password**: Generate strong password
   - **Save** the password somewhere safe

### **Configure Network Access**
1. **Network Access** → **Add IP Address**
2. **Choose**: "Allow Access from Anywhere" (0.0.0.0/0)
3. **Confirm** and **Save**

### **Get Connection String**
1. **Database** → **Connect** → **Connect your application**
2. **Driver**: Node.js
3. **Copy** the connection string
4. **Replace** `<password>` with your actual password
5. **Replace** `<dbname>` with `social-media-automation`

**Example Connection String:**
```
mongodb+srv://socialmedia_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/social-media-automation
```

---

## 🎯 **Step 2: Deploy to Render**

### **Create Render Web Service**
1. **Go to** [Render Dashboard](https://dashboard.render.com)
2. **Click** "New +" → "Web Service"
3. **Connect Repository**: 
   - **GitHub**: Connect your account
   - **Repository**: `social-media-automation-saas`
   - **Branch**: `master`

### **Configure Service Settings**
```
Name: social-media-automation-api
Environment: Node
Region: Choose closest to your MongoDB region
Branch: master
Root Directory: backend
```

### **Build & Start Commands**
```
Build Command: npm install
Start Command: npm start
```

### **Instance Type**
```
Instance Type: Free (for testing) or Starter ($7/month)
```

### **Advanced Settings**
```
Auto-Deploy: Yes
Health Check Path: /health
```

---

## 🎯 **Step 3: Configure Environment Variables**

### **Add Environment Variables in Render**
1. **Environment** tab in your service settings
2. **Add** the following variables:

#### **Required Variables**
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://portfolio-gamma-rouge-94.vercel.app

# MongoDB (replace with your actual connection string)
MONGODB_URI=mongodb+srv://socialmedia_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/social-media-automation

# JWT Secrets (generate new ones)
JWT_ACCESS_SECRET=your-super-secret-access-key-32-chars-long-minimum
JWT_REFRESH_SECRET=your-super-secret-refresh-key-64-chars-long-minimum
```

#### **Optional Variables**
```bash
TZ=UTC
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SCHEDULER_ENABLED=true
LOG_LEVEL=info
```

### **Generate JWT Secrets**
```bash
# For JWT_ACCESS_SECRET (32+ characters)
openssl rand -base64 32

# For JWT_REFRESH_SECRET (64+ characters)  
openssl rand -base64 64
```

---

## 🎯 **Step 4: Deploy and Monitor**

### **Trigger Deployment**
1. **Save** environment variables
2. **Click** "Create Web Service"
3. **Wait** for deployment (2-5 minutes)

### **Monitor Deployment**
1. **Watch** the build logs
2. **Check** for any errors
3. **Verify** successful deployment

### **Test Health Check**
```bash
curl https://your-service-name.onrender.com/health
```

**Expected Response:**
```json
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

---

## 🎯 **Step 5: Test API Endpoints**

### **Test Authentication**
```bash
# Test Registration
curl -X POST https://your-service-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test Login
curl -X POST https://your-service-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### **Test CORS**
```bash
# Test CORS preflight
curl -X OPTIONS https://your-service-name.onrender.com/api/auth/login \
  -H "Origin: https://portfolio-gamma-rouge-94.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

---

## 🔧 **Troubleshooting Common Issues**

### **Issue 1: Build Fails**
**Symptoms**: Build log shows npm install errors
**Solutions**:
- Check `package.json` is valid
- Verify all dependencies are listed
- Check for syntax errors in code

### **Issue 2: Server Doesn't Start**
**Symptoms**: Service starts but crashes
**Solutions**:
- Check environment variables are set correctly
- Verify MongoDB connection string is valid
- Check JWT secrets are long enough

### **Issue 3: Database Connection Fails**
**Symptoms**: MongoDB connection errors
**Solutions**:
- Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
- Check connection string format
- Verify database user credentials

### **Issue 4: CORS Errors**
**Symptoms**: Frontend can't access API
**Solutions**:
- Verify FRONTEND_URL is set correctly
- Check CORS configuration in server.js
- Test with curl from allowed origin

### **Issue 5: Health Check Fails**
**Symptoms**: Health check returns error
**Solutions**:
- Check server is listening on process.env.PORT
- Verify all required environment variables
- Check for startup errors in logs

---

## 📊 **Post-Deployment Verification**

### **Check List**
- [ ] **Health endpoint** returns 200 OK
- [ ] **User registration** works
- [ ] **User login** works and returns tokens
- [ ] **CORS headers** are present
- [ ] **Database connection** is established
- [ ] **Scheduler service** is running
- [ ] **Rate limiting** is working
- [ ] **Error handling** is working

### **Performance Tests**
```bash
# Test response time
time curl https://your-service-name.onrender.com/health

# Test rate limiting
for i in {1..10}; do
  curl https://your-service-name.onrender.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test$i@example.com","password":"password123","name":"Test User"}'
done
```

---

## 🎉 **Success!**

### **Your API is Live!**
- **API URL**: https://your-service-name.onrender.com
- **Health Check**: https://your-service-name.onrender.com/health
- **Documentation**: https://github.com/Abdessalem2000/social-media-automation-saas

### **Next Steps**
1. **Update frontend** to use the new API URL
2. **Test full application** integration
3. **Set up monitoring** and alerts
4. **Consider upgrading** to Starter plan for production

---

## 📞 **Support**

### **Render Support**
- **Documentation**: https://render.com/docs
- **Status**: https://status.render.com
- **Support**: support@render.com

### **Project Support**
- **GitHub**: https://github.com/Abdessalem2000/social-media-automation-saas
- **Author**: Kentache Abdessalem
- **Email**: kentacheabdou1@gmail.com

---

## 🔄 **Quick Reference**

### **Environment Variables Template**
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://portfolio-gamma-rouge-94.vercel.app
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_ACCESS_SECRET=32-char-secret
JWT_REFRESH_SECRET=64-char-secret
```

### **Render Service Config**
- **Build**: `npm install`
- **Start**: `npm start`
- **Root**: `backend`
- **Health**: `/health`

**🚀 Your backend will be live on Render in minutes!**
