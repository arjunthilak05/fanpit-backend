# Fanpit Platform - Authentication Setup

This document explains the JWT-based authentication system implemented for the Fanpit platform.

## Overview

The authentication system uses JSON Web Tokens (JWT) with separate access and refresh tokens for secure user authentication and authorization.

## Environment Variables

The following environment variables are required for authentication:

```env
# JWT Configuration
JWT_ACCESS_SECRET=185qZx6DEzgGocPCTi/Z03XpM8ywoyKw2xNP0d1//VQ=
JWT_REFRESH_SECRET=hgGCwn+CeNEBXZ3/UVF4uUriFUzjh20PYq83Dbl4Q50=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## User Roles

The system supports three user roles:
- `consumer`: Regular users who book spaces
- `brand_owner`: Space owners who list and manage spaces
- `staff`: Venue staff who handle check-ins

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Login endpoint that accepts email, password, and role.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "consumer"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "consumer",
    "avatar": "..."
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "accessTokenExpiresIn": "15m",
    "refreshTokenExpiresIn": "7d"
  },
  "expiresIn": {
    "accessToken": "15m",
    "refreshToken": "7d"
  }
}
```

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

#### GET `/api/auth/profile`
Get authenticated user's profile (protected route).

**Headers:**
```
Authorization: Bearer your_access_token_here
```

#### POST `/api/auth/logout`
Logout user (protected route).

**Headers:**
```
Authorization: Bearer your_access_token_here
```

## Using Authentication Middleware

### Protecting API Routes

```typescript
import { requireAuth, requireConsumer, requireBrandOwner } from '@/lib/auth-middleware'

async function myHandler(request: AuthenticatedRequest) {
  const { user } = request
  // user contains: userId, email, role, and full user object

  return NextResponse.json({ data: 'Protected content' })
}

// Different protection levels
export const GET = requireAuth(myHandler)                    // Any authenticated user
export const GET = requireConsumer(myHandler)               // Only consumers
export const GET = requireBrandOwner(myHandler)             // Only brand owners
export const GET = requireStaff(myHandler)                  // Only staff
export const GET = requireBrandOwnerOrStaff(myHandler)      // Brand owners or staff
```

### Manual Authentication Check

```typescript
import { AuthMiddleware } from '@/lib/auth-middleware'

const result = await AuthMiddleware.authenticate(request)
if (result.success) {
  const { user } = result
  // User is authenticated
} else {
  // Handle authentication failure
  console.log(result.error) // Error message
}
```

## JWT Token Structure

### Access Token Payload
```typescript
{
  userId: string,
  email: string,
  role: 'consumer' | 'brand_owner' | 'staff',
  iat: number,  // Issued at timestamp
  exp: number   // Expiration timestamp
}
```

### Refresh Token Payload
```typescript
{
  userId: string,
  tokenVersion: number,
  iat: number,
  exp: number
}
```

## Security Features

1. **Separate Secrets**: Access and refresh tokens use different secrets
2. **Short-lived Access Tokens**: 15-minute expiration
3. **Long-lived Refresh Tokens**: 7-day expiration
4. **Role-based Access Control**: Different permissions for different user roles
5. **Token Verification**: All tokens are cryptographically verified
6. **Secure Random Secrets**: 256-bit cryptographically secure random strings

## Client-side Token Management

### Storing Tokens
```javascript
// After successful login
localStorage.setItem('accessToken', tokens.accessToken)
localStorage.setItem('refreshToken', tokens.refreshToken)
```

### Using Tokens in Requests
```javascript
const accessToken = localStorage.getItem('accessToken')

fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

### Token Refresh Logic
```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })

  if (response.ok) {
    const data = await response.json()
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data.accessToken
  } else {
    // Redirect to login
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/auth'
  }
}
```

## Database Integration

The authentication system integrates with MongoDB through the DatabaseService. User data is stored in the `users` collection with the following structure:

```typescript
interface User {
  _id?: string
  email: string
  name: string
  role: 'consumer' | 'brand_owner' | 'staff'
  avatar?: string
  phone?: string
  organization?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  preferences?: {
    notifications: boolean
    marketing: boolean
    language: string
  }
}
```

## Next Steps

1. **Password Hashing**: Implement proper password hashing (bcrypt)
2. **User Registration**: Create dedicated registration endpoints
3. **Password Reset**: Implement forgot password functionality
4. **Token Blacklisting**: Add token revocation capability
5. **Rate Limiting**: Add rate limiting to auth endpoints
6. **Audit Logging**: Log authentication events
7. **Multi-factor Authentication**: Add 2FA support
