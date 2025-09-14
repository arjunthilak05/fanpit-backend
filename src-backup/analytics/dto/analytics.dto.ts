import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  IsEnum,
  IsMongoId,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsArray,
  ArrayMaxSize,
  IsObject
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AnalyticsType, MetricType } from '../schemas/analytics.schema';

export class RevenueMetricsDto {
  @ApiProperty({ example: 50000, description: 'Total revenue in paise' })
  totalRevenue: number;

  @ApiProperty({ example: 47500, description: 'Net revenue after fees' })
  netRevenue: number;

  @ApiProperty({ example: 50000, description: 'Gross revenue before fees' })
  grossRevenue: number;

  @ApiProperty({ example: 1000, description: 'Total refunds' })
  refunds: number;

  @ApiProperty({ example: 1500, description: 'Platform fees' })
  fees: number;

  @ApiProperty({ example: 1000, description: 'Taxes collected' })
  taxes: number;

  @ApiProperty({ example: 2500, description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ example: 12500, description: 'Revenue per space' })
  revenuePerSpace: number;

  @ApiProperty({ example: 500, description: 'Revenue per user' })
  revenuePerUser: number;

  @ApiProperty({ 
    example: { 'conference-room': 20000, 'coworking': 30000 },
    description: 'Revenue breakdown by category' 
  })
  revenueByCategory: Record<string, number>;

  @ApiProperty({ 
    example: { 'mumbai': 30000, 'delhi': 20000 },
    description: 'Revenue breakdown by location' 
  })
  revenueByLocation: Record<string, number>;

  @ApiProperty({ 
    example: { 'card': 40000, 'upi': 10000 },
    description: 'Revenue breakdown by payment method' 
  })
  revenueByPaymentMethod: Record<string, number>;
}

export class BookingMetricsDto {
  @ApiProperty({ example: 100, description: 'Total bookings' })
  totalBookings: number;

  @ApiProperty({ example: 85, description: 'Confirmed bookings' })
  confirmedBookings: number;

  @ApiProperty({ example: 10, description: 'Cancelled bookings' })
  cancelledBookings: number;

  @ApiProperty({ example: 5, description: 'No-show bookings' })
  noShowBookings: number;

  @ApiProperty({ example: 80, description: 'Completed bookings' })
  completedBookings: number;

  @ApiProperty({ example: 10.5, description: 'Cancellation rate percentage' })
  cancellationRate: number;

  @ApiProperty({ example: 5.9, description: 'No-show rate percentage' })
  noShowRate: number;

  @ApiProperty({ example: 94.1, description: 'Completion rate percentage' })
  completionRate: number;

  @ApiProperty({ example: 2.5, description: 'Average booking duration in hours' })
  averageBookingDuration: number;

  @ApiProperty({ example: 25.5, description: 'Repeat booking rate percentage' })
  repeatBookingRate: number;

  @ApiProperty({ 
    example: { 'conference-room': 40, 'coworking': 60 },
    description: 'Bookings breakdown by category' 
  })
  bookingsByCategory: Record<string, number>;

  @ApiProperty({ 
    example: { 'morning': 30, 'afternoon': 50, 'evening': 20 },
    description: 'Bookings breakdown by time slot' 
  })
  bookingsByTimeSlot: Record<string, number>;

  @ApiProperty({ 
    example: { 'monday': 15, 'tuesday': 20, 'wednesday': 25 },
    description: 'Bookings breakdown by day of week' 
  })
  bookingsByDayOfWeek: Record<string, number>;

  @ApiProperty({ 
    example: { '2024-01': 100, '2024-02': 120 },
    description: 'Bookings breakdown by month' 
  })
  bookingsByMonth: Record<string, number>;
}

export class UserMetricsDto {
  @ApiProperty({ example: 1000, description: 'Total users' })
  totalUsers: number;

  @ApiProperty({ example: 50, description: 'New users this period' })
  newUsers: number;

  @ApiProperty({ example: 800, description: 'Active users this period' })
  activeUsers: number;

  @ApiProperty({ example: 950, description: 'Verified users' })
  verifiedUsers: number;

  @ApiProperty({ example: 85.5, description: 'User retention rate percentage' })
  retentionRate: number;

  @ApiProperty({ example: 5.2, description: 'User churn rate percentage' })
  churnRate: number;

  @ApiProperty({ example: 2500, description: 'Average lifetime value' })
  lifetimeValue: number;

  @ApiProperty({ example: 150, description: 'Customer acquisition cost' })
  acquisitionCost: number;

