import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as rateLimit from 'express-rate-limit';
import * as helmet from 'helmet';
import * as mongoSanitize from 'express-mongo-sanitize';
import * as xss from 'xss-clean';
import * as hpp from 'hpp';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private rateLimiters: Map<string, any> = new Map();

  constructor() {
    this.initializeRateLimiters();
  }

  private initializeRateLimiters() {
    // General API rate limiter
    this.rateLimiters.set('api', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        statusCode: 429
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Authentication endpoints rate limiter (stricter)
    this.rateLimiters.set('auth', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 auth requests per windowMs
      message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        statusCode: 429
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for successful requests
        return req.method === 'GET' || req.url.includes('/profile');
      }
    }));

    // File upload rate limiter
    this.rateLimiters.set('upload', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // limit each IP to 20 uploads per hour
      message: {
        success: false,
        error: 'Upload limit exceeded, please try again later.',
        statusCode: 429
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Search endpoints rate limiter
    this.rateLimiters.set('search', rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // limit each IP to 30 search requests per minute
      message: {
        success: false,
        error: 'Too many search requests, please slow down.',
        statusCode: 429
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply Helmet for security headers
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.razorpay.com"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })(req, res, () => {});

    // Data sanitization against NoSQL injection
    mongoSanitize()(req, res, () => {});

    // Data sanitization against XSS
    xss()(req, res, () => {});

    // Prevent parameter pollution
    hpp()(req, res, () => {});

    // Apply appropriate rate limiter based on endpoint
    const url = req.url;
    let limiterType = 'api';

    if (url.includes('/auth/')) {
      limiterType = 'auth';
    } else if (url.includes('/upload') || url.includes('/images')) {
      limiterType = 'upload';
    } else if (url.includes('/search') || url.includes('/spaces?')) {
      limiterType = 'search';
    }

    const limiter = this.rateLimiters.get(limiterType);
    if (limiter) {
      limiter(req, res, (err) => {
        if (err) {
          return next(err);
        }
        next();
      });
    } else {
      next();
    }
  }
}

// Additional security utilities
export class SecurityUtils {
  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    if (!input) return input;

    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Check password strength
   */
  static isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[]
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Hash sensitive data for logging
   */
  static hashForLogging(data: string): string {
    // Simple hash for logging purposes (not for security)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Check if IP is suspicious (basic implementation)
   */
  static isSuspiciousIP(ip: string): boolean {
    // Basic checks for suspicious IPs
    const suspiciousPatterns = [
      /^192\.168\./,  // Private network
      /^10\./,        // Private network
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private network
      /^127\./,       // Localhost
      /^0\.0\.0\.0$/, // Invalid
    ];

    return suspiciousPatterns.some(pattern => pattern.test(ip));
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: Express.Multer.File, options: {
    allowedTypes?: string[];
    maxSize?: number;
    allowedExtensions?: string[];
  } = {}): { isValid: boolean; error?: string } {
    const {
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    } = options;

    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size ${file.size} exceeds maximum size ${maxSize}`
      };
    }

    const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File extension ${fileExtension} not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
      };
    }

    return { isValid: true };
  }
}
