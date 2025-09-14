import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../../bookings/schemas/booking.schema';
import { StaffActivity, StaffActivityDocument, StaffActionType } from '../schemas/staff-activity.schema';
import { 
  VerifyBookingDto, 
  VerificationMethod,
  BookingDetailsResponseDto,
  QRCodeDataDto,
  QRCodeResponseDto 
} from '../dto/booking-verification.dto';

export interface BookingVerificationResult {
  success: boolean;
  message: string;
  booking: any;
  checkInInfo: any;
  activityHistory?: any;
}

@Injectable()
export class BookingVerificationService {
  private readonly logger = new Logger(BookingVerificationService.name);
  private readonly checkInWindowMinutes = 15;
  private readonly gracePeriodMinutes = 30;

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(StaffActivity.name) private staffActivityModel: Model<StaffActivityDocument>
  ) {}

  /**
   * Verify booking by various methods
   */
  async verifyBooking(
    verifyDto: VerifyBookingDto,
    staffId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<BookingDetailsResponseDto> {
    try {
      let booking: BookingDocument | null = null;

      // Find booking based on verification method
      switch (verifyDto.method) {
        case VerificationMethod.BOOKING_CODE:
          booking = await this.findByBookingCode(verifyDto.identifier);
          break;
        case VerificationMethod.QR_CODE:
          booking = await this.findByQRCode(verifyDto.identifier);
          break;
        case VerificationMethod.PHONE_NUMBER:
          booking = await this.findByPhoneNumber(verifyDto.identifier, verifyDto.expectedDate);
          break;
        case VerificationMethod.EMAIL:
          booking = await this.findByEmail(verifyDto.identifier, verifyDto.expectedDate);
          break;
        default:
          throw new BadRequestException('Invalid verification method');
      }

      if (!booking) {
        throw new NotFoundException('Booking not found with provided identifier');
      }

      // Log verification activity
      await this.logVerificationActivity(booking, staffId, verifyDto.method, ipAddress, userAgent);

      // Get check-in information
      const checkInInfo = this.getCheckInInformation(booking);

      // Get activity history
      const activityHistory = await this.getBookingActivityHistory(booking._id);

      // Build response
      const response: BookingDetailsResponseDto = {
        success: true,
        message: 'Booking verified successfully',
        booking: {
          id: booking._id.toString(),
          code: booking.code,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          spaceName: booking.spaceName,
          spaceLocation: booking.spaceLocation,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: this.formatDuration(booking.duration),
          totalAmount: booking.totalAmount,
          amountPaid: booking.amountPaid || booking.totalAmount,
          status: booking.status,
          specialRequests: booking.specialRequests,
          createdAt: booking.createdAt
        },
        checkInInfo,
        activityHistory
      };

      this.logger.log(`Booking verification successful: ${booking.code} by staff ${staffId}`);
      return response;

    } catch (error) {
      this.logger.error(`Booking verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get booking details by booking code
   */
  async getBookingDetails(
    bookingCode: string,
    staffId: string
  ): Promise<BookingDetailsResponseDto> {
    const booking = await this.findByBookingCode(bookingCode);
    
    if (!booking) {
      throw new NotFoundException(`Booking with code ${bookingCode} not found`);
    }

    const checkInInfo = this.getCheckInInformation(booking);
    const activityHistory = await this.getBookingActivityHistory(booking._id);

    return {
      success: true,
      message: 'Booking details retrieved successfully',
      booking: {
        id: booking._id.toString(),
        code: booking.code,
        customerName: booking.customerDetails.name,
        customerEmail: booking.customerDetails.email,
        customerPhone: booking.customerDetails.phone,
        spaceName: booking.space?.name || 'Unknown Space',
        spaceLocation: booking.space?.location?.city || 'Unknown Location',
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: this.formatDuration(booking.duration),
        totalAmount: booking.pricing.totalAmount,
        amountPaid: booking.pricing.totalAmount, // Assuming full payment for now
        status: booking.status,
        specialRequests: booking.customerDetails.specialRequests,
        createdAt: booking.createdAt
      },
      checkInInfo,
      activityHistory
    };
  }

  /**
   * Decode and validate QR code
   */
  async decodeQRCode(qrCodeDto: QRCodeDataDto): Promise<QRCodeResponseDto> {
    try {
      // Decode base64 QR data
      const decodedData = Buffer.from(qrCodeDto.qrData, 'base64').toString('utf-8');
      const qrCodeInfo = JSON.parse(decodedData);

      // Validate QR code structure
      if (!qrCodeInfo.bookingCode || !qrCodeInfo.spaceId) {
        throw new BadRequestException('Invalid QR code format');
      }

      // Check QR code expiration
      const isValid = this.validateQRCodeExpiration(qrCodeInfo);
      let validationMessage: string | undefined;

      if (!isValid) {
        if (qrCodeInfo.expiresAt && new Date() > new Date(qrCodeInfo.expiresAt)) {
          validationMessage = 'QR code has expired';
        } else {
          validationMessage = 'QR code is invalid';
        }
      }

      return {
        success: true,
        message: 'QR code decoded successfully',
        qrCodeInfo: {
          bookingCode: qrCodeInfo.bookingCode,
          spaceId: qrCodeInfo.spaceId,
          generatedAt: new Date(qrCodeInfo.generatedAt || Date.now()),
          expiresAt: new Date(qrCodeInfo.expiresAt || Date.now() + 24 * 60 * 60 * 1000)
        },
        isValid,
        validationMessage
      };

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid QR code data format');
      }
      throw error;
    }
  }

  /**
   * Find bookings for customer verification
   */
  async findBookingsForCustomer(
    customerIdentifier: string,
    method: VerificationMethod,
    date?: string
  ): Promise<BookingDocument[]> {
    let query: any = {};
    
    // Build query based on method
    switch (method) {
      case VerificationMethod.EMAIL:
        query.customerEmail = { $regex: new RegExp(customerIdentifier, 'i') };
        break;
      case VerificationMethod.PHONE_NUMBER:
        query.customerPhone = customerIdentifier;
        break;
      default:
        throw new BadRequestException('Invalid search method for customer lookup');
    }

    // Add date filter if provided
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.startTime = {
        $gte: targetDate,
        $lt: nextDate
      };
    } else {
      // Default to today if no date specified
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.startTime = {
        $gte: today,
        $lt: tomorrow
      };
    }

    return this.bookingModel
      .find(query)
      .populate('spaceId', 'name location')
      .sort({ startTime: 1 })
      .limit(10); // Limit results for security
  }

  // Private helper methods

  private async findByBookingCode(bookingCode: string): Promise<BookingDocument | null> {
    return this.bookingModel
      .findOne({ 
        code: { $regex: new RegExp(`^${bookingCode}$`, 'i') }
      })
      .populate('spaceId', 'name location')
      .populate('customerId', 'name email phone');
  }

  private async findByQRCode(qrData: string): Promise<BookingDocument | null> {
    try {
      // Decode QR code first
      const decodedData = Buffer.from(qrData, 'base64').toString('utf-8');
      const qrCodeInfo = JSON.parse(decodedData);
      
      if (!qrCodeInfo.bookingCode) {
        return null;
      }

      // Find booking by code from QR
      return this.findByBookingCode(qrCodeInfo.bookingCode);
    } catch (error) {
      this.logger.warn(`Failed to decode QR code: ${error.message}`);
      return null;
    }
  }

  private async findByPhoneNumber(phoneNumber: string, expectedDate?: string): Promise<BookingDocument | null> {
    const query: any = { customerPhone: phoneNumber };
    
    if (expectedDate) {
      const date = new Date(expectedDate);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.startTime = {
        $gte: date,
        $lt: nextDate
      };
    }

    return this.bookingModel
      .findOne(query)
      .populate('spaceId', 'name location')
      .sort({ startTime: -1 }); // Get most recent booking
  }

  private async findByEmail(email: string, expectedDate?: string): Promise<BookingDocument | null> {
    const query: any = { 
      customerEmail: { $regex: new RegExp(`^${email}$`, 'i') }
    };
    
    if (expectedDate) {
      const date = new Date(expectedDate);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.startTime = {
        $gte: date,
        $lt: nextDate
      };
    }

    return this.bookingModel
      .findOne(query)
      .populate('spaceId', 'name location')
      .sort({ startTime: -1 }); // Get most recent booking
  }

  private getCheckInInformation(booking: BookingDocument): any {
    const now = new Date();
    const startTime = booking.startTime;
    const endTime = booking.endTime;
    
    // Calculate time until start/end
    const bookingStartDateTime = this.combineDateTime(booking.bookingDate, startTime);
    const bookingEndDateTime = this.combineDateTime(booking.bookingDate, endTime);
    const timeUntilStart = this.calculateTimeUntil(now, bookingStartDateTime);
    const timeUntilEnd = this.calculateTimeUntil(now, bookingEndDateTime);
    
    // Check-in window calculation
    const checkInWindowStart = new Date(bookingStartDateTime.getTime() - this.checkInWindowMinutes * 60 * 1000);
    const gracePeriodEnd = new Date(bookingStartDateTime.getTime() + this.gracePeriodMinutes * 60 * 1000);
    
    const isWithinCheckInWindow = now >= checkInWindowStart && now <= gracePeriodEnd;
    const isExpired = now > bookingEndDateTime;
    
    // Determine what actions are available
    const canCheckIn = (
      isWithinCheckInWindow && 
      booking.status === 'confirmed' && 
      !isExpired
    );
    
    const canCheckOut = (
      booking.status === 'checked-in' && 
      now <= bookingEndDateTime
    );
    
    // Calculate grace period remaining
    let gracePeriodRemaining: string | undefined;
    if (now > bookingStartDateTime && now < gracePeriodEnd && booking.status === 'confirmed') {
      const remaining = gracePeriodEnd.getTime() - now.getTime();
      gracePeriodRemaining = this.formatDuration(Math.ceil(remaining / (1000 * 60)));
    }

    return {
      canCheckIn,
      canCheckOut,
      isWithinCheckInWindow,
      isExpired,
      timeUntilStart,
      timeUntilEnd,
      gracePeriodRemaining
    };
  }

  private async getBookingActivityHistory(bookingId: Types.ObjectId): Promise<any> {
    const activities = await this.staffActivityModel
      .find({ bookingId })
      .populate('staffId', 'name email')
      .sort({ timestamp: 1 })
      .limit(10);

    const history: any = {};

    activities.forEach(activity => {
      switch (activity.action) {
        case StaffActionType.CHECK_IN:
          history.previousCheckIn = activity.details.checkInTime;
          history.checkInStaff = activity.staff?.name;
          history.checkInNotes = activity.details.notes;
          break;
        case StaffActionType.CHECK_OUT:
          history.previousCheckOut = activity.details.checkOutTime;
          history.checkOutStaff = activity.staff?.name;
          history.checkOutNotes = activity.details.notes;
          break;
      }
    });

    return Object.keys(history).length > 0 ? history : undefined;
  }

  private async logVerificationActivity(
    booking: BookingDocument,
    staffId: string,
    method: VerificationMethod,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const activity = new this.staffActivityModel({
        staffId: new Types.ObjectId(staffId),
        bookingId: booking._id,
        spaceId: booking.spaceId,
        action: StaffActionType.VERIFY_BOOKING,
        details: {
          bookingCode: booking.code,
          customerName: booking.customerName,
          verificationMethod: method,
          notes: `Booking verified via ${method}`
        },
        ipAddress,
        userAgent,
        timestamp: new Date()
      });

      await activity.save();
    } catch (error) {
      this.logger.warn(`Failed to log verification activity: ${error.message}`);
      // Don't throw error as this is not critical
    }
  }

  private validateQRCodeExpiration(qrCodeInfo: any): boolean {
    if (!qrCodeInfo.expiresAt) {
      // If no expiration set, consider it valid for 24 hours from generation
      const generatedAt = new Date(qrCodeInfo.generatedAt || Date.now());
      const expirationTime = new Date(generatedAt.getTime() + 24 * 60 * 60 * 1000);
      return new Date() <= expirationTime;
    }

    return new Date() <= new Date(qrCodeInfo.expiresAt);
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

  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}:00`;
    }
    
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
  }
}