  @ApiProperty({ 
    example: { 'consumer': 800, 'brand_owner': 150, 'staff': 50 },
    description: 'Users breakdown by role' 
  })
  usersByRole: Record<string, number>;

  @ApiProperty({ 
    example: { 'mumbai': 400, 'delhi': 300, 'bangalore': 300 },
    description: 'Users breakdown by location' 
  })
  usersByLocation: Record<string, number>;

  @ApiProperty({ 
    example: { '18-25': 200, '26-35': 500, '36-45': 300 },
    description: 'Users breakdown by age group' 
  })
  usersByAgeGroup: Record<string, number>;

  @ApiProperty({ 
    example: { 'high': 300, 'medium': 400, 'low': 300 },
    description: 'User engagement levels' 
  })
  userEngagement: Record<string, number>;
}

export class SpaceMetricsDto {
  @ApiProperty({ example: 50, description: 'Total spaces' })
  totalSpaces: number;

  @ApiProperty({ example: 45, description: 'Active spaces' })
  activeSpaces: number;

  @ApiProperty({ example: 5, description: 'New spaces this period' })
  newSpaces: number;

  @ApiProperty({ example: 40, description: 'Verified spaces' })
  verifiedSpaces: number;

  @ApiProperty({ example: 75.5, description: 'Average occupancy rate percentage' })
  occupancyRate: number;

  @ApiProperty({ example: 4.2, description: 'Average space rating' })
  averageRating: number;

  @ApiProperty({ example: 5000, description: 'Total space views' })
  totalViews: number;

  @ApiProperty({ example: 100, description: 'Average views per space' })
  averageViewsPerSpace: number;

  @ApiProperty({ 
    example: { 'conference-room': 20, 'coworking': 30 },
    description: 'Spaces breakdown by category' 
  })
  spacesByCategory: Record<string, number>;

  @ApiProperty({ 
    example: { 'mumbai': 25, 'delhi': 20, 'bangalore': 5 },
    description: 'Spaces breakdown by location' 
  })
  spacesByLocation: Record<string, number>;

  @ApiProperty({ 
    example: { 'space1': { revenue: 10000, bookings: 50 } },
    description: 'Top performing spaces' 
  })
  topPerformingSpaces: Record<string, any>;

  @ApiProperty({ 
    example: { 'space2': { revenue: 1000, bookings: 5 } },
    description: 'Bottom performing spaces' 
  })
  bottomPerformingSpaces: Record<string, any>;
}

export class ConversionMetricsDto {
  @ApiProperty({ example: 15.5, description: 'Search to view conversion rate' })
  searchToView: number;

  @ApiProperty({ example: 8.2, description: 'View to booking conversion rate' })
  viewToBooking: number;

  @ApiProperty({ example: 95.5, description: 'Booking to payment conversion rate' })
  bookingToPayment: number;

  @ApiProperty({ example: 12.1, description: 'Overall conversion rate' })
  overallConversion: number;

  @ApiProperty({ example: 25, description: 'Abandoned bookings count' })
  abandonedBookings: number;

  @ApiProperty({ example: 5, description: 'Failed payments count' })
  failedPayments: number;

  @ApiProperty({ example: 1800, description: 'Average time to booking in seconds' })
  averageTimeToBooking: number;

  @ApiProperty({ 
    example: { 'search': 1000, 'view': 155, 'booking': 13, 'payment': 12 },
    description: 'Conversion funnel data' 
  })
  conversionFunnel: Record<string, number>;

  @ApiProperty({ 
    example: { 'pricing': 50, 'availability': 30, 'payment': 20 },
    description: 'Drop-off points analysis' 
  })
  dropOffPoints: Record<string, number>;
}

export class EngagementMetricsDto {
  @ApiProperty({ example: 10000, description: 'Total page views' })
  totalPageViews: number;

  @ApiProperty({ example: 2500, description: 'Unique visitors' })
  uniqueVisitors: number;

  @ApiProperty({ example: 180, description: 'Average session duration in seconds' })
  averageSessionDuration: number;

  @ApiProperty({ example: 35.5, description: 'Bounce rate percentage' })
  bounceRate: number;

  @ApiProperty({ example: 25.5, description: 'Returning visitor rate percentage' })
  returningVisitorRate: number;

  @ApiProperty({ example: 500, description: 'Total search queries' })
  searchQueries: number;

  @ApiProperty({ example: 300, description: 'Filter usage count' })
  filterUsage: number;

