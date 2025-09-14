import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository, PaginationOptions } from '../database/base-repository';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Space, SpaceDocument } from '../spaces/schemas/space.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { StaffActivity, StaffActivityDocument } from '../staff/schemas/staff-activity.schema';
import { Issue, IssueDocument } from '../staff/schemas/issue.schema';
// import { Analytics, AnalyticsDocument } from '../analytics/schemas/analytics.schema';

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByRole(role: string, options?: PaginationOptions): Promise<{
    data: UserDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ role }, options);
  }

  async findActiveUsers(options?: PaginationOptions): Promise<{
    data: UserDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ 
      status: { $in: ['active', 'verified'] },
      isActive: true 
    }, options);
  }

  async findUsersByLocation(location: string, options?: PaginationOptions): Promise<{
    data: UserDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ 
      'address.city': { $regex: location, $options: 'i' } 
    }, options);
  }

  async getUsersWithRecentActivity(days: number = 30): Promise<UserDocument[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.userModel.find({
      lastActiveAt: { $gte: date }
    }).sort({ lastActiveAt: -1 }).exec();
  }

  async getUsersByRegistrationDate(startDate: Date, endDate: Date): Promise<UserDocument[]> {
    return this.userModel.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 }).exec();
  }

  async updateUserStats(userId: string, stats: {
    totalBookings?: number;
    totalSpending?: number;
    loyaltyPoints?: number;
    averageRating?: number;
    reviewCount?: number;
  }): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $inc: stats },
      { new: true }
    ).exec();
  }

  async getTopUsersBySpending(limit: number = 10): Promise<UserDocument[]> {
    return this.userModel.find()
      .sort({ totalSpending: -1 })
      .limit(limit)
      .exec();
  }

  async getUsersByLoyaltyPoints(minPoints: number): Promise<UserDocument[]> {
    return this.userModel.find({
      loyaltyPoints: { $gte: minPoints }
    }).sort({ loyaltyPoints: -1 }).exec();
  }
}

@Injectable()
export class SpaceRepository extends BaseRepository<SpaceDocument> {
  constructor(@InjectModel(Space.name) private spaceModel: Model<SpaceDocument>) {
    super(spaceModel);
  }

  async findActiveSpaces(options?: PaginationOptions): Promise<{
    data: SpaceDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ 
      isActive: true,
      status: 'active'
    }, options);
  }

  async findSpacesByCategory(category: string, options?: PaginationOptions): Promise<{
    data: SpaceDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ 
      category,
      isActive: true
    }, options);
  }

  async findSpacesByLocation(location: {
    lat: number;
    lng: number;
    radius: number; // in kilometers
  }): Promise<SpaceDocument[]> {
    return this.spaceModel.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: location.radius * 1000 // Convert to meters
        }
      },
      isActive: true
    }).exec();
  }

  async findSpacesByPriceRange(minPrice: number, maxPrice: number, options?: PaginationOptions): Promise<{
    data: SpaceDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({
      'pricing.basePrice': { $gte: minPrice, $lte: maxPrice },
      isActive: true
    }, options);
  }

  async findSpacesByOwner(ownerId: string, options?: PaginationOptions): Promise<{
    data: SpaceDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ ownerId }, options);
  }

  async getTopRatedSpaces(limit: number = 10): Promise<SpaceDocument[]> {
    return this.spaceModel.find({
      isActive: true,
      averageRating: { $gte: 4.0 }
    })
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(limit)
    .exec();
  }

  async getMostBookedSpaces(limit: number = 10): Promise<SpaceDocument[]> {
    return this.spaceModel.find({
      isActive: true
    })
    .sort({ totalBookings: -1 })
    .limit(limit)
    .exec();
  }

  async updateSpaceStats(spaceId: string, stats: {
    totalBookings?: number;
    totalRevenue?: number;
    averageRating?: number;
    reviewCount?: number;
    totalViews?: number;
  }): Promise<SpaceDocument | null> {
    return this.spaceModel.findByIdAndUpdate(
      spaceId,
      { $inc: stats },
      { new: true }
    ).exec();
  }

  async searchSpaces(query: {
    searchTerm?: string;
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    capacity?: number;
  }, options?: PaginationOptions): Promise<{
    data: SpaceDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const filter: any = { isActive: true };

    if (query.searchTerm) {
      filter.$or = [
        { name: { $regex: query.searchTerm, $options: 'i' } },
        { description: { $regex: query.searchTerm, $options: 'i' } },
        { 'location.address': { $regex: query.searchTerm, $options: 'i' } }
      ];
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.location) {
      filter['location.city'] = { $regex: query.location, $options: 'i' };
    }

    if (query.minPrice || query.maxPrice) {
      filter['pricing.basePrice'] = {};
      if (query.minPrice) filter['pricing.basePrice'].$gte = query.minPrice;
      if (query.maxPrice) filter['pricing.basePrice'].$lte = query.maxPrice;
    }

    if (query.amenities && query.amenities.length > 0) {
      filter.amenities = { $all: query.amenities };
    }

    if (query.capacity) {
      filter.capacity = { $gte: query.capacity };
    }

    return this.findWithPagination(filter, options);
  }
}

