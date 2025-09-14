# 🚀 Fanpit Backend - Production Deployment Guide

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Backup & Recovery](#backup--recovery)

## 🛠️ Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / CentOS 7+ / Docker
- **RAM**: Minimum 2GB, Recommended 4GB+
- **CPU**: 2 cores minimum, 4+ cores recommended
- **Storage**: 20GB minimum for application + database
- **Network**: Stable internet connection

### Software Requirements
```bash
# Docker & Docker Compose
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Node.js (if running without Docker)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 for process management (optional)
sudo npm install -g pm2
```

### Network Configuration
- **HTTP**: Port 80 (redirect to HTTPS)
- **HTTPS**: Port 443
- **API**: Port 3001
- **MongoDB**: Port 27017 (internal)
- **Redis**: Port 6379 (internal)
- **MinIO**: Port 9000 (internal)

## 🌍 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/fanpit-backend.git
cd fanpit-backend
```

### 2. Environment Configuration
```bash
# Copy production environment template
cp env.production.example .env.production

# Edit with your production values
nano .env.production
```

### 3. Required Environment Variables

#### Database Configuration
```env
# MongoDB Atlas (Recommended for Production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fanpit_prod?retryWrites=true&w=majority
MONGODB_DATABASE=fanpit_prod

# Alternative: Local MongoDB
MONGODB_URI=mongodb://mongodb:27017/fanpit_prod
MONGODB_ROOT_USERNAME=admin
MONGODB_ROOT_PASSWORD=secure_password_here
```

#### Authentication & Security
```env
JWT_ACCESS_SECRET=your_64_character_random_string_here
JWT_REFRESH_SECRET=your_64_character_random_string_here
BCRYPT_ROUNDS=12
```

#### File Storage (AWS S3)
```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=fanpit-space-images
```

#### Payment Gateway (Razorpay)
```env
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### Email Service
```env
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Fanpit Platform
```

#### External Services
```env
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_secure_redis_password

SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
```

## 🗄️ Database Setup

### MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create cluster and database user
3. Whitelist your server IP
4. Get connection string
5. Update `MONGODB_URI` in environment

### Database Initialization
```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Reset database (development only)
npm run db:reset
```

## 🚀 Deployment

### Method 1: Docker Deployment (Recommended)

#### Quick Deploy
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy application
./scripts/deploy.sh
```

#### Manual Docker Deployment
```bash
# Build Docker image
docker build -t fanpit-backend .

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Method 2: PM2 Deployment

#### Install Dependencies
```bash
npm ci --production=false
npm run build
```

#### Configure PM2
```bash
# Create ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'fanpit-backend',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000,
    autorestart: true,
  }],
};
```

#### Start with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 🔍 Monitoring

### Health Checks
```bash
# API Health Check
curl -f http://localhost:3001/api/v1/health

# Docker Health Check
docker-compose ps

# PM2 Status
pm2 status
pm2 monit
```

### Application Monitoring
- **Sentry**: Error tracking and performance monitoring
- **New Relic**: Application performance monitoring
- **PM2**: Process monitoring and auto-restart

### System Monitoring
```bash
# System resources
htop
df -h
free -h

# Docker monitoring
docker stats
docker system df

# Application logs
docker-compose logs -f app
pm2 logs fanpit-backend
```

## 🔒 Security

### SSL/TLS Configuration
```nginx
# nginx.conf SSL configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

    # ... rest of configuration
}
```

### Security Headers
- ✅ Helmet.js for security headers
- ✅ Rate limiting (100 requests/15min)
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ SQL/NoSQL injection prevention

### Backup Security
- ✅ Encrypted database backups
- ✅ Secure file storage
- ✅ Audit logging
- ✅ Access control

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check MongoDB connection
docker-compose exec mongodb mongo --eval "db.stats()"

# Check connection string
grep MONGODB_URI .env.production

# Restart database service
docker-compose restart mongodb
```

#### Application Not Starting
```bash
# Check logs
docker-compose logs app
pm2 logs fanpit-backend

# Check environment variables
cat .env.production

# Validate configuration
npm run test:unit
```

#### High Memory Usage
```bash
# Check memory usage
docker stats
pm2 monit

# Restart services
docker-compose restart
pm2 restart fanpit-backend
```

#### Slow Performance
```bash
# Check Redis connection
docker-compose exec redis redis-cli ping

# Check database performance
docker-compose exec mongodb mongosh --eval "db.serverStatus()"

# Enable query profiling
docker-compose exec mongodb mongosh fanpit_prod --eval "db.setProfilingLevel(2)"
```

### Log Analysis
```bash
# View recent logs
docker-compose logs --tail=100 app

# Search for specific errors
docker-compose logs app | grep ERROR

# PM2 log analysis
pm2 logs --lines 100
pm2 logs --err
```

## 💾 Backup & Recovery

### Database Backup
```bash
# MongoDB backup
docker-compose exec mongodb mongodump --db fanpit_prod --out /backup/$(date +%Y%m%d_%H%M%S)

# Automated backup script
crontab -e
# Add: 0 2 * * * /path/to/fanpit-backend/scripts/backup.sh
```

### File Backup
```bash
# S3 bucket backup
aws s3 sync s3://your-bucket /backup/files/$(date +%Y%m%d)

# Local file backup
tar -czf /backup/uploads_$(date +%Y%m%d).tar.gz /app/uploads
```

### Recovery Procedures
```bash
# Database recovery
docker-compose exec mongodb mongorestore --db fanpit_prod /backup/latest_dump

# File recovery
aws s3 sync /backup/files/latest s3://your-bucket

# Full system recovery
docker-compose down
docker-compose up -d
```

## 📊 Performance Optimization

### Database Optimization
```javascript
// Create indexes
db.spaces.createIndex({ location: "2dsphere" });
db.spaces.createIndex({ ownerId: 1, status: 1 });
db.bookings.createIndex({ spaceId: 1, startTime: 1 });
db.bookings.createIndex({ userId: 1, createdAt: -1 });
```

### Caching Strategy
```javascript
// Redis cache configuration
const cacheConfig = {
  ttl: 3600, // 1 hour
  max: 1000, // Maximum cache entries
};
```

### CDN Configuration
```nginx
# Static file serving with CDN headers
location /uploads/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
}
```

## 🔄 Updates & Maintenance

### Rolling Updates
```bash
# Zero-downtime deployment
docker-compose up -d --no-deps app

