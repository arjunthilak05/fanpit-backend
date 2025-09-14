import { Document } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class PaginationUtil {
  /**
   * Apply pagination to a MongoDB query
   */
  static applyPagination<T extends Document>(
    query: any,
    options: PaginationOptions,
    allowedSortFields: string[] = [],
  ): { 
    query: any; 
    page: number; 
    limit: number; 
    skip: number;
    sort: Record<string, 1 | -1>;
  } {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    // Apply pagination
    query = query.skip(skip).limit(limit);

    // Apply sorting
    const sort = this.buildSortObject(options.sortBy, options.sortOrder, allowedSortFields);
    if (Object.keys(sort).length > 0) {
      query = query.sort(sort);
    }

    return { query, page, limit, skip, sort };
  }

  /**
   * Build pagination response metadata
   */
  static buildPaginationResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  /**
   * Build MongoDB sort object
   */
  private static buildSortObject(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    allowedFields: string[] = [],
  ): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};

    if (sortBy) {
      // Check if sort field is allowed
      if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
        // Default to createdAt if invalid field
        sort.createdAt = -1;
      } else {
        const order = sortOrder === 'asc' ? 1 : -1;
        
        // Handle special sort fields
        switch (sortBy) {
          case 'price':
            sort['pricing.basePrice'] = order;
            break;
          case 'distance':
            // Distance sorting will be handled differently in geo queries
            break;
          default:
            sort[sortBy] = order;
        }
      }
    } else {
      // Default sort by creation date (newest first)
      sort.createdAt = -1;
    }

    return sort;
  }

  /**
   * Validate pagination parameters
   */
  static validatePaginationParams(page?: number, limit?: number): { page: number; limit: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 10));

    return {
      page: validatedPage,
      limit: validatedLimit,
    };
  }

  /**
   * Calculate offset for pagination
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Get pagination metadata for arrays (for in-memory pagination)
   */
  static getPaginationMetadata(
    total: number,
    page: number,
    limit: number,
  ): PaginationResult<any>['pagination'] {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }
}