import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Transform } from 'class-transformer';

export type AnalyticsDocument = Analytics & Document;

export enum AnalyticsType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum MetricType {
  REVENUE = 'revenue',
  BOOKINGS = 'bookings',
  USERS = 'users',
  SPACES = 'spaces',
  OCCUPANCY = 'occupancy',
  RATINGS = 'ratings',
  CONVERSION = 'conversion',
  ENGAGEMENT = 'engagement'
}

@Schema({ _id: false })
export class RevenueMetrics {
  @Prop({ required: true, default: 0 })
  totalRevenue: number;

  @Prop({ required: true, default: 0 })
  netRevenue: number;

  @Prop({ required: true, default: 0 })
  grossRevenue: number;

  @Prop({ required: true, default: 0 })
  refunds: number;

  @Prop({ required: true, default: 0 })
  fees: number;

  @Prop({ required: true, default: 0 })
  taxes: number;

  @Prop({ required: true, default: 0 })
  averageBookingValue: number;

  @Prop({ required: true, default: 0 })
  revenuePerSpace: number;

  @Prop({ required: true, default: 0 })
  revenuePerUser: number;

  @Prop({ type: Object, default: {} })
  revenueByCategory: Record<string, number>;

  @Prop({ type: Object, default: {} })
  revenueByLocation: Record<string, number>;

  @Prop({ type: Object, default: {} })
  revenueByPaymentMethod: Record<string, number>;
}

@Schema({ _id: false })
export class BookingMetrics {
  @Prop({ required: true, default: 0 })
  totalBookings: number;

  @Prop({ required: true, default: 0 })
  confirmedBookings: number;

  @Prop({ required: true, default: 0 })
  cancelledBookings: number;

  @Prop({ required: true, default: 0 })
  noShowBookings: number;

  @Prop({ required: true, default: 0 })
  completedBookings: number;

  @Prop({ required: true, default: 0 })
  cancellationRate: number;

  @Prop({ required: true, default: 0 })
  noShowRate: number;

  @Prop({ required: true, default: 0 })
  completionRate: number;

  @Prop({ required: true, default: 0 })
  averageBookingDuration: number;

  @Prop({ required: true, default: 0 })
  repeatBookingRate: number;

  @Prop({ type: Object, default: {} })
  bookingsByCategory: Record<string, number>;

  @Prop({ type: Object, default: {} })
  bookingsByTimeSlot: Record<string, number>;

  @Prop({ type: Object, default: {} })
  bookingsByDayOfWeek: Record<string, number>;

  @Prop({ type: Object, default: {} })
  bookingsByMonth: Record<string, number>;
}

@Schema({ _id: false })
export class UserMetrics {
  @Prop({ required: true, default: 0 })
  totalUsers: number;

  @Prop({ required: true, default: 0 })
  newUsers: number;

  @Prop({ required: true, default: 0 })
  activeUsers: number;

  @Prop({ required: true, default: 0 })
  verifiedUsers: number;

  @Prop({ required: true, default: 0 })
  retentionRate: number;

  @Prop({ required: true, default: 0 })
  churnRate: number;

  @Prop({ required: true, default: 0 })
  lifetimeValue: number;

  @Prop({ required: true, default: 0 })
  acquisitionCost: number;

  @Prop({ type: Object, default: {} })
  usersByRole: Record<string, number>;

  @Prop({ type: Object, default: {} })
  usersByLocation: Record<string, number>;

  @Prop({ type: Object, default: {} })
  usersByAgeGroup: Record<string, number>;

  @Prop({ type: Object, default: {} })
  userEngagement: Record<string, number>;
}

@Schema({ _id: false })
export class SpaceMetrics {
  @Prop({ required: true, default: 0 })
  totalSpaces: number;

  @Prop({ required: true, default: 0 })
  activeSpaces: number;

  @Prop({ required: true, default: 0 })
  newSpaces: number;

  @Prop({ required: true, default: 0 })
  verifiedSpaces: number;

  @Prop({ required: true, default: 0 })
  occupancyRate: number;

  @Prop({ required: true, default: 0 })
  averageRating: number;

