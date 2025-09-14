import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../../bookings/schemas/booking.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Space, SpaceDocument } from '../../spaces/schemas/space.schema';
import { StaffActivity, StaffActivityDocument, StaffActionType } from '../schemas/staff-activity.schema';
import { CheckInDto, CheckOutDto, CheckInResponseDto } from '../dto/staff.dto';

@Injectable()
export class CheckInService {
  private readonly logger = new Logger(CheckInService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>,
    @InjectModel(StaffActivity.name) private staffActivityModel: Model<StaffActivityDocument>,
  ) {}

  /**
   * Get today's bookings for check-in
   */
  async getTodaysBookings(staffId: string, spaceId?: string, status?: string) {
    try {
      const staff = await this.userModel.findById(staffId).select('assignedSpaces');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      let query: any = {
        startTime: { $gte: todayStart, $lt: todayEnd },
        status: { $in: ['confirmed', 'checked-in', 'no-show'] }
      };

      // Filter by space if specified
      if (spaceId) {
        query.spaceId = new Types.ObjectId(spaceId);
      } else if (staff.assignedSpaces && staff.assignedSpaces.length > 0) {
        // Filter by assigned spaces if no specific space requested
        query.spaceId = { $in: staff.assignedSpaces };
      }

      // Filter by status if specified
      if (status) {
        query.status = status;
      }

      const bookings = await this.bookingModel
        .find(query)
        .populate('userId', 'name email phone')
        .populate('spaceId', 'name address capacity')
        .sort({ startTime: 1 })
        .select('userId spaceId startTime endTime guestCount checkInCode status checkInTime checkOutTime');

      // Group bookings by status for easier management
      const groupedBookings = {
        pending: bookings.filter(b => b.status === 'confirmed'),
        checkedIn: bookings.filter(b => b.status === 'checked-in'),
        noShow: bookings.filter(b => b.status === 'no-show'),
        completed: bookings.filter(b => b.status === 'completed')
      };

      return {
        bookings,
        groupedBookings,
        summary: {
          total: bookings.length,
          pending: groupedBookings.pending.length,
          checkedIn: groupedBookings.checkedIn.length,
          noShow: groupedBookings.noShow.length,
          completed: groupedBookings.completed.length
        },
        date: todayStart
      };
    } catch (error) {
      this.logger.error(`Error getting today's bookings:`, error);
      throw error;
    }
  }

  /**
   * Check-in a guest
   */
  async checkInGuest(bookingId: string, staffId: string, checkInDto: CheckInDto): Promise<CheckInResponseDto> {
    try {
      const booking = await this.bookingModel
        .findById(bookingId)
        .populate('userId', 'name email phone')
        .populate('spaceId', 'name address');

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Verify staff has access to this space
      const staff = await this.userModel.findById(staffId).select('assignedSpaces name');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      if (staff.assignedSpaces && staff.assignedSpaces.length > 0) {
        const hasAccess = staff.assignedSpaces.some(id => id.toString() === booking.spaceId._id.toString());
        if (!hasAccess) {
          throw new ForbiddenException('Access denied to this space');
        }
      }

      // Check if booking can be checked in
      if (booking.status !== 'confirmed') {
        throw new BadRequestException(`Booking cannot be checked in. Current status: ${booking.status}`);
      }

      const now = new Date();
      const bookingStartTime = new Date(booking.startTime);
      const bookingEndTime = new Date(booking.endTime);

      // Check if it's within booking time window (allow 15 minutes early)
      const earlyCheckInTime = new Date(bookingStartTime.getTime() - 15 * 60 * 1000);
      if (now < earlyCheckInTime) {
        throw new BadRequestException('Too early to check in. Check-in allowed 15 minutes before booking time.');
      }

      if (now > bookingEndTime) {
        throw new BadRequestException('Booking time has ended. Cannot check in.');
      }

      // Update booking status
      booking.status = 'checked-in';
      booking.checkInTime = now;
      booking.checkInStaffId = new Types.ObjectId(staffId);
      
      if (checkInDto.guestCount) {
        booking.actualGuestCount = checkInDto.guestCount;
      }

      await booking.save();

      // Log staff activity
      await this.logStaffActivity(
        staffId,
        bookingId,
        StaffActionType.CHECK_IN,
        `Checked in guest for booking ${bookingId}`,
        checkInDto.notes
      );

      this.logger.log(`Guest checked in successfully: Booking ${bookingId} by Staff ${staffId}`);

      return {
        bookingId: booking._id.toString(),
        status: 'checked-in',
        checkInTime: now,
        staffMember: {
          id: staff._id.toString(),
          name: staff.name
        },
        message: 'Guest checked in successfully'
      };
    } catch (error) {
      this.logger.error(`Error checking in guest:`, error);
      throw error;
    }
  }

