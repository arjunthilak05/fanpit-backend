import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export class TokenUtil {
  /**
   * Generate a JWT token payload
   */
  static createTokenPayload(
    userId: string,
    email: string,
    role: string,
    type: 'access' | 'refresh' = 'access',
  ): TokenPayload {
    return {
      sub: userId,
      email,
      role,
      type,
    };
  }

  /**
   * Generate access and refresh token pair
   */
  static async generateTokenPair(
    jwtService: JwtService,
    configService: ConfigService,
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const accessPayload = this.createTokenPayload(userId, email, role, 'access');
    const refreshPayload = this.createTokenPayload(userId, email, role, 'refresh');

    const accessExpiresIn = configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const refreshExpiresIn = configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      jwtService.signAsync(accessPayload, {
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      }),
      jwtService.signAsync(refreshPayload, {
        secret: configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    // Convert expires in to seconds for frontend
    const expiresIn = this.parseExpirationToSeconds(accessExpiresIn);

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Generate a secure random string
   */
  static generateSecureToken(length = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Parse expiration string to seconds
   */
  private static parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }

  /**
   * Extract user ID from JWT token payload
   */
  static extractUserIdFromPayload(payload: any): string {
    return payload.sub || payload.userId || payload.id;
  }

  /**
   * Check if token is expired (client-side check)
   */
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}