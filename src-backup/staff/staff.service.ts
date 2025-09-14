import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Space, SpaceDocument } from '../spaces/schemas/space.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Issue, IssueDocument, IssueStatus, IssueSeverity } from './schemas/issue.schema';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Issue.name) private issueModel: Model<IssueDocument>,
  ) {}

  /**
   * Get spaces assigned to a staff member
   */
  async getAssignedSpaces(staffId: string) {
    try {
      const staff = await this.userModel.findById(staffId).select('assignedSpaces');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      // If no specific spaces assigned, return all active spaces
      if (!staff.assignedSpaces || staff.assignedSpaces.length === 0) {
        const allSpaces = await this.spaceModel
          .find({ status: 'active' })
          .select('name address capacity amenities images')
          .limit(50);
        
        return {
          spaces: allSpaces,
          totalCount: allSpaces.length,
          assignedCount: 0
        };
      }

      const assignedSpaces = await this.spaceModel
        .find({ 
          _id: { $in: staff.assignedSpaces },
          status: 'active' 
        })
        .select('name address capacity amenities images');

      return {
        spaces: assignedSpaces,
        totalCount: assignedSpaces.length,
        assignedCount: assignedSpaces.length
      };
    } catch (error) {
      this.logger.error(`Error getting assigned spaces for staff ${staffId}:`, error);
      throw error;
    }
  }

  /**
   * Get current space occupancy
   */
  async getSpaceOccupancy(spaceId: string, staffId: string) {
    try {
      // Verify staff has access to this space
      const staff = await this.userModel.findById(staffId).select('assignedSpaces');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      // Check if staff has access to this space
      if (staff.assignedSpaces && staff.assignedSpaces.length > 0) {
        const hasAccess = staff.assignedSpaces.some(id => id.toString() === spaceId);
        if (!hasAccess) {
          throw new ForbiddenException('Access denied to this space');
        }
      }

      const space = await this.spaceModel.findById(spaceId);
      if (!space) {
        throw new NotFoundException('Space not found');
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // Get current active bookings
      const activeBookings = await this.bookingModel
        .find({
          spaceId: new Types.ObjectId(spaceId),
          startTime: { $lte: now },
          endTime: { $gte: now },
          bookingStatus: { $in: ['confirmed', 'checked-in'] }
        })
        .populate('userId', 'name email phone')
        .select('userId startTime endTime guestCount checkInTime bookingStatus');

      // Get today's total bookings
      const todaysBookings = await this.bookingModel
        .find({
          spaceId: new Types.ObjectId(spaceId),
          startTime: { $gte: todayStart, $lt: todayEnd }
        })
        .select('bookingStatus checkInTime checkOutTime');

      const stats = {
        currentOccupancy: activeBookings.length,
        maxCapacity: space.capacity,
        occupancyPercentage: space.capacity > 0 ? (activeBookings.length / space.capacity) * 100 : 0,
        todaysTotalBookings: todaysBookings.length,
        todaysCheckedIn: todaysBookings.filter(b => b.status === 'checked-in').length,
        todaysCompleted: todaysBookings.filter(b => b.status === 'completed').length,
        todaysNoShows: todaysBookings.filter(b => b.status === 'no-show').length
      };

      return {
        space: {
          id: space._id,
          name: space.name,
          capacity: space.capacity
        },
        currentBookings: activeBookings,
        statistics: stats,
        lastUpdated: now
      };
    } catch (error) {
      this.logger.error(`Error getting space occupancy for space ${spaceId}:`, error);
      throw error;
    }
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(staffId: string, message: string, priority: string) {
    try {
      const staff = await this.userModel.findById(staffId).select('name email');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      // Create emergency issue
      const emergencyIssue = new this.issueModel({
        reportedBy: new Types.ObjectId(staffId),
        type: 'emergency',
        priority: priority,
        title: `Emergency Alert - ${priority.toUpperCase()}`,
        description: message,
        status: 'open',
        isEmergency: true,
        reportedAt: new Date()
      });

      await emergencyIssue.save();

      // Log the emergency alert
      this.logger.warn(`EMERGENCY ALERT: ${priority.toUpperCase()} - ${message}`, {
        staffId,
        staffName: staff.name,
        timestamp: new Date()
      });

      // TODO: Send notifications to management, security, etc.
      // This could include:
      // - Email alerts to management
      // - SMS notifications
      // - Push notifications to mobile apps
      // - Integration with security systems

      return {
        success: true,
        message: 'Emergency alert sent successfully',
        issueId: emergencyIssue._id,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Error sending emergency alert:`, error);
      throw error;
    }
  }

  /**
   * Get maintenance requests
   */
  async getMaintenanceRequests(staffId: string) {
    try {
      const staff = await this.userModel.findById(staffId).select('assignedSpaces');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      let query: any = { type: 'maintenance' };
      
      // If staff has assigned spaces, filter by those spaces
      if (staff.assignedSpaces && staff.assignedSpaces.length > 0) {
        query.spaceId = { $in: staff.assignedSpaces };
      }

      const maintenanceRequests = await this.issueModel
        .find(query)
        .populate('spaceId', 'name address')
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(50);

      const stats = {
        total: maintenanceRequests.length,
        open: maintenanceRequests.filter(r => r.status === IssueStatus.OPEN).length,
        inProgress: maintenanceRequests.filter(r => r.status === IssueStatus.IN_PROGRESS).length,
        resolved: maintenanceRequests.filter(r => r.status === IssueStatus.RESOLVED).length,
        critical: maintenanceRequests.filter(r => r.severity === IssueSeverity.CRITICAL).length
      };

      return {
        requests: maintenanceRequests,
        statistics: stats
      };
    } catch (error) {
      this.logger.error(`Error getting maintenance requests:`, error);
      throw error;
    }
  }

  /**
   * Update staff assigned spaces
   */
  async updateAssignedSpaces(staffId: string, spaceIds: string[]) {
    try {
      const staff = await this.userModel.findById(staffId);
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      // Validate space IDs
      const validSpaces = await this.spaceModel.find({
        _id: { $in: spaceIds }
      }).select('_id');

      const validSpaceIds = validSpaces.map(space => space._id.toString());

      staff.assignedSpaces = validSpaceIds;
      await staff.save();

      return {
        success: true,
        message: 'Assigned spaces updated successfully',
        assignedSpaces: validSpaceIds
      };
    } catch (error) {
      this.logger.error(`Error updating assigned spaces:`, error);
      throw error;
    }
  }

  /**
   * Get staff performance metrics
   */
  async getStaffPerformance(staffId: string, startDate?: Date, endDate?: Date) {
    try {
      const staff = await this.userModel.findById(staffId);
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;

      // Get check-in/check-out activities
      const activities = await this.bookingModel.aggregate([
        {
          $match: {
            $or: [
              { checkInStaffId: new Types.ObjectId(staffId) },
              { checkOutStaffId: new Types.ObjectId(staffId) }
            ],
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
          }
        },
        {
          $group: {
            _id: null,
            totalCheckIns: {
              $sum: { $cond: [{ $ne: ['$checkInStaffId', null] }, 1, 0] }
            },
            totalCheckOuts: {
              $sum: { $cond: [{ $ne: ['$checkOutStaffId', null] }, 1, 0] }
            },
            totalNoShows: {
              $sum: { $cond: [{ $eq: ['$bookingStatus', 'no-show'] }, 1, 0] }
            }
          }
        }
      ]);

      // Get issues reported by staff
      const issuesReported = await this.issueModel.countDocuments({
        reportedBy: new Types.ObjectId(staffId),
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      });

      const performance = {
        totalCheckIns: activities[0]?.totalCheckIns || 0,
        totalCheckOuts: activities[0]?.totalCheckOuts || 0,
        totalNoShows: activities[0]?.totalNoShows || 0,
        issuesReported,
        efficiency: 0, // Calculate based on check-ins vs no-shows
        period: {
          startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: endDate || new Date()
        }
      };

      // Calculate efficiency (higher is better)
      const totalBookings = performance.totalCheckIns + performance.totalNoShows;
      if (totalBookings > 0) {
        performance.efficiency = ((performance.totalCheckIns / totalBookings) * 100);
      }

      return performance;
    } catch (error) {
      this.logger.error(`Error getting staff performance:`, error);
      throw error;
    }
  }
}