  @ApiProperty({ 
    example: { 'conference room': 100, 'coworking space': 80 },
    description: 'Top search terms' 
  })
  topSearchTerms: Record<string, number>;

  @ApiProperty({ 
    example: { 'price': 200, 'location': 150, 'amenities': 100 },
    description: 'Popular filters used' 
  })
  popularFilters: Record<string, number>;

  @ApiProperty({ 
    example: { 'google': 40, 'direct': 30, 'social': 20, 'referral': 10 },
    description: 'Traffic sources breakdown' 
  })
  trafficSources: Record<string, number>;
}

export class PerformanceIndicatorsDto {
  @ApiProperty({ example: 250, description: 'Average response time in milliseconds' })
  averageResponseTime: number;

  @ApiProperty({ example: 99.9, description: 'System uptime percentage' })
  systemUptime: number;

  @ApiProperty({ example: 0.1, description: 'Error rate percentage' })
  errorRate: number;

  @ApiProperty({ example: 50000, description: 'Total API calls count' })
  apiCallsCount: number;

  @ApiProperty({ example: 50, description: 'Average database query time in milliseconds' })
  databaseQueryTime: number;

  @ApiProperty({ 
    example: { 'validation': 5, 'authentication': 3, 'database': 2 },
    description: 'Errors breakdown by type' 
  })
  errorsByType: Record<string, number>;

  @ApiProperty({ 
    example: { '/api/spaces/search': 500, '/api/bookings': 300 },
    description: 'Slowest endpoints with response times' 
  })
  slowestEndpoints: Record<string, number>;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ 
    example: AnalyticsType.DAILY,
    description: 'Analytics type',
    enum: AnalyticsType 
  })
  @IsOptional()
  @IsEnum(AnalyticsType)
  type?: AnalyticsType;

  @ApiPropertyOptional({ 
    example: MetricType.REVENUE,
    description: 'Metric type',
    enum: MetricType 
  })
  @IsOptional()
  @IsEnum(MetricType)
  metricType?: MetricType;

  @ApiPropertyOptional({ 
    example: '2024-01-01',
    description: 'Start date for analytics' 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    example: '2024-01-31',
    description: 'End date for analytics' 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by space ID' 
  })
  @IsOptional()
  @IsMongoId()
  spaceId?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439012',
    description: 'Filter by user ID' 
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ 
    example: 'conference-room',
    description: 'Filter by category' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({ 
    example: 'mumbai',
    description: 'Filter by location' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Page number for pagination',
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    example: 10,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    example: 'date',
    description: 'Field to sort by' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortBy?: string = 'date';

  @ApiPropertyOptional({ 
    example: 'desc',
    description: 'Sort order',
    enum: ['asc', 'desc'] 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class AnalyticsResponseDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439014',
    description: 'Analytics record ID' 
  })
  _id: string;

  @ApiProperty({ 
    example: AnalyticsType.DAILY,
    description: 'Analytics type',
    enum: AnalyticsType 
  })
  type: AnalyticsType;

  @ApiProperty({ 
    example: MetricType.REVENUE,
    description: 'Metric type',
    enum: MetricType 
  })
  metricType: MetricType;

  @ApiProperty({ 
    example: '2024-01-15T00:00:00Z',
    description: 'Analytics date' 
  })
  date: string;

  @ApiProperty({ 
    example: '2024-01-15',
    description: 'Period identifier' 
  })
  period: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Space ID (if space-specific)' 
  })
  spaceId?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439012',
    description: 'User ID (if user-specific)' 
  })
  userId?: string;

  @ApiPropertyOptional({ 
    example: 'conference-room',
    description: 'Category filter' 
  })
  category?: string;

  @ApiPropertyOptional({ 
    example: 'mumbai',
    description: 'Location filter' 
  })
  location?: string;

  @ApiPropertyOptional({ 
    description: 'Revenue metrics' 
  })
  revenue?: RevenueMetricsDto;

  @ApiPropertyOptional({ 
    description: 'Booking metrics' 
  })
  bookings?: BookingMetricsDto;

  @ApiPropertyOptional({ 
    description: 'User metrics' 
  })
  users?: UserMetricsDto;

  @ApiPropertyOptional({ 
    description: 'Space metrics' 
  })
  spaces?: SpaceMetricsDto;

  @ApiPropertyOptional({ 
    description: 'Conversion metrics' 
  })
  conversion?: ConversionMetricsDto;

  @ApiPropertyOptional({ 
    description: 'Engagement metrics' 
  })
  engagement?: EngagementMetricsDto;

  @ApiPropertyOptional({ 
    description: 'Performance indicators' 
  })
  performance?: PerformanceIndicatorsDto;

  @ApiProperty({ 
    example: {},
    description: 'Raw data for flexibility' 
  })
  rawData: Record<string, any>;

  @ApiPropertyOptional({ 
    example: { value: 45000, change: 12.5 },
    description: 'Comparison with previous period' 
  })
  previousPeriodComparison?: Record<string, number>;

  @ApiPropertyOptional({ 
    example: { value: 40000, change: 25.0 },
    description: 'Year-over-year comparison' 
  })
  yearOverYearComparison?: Record<string, number>;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'When analytics were calculated' 
  })
  calculatedAt: string;

  @ApiProperty({ 
    example: '1.0.0',
    description: 'Data version' 
  })
  dataVersion: string;

  @ApiProperty({ 
    example: ['revenue', 'daily'],
    description: 'Analytics tags' 
  })
  tags: string[];

  @ApiPropertyOptional({ 
    example: { source: 'automated', confidence: 0.95 },
    description: 'Additional metadata' 
  })
  metadata?: Record<string, any>;

  @ApiProperty({ 
    example: true,
    description: 'Whether analytics are complete' 
  })
  isComplete: boolean;

  @ApiProperty({ 
    example: false,
    description: 'Whether anomalies were detected' 
  })
  hasAnomaly: boolean;

  @ApiPropertyOptional({ 
    example: { type: 'significant_change', growthRate: 55.2 },
    description: 'Anomaly details if detected' 
  })
  anomalyDetails?: Record<string, any>;

  @ApiProperty({ 
    example: false,
    description: 'Whether record is archived' 
  })
  isArchived: boolean;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Creation timestamp' 
  })
  createdAt: string;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Last update timestamp' 
  })
  updatedAt: string;

  // Computed virtual fields
  @ApiProperty({ 
    example: 12.5,
    description: 'Growth rate percentage' 
  })
  growthRate: number;

  @ApiProperty({ 
    example: 'upward',
    description: 'Trend direction',
    enum: ['upward', 'downward', 'stable'] 
  })
  trend: string;
}