# Blue-green deployment
docker tag fanpit-backend:latest fanpit-backend:previous
docker build -t fanpit-backend:new .
docker-compose up -d app
```

### Maintenance Mode
```bash
# Enable maintenance mode
docker-compose exec app touch /app/maintenance.flag

# Disable maintenance mode
docker-compose exec app rm /app/maintenance.flag
```

## 📞 Support

### Emergency Contacts
- **Technical Lead**: tech@yourdomain.com
- **DevOps**: devops@yourdomain.com
- **Security**: security@yourdomain.com

### Monitoring Alerts
- **CPU Usage > 90%**: Immediate investigation
- **Memory Usage > 90%**: Service restart
- **Disk Usage > 90%**: Cleanup or expansion
- **Response Time > 5s**: Performance optimization

### Documentation Links
- [API Documentation](http://localhost:3001/api/docs)
- [Health Check](http://localhost:3001/api/v1/health)
- [Monitoring Dashboard](https://your-monitoring-domain.com)

---

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backup created
- [ ] Monitoring tools configured
- [ ] Security audit completed

### Deployment
- [ ] Docker images built successfully
- [ ] Services started without errors
- [ ] Health checks passing
- [ ] Database migrations completed
- [ ] CDN configured (if applicable)

### Post-Deployment
- [ ] Application accessible via domain
- [ ] SSL working correctly
- [ ] Monitoring dashboards active
- [ ] Backup jobs scheduled
- [ ] Team notified of deployment

### Security Verification
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] Input validation active
- [ ] Audit logging enabled
- [ ] Access controls configured

**🎉 Your Fanpit Backend is now production-ready!**
