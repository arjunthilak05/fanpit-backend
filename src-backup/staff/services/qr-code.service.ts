import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../../bookings/schemas/booking.schema';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

export interface QRCodeData {
  bookingCode: string;
  spaceId: string;
  customerId: string;
  generatedAt: Date;
  expiresAt: Date;
  signature: string;
}

export interface QRCodeGenerationResult {
  qrCodeUrl: string;
  qrCodeData: string;
  expiresAt: Date;
  bookingCode: string;
}

export interface QRCodeValidationResult {
  isValid: boolean;
  bookingCode?: string;
  spaceId?: string;
  customerId?: string;
  expiresAt?: Date;
  errorMessage?: string;
}

@Injectable()
export class QRCodeService {
  private readonly logger = new Logger(QRCodeService.name);
  private readonly qrSecret: string;
  private readonly qrExpiryHours: number = 24;

  constructor(
    private configService: ConfigService,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>
  ) {
    this.qrSecret = this.configService.get<string>('QR_SECRET') || 'default-qr-secret';
  }

  /**
   * Generate QR code for a booking
   */
  async generateBookingQRCode(bookingId: string): Promise<QRCodeGenerationResult> {
    try {
      // Find booking
      const booking = await this.bookingModel
        .findById(bookingId)
        .populate('spaceId', '_id name')
        .populate('customerId', '_id name');

      if (!booking) {
        throw new BadRequestException('Booking not found');
      }

      if (booking.status === 'cancelled') {
        throw new BadRequestException('Cannot generate QR code for cancelled booking');
      }

      // Generate QR data
      const qrData = this.buildQRData(booking);
      
      // Encode to base64
      const encodedData = Buffer.from(JSON.stringify(qrData)).toString('base64');
      
      // Generate QR code image
      const qrCodeUrl = await QRCode.toDataURL(encodedData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      this.logger.log(`QR code generated for booking ${booking.bookingCode}`);

      return {
        qrCodeUrl,
        qrCodeData: encodedData,
        expiresAt: qrData.expiresAt,
        bookingCode: booking.bookingCode
      };

    } catch (error) {
      this.logger.error(`Failed to generate QR code for booking ${bookingId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate QR code for mobile check-in
   */
  async generateMobileCheckInQR(bookingCode: string): Promise<QRCodeGenerationResult> {
    try {
      const booking = await this.bookingModel
        .findOne({ code: bookingCode })
        .populate('spaceId', '_id name')
        .populate('customerId', '_id name');

      if (!booking) {
        throw new BadRequestException('Booking not found');
      }

      return this.generateBookingQRCode(booking._id.toString());

    } catch (error) {
      this.logger.error(`Failed to generate mobile QR code for booking ${bookingCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate and decode QR code
   */
  async validateQRCode(encodedData: string): Promise<QRCodeValidationResult> {
    try {
      // Decode base64
      const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
      const qrData: QRCodeData = JSON.parse(decodedData);

      // Validate structure
      if (!this.isValidQRStructure(qrData)) {
        return {
          isValid: false,
          errorMessage: 'Invalid QR code structure'
        };
      }

      // Check expiration
      if (new Date() > new Date(qrData.expiresAt)) {
        return {
          isValid: false,
          errorMessage: 'QR code has expired'
        };
      }

      // Verify signature
      if (!this.verifyQRSignature(qrData)) {
        return {
          isValid: false,
          errorMessage: 'Invalid QR code signature'
        };
      }

      // Verify booking still exists and is valid
      const booking = await this.bookingModel
        .findOne({ code: qrData.bookingCode })
        .select('status startTime endTime');

      if (!booking) {
        return {
          isValid: false,
          errorMessage: 'Booking no longer exists'
        };
      }

      if (booking.status === 'cancelled') {
        return {
          isValid: false,
          errorMessage: 'Booking has been cancelled'
        };
      }

      return {
        isValid: true,
        bookingCode: qrData.bookingCode,
        spaceId: qrData.spaceId,
        customerId: qrData.customerId,
        expiresAt: new Date(qrData.expiresAt)
      };

    } catch (error) {
      this.logger.warn(`QR code validation failed: ${error.message}`);
      return {
        isValid: false,
        errorMessage: 'Failed to decode QR code'
      };
    }
  }

  /**
   * Generate batch QR codes for multiple bookings
   */
  async generateBatchQRCodes(bookingIds: string[]): Promise<QRCodeGenerationResult[]> {
    const results = [];
    
    for (const bookingId of bookingIds) {
      try {
        const result = await this.generateBookingQRCode(bookingId);
        results.push(result);
      } catch (error) {
        this.logger.warn(`Failed to generate QR code for booking ${bookingId}: ${error.message}`);
        results.push({
          qrCodeUrl: '',
          qrCodeData: '',
          expiresAt: new Date(),
          bookingCode: '',
          error: error.message
        } as any);
      }
    }

    return results;
  }

  /**
   * Refresh expired QR code
   */
  async refreshQRCode(bookingCode: string): Promise<QRCodeGenerationResult> {
    try {
      const booking = await this.bookingModel
        .findOne({ code: bookingCode })
        .populate('spaceId', '_id name')
        .populate('customerId', '_id name');

      if (!booking) {
        throw new BadRequestException('Booking not found');
      }

      // Check if booking is still valid for QR generation
      const now = new Date();
      const bookingEndDateTime = this.combineDateTime(booking.bookingDate, booking.endTime);
      if (bookingEndDateTime < now) {
        throw new BadRequestException('Cannot refresh QR code for past booking');
      }

      return this.generateBookingQRCode(booking._id.toString());

    } catch (error) {
      this.logger.error(`Failed to refresh QR code for booking ${bookingCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate QR code for space access (without specific booking)
   */
  async generateSpaceAccessQR(spaceId: string, validityHours: number = 2): Promise<string> {
    try {
      const spaceData = {
        spaceId,
        type: 'space-access',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + validityHours * 60 * 60 * 1000),
        signature: this.generateSignature(`space-access-${spaceId}-${Date.now()}`)
      };

      const encodedData = Buffer.from(JSON.stringify(spaceData)).toString('base64');
      
      const qrCodeUrl = await QRCode.toDataURL(encodedData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1
      });

      this.logger.log(`Space access QR code generated for space ${spaceId}`);
      
      return qrCodeUrl;

    } catch (error) {
      this.logger.error(`Failed to generate space access QR code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract booking information from QR code
   */
  async extractBookingFromQR(encodedData: string): Promise<{
    bookingCode: string;
    spaceId: string;
    isValid: boolean;
    booking?: any;
  }> {
    const validationResult = await this.validateQRCode(encodedData);
    
    if (!validationResult.isValid) {
      return {
        bookingCode: '',
        spaceId: '',
        isValid: false
      };
    }

    // Get full booking details
    const booking = await this.bookingModel
      .findOne({ code: validationResult.bookingCode })
      .populate('spaceId', 'name location')
      .populate('customerId', 'name email phone');

    return {
      bookingCode: validationResult.bookingCode!,
      spaceId: validationResult.spaceId!,
      isValid: true,
      booking: booking ? {
        id: booking._id.toString(),
        code: booking.bookingCode,
        customerName: booking.customerDetails.name,
        customerEmail: booking.customerDetails.email,
        spaceName: 'Unknown Space',
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status
      } : null
    };
  }

  // Private helper methods

  private buildQRData(booking: BookingDocument): QRCodeData {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.qrExpiryHours * 60 * 60 * 1000);
    
    const baseData = {
      bookingCode: booking.bookingCode,
      spaceId: booking.spaceId.toString(),
      customerId: booking.customerId.toString(),
      generatedAt: now,
      expiresAt
    };

    const signature = this.generateSignature(JSON.stringify(baseData));

    return {
      ...baseData,
      signature
    };
  }

  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.qrSecret)
      .update(data)
      .digest('hex');
  }

  private verifyQRSignature(qrData: QRCodeData): boolean {
    const { signature, ...dataWithoutSignature } = qrData;
    const expectedSignature = this.generateSignature(JSON.stringify(dataWithoutSignature));
    
    return signature === expectedSignature;
  }

  private isValidQRStructure(qrData: any): qrData is QRCodeData {
    return (
      typeof qrData === 'object' &&
      typeof qrData.bookingCode === 'string' &&
      typeof qrData.spaceId === 'string' &&
      typeof qrData.customerId === 'string' &&
      qrData.generatedAt &&
      qrData.expiresAt &&
      typeof qrData.signature === 'string'
    );
  }

  /**
   * Generate QR code with custom options
   */
  async generateCustomQRCode(
    data: any,
    options: {
      size?: number;
      margin?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
      darkColor?: string;
      lightColor?: string;
    } = {}
  ): Promise<string> {
    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      type: 'image/png' as const,
      quality: 0.92,
      margin: options.margin || 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      },
      width: options.size || 256
    };

    const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');
    return await QRCode.toDataURL(encodedData, qrOptions);
  }

  /**
   * Generate QR code as SVG string
   */
  async generateQRCodeSVG(data: any): Promise<string> {
    const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');
    
    return QRCode.toString(encodedData, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256
    });
  }

  /**
   * Validate QR code and check booking eligibility
   */
  async validateAndCheckEligibility(encodedData: string): Promise<{
    isValid: boolean;
    canCheckIn: boolean;
    canCheckOut: boolean;
    booking?: any;
    message?: string;
  }> {
    const validationResult = await this.validateQRCode(encodedData);
    
    if (!validationResult.isValid) {
      return {
        isValid: false,
        canCheckIn: false,
        canCheckOut: false,
        message: validationResult.errorMessage
      };
    }

    // Get booking with full details
    const booking = await this.bookingModel
      .findOne({ code: validationResult.bookingCode })
      .populate('spaceId', 'name location');

    if (!booking) {
      return {
        isValid: false,
        canCheckIn: false,
        canCheckOut: false,
        message: 'Booking not found'
      };
    }

    // Check eligibility for check-in/check-out
    const now = new Date();
    const bookingStartDateTime = this.combineDateTime(booking.bookingDate, booking.startTime);
    const checkInWindowStart = new Date(bookingStartDateTime.getTime() - 15 * 60 * 1000); // 15 min before
    const gracePeriodEnd = new Date(bookingStartDateTime.getTime() + 30 * 60 * 1000); // 30 min after
    
    const canCheckIn = (
      now >= checkInWindowStart &&
      now <= gracePeriodEnd &&
      booking.status === 'confirmed'
    );

    const canCheckOut = (
      booking.status === 'checked-in' &&
      now <= this.combineDateTime(booking.bookingDate, booking.endTime)
    );

    return {
      isValid: true,
      canCheckIn,
      canCheckOut,
      booking: {
        id: booking._id.toString(),
        code: booking.bookingCode,
        customerName: booking.customerDetails?.name || 'Unknown',
        spaceName: 'Unknown Space',
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status
      },
      message: 'QR code validated successfully'
    };
  }

  private combineDateTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }
}