export class DashboardSummaryDto {
  @ApiProperty({ 
    example: 50000,
    description: 'Total revenue for the period' 
  })
  totalRevenue: number;

  @ApiProperty({ 
    example: 100,
    description: 'Total bookings for the period' 
  })
  totalBookings: number;

  @ApiProperty({ 
    example: 1000,
    description: 'Total users' 
  })
  totalUsers: number;

  @ApiProperty({ 
    example: 50,
    description: 'Total spaces' 
  })
  totalSpaces: number;

  @ApiProperty({ 
    example: 75.5,
    description: 'Average occupancy rate percentage' 
  })
  averageOccupancy: number;

  @ApiProperty({ 
    example: 12.1,
    description: 'Overall conversion rate percentage' 
  })
  conversionRate: number;

  @ApiProperty({ 
    example: 10.5,
    description: 'Cancellation rate percentage' 
  })
  cancellationRate: number;

  @ApiProperty({ 
    example: '2024-01-01',
    description: 'Period start date' 
  })
  periodStart: string;

  @ApiProperty({ 
    example: '2024-01-31',
    description: 'Period end date' 
  })
  periodEnd: string;
}

export class SpacePerformanceDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Space ID' 
  })
  spaceId: string;

  @ApiProperty({ 
    example: 'Conference Room A',
    description: 'Space name' 
  })
  spaceName: string;

  @ApiProperty({ 
    example: 15000,
    description: 'Total revenue for the period' 
  })
  totalRevenue: number;

  @ApiProperty({ 
    example: 25,
    description: 'Total bookings for the period' 
  })
  totalBookings: number;

  @ApiProperty({ 
    example: 80.5,
    description: 'Average occupancy rate percentage' 
  })
  averageOccupancy: number;

  @ApiProperty({ 
    example: 4.2,
    description: 'Average rating' 
  })
  averageRating: number;

  @ApiProperty({ 
    example: 500,
    description: 'Total views' 
  })
  totalViews: number;

  @ApiProperty({ 
    example: 15.5,
    description: 'Conversion rate percentage' 
  })
  conversionRate: number;

  @ApiProperty({ 
    example: '2024-01-01',
    description: 'Period start date' 
  })
  periodStart: string;

  @ApiProperty({ 
    example: '2024-01-31',
    description: 'Period end date' 
  })
  periodEnd: string;
}
