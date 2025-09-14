# Fanpit Backend API

Production-ready NestJS backend for the Fanpit space booking platform with complete implementation of all assignment requirements.

## 🚀 Assignment Implementation Status

✅ **All Core Requirements Implemented**
- Authentication with JWT access + refresh tokens
- Role-based access control (Consumer, Brand Owner, Staff, Admin)
- Complete space management with CRUD operations
- Sophisticated pricing engine with multiple models
- Full booking workflow with Razorpay integration
- Staff check-in/check-out dashboard
- Payment webhooks and status management
- Comprehensive API documentation with Swagger

## 🏗️ Architecture

Built following **SOLID principles** and **clean architecture**:
- **Modular Structure**: Separate modules for each domain
- **Dependency Injection**: NestJS IoC container
- **Repository Pattern**: Service layer abstraction
- **DTO Validation**: Input/output validation with class-validator
- **Error Handling**: Global exception filters
- **Security**: Multiple layers of protection

## 📊 Database Schema

### Core Entities

#### User Schema
```typescript
{
  name: string
  email: string (unique)
  password: string (hashed with bcrypt)
  phone?: string
  role: 'consumer' | 'brand_owner' | 'staff' | 'admin'
  isEmailVerified: boolean
  isPhoneVerified: boolean
  avatar?: string
  ownedSpaces?: ObjectId[]
  staffAtSpaces?: ObjectId[]
  isActive: boolean
  refreshToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}
```

#### Space Schema (Advanced)
```typescript
{
  name: string
  description: string
  location: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    coordinates: { lat: number, lng: number }
  }
  capacity: number
  type: 'coworking' | 'event_space' | 'meeting_room' | 'casual_space'
  images: string[]
  amenities: Array<{ name: string, icon: string, description?: string }>
  ownerId: ObjectId
  staffIds: ObjectId[]
  pricingRules: PricingRule[] // Sophisticated pricing engine
  businessHours: BusinessHours[]
  status: 'active' | 'inactive' | 'maintenance'
  rating: number
  totalReviews: number
  totalBookings: number
  totalRevenue: number
  tags: string[]
  metadata: object // Extensible for additional features
  isPublished: boolean
  isFeatured: boolean
  featuredImage?: string
  createdAt: Date
  updatedAt: Date
}
```

#### Sophisticated Pricing Rules
```typescript
interface PricingRule {
  id: string
  name: string
  type: 'hourly' | 'daily' | 'monthly' | 'bundle' | 'promo'
  basePrice: number
  conditions: {
    timeSlots?: string[] // ["09:00-12:00", "18:00-21:00"]
    dayOfWeek?: number[] // [0,6] for weekends
    dateRange?: { start: Date; end: Date }
    minDuration?: number
    maxDuration?: number
    peakMultiplier?: number // 1.5x for peak hours
  }
  discountPercentage?: number
  promoCode?: string
  isActive: boolean
}
```

#### Booking Schema (Complete Lifecycle)
```typescript
{
  userId: ObjectId
  spaceId: ObjectId
  date: Date
  startTime: string
  endTime: string
  duration: number
  priceBreakdown: {
    baseAmount: number
    taxes: number
    discounts: number
    totalAmount: number
    appliedRules: string[]
    promoCode?: string
  }
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show' | 'refunded'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  bookingCode: string (unique - "FP" + timestamp + random)
  qrCode?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  checkInDetails?: {
    checkedInAt: Date
    checkedInBy: ObjectId
    notes?: string
    actualStartTime?: string
  }
  checkOutDetails?: {
    checkedOutAt: Date
    checkedOutBy: ObjectId
    notes?: string
    actualEndTime?: string
    damageReported?: boolean
    additionalCharges?: number
  }
  cancellationReason?: string
  cancelledAt?: Date
  cancelledBy?: ObjectId
  refundAmount?: number
  refundedAt?: Date
  notifications: string[]
  reminderSent: boolean
  feedbackRequested: boolean
  metadata: object
  createdAt: Date
  updatedAt: Date
}
```

#### Payment Schema (Razorpay Integration)
```typescript
{
  bookingId: ObjectId
  userId: ObjectId
  razorpayOrderId: string
  razorpayPaymentId?: string
  amount: number // in paise
  currency: string // "INR"
  status: 'created' | 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded'
  method?: 'card' | 'upi' | 'netbanking' | 'wallet'
  description?: string
  razorpayResponse?: any
  refunds: RefundDetails[]
  failureReason?: string
  capturedAt?: Date
  authorizedAt?: Date
  failedAt?: Date
  metadata: object
  webhookEvents: Array<{
    eventId: string
    eventType: string
    processedAt: Date
    payload: any
  }>
  createdAt: Date
  updatedAt: Date
}
```