  @Prop({ required: true, default: 0 })
  totalViews: number;

  @Prop({ required: true, default: 0 })
  averageViewsPerSpace: number;

  @Prop({ type: Object, default: {} })
  spacesByCategory: Record<string, number>;

  @Prop({ type: Object, default: {} })
  spacesByLocation: Record<string, number>;

  @Prop({ type: Object, default: {} })
  topPerformingSpaces: Record<string, any>;

  @Prop({ type: Object, default: {} })
  bottomPerformingSpaces: Record<string, any>;
}

@Schema({ _id: false })
export class ConversionMetrics {
  @Prop({ required: true, default: 0 })
  searchToView: number;

  @Prop({ required: true, default: 0 })
  viewToBooking: number;

  @Prop({ required: true, default: 0 })
  bookingToPayment: number;

  @Prop({ required: true, default: 0 })
  overallConversion: number;

  @Prop({ required: true, default: 0 })
  abandonedBookings: number;

  @Prop({ required: true, default: 0 })
  failedPayments: number;

  @Prop({ required: true, default: 0 })
  averageTimeToBooking: number;

  @Prop({ type: Object, default: {} })
  conversionFunnel: Record<string, number>;

  @Prop({ type: Object, default: {} })
  dropOffPoints: Record<string, number>;
}

@Schema({ _id: false })
export class EngagementMetrics {
  @Prop({ required: true, default: 0 })
  totalPageViews: number;

  @Prop({ required: true, default: 0 })
  uniqueVisitors: number;

  @Prop({ required: true, default: 0 })
  averageSessionDuration: number;

  @Prop({ required: true, default: 0 })
  bounceRate: number;

  @Prop({ required: true, default: 0 })
  returningVisitorRate: number;

  @Prop({ required: true, default: 0 })
  searchQueries: number;

  @Prop({ required: true, default: 0 })
  filterUsage: number;

  @Prop({ type: Object, default: {} })
  topSearchTerms: Record<string, number>;

  @Prop({ type: Object, default: {} })
  popularFilters: Record<string, number>;

  @Prop({ type: Object, default: {} })
  trafficSources: Record<string, number>;
}

@Schema({ _id: false })
export class PerformanceIndicators {
  @Prop({ required: true, default: 0 })
  averageResponseTime: number;

  @Prop({ required: true, default: 0 })
  systemUptime: number;

  @Prop({ required: true, default: 0 })
  errorRate: number;

  @Prop({ required: true, default: 0 })
  apiCallsCount: number;

  @Prop({ required: true, default: 0 })
  databaseQueryTime: number;

  @Prop({ type: Object, default: {} })
  errorsByType: Record<string, number>;

  @Prop({ type: Object, default: {} })
  slowestEndpoints: Record<string, number>;
}

@Schema({ timestamps: true })
export class Analytics {
  @Transform(({ value }) => value?.toString())
  _id: string;

  @Prop({ 
    required: true,
    enum: Object.values(AnalyticsType),
    index: true
  })
  type: AnalyticsType;

  @Prop({ 
    required: true,
    enum: Object.values(MetricType),
    index: true
  })
  metricType: MetricType;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true, index: true })
  period: string; // YYYY-MM-DD, YYYY-WW, YYYY-MM, YYYY format

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Space',
    index: true
  })
  spaceId?: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User',
    index: true
  })
  userId?: MongooseSchema.Types.ObjectId;

  @Prop({ index: true })
  category?: string;

  @Prop({ index: true })
  location?: string;

  @Prop({ type: RevenueMetrics })
  revenue?: RevenueMetrics;

  @Prop({ type: BookingMetrics })
  bookings?: BookingMetrics;

  @Prop({ type: UserMetrics })
  users?: UserMetrics;

  @Prop({ type: SpaceMetrics })
  spaces?: SpaceMetrics;

  @Prop({ type: ConversionMetrics })
  conversion?: ConversionMetrics;

  @Prop({ type: EngagementMetrics })
  engagement?: EngagementMetrics;

  @Prop({ type: PerformanceIndicators })
  performance?: PerformanceIndicators;

  // Raw metrics for flexibility
  @Prop({ type: Object, default: {} })
  rawData: Record<string, any>;

  // Comparison data
  @Prop({ type: Object })
  previousPeriodComparison?: Record<string, number>;

  @Prop({ type: Object })
  yearOverYearComparison?: Record<string, number>;

  // Metadata
  @Prop({ default: Date.now })
  calculatedAt: Date;

  @Prop({ required: true })
  dataVersion: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: false })
  isComplete: boolean;

  @Prop({ default: false })
  hasAnomaly: boolean;

  @Prop({ type: Object })
  anomalyDetails?: Record<string, any>;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop()
  archivedAt?: Date;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);