  /**
   * Check-out a guest
   */
  async checkOutGuest(bookingId: string, staffId: string, checkOutDto: CheckOutDto): Promise<CheckInResponseDto> {
    try {
      const booking = await this.bookingModel
        .findById(bookingId)
        .populate('userId', 'name email phone')
        .populate('spaceId', 'name address');

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Verify staff has access to this space
      const staff = await this.userModel.findById(staffId).select('assignedSpaces name');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      if (staff.assignedSpaces && staff.assignedSpaces.length > 0) {
        const hasAccess = staff.assignedSpaces.some(id => id.toString() === booking.spaceId._id.toString());
        if (!hasAccess) {
          throw new ForbiddenException('Access denied to this space');
        }
      }

      // Check if booking can be checked out
      if (booking.status !== 'checked-in') {
        throw new BadRequestException(`Booking cannot be checked out. Current status: ${booking.status}`);
      }

      const now = new Date();
      const bookingEndTime = new Date(booking.endTime);

      // Update booking status
      booking.status = 'completed';
      booking.checkOutTime = now;
      booking.checkOutStaffId = new Types.ObjectId(staffId);

      // Calculate actual duration and any overtime charges
      const actualDuration = (now.getTime() - booking.checkInTime.getTime()) / (1000 * 60 * 60); // hours
      booking.actualDuration = actualDuration;

      // Check for overtime (if checked out after booking end time)
      if (now > bookingEndTime) {
        const overtimeHours = (now.getTime() - bookingEndTime.getTime()) / (1000 * 60 * 60);
        booking.overtimeHours = overtimeHours;
        // TODO: Calculate overtime charges based on space pricing
      }

      await booking.save();

      // Log staff activity
      await this.logStaffActivity(
        staffId,
        bookingId,
        StaffActionType.CHECK_OUT,
        `Checked out guest for booking ${bookingId}`,
        checkOutDto.notes || checkOutDto.feedback
      );

      this.logger.log(`Guest checked out successfully: Booking ${bookingId} by Staff ${staffId}`);

      return {
        bookingId: booking._id.toString(),
        status: 'completed',
        checkInTime: booking.checkInTime,
        staffMember: {
          id: staff._id.toString(),
          name: staff.name
        },
        message: 'Guest checked out successfully'
      };
    } catch (error) {
      this.logger.error(`Error checking out guest:`, error);
      throw error;
    }
  }

  /**
   * Mark booking as no-show
   */
  async markNoShow(bookingId: string, staffId: string, notes?: string) {
    try {
      const booking = await this.bookingModel
        .findById(bookingId)
        .populate('userId', 'name email phone')
        .populate('spaceId', 'name address');

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Verify staff has access to this space
      const staff = await this.userModel.findById(staffId).select('assignedSpaces name');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      if (staff.assignedSpaces && staff.assignedSpaces.length > 0) {
        const hasAccess = staff.assignedSpaces.some(id => id.toString() === booking.spaceId._id.toString());
        if (!hasAccess) {
          throw new ForbiddenException('Access denied to this space');
        }
      }

      // Check if booking can be marked as no-show
      if (booking.status !== 'confirmed') {
        throw new BadRequestException(`Booking cannot be marked as no-show. Current status: ${booking.status}`);
      }

      const now = new Date();
      const bookingStartTime = new Date(booking.startTime);

      // Only allow marking as no-show after booking start time
      if (now < bookingStartTime) {
        throw new BadRequestException('Cannot mark as no-show before booking start time.');
      }

      // Update booking status
      booking.status = 'no-show';
      booking.noShowTime = now;
      booking.noShowStaffId = new Types.ObjectId(staffId);

      await booking.save();

      // Log staff activity
      await this.logStaffActivity(
        staffId,
        bookingId,
        StaffActionType.NO_SHOW,
        `Marked booking as no-show: ${bookingId}`,
        notes
      );

      this.logger.log(`Booking marked as no-show: ${bookingId} by Staff ${staffId}`);

      return {
        success: true,
        message: 'Booking marked as no-show successfully',
        bookingId: booking._id.toString(),
        noShowTime: now
      };
    } catch (error) {
      this.logger.error(`Error marking booking as no-show:`, error);
      throw error;
    }
  }

  /**
   * Verify check-in code
   */
  async verifyCheckInCode(code: string, staffId: string) {
    try {
      const booking = await this.bookingModel
        .findOne({ checkInCode: code })
        .populate('userId', 'name email phone')
        .populate('spaceId', 'name address');

      if (!booking) {
        throw new NotFoundException('Invalid check-in code');
      }

      // Verify staff has access to this space
      const staff = await this.userModel.findById(staffId).select('assignedSpaces name');
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      if (staff.assignedSpaces && staff.assignedSpaces.length > 0) {
        const hasAccess = staff.assignedSpaces.some(id => id.toString() === booking.spaceId._id.toString());
        if (!hasAccess) {
          throw new ForbiddenException('Access denied to this space');
        }
      }

      const now = new Date();
      const bookingStartTime = new Date(booking.startTime);
      const bookingEndTime = new Date(booking.endTime);

      // Check if booking is valid for check-in
      const earlyCheckInTime = new Date(bookingStartTime.getTime() - 15 * 60 * 1000);
      const canCheckIn = now >= earlyCheckInTime && now <= bookingEndTime && booking.status === 'confirmed';

      return {
        valid: true,
        booking: {
          id: booking._id.toString(),
          guestName: booking.userId.name,
          guestEmail: booking.userId.email,
          spaceName: booking.spaceId.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          guestCount: booking.guestCount,
          status: booking.status
        },
        canCheckIn,
        message: canCheckIn ? 'Ready for check-in' : 'Cannot check in at this time'
      };
    } catch (error) {
      this.logger.error(`Error verifying check-in code:`, error);
      throw error;
    }
  }

  /**
   * Log staff activity
   */
  private async logStaffActivity(
    staffId: string,
    bookingId: string,
    action: StaffActionType,
    description: string,
    notes?: string
  ) {
    try {
      const activity = new this.staffActivityModel({
        staffId: new Types.ObjectId(staffId),
        bookingId: new Types.ObjectId(bookingId),
        action,
        description,
        notes,
        timestamp: new Date()
      });

      await activity.save();
    } catch (error) {
      this.logger.error(`Error logging staff activity:`, error);
      // Don't throw error here as it's not critical for the main operation
    }
  }
}