## 🔐 Security Implementation

### Authentication & Authorization
- **JWT Strategy**: Access tokens (1h) + Refresh tokens (7d)
- **Password Security**: bcryptjs with 12 salt rounds
- **Role-based Guards**: Consumer, Brand Owner, Staff, Admin roles
- **Route Protection**: Public/Private route decorators
- **Token Refresh**: Secure token rotation mechanism

### Security Middleware
- **Helmet**: Security headers
- **CORS**: Configurable origins
- **Rate Limiting**: 100 requests/minute per IP
- **Input Validation**: DTO validation with class-validator
- **Sanitization**: MongoDB injection protection
- **Error Handling**: No sensitive data in error responses

## 💰 Pricing Engine Features

### Multiple Pricing Models
1. **Hourly Rates**: Base hourly pricing
2. **Daily Rates**: Full day bookings
3. **Monthly Passes**: Subscription-based access
4. **Time Bundles**: 4-hour blocks, 8-hour blocks
5. **Peak/Off-peak**: Dynamic multipliers
6. **Promo Codes**: Percentage-based discounts

### Advanced Pricing Logic
```typescript
// Example: Calculate price for 6-hour booking on weekend evening
const pricing = await spacesService.calculatePrice(
  spaceId, 
  new Date('2024-01-20'), // Saturday
  '18:00', // Peak evening time
  6, // 6 hours
  'WEEKEND20' // Promo code
);

// Result:
{
  baseAmount: 3000, // 6 hours × ₹500/hour
  taxes: 540,       // 18% GST
  discounts: 600,   // 20% weekend promo
  totalAmount: 2940,
  appliedRules: ['Hourly Rate', 'Peak Multiplier', 'Weekend Promo'],
  promoCode: 'WEEKEND20'
}
```

## 📱 Staff Dashboard Features

### Real-time Check-in System
- **Today's Bookings**: Live list for each space
- **QR Code Scanning**: Quick check-in with booking codes
- **Guest Management**: Check-in/check-out with timestamps
- **Status Updates**: Mark no-shows, early checkouts
- **Notes & Reports**: Damage reports, special requests

### Staff Operations
```typescript
// Check-in guest
POST /api/v1/staff/check-in/64f8a9b5c8d4e2f1a3b7c8d9
{
  "notes": "Guest arrived 15 minutes early",
  "actualStartTime": "09:45"
}

// Check-out guest  
POST /api/v1/staff/check-out/64f8a9b5c8d4e2f1a3b7c8d9
{
  "notes": "Space cleaned and ready",
  "actualEndTime": "17:30",
  "damageReported": false
}
```

## 💳 Razorpay Integration

### Complete Payment Flow
1. **Order Creation**: Generate Razorpay order with booking details
2. **Frontend Integration**: Razorpay checkout with order ID
3. **Payment Verification**: Verify payment signature
4. **Webhook Handling**: Process payment status updates
5. **Refund Management**: Handle cancellations and refunds

### Webhook Implementation
```typescript
// Webhook endpoint handles all Razorpay events
POST /api/v1/payments/webhook
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "id": "pay_xxxxxxxxxxxx",
      "order_id": "order_xxxxxxxxxxxx",
      "status": "captured",
      "amount": 294000
    }
  }
}
```

## 📊 Analytics & Reporting

### Brand Owner Analytics
- **Revenue Tracking**: Daily, monthly, yearly revenue
- **Occupancy Rates**: Space utilization percentages  
- **Booking Trends**: Peak hours, popular days
- **Customer Analytics**: Repeat customers, demographics
- **Performance Metrics**: Average booking duration, revenue per booking

### Space Analytics
- **Utilization Rates**: Hourly occupancy tracking
- **Revenue Performance**: Revenue per square foot
- **Customer Satisfaction**: Ratings and reviews analysis
- **Operational Metrics**: Check-in/check-out efficiency

## 🌐 API Documentation

### Comprehensive Swagger Documentation
- **Interactive UI**: Available at `/api/docs`
- **Authentication**: Built-in JWT token management
- **Request/Response Examples**: Complete API examples
- **Error Responses**: Detailed error documentation
- **Rate Limiting Info**: API usage guidelines

### Key API Endpoints

#### Authentication
```typescript
POST /api/v1/auth/register     // Register with role selection
POST /api/v1/auth/login        // Login with email/password
POST /api/v1/auth/refresh      // Refresh access token
GET  /api/v1/auth/me          // Get current user profile
POST /api/v1/auth/logout      // Logout and invalidate tokens
POST /api/v1/auth/forgot-password // Request password reset
POST /api/v1/auth/reset-password  // Reset password with token
POST /api/v1/auth/change-password // Change password (authenticated)
```

