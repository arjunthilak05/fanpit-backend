# Fanpit Backend API

A modern NestJS-based backend API for the Fanpit space booking platform, designed to handle authentication, space management, bookings, payments, and staff operations with enterprise-grade security and performance.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens and role-based access control
- **Space Management**: Complete CRUD operations for co-working spaces with availability tracking
- **Booking System**: Real-time space booking with conflict detection and management
- **Payment Integration**: Razorpay payment gateway with webhook verification
- **Staff Dashboard**: Administrative interface with analytics and management tools
- **AI Agents**: Intelligent agents for automated tasks and customer support
- **Rate Limiting**: Multi-tier rate limiting system for API protection
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Security**: Comprehensive security with Helmet, CORS, input validation, and encryption
- **Database**: MongoDB with Mongoose ODM and connection pooling
- **Testing**: Unit, integration, and E2E testing with comprehensive coverage

## 📦 Tech Stack

- **Framework**: NestJS v10 with TypeScript
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT with Passport.js (Local, JWT strategies)
- **Payment**: Razorpay integration with webhook handling
- **Documentation**: Swagger/OpenAPI v3
- **Security**: Helmet, CORS, Rate limiting, bcrypt encryption
- **Validation**: class-validator & class-transformer
- **Testing**: Jest with supertest for E2E testing
- **DevOps**: Docker support with multi-stage builds
- **Monitoring**: Request logging and error tracking

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- MongoDB Atlas account or local MongoDB instance
- Razorpay account for payment processing

### 1. Clone and Install

```bash
git clone <repository-url>
cd fanpit-backend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment variables in `.env`:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/fanpit?retryWrites=true&w=majority

# JWT Configuration
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_here
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@example.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@fanpit.com

# Rate Limiting Configuration
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### 3. Run the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production build and start
npm run start:prod

# Debug mode
npm run start:debug

# Simple Express server (alternative)
npm run start:simple

# MongoDB-focused simple server
npm run start:mongodb
```

**🌐 Access Points:**
- **API Base URL**: http://localhost:3001/api/v1
- **Swagger Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/health

## 📚 API Documentation & Endpoints

### 🔐 Authentication
- `POST /api/v1/auth/register` - User registration with validation
- `POST /api/v1/auth/login` - User login with JWT tokens
- `POST /api/v1/auth/refresh` - Refresh access tokens
- `POST /api/v1/auth/logout` - Secure logout
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset with token

### 👥 User Management
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `DELETE /api/v1/users/account` - Delete user account
- `GET /api/v1/users` - List all users (Staff only)
- `GET /api/v1/users/:id` - Get user by ID (Staff only)

### 🏢 Space Management
- `GET /api/v1/spaces` - List all available spaces with filters
- `GET /api/v1/spaces/:id` - Get detailed space information
- `POST /api/v1/spaces` - Create new space (Staff/Brand Owner)
- `PUT /api/v1/spaces/:id` - Update space details
- `DELETE /api/v1/spaces/:id` - Delete space
- `GET /api/v1/spaces/:id/availability` - Check space availability

### 📅 Booking System
- `GET /api/v1/bookings` - List user bookings with filters
- `POST /api/v1/bookings` - Create new booking with conflict checking
- `GET /api/v1/bookings/:id` - Get booking details
- `PUT /api/v1/bookings/:id` - Modify existing booking
- `DELETE /api/v1/bookings/:id` - Cancel booking
- `POST /api/v1/bookings/:id/extend` - Extend booking duration

### 💳 Payment Processing
- `POST /api/v1/payments/create-order` - Create Razorpay payment order
- `POST /api/v1/payments/verify` - Verify payment signature
- `GET /api/v1/payments/history` - Payment transaction history
- `POST /api/v1/payments/refund` - Process refund request
- `POST /api/v1/payments/webhook` - Razorpay webhook handler

### 🔧 Staff Dashboard
- `GET /api/v1/staff/dashboard` - Dashboard statistics and KPIs
- `GET /api/v1/staff/bookings` - Manage all bookings
- `GET /api/v1/staff/analytics` - Business analytics and reports
- `GET /api/v1/staff/users` - User management interface
- `POST /api/v1/staff/notifications` - Send system notifications