// Compound indexes for performance
AnalyticsSchema.index({ type: 1, period: 1 });
AnalyticsSchema.index({ metricType: 1, date: -1 });
AnalyticsSchema.index({ spaceId: 1, type: 1, date: -1 });
AnalyticsSchema.index({ userId: 1, type: 1, date: -1 });
AnalyticsSchema.index({ category: 1, type: 1, date: -1 });
AnalyticsSchema.index({ location: 1, type: 1, date: -1 });
AnalyticsSchema.index({ date: -1, type: 1 });
AnalyticsSchema.index({ calculatedAt: -1 });
AnalyticsSchema.index({ isComplete: 1, hasAnomaly: 1 });
AnalyticsSchema.index({ isArchived: 1, archivedAt: 1 });

// TTL index for old analytics data (keep for 2 years)
AnalyticsSchema.index(
  { date: 1 },
  { 
    expireAfterSeconds: 2 * 365 * 24 * 60 * 60,
    partialFilterExpression: { isArchived: true }
  }
);

// Unique compound index to prevent duplicates
AnalyticsSchema.index(
  { 
    type: 1, 
    metricType: 1, 
    period: 1, 
    spaceId: 1, 
    userId: 1, 
    category: 1, 
    location: 1 
  },
  { 
    unique: true,
    partialFilterExpression: {
      spaceId: { $exists: true },
      userId: { $exists: true },
      category: { $exists: true },
      location: { $exists: true }
    }
  }
);

// Virtual for growth rate calculation
AnalyticsSchema.virtual('growthRate').get(function() {
  if (this.previousPeriodComparison && this.previousPeriodComparison.value) {
    const current = this.rawData.totalValue || 0;
    const previous = this.previousPeriodComparison.value;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }
  return 0;
});

// Virtual for trend direction
AnalyticsSchema.virtual('trend').get(function() {
  const growth = this.growthRate;
  if (growth > 5) return 'upward';
  if (growth < -5) return 'downward';
  return 'stable';
});

// Instance methods
AnalyticsSchema.methods.calculateGrowthRate = function(
  currentValue: number,
  previousValue: number
): number {
  return previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
};

AnalyticsSchema.methods.detectAnomalies = function(): boolean {
  // Simple anomaly detection based on significant deviation
  if (this.previousPeriodComparison) {
    const growthRate = Math.abs(this.growthRate);
    if (growthRate > 50) { // More than 50% change
      this.hasAnomaly = true;
      this.anomalyDetails = {
        type: 'significant_change',
        growthRate,
        threshold: 50,
        detectedAt: new Date()
      };
      return true;
    }
  }
  return false;
};

AnalyticsSchema.methods.markComplete = function(): void {
  this.isComplete = true;
  this.calculatedAt = new Date();
};

AnalyticsSchema.methods.archive = function(): void {
  this.isArchived = true;
  this.archivedAt = new Date();
};

