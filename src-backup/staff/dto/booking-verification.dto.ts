import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  MaxLength, 
  MinLength,
  IsEnum
} from 'class-validator';

export enum VerificationMethod {
  BOOKING_CODE = 'booking-code',
  QR_CODE = 'qr-code',
  PHONE_NUMBER = 'phone-number',
  EMAIL = 'email'
}

export class VerifyBookingDto {
  @ApiProperty({ 
    example: 'BK12345ABC',
    description: 'Booking identifier (code, QR data, phone, or email)' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  identifier: string;

  @ApiProperty({ 
    example: VerificationMethod.BOOKING_CODE,
    description: 'Method used for verification',
    enum: VerificationMethod 
  })
  @IsEnum(VerificationMethod)
  method: VerificationMethod;

  @ApiPropertyOptional({ 
    example: '2024-11-15',
    description: 'Expected booking date (helps with validation)' 
  })
  @IsString()
  @IsOptional()
  expectedDate?: string;
}

export class BookingDetailsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Booking verified successfully' })
  message: string;

  @ApiProperty({ 
    example: {
      id: '507f1f77bcf86cd799439011',
      code: 'BK12345ABC',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      spaceName: 'Conference Room A',
      spaceLocation: 'Floor 2, Building A',
      startTime: '2024-11-15T10:00:00.000Z',
      endTime: '2024-11-15T12:00:00.000Z',
      duration: '2 hours',
      totalAmount: 150,
      amountPaid: 150,
      status: 'confirmed',
      specialRequests: 'Need projector setup',
      createdAt: '2024-11-10T08:00:00.000Z'
    }
  })
  booking: {
    id: string;
    code: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    spaceName: string;
    spaceLocation: string;
    startTime: Date;
    endTime: Date;
    duration: string;
    totalAmount: number;
    amountPaid: number;
    status: string;
    specialRequests?: string;
    createdAt: Date;
  };

  @ApiProperty({ 
    example: {
      canCheckIn: true,
      canCheckOut: false,
      isWithinCheckInWindow: true,
      isExpired: false,
      timeUntilStart: '30 minutes',
      timeUntilEnd: '2 hours 30 minutes',
      gracePeriodRemaining: '45 minutes'
    }
  })
  checkInInfo: {
    canCheckIn: boolean;
    canCheckOut: boolean;
    isWithinCheckInWindow: boolean;
    isExpired: boolean;
    timeUntilStart: string;
    timeUntilEnd: string;
    gracePeriodRemaining?: string;
  };

  @ApiPropertyOptional({ 
    example: {
      previousCheckIn: '2024-11-15T10:05:00.000Z',
      checkInStaff: 'Jane Smith',
      checkInNotes: 'Arrived 5 minutes late'
    }
  })
  activityHistory?: {
    previousCheckIn?: Date;
    checkInStaff?: string;
    checkInNotes?: string;
    previousCheckOut?: Date;
    checkOutStaff?: string;
    checkOutNotes?: string;
  };
}

export class QRCodeDataDto {
  @ApiProperty({ 
    example: 'eyJib29raW5nQ29kZSI6IkJLMTIzNDVBQkMiLCJzcGFjZUlkIjoiNTA3ZjFmNzdiY2Y4NmNkNzk5NDM5MDExIn0=',
    description: 'Base64 encoded QR code data' 
  })
  @IsString()
  @IsNotEmpty()
  qrData: string;

  @ApiPropertyOptional({ 
    example: '2024-11-15T10:30:00.000Z',
    description: 'Timestamp when QR code was scanned' 
  })
  @IsString()
  @IsOptional()
  scannedAt?: string;
}

export class QRCodeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'QR code decoded successfully' })
  message: string;

  @ApiProperty({ 
    example: {
      bookingCode: 'BK12345ABC',
      spaceId: '507f1f77bcf86cd799439011',
      generatedAt: '2024-11-15T09:00:00.000Z',
      expiresAt: '2024-11-15T15:00:00.000Z'
    }
  })
  qrCodeInfo: {
    bookingCode: string;
    spaceId: string;
    generatedAt: Date;
    expiresAt: Date;
  };

  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiPropertyOptional({ example: 'QR code has expired' })
  validationMessage?: string;
}