@Injectable()
export class BookingRepository extends BaseRepository<BookingDocument> {
  constructor(@InjectModel(Booking.name) private bookingModel: Model<BookingDocument>) {
    super(bookingModel);
  }

  async findByBookingCode(bookingCode: string): Promise<BookingDocument | null> {
    return this.bookingModel.findOne({ bookingCode }).exec();
  }

  async findByCustomer(customerId: string, options?: PaginationOptions): Promise<{
    data: BookingDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ customerId }, options);
  }

  async findBySpace(spaceId: string, options?: PaginationOptions): Promise<{
    data: BookingDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ spaceId }, options);
  }

  async findByStatus(status: string, options?: PaginationOptions): Promise<{
    data: BookingDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ status }, options);
  }

  async findBookingsByDateRange(startDate: Date, endDate: Date): Promise<BookingDocument[]> {
    return this.bookingModel.find({
      bookingDate: { $gte: startDate, $lte: endDate }
    }).sort({ bookingDate: 1 }).exec();
  }

  async findUpcomingBookings(customerId?: string): Promise<BookingDocument[]> {
    const now = new Date();
    const filter: any = {
      bookingDate: { $gte: now },
      status: { $in: ['confirmed', 'pending'] }
    };

    if (customerId) {
      filter.customerId = customerId;
    }

    return this.bookingModel.find(filter)
      .sort({ bookingDate: 1 })
      .exec();
  }

  async findPastBookings(customerId?: string): Promise<BookingDocument[]> {
    const now = new Date();
    const filter: any = {
      bookingDate: { $lt: now },
      status: { $in: ['completed', 'checked-out', 'cancelled', 'no-show'] }
    };

    if (customerId) {
      filter.customerId = customerId;
    }

    return this.bookingModel.find(filter)
      .sort({ bookingDate: -1 })
      .exec();
  }

  async checkAvailability(spaceId: string, date: Date, startTime: string, endTime: string): Promise<boolean> {
    const conflictingBookings = await this.bookingModel.countDocuments({
      spaceId,
      bookingDate: date,
      status: { $in: ['confirmed', 'checked-in'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    return conflictingBookings === 0;
  }

  async getBookingStats(spaceId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
  }> {
    const filter: any = {};
    
    if (spaceId) filter.spaceId = spaceId;
    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = startDate;
      if (endDate) filter.bookingDate.$lte = endDate;
    }

    const stats = await this.bookingModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          averageBookingValue: { $avg: '$pricing.totalAmount' }
        }
      }
    ]);

    return stats[0] || {
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      completedBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0
    };
  }
}

@Injectable()
export class PaymentRepository extends BaseRepository<PaymentDocument> {
  constructor(@InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>) {
    super(paymentModel);
  }

