import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  MaxLength, 
  MinLength,
  IsDateString,
  IsBoolean
} from 'class-validator';

export class CheckInDto {
  @ApiProperty({ 
    example: 'BK12345ABC',
    description: 'Booking code for check-in' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  bookingCode: string;

  @ApiPropertyOptional({ 
    example: 'Customer arrived on time, no issues',
    description: 'Optional notes about the check-in process' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether to send check-in confirmation to customer' 
  })
  @IsBoolean()
  @IsOptional()
  sendConfirmation?: boolean;

  @ApiPropertyOptional({ 
    example: '2024-11-15T10:30:00.000Z',
    description: 'Override check-in time (for late entries)' 
  })
  @IsDateString()
  @IsOptional()
  checkInTime?: string;
}

export class CheckOutDto {
  @ApiProperty({ 
    example: 'BK12345ABC',
    description: 'Booking code for check-out' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  bookingCode: string;

  @ApiPropertyOptional({ 
    example: 'Space left clean, all equipment functioning',
    description: 'Optional notes about the check-out process' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether space condition is satisfactory' 
  })
  @IsBoolean()
  @IsOptional()
  spaceConditionOk?: boolean;

  @ApiPropertyOptional({ 
    example: '2024-11-15T12:30:00.000Z',
    description: 'Override check-out time (for late entries)' 
  })
  @IsDateString()
  @IsOptional()
  checkOutTime?: string;
}

export class MarkNoShowDto {
  @ApiPropertyOptional({ 
    example: 'Customer did not arrive within grace period',
    description: 'Reason for marking as no-show' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether to attempt customer contact before marking no-show' 
  })
  @IsBoolean()
  @IsOptional()
  attemptContact?: boolean;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether to process refund according to policy' 
  })
  @IsBoolean()
  @IsOptional()
  processRefund?: boolean;
}

export class CheckInResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Check-in successful' })
  message: string;

  @ApiProperty({ example: 'BK12345ABC' })
  bookingCode: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: '2024-11-15T10:30:00.000Z' })
  checkInTime: Date;

  @ApiProperty({ example: 'Conference Room A' })
  spaceName: string;

  @ApiProperty({ example: '2024-11-15T10:00:00.000Z' })
  bookingStartTime: Date;

  @ApiProperty({ example: '2024-11-15T12:00:00.000Z' })
  bookingEndTime: Date;

  @ApiPropertyOptional({ example: 'Welcome message sent to customer' })
  additionalInfo?: string;
}

export class CheckOutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Check-out successful' })
  message: string;

  @ApiProperty({ example: 'BK12345ABC' })
  bookingCode: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: '2024-11-15T12:30:00.000Z' })
  checkOutTime: Date;

  @ApiProperty({ example: '02:00' })
  duration: string;

  @ApiProperty({ example: 150 })
  totalAmount: number;

  @ApiPropertyOptional({ example: 'Billing information updated' })
  additionalInfo?: string;
}