// Static methods for aggregations
AnalyticsSchema.statics.getRevenueAnalytics = function(
  startDate: Date,
  endDate: Date,
  groupBy: string = 'day'
) {
  const groupFormat = {
    day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
    week: { $dateToString: { format: '%Y-W%U', date: '$date' } },
    month: { $dateToString: { format: '%Y-%m', date: '$date' } },
    year: { $dateToString: { format: '%Y', date: '$date' } }
  };

  return this.aggregate([
    {
      $match: {
        metricType: MetricType.REVENUE,
        date: { $gte: startDate, $lte: endDate },
        isComplete: true
      }
    },
    {
      $group: {
        _id: groupFormat[groupBy],
        totalRevenue: { $sum: '$revenue.totalRevenue' },
        netRevenue: { $sum: '$revenue.netRevenue' },
        bookingCount: { $sum: '$bookings.totalBookings' },
        averageBookingValue: { $avg: '$revenue.averageBookingValue' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

AnalyticsSchema.statics.getSpacePerformance = function(
  spaceId: string,
  period: string = '30d'
) {
  const startDate = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        spaceId,
        date: { $gte: startDate },
        isComplete: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue.totalRevenue' },
        totalBookings: { $sum: '$bookings.totalBookings' },
        averageOccupancy: { $avg: '$spaces.occupancyRate' },
        averageRating: { $avg: '$spaces.averageRating' },
        totalViews: { $sum: '$spaces.totalViews' },
        conversionRate: { $avg: '$conversion.overallConversion' }
      }
    }
  ]);
};

AnalyticsSchema.statics.getUserEngagementTrends = function(
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        metricType: MetricType.ENGAGEMENT,
        date: { $gte: startDate, $lte: endDate },
        isComplete: true
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalPageViews: { $sum: '$engagement.totalPageViews' },
        uniqueVisitors: { $sum: '$engagement.uniqueVisitors' },
        averageSessionDuration: { $avg: '$engagement.averageSessionDuration' },
        bounceRate: { $avg: '$engagement.bounceRate' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

AnalyticsSchema.statics.getTopPerformingSpaces = function(
  limit: number = 10,
  metric: string = 'revenue',
  period: string = '30d'
) {
  const startDate = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  startDate.setDate(startDate.getDate() - days);

  const groupFields = {
    revenue: '$revenue.totalRevenue',
    bookings: '$bookings.totalBookings',
    rating: '$spaces.averageRating',
    occupancy: '$spaces.occupancyRate'
  };

  return this.aggregate([
    {
      $match: {
        spaceId: { $exists: true },
        date: { $gte: startDate },
        isComplete: true
      }
    },
    {
      $group: {
        _id: '$spaceId',
        totalValue: { $sum: groupFields[metric] },
        totalBookings: { $sum: '$bookings.totalBookings' },
        averageRating: { $avg: '$spaces.averageRating' }
      }
    },
    { $sort: { totalValue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'spaces',
        localField: '_id',
        foreignField: '_id',
        as: 'spaceInfo'
      }
    }
  ]);
};

AnalyticsSchema.statics.getDashboardSummary = function(period: string = '30d') {
  const startDate = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate },
        isComplete: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue.totalRevenue' },
        totalBookings: { $sum: '$bookings.totalBookings' },
        totalUsers: { $max: '$users.totalUsers' },
        totalSpaces: { $max: '$spaces.totalSpaces' },
        averageOccupancy: { $avg: '$spaces.occupancyRate' },
        conversionRate: { $avg: '$conversion.overallConversion' },
        cancellationnRate: { $avg: '$bookings.cancellationRate' }
      }
    }
  ]);
};

// Pre-save middleware
AnalyticsSchema.pre('save', function(next) {
  // Set data version if not provided
  if (!this.dataVersion) {
    this.dataVersion = '1.0.0';
  }

  // Generate period string based on type and date
  if (!this.period) {
    const date = this.date;
    switch (this.type) {
      case AnalyticsType.DAILY:
        this.period = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case AnalyticsType.WEEKLY:
        const week = this.getWeekNumber(date);
        this.period = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
        break;
      case AnalyticsType.MONTHLY:
        this.period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case AnalyticsType.YEARLY:
        this.period = date.getFullYear().toString();
        break;
    }
  }

  // Detect anomalies
  this.detectAnomalies();

  next();
});

// Helper method to get week number
AnalyticsSchema.methods.getWeekNumber = function(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Transform output
AnalyticsSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Hide sensitive performance data in public APIs
    if (ret.performance) {
      delete ret.performance.errorsByType;
      delete ret.performance.slowestEndpoints;
    }
    return ret;
  }
});