  async findByOrderId(orderId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ orderId }).exec();
  }

  async findByPaymentId(paymentId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ paymentId }).exec();
  }

  async findByBooking(bookingId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ bookingId }).exec();
  }

  async findByCustomer(customerId: string, options?: PaginationOptions): Promise<{
    data: PaymentDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ customerId }, options);
  }

  async findByStatus(status: string, options?: PaginationOptions): Promise<{
    data: PaymentDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ status }, options);
  }

  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    totalRefunds: number;
    netAmount: number;
  }> {
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const stats = await this.paymentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          successfulPayments: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] } },
          failedPayments: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalAmount: { $sum: '$amount' },
          totalRefunds: { $sum: '$totalRefunded' }
        }
      }
    ]);

    const result = stats[0] || {
      totalPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      totalAmount: 0,
      totalRefunds: 0
    };

    result.netAmount = result.totalAmount - result.totalRefunds;
    return result;
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<any[]> {
    const groupFormat = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $dateToString: { format: '%Y-W%U', date: '$createdAt' } },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
    };

    return this.paymentModel.aggregate([
      {
        $match: {
          status: 'captured',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupFormat[groupBy],
          totalRevenue: { $sum: '$amount' },
          totalRefunds: { $sum: '$totalRefunded' },
          netRevenue: { $sum: { $subtract: ['$amount', '$totalRefunded'] } },
          paymentCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
}

@Injectable()
export class StaffActivityRepository extends BaseRepository<StaffActivityDocument> {
  constructor(@InjectModel(StaffActivity.name) private staffActivityModel: Model<StaffActivityDocument>) {
    super(staffActivityModel);
  }

  async findByStaff(staffId: string, options?: PaginationOptions): Promise<{
    data: StaffActivityDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ staffId }, options);
  }

  async findByBooking(bookingId: string): Promise<StaffActivityDocument[]> {
    return this.staffActivityModel.find({ bookingId })
      .sort({ timestamp: 1 })
      .exec();
  }

  async findBySpace(spaceId: string, options?: PaginationOptions): Promise<{
    data: StaffActivityDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ spaceId }, options);
  }

  async getStaffPerformanceMetrics(staffId: string, startDate: Date, endDate: Date): Promise<{
    totalActivities: number;
    checkIns: number;
    checkOuts: number;
    noShows: number;
    issuesReported: number;
    issuesResolved: number;
    averageProcessingTime: number;
    performanceScore: number;
  }> {
    const activities = await this.staffActivityModel.find({
      staffId,
      timestamp: { $gte: startDate, $lte: endDate }
    });

    const metrics = {
      totalActivities: activities.length,
      checkIns: activities.filter(a => a.action === 'check-in').length,
      checkOuts: activities.filter(a => a.action === 'check-out').length,
      noShows: activities.filter(a => a.action === 'mark-no-show').length,
      issuesReported: activities.filter(a => a.action === 'report-issue').length,
      issuesResolved: activities.filter(a => a.action === 'resolve-issue').length,
      averageProcessingTime: 0,
      performanceScore: 0
    };

    const processingTimes = activities
      .map(a => a.details.processingTimeMs)
      .filter(time => time && time > 0);

    if (processingTimes.length > 0) {
      metrics.averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    }

    // Calculate performance score (0-100)
    const completionRate = metrics.totalActivities > 0 ? 
      (metrics.checkIns + metrics.checkOuts) / metrics.totalActivities : 0;
    const issueResolutionRate = metrics.issuesReported > 0 ? 
      metrics.issuesResolved / metrics.issuesReported : 1;
    
    metrics.performanceScore = Math.round((completionRate * 0.7 + issueResolutionRate * 0.3) * 100);

    return metrics;
  }

  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<StaffActivityDocument[]> {
    return this.staffActivityModel.find({
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate('staff', 'name email')
    .populate('booking', 'bookingCode customerName')
    .populate('space', 'name location')
    .sort({ timestamp: -1 })
    .exec();
  }
}

@Injectable()
export class IssueRepository extends BaseRepository<IssueDocument> {
  constructor(@InjectModel(Issue.name) private issueModel: Model<IssueDocument>) {
    super(issueModel);
  }

  async findByStatus(status: string, options?: PaginationOptions): Promise<{
    data: IssueDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ status }, options);
  }

  async findBySeverity(severity: string, options?: PaginationOptions): Promise<{
    data: IssueDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ severity }, options);
  }

  async findBySpace(spaceId: string, options?: PaginationOptions): Promise<{
    data: IssueDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ spaceId }, options);
  }

  async findByAssignee(assignedTo: string, options?: PaginationOptions): Promise<{
    data: IssueDocument[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    return this.findWithPagination({ assignedTo }, options);
  }

  async getOverdueIssues(): Promise<IssueDocument[]> {
    return this.issueModel.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['resolved', 'closed'] }
    })
    .populate('reporter', 'name email')
    .populate('assignee', 'name email')
    .populate('space', 'name location')
    .sort({ dueDate: 1 })
    .exec();
  }

  async getCriticalIssues(): Promise<IssueDocument[]> {
    return this.issueModel.find({
      severity: 'critical',
      status: { $nin: ['resolved', 'closed'] }
    })
    .populate('reporter', 'name email')
    .populate('assignee', 'name email')
    .populate('space', 'name location')
    .sort({ createdAt: 1 })
    .exec();
  }

  async getIssueStats(startDate?: Date, endDate?: Date): Promise<{
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    closedIssues: number;
    averageResolutionTime: number;
    criticalIssues: number;
  }> {
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const stats = await this.issueModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          openIssues: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          resolvedIssues: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closedIssues: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          criticalIssues: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalIssues: 0,
      openIssues: 0,
      resolvedIssues: 0,
      closedIssues: 0,
      criticalIssues: 0
    };

    // Calculate average resolution time
    const resolvedIssues = await this.issueModel.find({
      ...filter,
      status: 'resolved',
      'resolution.resolvedAt': { $exists: true }
    });

    if (resolvedIssues.length > 0) {
      const totalResolutionTime = resolvedIssues.reduce((sum, issue) => {
        const resolutionTime = issue.resolution.resolvedAt.getTime() - issue.createdAt.getTime();
        return sum + resolutionTime;
      }, 0);
      
      result.averageResolutionTime = totalResolutionTime / resolvedIssues.length / (1000 * 60 * 60); // in hours
    } else {
      result.averageResolutionTime = 0;
    }

    return result;
  }
}

