import { 
  IsString, 
  IsEmail, 
  IsPhoneNumber, 
  IsDateString, 
  IsOptional, 
  IsNumber, 
  Min, 
  Max, 
  Matches, 
  IsNotEmpty,
  IsMongoId,
  ValidateNested,
  IsInt
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerDetailsDto {
  @ApiProperty({ description: 'Customer full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Customer email address', example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Customer phone number', example: '+919876543210' })
  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: 'Purpose of the event', example: 'Team meeting' })
  @IsOptional()
  @IsString()
  eventPurpose?: string;

  @ApiPropertyOptional({ description: 'Any special requests', example: 'Need projector setup' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiProperty({ description: 'Number of guests', example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  guestCount: number;
}

export class CreateBookingDto {
  @ApiProperty({ 
    description: 'Space ID to book', 
    example: '507f1f77bcf86cd799439011' 
  })
  @IsMongoId()
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ 
    description: 'Booking date in ISO format', 
    example: '2024-12-01' 
  })
  @IsDateString()
  @IsNotEmpty()
  bookingDate: string;

  @ApiProperty({ 
    description: 'Start time in HH:mm format', 
    example: '09:00' 
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format'
  })
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ 
    description: 'End time in HH:mm format', 
    example: '17:00' 
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format'
  })
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ 
    description: 'Customer details',
    type: CustomerDetailsDto
  })
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  @IsNotEmpty()
  customerDetails: CustomerDetailsDto;

  @ApiPropertyOptional({ 
    description: 'Promo code to apply', 
    example: 'WELCOME20' 
  })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ 
    description: 'Buffer time in minutes', 
    example: 15,
    minimum: 0,
    maximum: 60
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  bufferTime?: number;
}