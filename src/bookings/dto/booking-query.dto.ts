import { 
  IsOptional, 
  IsEnum, 
  IsDateString, 
  IsMongoId,
  IsString,
  IsInt,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BookingQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by booking status', 
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show']
  })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by payment status', 
    enum: ['pending', 'paid', 'failed', 'refunded']
  })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'failed', 'refunded'])
  paymentStatus?: string;

  @ApiPropertyOptional({ 
    description: 'Filter bookings from this date (ISO format)', 
    example: '2024-11-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Filter bookings until this date (ISO format)', 
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by space ID', 
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  spaceId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by customer ID', 
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @ApiPropertyOptional({ 
    description: 'Search by booking code, customer name, or email', 
    example: 'BK12345ABC'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination', 
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page', 
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Sort field', 
    example: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class DailyBookingsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Date to get bookings for (ISO format)', 
    example: '2024-12-01'
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by space ID', 
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  spaceId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by booking status', 
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show']
  })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'])
  status?: string;
}