### 🎫 Promocodes & Reviews
- `GET /api/v1/promocodes` - List active promocodes
- `POST /api/v1/promocodes/validate` - Validate promo code
- `GET /api/v1/reviews` - Get space reviews
- `POST /api/v1/reviews` - Submit space review

### 🤖 AI Agents
- `POST /api/v1/agents/chat` - Chat with AI support agent
- `GET /api/v1/agents/suggestions` - Get AI-powered suggestions
- `POST /api/v1/agents/analyze` - Analyze booking patterns

## 🔐 Authentication & Authorization

The API uses JWT Bearer token authentication with role-based access control:

```bash
# Include JWT token in Authorization header
curl -H "Authorization: Bearer your_jwt_token" \
  http://localhost:3001/api/v1/users/profile
```

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Consumer** | Browse spaces, create bookings, manage profile |
| **Brand Owner** | Manage owned spaces, view space analytics |
| **Staff** | Full admin access, user management, analytics |

## 🏗️ Project Architecture

```
src/
├── agents/              # AI agents for automation & support
│   ├── agents.controller.ts
│   ├── agents.service.ts
│   └── agents.module.ts
├── analytics/           # Business analytics & reporting
├── auth/               # Authentication & authorization
│   ├── strategies/     # Passport strategies (JWT, Local)
│   ├── guards/        # Role-based guards
│   ├── dto/           # Auth DTOs
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── bookings/          # Booking management system
│   ├── dto/          # Booking DTOs
│   ├── schemas/      # Booking schemas
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   └── bookings.module.ts
├── common/            # Shared utilities & components
│   ├── decorators/    # Custom decorators (Roles, etc.)
│   ├── filters/       # HTTP exception filters
│   ├── guards/        # Auth & role guards
│   ├── interceptors/  # Response transformers & logging
│   ├── pipes/         # Validation pipes
│   └── controllers/   # File upload controller
├── config/            # Configuration management
├── database/          # Database utilities & services
│   ├── migrations/    # Database migrations
│   ├── seeds/         # Database seeding
│   ├── schemas/       # Mongoose schemas
│   ├── database.service.ts
│   └── database.module.ts
├── payments/          # Payment processing (Razorpay)
│   ├── dto/          # Payment DTOs
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   └── payments.module.ts
├── promocodes/        # Promotional codes management
├── repositories/      # Data access layer
├── reviews/           # Review & rating system
├── spaces/            # Space management
│   ├── dto/          # Space DTOs
│   ├── schemas/      # Space schemas
│   ├── spaces.controller.ts
│   ├── spaces.service.ts
│   └── spaces.module.ts
├── staff/             # Staff dashboard & admin features
│   ├── staff.controller.ts
│   ├── staff.service.ts
│   └── staff.module.ts
├── users/             # User management
│   ├── dto/          # User DTOs
│   ├── schemas/      # User schemas
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── app.controller.ts   # Main app controller
├── app.module.ts      # Root application module
├── app.service.ts     # Main app service
├── main.ts           # Application entry point
├── main-simple.ts    # Simple server entry point
└── minimal-main.ts   # Minimal server entry point
```

## 🧪 Testing & Development

### Test Commands
```bash
# Unit tests
npm run test
npm run test:watch
npm run test:cov

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Run all tests
npm run test:all
npm run test:ci
```

### Development Commands
```bash
# Install dependencies
npm install

# Development with hot reload
npm run start:dev

# Production build & start
npm run build
npm run start:prod

# Code quality
npm run lint
npm run lint:check
npm run format

# Security checks
npm run security:audit
npm run security:fix

# Health monitoring
npm run health:check
```

### Database Operations
```bash
# Database seeding
npm run db:seed

# Run migrations
npm run db:migrate

# Reset database (drop + migrate + seed)
npm run db:reset

# Drop database
npm run db:drop
```

## 🐳 Docker Support

### Docker Commands
```bash
# Build Docker image
npm run docker:build

# Run with Docker Compose
npm run docker:up

# Stop containers
npm run docker:down

# View container logs
npm run docker:logs

# Production deployment
npm run prod:deploy
```

### Docker Configuration
- **Dockerfile**: Multi-stage production build
- **docker-compose.yml**: Full stack deployment
- **Dockerfile.render**: Render.com deployment
- **render.yaml**: Render.com configuration