#### Space Management (Brand Owner)
```typescript
GET  /api/v1/spaces                    // Browse public spaces
GET  /api/v1/spaces/:id               // Get space details
POST /api/v1/spaces                   // Create new space
PUT  /api/v1/spaces/:id              // Update owned space
GET  /api/v1/spaces/owner/my-spaces  // Get owned spaces
POST /api/v1/spaces/:id/pricing/calculate // Calculate booking price
POST /api/v1/spaces/:id/availability/check // Check availability
```

#### Booking Workflow
```typescript
GET  /api/v1/bookings         // Get user bookings
POST /api/v1/bookings         // Create booking
GET  /api/v1/bookings/:id     // Get booking details
PUT  /api/v1/bookings/:id     // Update/cancel booking
```

#### Payment Processing
```typescript
POST /api/v1/payments/create-order // Create Razorpay order
POST /api/v1/payments/verify       // Verify payment
POST /api/v1/payments/webhook      // Handle payment webhooks (public)
```

#### Staff Operations
```typescript
GET  /api/v1/staff/bookings/today/:spaceId // Today's bookings
POST /api/v1/staff/check-in/:bookingId     // Check-in guest
POST /api/v1/staff/check-out/:bookingId    // Check-out guest
```

#### Analytics (Brand Owner)
```typescript
GET /api/v1/analytics/owner              // Owner dashboard analytics
GET /api/v1/analytics/space/:spaceId     // Individual space analytics
```

## 🚀 Deployment

### Environment Configuration
```env
# Core Configuration
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fanpit

# JWT Configuration  
JWT_ACCESS_SECRET=your-super-secure-access-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Razorpay Configuration (Test/Live)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=webhook_secret_from_dashboard

# Frontend CORS
ALLOWED_ORIGINS=https://fanpit-frontend.vercel.app,http://localhost:3000

# Optional Services
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=noreply@fanpit.com
EMAIL_SERVER_PASSWORD=app-password
EMAIL_FROM=noreply@fanpit.com

# File Upload (AWS S3)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  
AWS_REGION=us-east-1
AWS_S3_BUCKET=fanpit-uploads

# Security
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### Build & Deploy Commands
```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Start production server
npm run start:prod

# Health check
curl http://localhost:3001/api/v1/health
```

### Render Deployment
- Auto-deploy from GitHub
- Environment variables configured
- MongoDB Atlas connection
- SSL/HTTPS enabled
- Production-ready scaling

## 🧪 Testing

### Test Coverage
```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests  
npm run test:cov      # Coverage report
npm run test:ci       # CI pipeline tests
```

### Example Test Structure
```typescript
describe('AuthService', () => {
  it('should register new user with hashed password', async () => {
    const result = await authService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.CONSUMER
    });
    
    expect(result.user.email).toBe('test@example.com');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.user.password).toBeUndefined(); // Should be hidden
  });
});
```

## 📈 Performance & Monitoring

### Performance Optimizations
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: MongoDB connection optimization
- **Compression**: Gzip compression for API responses
- **Caching Strategy**: Redis for frequently accessed data
- **Query Optimization**: Efficient aggregation pipelines

### Monitoring & Logging
- **Request Logging**: All API requests logged with timestamps
- **Error Tracking**: Global exception handling and logging  
- **Health Checks**: `/api/v1/health` endpoint for monitoring
- **Performance Metrics**: Response time tracking
- **Database Monitoring**: Query performance analytics

## 🔍 Code Quality

### Development Standards
- **TypeScript**: Full type safety with strict mode
- **ESLint + Prettier**: Code formatting and linting
- **Husky**: Pre-commit hooks for quality checks
- **Conventional Commits**: Structured commit messages
- **Documentation**: Comprehensive JSDoc comments

### Architecture Patterns
- **Domain-Driven Design**: Clear domain boundaries
- **SOLID Principles**: Maintainable and extensible code
- **Dependency Injection**: Loose coupling between modules
- **Repository Pattern**: Data access abstraction
- **DTO Pattern**: Input/output validation and transformation

## 📧 Contact & Support

- **Email**: tech@fanpit.live
- **Documentation**: Available at `/api/docs` when server is running
- **GitHub**: Create issues for bugs or feature requests
- **Demo**: Backend running on Render with full functionality

---

**Status**: ✅ Production-ready backend with all assignment requirements implemented
**Last Updated**: September 2024
**Version**: 1.0.0