//// @Injectable()
//// export class AnalyticsRepository extends BaseRepository<AnalyticsDocument> {
//  constructor(@InjectModel(Analytics.name) private analyticsModel: Model<AnalyticsDocument>) {
//    super(analyticsModel);
//  }
//
//  async findByType(type: string, options?: PaginationOptions): Promise<{
//    data: AnalyticsDocument[];
//    totalCount: number;
//    totalPages: number;
//    currentPage: number;
//    hasNextPage: boolean;
//    hasPreviousPage: boolean;
//  }> {
//    return this.findWithPagination({ type }, options);
//  }
//
//  async findByMetricType(metricType: string, options?: PaginationOptions): Promise<{
//    data: AnalyticsDocument[];
//    totalCount: number;
//    totalPages: number;
//    currentPage: number;
//    hasNextPage: boolean;
//    hasPreviousPage: boolean;
//  }> {
//    return this.findWithPagination({ metricType }, options);
//  }
//
//  async findByDateRange(startDate: Date, endDate: Date): Promise<AnalyticsDocument[]> {
//    return this.analyticsModel.find({
//      date: { $gte: startDate, $lte: endDate }
//    }).sort({ date: 1 }).exec();
//  }
//
//  async getDashboardSummary(period: string = '30d'): Promise<any> {
//    const startDate = new Date();
//    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
//    startDate.setDate(startDate.getDate() - days);
//
//    return this.analyticsModel.aggregate([
//      {
//        $match: {
//          date: { $gte: startDate },
//          isComplete: true
//        }
//      },
//      {
//        $group: {
//          _id: null,
//          totalRevenue: { $sum: '$revenue.totalRevenue' },
//          totalBookings: { $sum: '$bookings.totalBookings' },
//          totalUsers: { $max: '$users.totalUsers' },
//          totalSpaces: { $max: '$spaces.totalSpaces' },
//          averageOccupancy: { $avg: '$spaces.occupancyRate' },
//          conversionRate: { $avg: '$conversion.overallConversion' },
//          cancellationRate: { $avg: '$bookings.cancellationRate' }
//        }
//      }
//    ]);
//  }
//
//  async getRevenueAnalytics(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<any[]> {
//    const groupFormat = {
//      day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
//      week: { $dateToString: { format: '%Y-W%U', date: '$date' } },
//      month: { $dateToString: { format: '%Y-%m', date: '$date' } }
//    };
//
//    return this.analyticsModel.aggregate([
//      {
//        $match: {
//          metricType: 'revenue',
//          date: { $gte: startDate, $lte: endDate },
//          isComplete: true
//        }
//      },
//      {
//        $group: {
//          _id: groupFormat[groupBy],
//          totalRevenue: { $sum: '$revenue.totalRevenue' },
//          netRevenue: { $sum: '$revenue.netRevenue' },
//          bookingCount: { $sum: '$bookings.totalBookings' },
//          averageBookingValue: { $avg: '$revenue.averageBookingValue' }
//        }
//      },
//      { $sort: { _id: 1 } }
//    ]);
//  }
//
//  async getTopPerformingSpaces(limit: number = 10, metric: string = 'revenue', period: string = '30d'): Promise<any[]> {
//    const startDate = new Date();
//    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
//    startDate.setDate(startDate.getDate() - days);
//
//    const groupFields = {
//      revenue: '$revenue.totalRevenue',
//      bookings: '$bookings.totalBookings',
//      rating: '$spaces.averageRating',
//      occupancy: '$spaces.occupancyRate'
//    };
//
//    return this.analyticsModel.aggregate([
//      {
//        $match: {
//          spaceId: { $exists: true },
//          date: { $gte: startDate },
//          isComplete: true
//        }
//      },
//      {
//        $group: {
//          _id: '$spaceId',
//          totalValue: { $sum: groupFields[metric] },
//          totalBookings: { $sum: '$bookings.totalBookings' },
//          averageRating: { $avg: '$spaces.averageRating' }
//        }
//      },
//      { $sort: { totalValue: -1 } },
//      { $limit: limit },
//      {
//        $lookup: {
//          from: 'spaces',
//          localField: '_id',
//          foreignField: '_id',
//          as: 'spaceInfo'
//        }
//      }
//    ]);
//  }
//}
