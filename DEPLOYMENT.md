# Fanpit Backend Deployment Guide

## 🚀 Production Deployment on Render

### 1. Prepare Your Repository

The `simple-server.js` is production-ready and perfect for deployment. It includes:
- ✅ CORS configuration for multiple origins
- ✅ Error handling and validation
- ✅ Request logging
- ✅ Health check endpoint
- ✅ Environment-based configuration

### 2. Deploy to Render

1. **Connect your GitHub repository to Render**
2. **Create a new Web Service**
3. **Configure the service:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm run start:simple:prod`
   - **Environment:** `Node`

### 3. Environment Variables in Render

Add these environment variables in your Render dashboard:

```bash
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-frontend-app.vercel.app,https://fanpit.vercel.app
```

**Important:** Replace `your-frontend-app.vercel.app` with your actual Vercel frontend URL.

### 4. Frontend Configuration

Update your frontend's API configuration to point to your Render backend URL:

```typescript
// In your frontend config
const API_BASE_URL = 'https://your-backend-app.onrender.com/api/v1';
```

### 5. Test Your Deployment

After deployment, test these endpoints:

- **Health Check:** `GET https://your-backend-app.onrender.com/api/v1/health`
- **API Info:** `GET https://your-backend-app.onrender.com/`
- **Register:** `POST https://your-backend-app.onrender.com/api/v1/auth/register`

### 6. Available Scripts

```bash
# Development
npm run start:simple

# Production
npm run start:simple:prod
```

## 🔧 Current Features

The simple server provides these endpoints:

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login  
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/health` - Health check
- `GET /` - API information

## 🔄 Next Steps

This is a mock server for quick deployment. For full production, you can:

1. **Add real database** (MongoDB/PostgreSQL)
2. **Implement real authentication** (JWT tokens)
3. **Add payment processing** (Razorpay integration)
4. **Add email notifications**
5. **Implement real business logic**

## 🛡️ Security Notes

- The current server uses mock authentication
- For production, implement proper JWT token validation
- Add rate limiting and input sanitization
- Use HTTPS in production
- Keep environment variables secure

## 📞 Support

If you encounter any issues during deployment, check:
1. Render service logs
2. Environment variables are set correctly
3. CORS origins include your frontend URL
4. Port configuration matches Render's requirements
