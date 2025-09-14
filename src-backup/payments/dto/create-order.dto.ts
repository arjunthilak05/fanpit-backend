import { 
  IsString, 
  IsNotEmpty, 
  IsMongoId, 
  IsOptional, 
  IsNumber,
  Min,
  IsObject,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ 
    description: 'Booking ID for which payment is being created',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({ 
    description: 'Custom receipt number (will be auto-generated if not provided)',
    example: 'RCP_123456789'
  })
  @IsOptional()
  @IsString()
  receipt?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes for the payment',
    example: 'Conference room booking payment'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { source: 'mobile_app', campaign: 'summer2024' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}