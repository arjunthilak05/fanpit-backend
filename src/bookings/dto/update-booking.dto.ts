import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsNumber,
  Min,
  Max,
  IsNotEmpty
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelBookingDto {
  @ApiPropertyOptional({ 
    description: 'Reason for cancellation', 
    example: 'Change of plans' 
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class UpdateBookingStatusDto {
  @ApiPropertyOptional({ 
    description: 'New booking status', 
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'],
    example: 'confirmed'
  })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Staff notes', 
    example: 'Customer arrived early' 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Cancellation reason (required if status is cancelled)', 
    example: 'Customer requested cancellation' 
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class AddBookingReviewDto {
  @ApiPropertyOptional({ 
    description: 'Rating for the booking experience', 
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ 
    description: 'Review comment', 
    example: 'Great space, excellent service!' 
  })
  @IsOptional()
  @IsString()
  review?: string;
}