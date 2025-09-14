export interface SearchFilters {
  query?: string;
  category?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string[];
  minRating?: number;
  featured?: boolean;
  verified?: boolean;
  availableDate?: string;
  availableFrom?: string;
  availableTo?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export class SearchUtil {
  /**
   * Build MongoDB aggregation pipeline for space search
   */
  static buildSearchPipeline(filters: SearchFilters): any[] {
    const pipeline: any[] = [];

    // Match stage - basic filtering
    const matchStage: any = {
      isActive: true,
    };

    // Text search
    if (filters.query) {
      matchStage.$text = { $search: filters.query };
    }

    // Category filter
    if (filters.category) {
      matchStage.category = filters.category;
    }

    // Location filters
    if (filters.city) {
      matchStage['address.city'] = new RegExp(filters.city, 'i');
    }
    if (filters.state) {
      matchStage['address.state'] = new RegExp(filters.state, 'i');
    }

    // Capacity range
    if (filters.minCapacity !== undefined || filters.maxCapacity !== undefined) {
      matchStage.capacity = {};
      if (filters.minCapacity !== undefined) {
        matchStage.capacity.$gte = filters.minCapacity;
      }
      if (filters.maxCapacity !== undefined) {
        matchStage.capacity.$lte = filters.maxCapacity;
      }
    }

    // Price range (base price only for now)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      matchStage['pricing.basePrice'] = {};
      if (filters.minPrice !== undefined) {
        matchStage['pricing.basePrice'].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        matchStage['pricing.basePrice'].$lte = filters.maxPrice;
      }
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      matchStage.amenities = { $all: filters.amenities };
    }

    // Rating filter
    if (filters.minRating !== undefined) {
      matchStage.rating = { $gte: filters.minRating };
    }

    // Featured filter
    if (filters.featured) {
      matchStage.isFeatured = true;
    }

    // Verified filter
    if (filters.verified) {
      matchStage.isVerified = true;
    }

    // Availability filter (basic - just check if date is not in blackout dates)
    if (filters.availableDate) {
      const date = new Date(filters.availableDate);
      matchStage.blackoutDates = { $ne: date };
      
      // Check operating hours for the day
      const dayName = this.getDayName(date);
      matchStage[`operatingHours.${dayName}.closed`] = { $ne: true };
    }

    pipeline.push({ $match: matchStage });

    // Add text search score for sorting
    if (filters.query) {
      pipeline.push({
        $addFields: {
          textScore: { $meta: 'textScore' }
        }
      });
    }

    // Geospatial search
    if (filters.lat !== undefined && filters.lng !== undefined && filters.radius !== undefined) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [filters.lng, filters.lat],
          },
          distanceField: 'distance',
          maxDistance: filters.radius * 1000, // Convert km to meters
          spherical: true,
        }
      });
    }

    // Lookup owner information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner',
        pipeline: [
          { $project: { name: 1, organization: 1 } }
        ]
      }
    });

    pipeline.push({
      $addFields: {
        owner: { $arrayElemAt: ['$owner', 0] }
      }
    });

    return pipeline;
  }

  /**
   * Build sort stage for aggregation pipeline
   */
  static buildSortStage(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
    hasTextSearch = false,
    hasGeoSearch = false,
  ): any {
    const sort: any = {};

    if (hasTextSearch && (!sortBy || sortBy === 'relevance')) {
      sort.textScore = { $meta: 'textScore' };
      sort.rating = -1; // Secondary sort by rating
      return { $sort: sort };
    }

    if (hasGeoSearch && sortBy === 'distance') {
      sort.distance = sortOrder === 'asc' ? 1 : -1;
      return { $sort: sort };
    }

    const order = sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'rating':
        sort.rating = order;
        sort.reviewCount = -1; // Secondary sort
        break;
      case 'price':
        sort['pricing.basePrice'] = order;
        break;
      case 'capacity':
        sort.capacity = order;
        break;
      case 'createdAt':
        sort.createdAt = order;
        break;
      default:
        sort.createdAt = -1; // Default sort by newest
        sort.isFeatured = -1; // Featured spaces first
    }

    return { $sort: sort };
  }

  /**
   * Build projection stage to format response
   */
  static buildProjectionStage(): any {
    return {
      $project: {
        id: '$_id',
        name: 1,
        description: 1,
        address: 1,
        capacity: 1,
        category: 1,
        amenities: 1,
        images: 1,
        pricing: 1,
        operatingHours: 1,
        rating: 1,
        reviewCount: 1,
        totalBookings: 1,
        owner: {
          id: '$owner._id',
          name: '$owner.name',
          organization: '$owner.organization',
        },
        isFeatured: 1,
        isVerified: 1,
        createdAt: 1,
        updatedAt: 1,
        distance: 1, // Will be present if geo search was used
        textScore: 1, // Will be present if text search was used
        _id: 0,
      }
    };
  }

  /**
   * Get day name from date
   */
  private static getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  /**
   * Build availability check pipeline
   */
  static buildAvailabilityCheckPipeline(
    date: Date,
    startTime: string,
    endTime: string,
  ): any[] {
    const dayName = this.getDayName(date);
    
    return [
      {
        $match: {
          // Not in blackout dates
          blackoutDates: { $ne: date },
          // Not closed on this day
          [`operatingHours.${dayName}.closed`]: { $ne: true },
          // Check if requested time is within operating hours
          $expr: {
            $and: [
              { $lte: [`$operatingHours.${dayName}.open`, startTime] },
              { $gte: [`$operatingHours.${dayName}.close`, endTime] }
            ]
          }
        }
      },
      // TODO: Add booking conflict check when booking schema is implemented
      // This would involve looking up existing bookings for the same date/time
    ];
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * 
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Build facet pipeline for search analytics
   */
  static buildSearchAnalyticsPipeline(): any {
    return {
      $facet: {
        // Category breakdown
        categories: [
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        // Price ranges
        priceRanges: [
          {
            $bucket: {
              groupBy: '$pricing.basePrice',
              boundaries: [0, 25, 50, 100, 200, 500, 1000],
              default: '1000+',
              output: { count: { $sum: 1 } }
            }
          }
        ],
        // City breakdown
        cities: [
          { $group: { _id: '$address.city', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        // Amenities breakdown
        amenities: [
          { $unwind: '$amenities' },
          { $group: { _id: '$amenities', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]
      }
    };
  }
}