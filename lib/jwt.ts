import jwt from 'jsonwebtoken'

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables')
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: 'consumer' | 'brand_owner' | 'staff'
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenVersion: number
  iat?: number
  exp?: number
}

export class JWTService {
  /**
   * Generate an access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
      issuer: 'fanpit-platform',
      audience: 'fanpit-users'
    })
  }

  /**
   * Generate a refresh token
   */
  static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'fanpit-platform',
      audience: 'fanpit-refresh'
    })
  }

  /**
   * Verify an access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
        issuer: 'fanpit-platform',
        audience: 'fanpit-users'
      }) as JWTPayload
      return decoded
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token')
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired')
      }
      throw error
    }
  }

  /**
   * Verify a refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'fanpit-platform',
        audience: 'fanpit-refresh'
      }) as RefreshTokenPayload
      return decoded
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token')
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired')
      }
      throw error
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(user: { userId: string; email: string; role: 'consumer' | 'brand_owner' | 'staff' }, tokenVersion: number = 1) {
    const accessToken = this.generateAccessToken({
      userId: user.userId,
      email: user.email,
      role: user.role
    })

    const refreshToken = this.generateRefreshToken({
      userId: user.userId,
      tokenVersion
    })

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: JWT_ACCESS_EXPIRES_IN,
      refreshTokenExpiresIn: JWT_REFRESH_EXPIRES_IN
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static refreshAccessToken(refreshToken: string): string {
    const decoded = this.verifyRefreshToken(refreshToken)

    // Generate new access token
    return this.generateAccessToken({
      userId: decoded.userId,
      email: '', // Email will be fetched from database in auth middleware
      role: 'consumer' // Role will be fetched from database in auth middleware
    })
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000)
      }
      return null
    } catch {
      return null
    }
  }
}

// JWT Error types for better error handling
export class JWTError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'JWTError'
  }
}

export class TokenExpiredError extends JWTError {
  constructor(message: string = 'Token has expired') {
    super(message, 'TOKEN_EXPIRED')
  }
}

export class InvalidTokenError extends JWTError {
  constructor(message: string = 'Invalid token') {
    super(message, 'INVALID_TOKEN')
  }
}
