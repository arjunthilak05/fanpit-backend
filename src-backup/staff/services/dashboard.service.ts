import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../../bookings/schemas/booking.schema';
import { Issue, IssueDocument, IssueStatus } from '../schemas/issue.schema';
import { StaffActivity, StaffActivityDocument, StaffActionType } from '../schemas/staff-activity.schema';
import { 
  DashboardQueryDto, 
  StatsQueryDto, 
  ActivityLogQueryDto,
  DashboardResponseDto,
  StaffStatsResponseDto,
  PaginatedActivityLogResponseDto,
  BookingStatusFilter 
} from '../dto/dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Issue.name) private issueModel: Model<IssueDocument>,
    @InjectModel(StaffActivity.name) private staffActivityModel: Model<StaffActivityDocument>
  ) {}

  /**
   * Get daily dashboard data
   */
  async getDashboardData(
    queryDto: DashboardQueryDto,
    staffId: string,
    staffSpaces?: string[]
  ): Promise<DashboardResponseDto> {
    try {
      const targetDate = queryDto.date ? new Date(queryDto.date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Build base query for bookings
      const baseQuery: any = {
        startTime: { $gte: startOfDay, $lte: endOfDay }
      };

      // Filter by space if provided
      if (queryDto.spaceId) {
        baseQuery.spaceId = new Types.ObjectId(queryDto.spaceId);
      } else if (staffSpaces?.length) {
        baseQuery.spaceId = { $in: staffSpaces.map(id => new Types.ObjectId(id)) };
      }

      // Get booking summary and detailed data
      const [
        bookingSummary,
        upcomingBookings,
        activeBookings,
        activeIssues,
        spaceStatus,
        dailyStats,
        hourlyActivity
      ] = await Promise.all([
        this.getBookingSummary(baseQuery, queryDto.status),
        this.getUpcomingBookings(baseQuery),
        this.getActiveBookings(baseQuery),
        this.getActiveIssues(staffSpaces),
        this.getSpaceStatus(staffSpaces),
        this.getDailyStats(startOfDay, endOfDay, staffSpaces),
        this.getHourlyActivity(startOfDay, endOfDay, staffSpaces)
      ]);

      return {
        date: targetDate.toISOString().split('T')[0],
        bookingSummary,
        upcomingBookings,
        activeBookings,
        activeIssues,
        spaceStatus,
        dailyStats,
        hourlyActivity,
        lastUpdated: new Date()
      };

    } catch (error) {
      this.logger.error(`Failed to get dashboard data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get staff performance statistics
   */
  async getStaffStats(
    queryDto: StatsQueryDto,
    staffId: string
  ): Promise<StaffStatsResponseDto> {
    try {
      const startDate = queryDto.startDate ? new Date(queryDto.startDate) : new Date();
      const endDate = queryDto.endDate ? new Date(queryDto.endDate) : new Date();
      
      if (!queryDto.startDate) {
        startDate.setHours(0, 0, 0, 0);
      }
      if (!queryDto.endDate) {
        endDate.setHours(23, 59, 59, 999);
      }

      const [staffMetrics, hourlyPerformance, operationalInsights] = await Promise.all([
        this.getStaffMetrics(staffId, startDate, endDate),
        this.getHourlyPerformance(staffId, startDate, endDate),
        this.getOperationalInsights(staffId, startDate, endDate, queryDto.spaceId)
      ]);

      return {
        date: startDate.toISOString().split('T')[0],
        staffMetrics,
        hourlyPerformance,
        operationalInsights
      };

    } catch (error) {
      this.logger.error(`Failed to get staff stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get staff activity log
   */
  async getActivityLog(
    queryDto: ActivityLogQueryDto,
    staffId: string
  ): Promise<PaginatedActivityLogResponseDto> {
    try {
      const { page = 1, limit = 20, ...filters } = queryDto;

      // Build query
      const query: any = { staffId: new Types.ObjectId(staffId) };

      if (filters.action) {
        query.action = filters.action;
      }

      if (filters.fromDate || filters.toDate) {
        query.timestamp = {};
        if (filters.fromDate) {
          query.timestamp.$gte = new Date(filters.fromDate);
        }
        if (filters.toDate) {
          const toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59, 999);
          query.timestamp.$lte = toDate;
        }
      }

      // Execute paginated query
      const [activities, total] = await Promise.all([
        this.staffActivityModel
          .find(query)
          .populate('spaceId', 'name location')
          .sort({ timestamp: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        this.staffActivityModel.countDocuments(query)
      ]);

      const data = activities.map(activity => ({
        id: activity._id.toString(),
        action: activity.action,
        details: activity.details,
        space: {
          id: activity.spaceId._id?.toString() || activity.spaceId.toString(),
          name: (activity.spaceId as any).name || 'Unknown Space',
          location: (activity.spaceId as any).location || 'Unknown Location'
        },
        timestamp: activity.timestamp,
        correlationId: activity.correlationId || ''
      }));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      this.logger.error(`Failed to get activity log: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reservations for a specific date
   */
  async getReservationsForDate(
    date: string,
    staffId: string,
    staffSpaces?: string[]
  ): Promise<any[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query: any = {
      startTime: { $gte: startOfDay, $lte: endOfDay }
    };

    if (staffSpaces?.length) {
      query.spaceId = { $in: staffSpaces.map(id => new Types.ObjectId(id)) };
    }

    const bookings = await this.bookingModel
      .find(query)
      .populate('spaceId', 'name location')
      .populate('customerId', 'name email phone')
      .sort({ startTime: 1 });

    return bookings.map(booking => ({
      id: booking._id.toString(),
      code: booking.bookingCode,
      customerName: booking.customerDetails.name,
      customerEmail: booking.customerDetails.email,
      customerPhone: booking.customerDetails.phone,
      spaceName: booking.space?.name || 'Unknown Space',
      spaceLocation: booking.space?.location?.city || 'Unknown Location',
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      status: booking.status,
      totalAmount: booking.pricing.totalAmount,
      specialRequests: booking.customerDetails.specialRequests,
      checkInTime: booking.checkedInAt,
      checkOutTime: booking.checkedOutAt
    }));
  }

  /**
   * Get spaces assigned to staff
   */
  async getStaffSpaces(staffId: string): Promise<any[]> {
    // This would typically come from a staff-space assignment table
    // For now, we'll return all spaces (this should be implemented based on your business logic)
    
    // Placeholder implementation - in reality, you'd have a staff_spaces table or similar
    const spaces = []; // await this.spaceModel.find({ assignedStaff: { $in: [staffId] } });
    
    return spaces.map(space => ({
      id: (space as any)._id?.toString(),
      name: (space as any).name,
      location: (space as any).location,
      capacity: (space as any).capacity,
      amenities: (space as any).amenities,
      status: 'operational' // This would come from space status tracking
    }));
  }

  // Private helper methods

  private async getBookingSummary(baseQuery: any, statusFilter?: BookingStatusFilter): Promise<any> {
    let matchQuery = { ...baseQuery };
    
    if (statusFilter && statusFilter !== BookingStatusFilter.ALL) {
      matchQuery.status = statusFilter;
    }

    const summary = await this.bookingModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      confirmed: 0,
      checkedIn: 0,
      completed: 0,
      noShow: 0,
      cancelled: 0,
      pending: 0
    };

    summary.forEach((item: any) => {
      result.total += item.count;
      switch (item._id) {
        case 'confirmed':
          result.confirmed = item.count;
          break;
        case 'checked-in':
          result.checkedIn = item.count;
          break;
        case 'completed':
          result.completed = item.count;
          break;
        case 'no-show':
          result.noShow = item.count;
          break;
        case 'cancelled':
          result.cancelled = item.count;
          break;
        case 'pending':
          result.pending = item.count;
          break;
      }
    });

    return result;
  }

  private async getUpcomingBookings(baseQuery: any): Promise<any[]> {
    const now = new Date();
    const bookings = await this.bookingModel
      .find({
        ...baseQuery,
        startTime: { $gte: now },
        status: { $in: ['confirmed', 'pending'] }
      })
      .populate('spaceId', 'name location')
      .sort({ startTime: 1 })
      .limit(10);

    return bookings.map(booking => {
      const timeUntilStart = this.calculateTimeUntil(now, booking.startTime);
      const canCheckIn = this.canCheckIn(booking, now);

      return {
        id: booking._id.toString(),
        code: booking.bookingCode,
        customerName: booking.customerDetails.name,
        spaceName: booking.spaceName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        canCheckIn,
        timeUntilStart,
        specialRequests: booking.specialRequests
      };
    });
  }

  private async getActiveBookings(baseQuery: any): Promise<any[]> {
    const bookings = await this.bookingModel
      .find({
        ...baseQuery,
        status: 'checked-in'
      })
      .populate('spaceId', 'name location')
      .sort({ checkInTime: 1 });

    return bookings.map(booking => {
      const now = new Date();
      const bookingEndDateTime = this.combineDateTime(booking.bookingDate, booking.endTime);
      const overtimeMinutes = Math.max(0, Math.floor((now.getTime() - bookingEndDateTime.getTime()) / (1000 * 60)));
      const canCheckOut = now <= bookingEndDateTime || overtimeMinutes < 30; // 30 min grace

      return {
        id: booking._id.toString(),
        code: booking.bookingCode,
        customerName: booking.customerDetails.name,
        spaceName: booking.space?.name || 'Unknown Space',
        checkInTime: booking.checkedInAt,
        expectedEndTime: booking.endTime,
        canCheckOut,
        overtimeMinutes
      };
    });
  }

  private async getActiveIssues(staffSpaces?: string[]): Promise<any[]> {
    const query: any = {
      status: { $in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] }
    };

    if (staffSpaces?.length) {
      query.spaceId = { $in: staffSpaces.map(id => new Types.ObjectId(id)) };
    }

    const issues = await this.issueModel
      .find(query)
      .populate('spaceId', 'name location')
      .sort({ severity: -1, createdAt: 1 })
      .limit(10);

    return issues.map(issue => ({
      id: issue._id.toString(),
      ticketNumber: issue.ticketNumber,
      type: issue.type,
      severity: issue.severity,
      spaceName: (issue.spaceId as any).name,
      description: issue.description,
      createdAt: issue.createdAt,
      ageInHours: (issue as any).ageInHours || 0
    }));
  }

  private async getSpaceStatus(staffSpaces?: string[]): Promise<any> {
    // This is a simplified implementation
    // In reality, you'd calculate this based on actual space assignments and issue tracking
    
    const totalSpaces = staffSpaces?.length || 10;
    const spacesWithIssues = 2; // This would be calculated from actual issues
    
    return {
      spacesOperational: totalSpaces - spacesWithIssues,
      spacesWithIssues,
      totalCapacity: totalSpaces * 12, // Average capacity
      currentOccupancy: 45, // This would be calculated from active bookings
      utilizationRate: 37.5
    };
  }

  private async getDailyStats(startOfDay: Date, endOfDay: Date, staffSpaces?: string[]): Promise<any> {
    const query: any = {
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    };

    if (staffSpaces?.length) {
      query.spaceId = { $in: staffSpaces.map(id => new Types.ObjectId(id)) };
    }

    const activities = await this.staffActivityModel.find(query);

    const stats = {
      totalCheckIns: 0,
      totalCheckOuts: 0,
      totalNoShows: 0,
      averageProcessingTime: 0,
      issuesReported: 0,
      issuesResolved: 0
    };

    let processingTimes: number[] = [];

    activities.forEach(activity => {
      switch (activity.action) {
        case StaffActionType.CHECK_IN:
          stats.totalCheckIns++;
          if (activity.details.processingTimeMs) {
            processingTimes.push(activity.details.processingTimeMs);
          }
          break;
        case StaffActionType.CHECK_OUT:
          stats.totalCheckOuts++;
          if (activity.details.processingTimeMs) {
            processingTimes.push(activity.details.processingTimeMs);
          }
          break;
        case StaffActionType.MARK_NO_SHOW:
          stats.totalNoShows++;
          break;
        case StaffActionType.REPORT_ISSUE:
          stats.issuesReported++;
          break;
        case StaffActionType.RESOLVE_ISSUE:
          stats.issuesResolved++;
          break;
      }
    });

    if (processingTimes.length > 0) {
      stats.averageProcessingTime = Math.round(
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length / 1000
      );
    }

    return stats;
  }

  private async getHourlyActivity(startOfDay: Date, endOfDay: Date, staffSpaces?: string[]): Promise<any[]> {
    const query: any = {
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    };

    if (staffSpaces?.length) {
      query.spaceId = { $in: staffSpaces.map(id => new Types.ObjectId(id)) };
    }

    const activities = await this.staffActivityModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.hour': 1 } }
    ]);

    // Build hourly breakdown
    const hourlyData: { [hour: number]: any } = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = {
        time: `${hour.toString().padStart(2, '0')}:00`,
        checkIns: 0,
        checkOuts: 0,
        noShows: 0
      };
    }

    activities.forEach((item: any) => {
      const hour = item._id.hour;
      const action = item._id.action;
      const count = item.count;

      if (hourlyData[hour]) {
        switch (action) {
          case StaffActionType.CHECK_IN:
            hourlyData[hour].checkIns = count;
            break;
          case StaffActionType.CHECK_OUT:
            hourlyData[hour].checkOuts = count;
            break;
          case StaffActionType.MARK_NO_SHOW:
            hourlyData[hour].noShows = count;
            break;
        }
      }
    });

    return Object.values(hourlyData).filter((data: any) => 
      data.checkIns > 0 || data.checkOuts > 0 || data.noShows > 0
    );
  }

  private async getStaffMetrics(staffId: string, startDate: Date, endDate: Date): Promise<any> {
    const metrics = await this.staffActivityModel.getStaffMetrics(
      new Types.ObjectId(staffId),
      startDate,
      endDate
    );

    return {
      totalActivities: metrics.totalActivities,
      checkIns: metrics.checkIns,
      checkOuts: metrics.checkOuts,
      noShows: metrics.noShows,
      issuesReported: metrics.issuesReported,
      issuesResolved: metrics.issuesResolved,
      averageProcessingTime: Math.round(metrics.averageProcessingTime / 1000), // Convert to seconds
      customerSatisfactionScore: 4.2 // This would come from customer feedback
    };
  }

  private async getHourlyPerformance(staffId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const activities = await this.staffActivityModel.find({
      staffId: new Types.ObjectId(staffId),
      timestamp: { $gte: startDate, $lte: endDate }
    });

    const hourlyStats: { [hour: number]: { count: number; totalTime: number } } = {};

    activities.forEach(activity => {
      const hour = activity.timestamp.getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { count: 0, totalTime: 0 };
      }
      hourlyStats[hour].count++;
      if (activity.details.processingTimeMs) {
        hourlyStats[hour].totalTime += activity.details.processingTimeMs;
      }
    });

    return Object.entries(hourlyStats).map(([hour, stats]) => ({
      hour: parseInt(hour),
      activities: stats.count,
      averageProcessingTime: stats.count > 0 ? Math.round(stats.totalTime / stats.count / 1000) : 0
    }));
  }

  private async getOperationalInsights(staffId: string, startDate: Date, endDate: Date, spaceId?: string): Promise<any> {
    // This would involve complex queries across multiple collections
    // For now, returning mock data structure
    
    return {
      totalBookings: 100,
      successfulCheckIns: 95,
      noShowRate: 5,
      averageBookingDuration: 90,
      peakHours: ['10:00-11:00', '14:00-15:00'],
      mostCommonIssues: ['equipment-failure', 'cleanliness']
    };
  }

  private canCheckIn(booking: BookingDocument, now: Date): boolean {
    const bookingStartDateTime = this.combineDateTime(booking.bookingDate, booking.startTime);
    const checkInWindowStart = new Date(bookingStartDateTime.getTime() - 15 * 60 * 1000); // 15 min before
    const gracePeriodEnd = new Date(bookingStartDateTime.getTime() + 30 * 60 * 1000); // 30 min after
    
    return (
      now >= checkInWindowStart &&
      now <= gracePeriodEnd &&
      booking.status === 'confirmed'
    );
  }

  private calculateTimeUntil(from: Date, to: Date): string {
    const diffMs = to.getTime() - from.getTime();
    
    if (diffMs <= 0) {
      return 'Passed';
    }
    
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    
    if (remainingMinutes === 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
    
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
  }

  private combineDateTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }
}