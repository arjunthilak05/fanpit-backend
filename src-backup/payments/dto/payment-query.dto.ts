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

export class PaymentQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by payment status',
    enum: ['created', 'authorized', 'captured', 'refunded', 'failed', 'cancelled']
  })
  @IsOptional()
  @IsEnum(['created', 'authorized', 'captured', 'refunded', 'failed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by payment method',
    example: 'card'
  })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ 
    description: 'Filter payments from this date (ISO format)', 
    example: '2024-11-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Filter payments until this date (ISO format)', 
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by booking ID', 
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  bookingId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by customer ID', 
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @ApiPropertyOptional({ 
    description: 'Search by order ID, payment ID, receipt, or customer email',
    example: 'order_abc123'
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