## 🔧 Configuration & Environment

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_ACCESS_SECRET` | ✅ | JWT access token secret (32+ chars) | `your_secret_key` |
| `JWT_REFRESH_SECRET` | ✅ | JWT refresh token secret (32+ chars) | `your_refresh_secret` |
| `JWT_ACCESS_EXPIRES_IN` | ⚪ | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | ⚪ | Refresh token expiry | `7d` |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay key secret | `your_razorpay_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | ⚪ | Razorpay webhook secret | `whsec_...` |
| `PORT` | ⚪ | Server port | `3001` |
| `NODE_ENV` | ⚪ | Environment mode | `development` |
| `FRONTEND_URL` | ⚪ | Frontend URL for CORS | `http://localhost:3000` |
| `EMAIL_SERVER_HOST` | ⚪ | SMTP server host | `smtp.gmail.com` |
| `EMAIL_SERVER_PORT` | ⚪ | SMTP server port | `587` |
| `EMAIL_SERVER_USER` | ⚪ | SMTP username | `user@gmail.com` |
| `EMAIL_SERVER_PASSWORD` | ⚪ | SMTP password | `app_password` |
| `EMAIL_FROM` | ⚪ | From email address | `noreply@fanpit.com` |
| `THROTTLE_TTL` | ⚪ | Rate limit time window | `60000` |
| `THROTTLE_LIMIT` | ⚪ | Rate limit max requests | `100` |

### Security Configuration
- **Rate Limiting**: Multi-tier throttling (short, medium, long, auth)
- **CORS**: Configurable origins with credentials support
- **Helmet**: Security headers protection
- **Input Validation**: class-validator with whitelist/forbidNonWhitelisted
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Access + refresh token strategy

## 🚀 Production Deployment

### Build & Deploy
```bash
# Complete production build
npm run prod:build

# Production start
npm run prod:start

# Full deployment with Docker
npm run prod:deploy
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set secure JWT secrets (32+ characters)
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Configure environment-specific CORS origins

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "timestamp": "2024-09-14T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error description",
    "details": {}
  },
  "timestamp": "2024-09-14T12:00:00.000Z"
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": {
      "field": ["field is required", "field must be a string"]
    }
  },
  "timestamp": "2024-09-14T12:00:00.000Z"
}
```

## 🛠️ Development Guidelines

### Code Standards
- **TypeScript**: Strict typing enabled
- **ESLint**: Airbnb configuration with NestJS rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages
- **API Documentation**: Swagger decorators on all endpoints

### Best Practices
- Use DTOs for all request/response objects
- Implement proper error handling with custom exceptions
- Write comprehensive tests (unit + integration + E2E)
- Follow NestJS modular architecture patterns
- Use dependency injection and inversion of control
- Implement proper logging with context
- Use environment-specific configurations

## 🤝 Contributing

1. **Fork & Clone**: Fork repository and clone locally
2. **Branch**: Create feature branch from `main`
3. **Develop**: Follow coding standards and write tests
4. **Test**: Ensure all tests pass (`npm run test:all`)
5. **Lint**: Run linting (`npm run lint`)
6. **Commit**: Use conventional commit messages
7. **Pull Request**: Submit PR with detailed description

### Commit Message Format
```
type(scope): description

feat(auth): add refresh token rotation
fix(payments): handle razorpay webhook errors
docs(readme): update API documentation
test(bookings): add integration tests
```

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check connection string format
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Verify network access in MongoDB Atlas
# Add current IP to IP whitelist
```

**JWT Authentication Issues**
```bash
# Ensure secrets are properly set
JWT_ACCESS_SECRET=your-super-secure-secret-key-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-32-chars

# Check token expiry format
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Razorpay Integration Problems**
```bash
# Verify API credentials
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=your_secret_key

# For webhooks, ensure HTTPS in production
RAZORPAY_WEBHOOK_SECRET=whsec_webhook_secret
```

**Port Already in Use**
```bash
# Change port or kill existing process
PORT=3002
# or
lsof -ti:3001 | xargs kill -9
```

## 📞 Support & Documentation

- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/health
- **Repository Issues**: Create issue for bugs/features
- **Email Support**: Contact development team

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

**🚀 Built with NestJS, TypeScript, and modern web technologies for scalable enterprise applications**