import { 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsDateString,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromoCodeDto {
  @ApiProperty({ description: 'Promo code (will be uppercased)', example: 'SUMMER20' })
  @IsString()
  @MinLength(3, { message: 'Promo code must be at least 3 characters' })
  @MaxLength(20, { message: 'Promo code must not exceed 20 characters' })
  @Matches(/^[A-Z0-9]+$/, { message: 'Promo code can only contain uppercase letters and numbers' })
  code: string;

  @ApiProperty({ description: 'Discount amount', example: 20 })
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount must be non-negative' })
  discount: number;

  @ApiProperty({ 
    description: 'Discount type',
    enum: ['percentage', 'fixed'],
    example: 'percentage'
  })
  @IsEnum(['percentage', 'fixed'], { message: 'Type must be either percentage or fixed' })
  type: string;

  @ApiProperty({ description: 'Valid from date', example: '2024-01-01T00:00:00Z' })
  @IsDateString({}, { message: 'Valid from must be a valid ISO date string' })
  validFrom: string;

  @ApiProperty({ description: 'Valid to date', example: '2024-12-31T23:59:59Z' })
  @IsDateString({}, { message: 'Valid to must be a valid ISO date string' })
  validTo: string;

  @ApiPropertyOptional({ description: 'Maximum number of uses', example: 100 })
  @IsOptional()
  @IsNumber({}, { message: 'Usage limit must be a number' })
  @Min(1, { message: 'Usage limit must be at least 1' })
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Whether the promo code is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidatePromoCodeDto {
  @ApiProperty({ description: 'Promo code to validate', example: 'SUMMER20' })
  @IsString()
  @MinLength(3, { message: 'Promo code must be at least 3 characters' })
  code: string;

  @ApiProperty({ description: 'Original price to apply discount to', example: 100 })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be non-negative' })
  price: number;

  @ApiPropertyOptional({ description: 'Booking date to check validity', example: '2024-06-15T00:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  bookingDate?: string;
}