import { 
  IsString, 
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiPropertyOptional({ 
    description: 'Amount to refund in paise (if not provided, full refund will be processed)',
    example: 50000,
    minimum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  amount?: number;

  @ApiProperty({ 
    description: 'Reason for refund',
    example: 'Customer requested cancellation'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ 
    description: 'Speed of refund processing',
    example: 'normal',
    enum: ['normal', 'optimum']
  })
  @IsOptional()
  @IsEnum(['normal', 'optimum'])
  speed?: 'normal' | 'optimum';

  @ApiPropertyOptional({ 
    description: 'Receipt number for refund tracking',
    example: 'REF_123456789'
  })
  @IsOptional()
  @IsString()
  receipt?: string;
}