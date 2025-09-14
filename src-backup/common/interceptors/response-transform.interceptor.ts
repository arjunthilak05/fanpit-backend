import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface ResponseTransformOptions {
  excludeFields?: string[];
  includeFields?: string[];
  transformDates?: boolean;
  transformPrices?: boolean;
  transformImages?: boolean;
  addMetadata?: boolean;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<ResponseTransformOptions>(
      'responseTransform',
      context.getHandler(),
    ) || {};

    return next.handle().pipe(
      map((data) => this.transformResponse(data, options)),
    );
  }

  private transformResponse(data: any, options: ResponseTransformOptions): any {
    if (!data) return data;

    // Handle paginated responses
    if (data.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map((item: any) => this.transformItem(item, options)),
      };
    }

    // Handle array responses
    if (Array.isArray(data)) {
      return data.map((item: any) => this.transformItem(item, options));
    }

    // Handle single object responses
    return this.transformItem(data, options);
  }

  private transformItem(item: any, options: ResponseTransformOptions): any {
    if (!item || typeof item !== 'object') return item;

    const transformed = { ...item };

    // Remove sensitive fields
    if (options.excludeFields) {
      options.excludeFields.forEach(field => {
        delete transformed[field];
      });
    }

    // Include only specified fields
    if (options.includeFields) {
      const filtered: any = {};
      options.includeFields.forEach(field => {
        if (transformed[field] !== undefined) {
          filtered[field] = transformed[field];
        }
      });
      return filtered;
    }

    // Transform dates
    if (options.transformDates) {
      this.transformDates(transformed);
    }

    // Transform prices
    if (options.transformPrices) {
      this.transformPrices(transformed);
    }

    // Transform images
    if (options.transformImages) {
      this.transformImages(transformed);
    }

    // Add metadata
    if (options.addMetadata) {
      this.addMetadata(transformed);
    }

    return transformed;
  }

  private transformDates(obj: any): void {
    const dateFields = [
      'createdAt', 'updatedAt', 'deletedAt', 'lastLoginAt', 'lastActiveAt',
      'bookingDate', 'startTime', 'endTime', 'cancelledAt', 'checkedInAt',
      'checkedOutAt', 'resolvedAt', 'assignedAt', 'dueDate', 'calculatedAt',
      'archivedAt', 'timestamp', 'date', 'expiresAt', 'verifiedAt'
    ];

    dateFields.forEach(field => {
      if (obj[field] && obj[field] instanceof Date) {
        obj[field] = obj[field].toISOString();
      }
    });

    // Transform nested objects
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        this.transformDates(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any) => {
          if (item && typeof item === 'object') {
            this.transformDates(item);
          }
        });
      }
    });
  }

  private transformPrices(obj: any): void {
    const priceFields = [
      'amount', 'totalAmount', 'basePrice', 'hourlyRate', 'dailyRate',
      'totalRevenue', 'netRevenue', 'grossRevenue', 'refunds', 'fees',
      'taxes', 'averageBookingValue', 'revenuePerSpace', 'revenuePerUser',
      'lifetimeValue', 'acquisitionCost', 'price', 'cost', 'value'
    ];

    priceFields.forEach(field => {
      if (obj[field] && typeof obj[field] === 'number') {
        // Convert paise to rupees for display
        obj[field] = Math.round(obj[field] / 100 * 100) / 100;
        obj[`${field}Formatted`] = `₹${obj[field].toLocaleString('en-IN')}`;
      }
    });

    // Transform nested objects
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        this.transformPrices(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any) => {
          if (item && typeof item === 'object') {
            this.transformPrices(item);
          }
        });
      }
    });
  }

  private transformImages(obj: any): void {
    const imageFields = [
      'avatar', 'image', 'photo', 'picture', 'logo', 'banner', 'thumbnail',
      'coverImage', 'profileImage', 'spaceImage', 'amenityIcon'
    ];

    imageFields.forEach(field => {
      if (obj[field] && typeof obj[field] === 'string') {
        // Add CDN URL prefix if not already present
        if (!obj[field].startsWith('http')) {
          obj[field] = `${process.env.CDN_URL || 'https://cdn.fanpit.com'}/${obj[field]}`;
        }
        
        // Add different sizes
        const baseUrl = obj[field].split('?')[0];
        obj[`${field}Thumbnail`] = `${baseUrl}?w=150&h=150&fit=crop`;
        obj[`${field}Medium`] = `${baseUrl}?w=400&h=400&fit=crop`;
        obj[`${field}Large`] = `${baseUrl}?w=800&h=800&fit=crop`;
      }
    });

    // Transform nested objects
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        this.transformImages(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any) => {
          if (item && typeof item === 'object') {
            this.transformImages(item);
          }
        });
      }
    });
  }

  private addMetadata(obj: any): void {
    if (!obj._id) return;

    // Add computed fields
    obj.id = obj._id.toString();
    
    // Add status indicators
    if (obj.status) {
      obj.isActive = ['active', 'confirmed', 'completed', 'verified'].includes(obj.status);
      obj.isPending = ['pending', 'in-progress', 'open'].includes(obj.status);
      obj.isCancelled = ['cancelled', 'closed', 'failed'].includes(obj.status);
    }

    // Add time-based metadata
    if (obj.createdAt) {
      const createdAt = new Date(obj.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      obj.ageInDays = diffDays;
      obj.isNew = diffDays <= 7;
      obj.isRecent = diffDays <= 30;
    }

    // Add computed ratings
    if (obj.averageRating) {
      obj.ratingStars = '★'.repeat(Math.floor(obj.averageRating)) + 
                       '☆'.repeat(5 - Math.floor(obj.averageRating));
      obj.ratingPercentage = (obj.averageRating / 5) * 100;
    }

    // Add computed availability
    if (obj.occupancyRate !== undefined) {
      obj.availabilityPercentage = 100 - obj.occupancyRate;
      obj.isFullyBooked = obj.occupancyRate >= 100;
      obj.hasAvailability = obj.occupancyRate < 100;
    }

    // Add computed performance indicators
    if (obj.totalBookings && obj.totalRevenue) {
      obj.averageBookingValue = obj.totalRevenue / obj.totalBookings;
      obj.performanceScore = Math.min(100, (obj.totalBookings / 100) * 100);
    }
  }
}

// Decorator for applying response transformation
export const ResponseTransform = (options: ResponseTransformOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('responseTransform', options, descriptor.value);
    return descriptor;
  };
};

// Common transformation presets
export const ResponseTransformPresets = {
  // For user data - exclude sensitive fields
  user: {
    excludeFields: ['password', 'refreshTokens', 'passwordResetToken', 'emailVerificationToken'],
    transformDates: true,
    transformImages: true,
    addMetadata: true,
  },

  // For booking data - include all fields with transformations
  booking: {
    transformDates: true,
    transformPrices: true,
    addMetadata: true,
  },

  // For space data - transform images and add metadata
  space: {
    transformImages: true,
    transformPrices: true,
    addMetadata: true,
  },

  // For payment data - transform prices and exclude sensitive fields
  payment: {
    excludeFields: ['razorpayOrderData', 'razorpayPaymentData'],
    transformPrices: true,
    transformDates: true,
  },

  // For analytics data - transform prices and dates
  analytics: {
    transformPrices: true,
    transformDates: true,
    addMetadata: true,
  },

  // For public API responses - minimal data
  public: {
    includeFields: ['id', 'name', 'status', 'createdAt'],
    transformDates: true,
  },

  // For admin responses - full data with transformations
  admin: {
    transformDates: true,
    transformPrices: true,
    transformImages: true,
    addMetadata: true,
  },
};
