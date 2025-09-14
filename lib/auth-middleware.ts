import { NextRequest, NextResponse } from 'next/server'
import { JWTService, JWTPayload, TokenExpiredError, InvalidTokenError } from './jwt'
import { DatabaseService } from './database'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role: 'consumer' | 'brand_owner' | 'staff'
    user: any // Full user object from database
  }
}

export type AuthMiddlewareResult = {
  success: true
  user: {
    userId: string
    email: string
    role: 'consumer' | 'brand_owner' | 'staff'
    user: any
  }
} | {
  success: false
  error: string
  statusCode: number
}

export class AuthMiddleware {
  /**
   * Authenticate a request using JWT token
   */
  static async authenticate(request: NextRequest): Promise<AuthMiddlewareResult> {
    try {
      const authHeader = request.headers.get('authorization')
      const token = JWTService.extractTokenFromHeader(authHeader)

      if (!token) {
        return {
          success: false,
          error: 'No authorization token provided',
          statusCode: 401
        }
      }

      // Verify the access token
      const decoded = JWTService.verifyAccessToken(token)

      // Fetch user from database to ensure they still exist and are active
      const user = await DatabaseService.getUserById(decoded.userId)

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          statusCode: 401
        }
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated',
          statusCode: 401
        }
      }

      return {
        success: true,
        user: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          user
        }
      }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return {
          success: false,
          error: 'Access token expired',
          statusCode: 401
        }
      }

      if (error instanceof InvalidTokenError) {
        return {
          success: false,
          error: 'Invalid access token',
          statusCode: 401
        }
      }

      console.error('Authentication error:', error)
      return {
        success: false,
        error: 'Authentication failed',
        statusCode: 401
      }
    }
  }

  /**
   * Middleware function for API routes
   */
  static async withAuth(
    handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse> | NextResponse,
    options: {
      requiredRoles?: ('consumer' | 'brand_owner' | 'staff')[]
      allowPublic?: boolean
    } = {}
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      const authResult = await this.authenticate(request)

      if (!authResult.success) {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.statusCode }
        )
      }

      const { user } = authResult

      // Check role-based access
      if (options.requiredRoles && !options.requiredRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Add user to request object
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      return handler(authenticatedRequest, context)
    }
  }

  /**
   * Check if user has required role
   */
  static hasRole(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole)
  }

  /**
   * Generate auth response with tokens
   */
  static createAuthResponse(user: any, tokenVersion: number = 1) {
    const tokens = JWTService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    }, tokenVersion)

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      },
      tokens,
      expiresIn: {
        accessToken: tokens.accessTokenExpiresIn,
        refreshToken: tokens.refreshTokenExpiresIn
      }
    }
  }
}

// Convenience middleware functions for different user roles
export const requireAuth = (handler: any) => AuthMiddleware.withAuth(handler, {})

export const requireConsumer = (handler: any) =>
  AuthMiddleware.withAuth(handler, { requiredRoles: ['consumer'] })

export const requireBrandOwner = (handler: any) =>
  AuthMiddleware.withAuth(handler, { requiredRoles: ['brand_owner'] })

export const requireStaff = (handler: any) =>
  AuthMiddleware.withAuth(handler, { requiredRoles: ['staff'] })

export const requireBrandOwnerOrStaff = (handler: any) =>
  AuthMiddleware.withAuth(handler, { requiredRoles: ['brand_owner', 'staff'] })

export const requireAnyRole = (handler: any) =>
  AuthMiddleware.withAuth(handler, { requiredRoles: ['consumer', 'brand_owner', 'staff'] })
