import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpaceResponseDto {
  @ApiProperty({ description: 'Space ID', example: '64a7b8c9d0e1f2a3b4c5d6e7' })
  id: string;

  @ApiProperty({ description: 'Space name', example: 'Downtown Creative Hub' })
  name: string;

  @ApiProperty({ description: 'Space description' })
  description: string;

  @ApiProperty({
    description: 'Space address',
    example: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    }
  })
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };

  @ApiProperty({ description: 'Maximum capacity', example: 20 })
  capacity: number;

  @ApiProperty({ description: 'Space category', example: 'coworking' })
  category: string;

  @ApiProperty({ description: 'Available amenities', example: ['wifi', 'projector', 'coffee'] })
  amenities: string[];

  @ApiProperty({ description: 'Space images', example: ['https://example.com/image1.jpg'] })
  images: string[];

  @ApiProperty({
    description: 'Pricing information',
    example: {
      basePrice: 50,
      priceType: 'hourly',
      peakHours: { start: '14:00', end: '18:00', multiplier: 1.5 }
    }
  })
  pricing: {
    basePrice: number;
    priceType: string;
    peakHours?: { start: string; end: string; multiplier: number };
    offPeakMultiplier?: number;
    weekendMultiplier?: number;
    timeBlocks?: Array<{ duration: number; price: number; title: string }>;
    monthlyPass?: { price: number; unlimited: boolean };
  };

  @ApiProperty({
    description: 'Operating hours',
    example: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false }
    }
  })
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };

  @ApiProperty({ description: 'Average rating', example: 4.5 })
  rating: number;

  @ApiProperty({ description: 'Number of reviews', example: 25 })
  reviewCount: number;

  @ApiProperty({ description: 'Total bookings count', example: 150 })
  totalBookings: number;

  @ApiProperty({ description: 'Owner information' })
  owner: {
    id: string;
    name: string;
    organization?: string;
  };

  @ApiProperty({ description: 'Whether space is featured', example: false })
  isFeatured: boolean;

  @ApiProperty({ description: 'Whether space is verified', example: true })
  isVerified: boolean;

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Distance from search location (if location search)', example: 2.5 })
  distance?: number;

  @ApiPropertyOptional({ description: 'Calculated price for search criteria', example: 75 })
  calculatedPrice?: number;
}

export class PaginatedSpacesResponseDto {
  @ApiProperty({ description: 'Array of spaces', type: [SpaceResponseDto] })
  data: SpaceResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
      hasNextPage: true,
      hasPrevPage: false
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  @ApiPropertyOptional({
    description: 'Applied filters summary',
    example: {
      category: 'coworking',
      city: 'New York',
      priceRange: '20-100',
      amenities: ['wifi', 'projector']
    }
  })
  filters?: Record<string, any>;
}

export class SpaceAnalyticsDto {
  @ApiProperty({ description: 'Space ID', example: '64a7b8c9d0e1f2a3b4c5d6e7' })
  spaceId: string;

  @ApiProperty({ description: 'Total bookings', example: 150 })
  totalBookings: number;

  @ApiProperty({ description: 'Total revenue', example: 15000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Average booking value', example: 100 })
  averageBookingValue: number;

  @ApiProperty({ description: 'View count', example: 500 })
  viewCount: number;

  @ApiProperty({ description: 'Conversion rate (bookings/views)', example: 0.3 })
  conversionRate: number;

  @ApiProperty({ description: 'Peak booking hours', example: ['14:00', '15:00', '16:00'] })
  peakHours: string[];

  @ApiProperty({ description: 'Most popular amenities', example: ['wifi', 'coffee', 'projector'] })
  popularAmenities: string[];

  @ApiProperty({
    description: 'Monthly performance data',
    example: [
      { month: '2024-01', bookings: 10, revenue: 1000 },
      { month: '2024-02', bookings: 15, revenue: 1500 }
    ]
  })
  monthlyData: Array<{
    month: string;
    bookings: number;
    revenue: number;
    views: number;
  }>;

  @ApiProperty({
    description: 'Revenue breakdown by pricing type',
    example: {
      hourly: 8000,
      timeBlocks: 5000,
      monthlyPass: 2000
    }
  })
  revenueBreakdown: {
    hourly: number;
    timeBlocks: number;
    monthlyPass: number;
    special: number;
  };
}