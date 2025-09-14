import { 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsArray, 
  IsOptional, 
  IsBoolean,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ description: 'Street address', example: '123 Main Street' })
  @IsString()
  @MinLength(5, { message: 'Street address must be at least 5 characters' })
  @MaxLength(200, { message: 'Street address must not exceed 200 characters' })
  street: string;

  @ApiProperty({ description: 'City', example: 'New York' })
  @IsString()
  @MinLength(2, { message: 'City must be at least 2 characters' })
  @MaxLength(100, { message: 'City must not exceed 100 characters' })
  city: string;

  @ApiProperty({ description: 'State', example: 'NY' })
  @IsString()
  @MinLength(2, { message: 'State must be at least 2 characters' })
  @MaxLength(100, { message: 'State must not exceed 100 characters' })
  state: string;

  @ApiProperty({ description: 'ZIP code', example: '10001' })
  @IsString()
  @Matches(/^\d{5}(-\d{4})?$/, { message: 'ZIP code must be in format 12345 or 12345-6789' })
  zipCode: string;

  @ApiPropertyOptional({
    description: 'Geographic coordinates',
    example: { lat: 40.7128, lng: -74.0060 }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class CoordinatesDto {
  @ApiProperty({ description: 'Latitude', example: 40.7128 })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  lat: number;

  @ApiProperty({ description: 'Longitude', example: -74.0060 })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  lng: number;
}

export class PeakHoursDto {
  @ApiProperty({ description: 'Peak hours start time (HH:mm)', example: '14:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:mm format' })
  start: string;

  @ApiProperty({ description: 'Peak hours end time (HH:mm)', example: '18:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'End time must be in HH:mm format' })
  end: string;

  @ApiProperty({ description: 'Price multiplier for peak hours', example: 1.5 })
  @IsNumber({}, { message: 'Multiplier must be a number' })
  @Min(0.1, { message: 'Multiplier must be at least 0.1' })
  @Max(10, { message: 'Multiplier must not exceed 10' })
  multiplier: number;
}

export class TimeBlockDto {
  @ApiProperty({ description: 'Duration in hours', example: 4 })
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(1, { message: 'Duration must be at least 1 hour' })
  @Max(24, { message: 'Duration must not exceed 24 hours' })
  duration: number;

  @ApiProperty({ description: 'Price for this time block', example: 100 })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be non-negative' })
  price: number;

  @ApiProperty({ description: 'Title for this time block', example: 'Half Day Package' })
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(50, { message: 'Title must not exceed 50 characters' })
  title: string;
}

export class MonthlyPassDto {
  @ApiProperty({ description: 'Monthly pass price', example: 500 })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be non-negative' })
  price: number;

  @ApiPropertyOptional({ description: 'Whether the pass offers unlimited access', default: false })
  @IsOptional()
  @IsBoolean()
  unlimited?: boolean;
}

export class SpecialEventPricingDto {
  @ApiProperty({ description: 'Date for special pricing', example: '2024-12-25T00:00:00Z' })
  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  date: string;

  @ApiProperty({ description: 'Special price for this date', example: 200 })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be non-negative' })
  price: number;
}

export class PricingDto {
  @ApiProperty({ description: 'Base price for the space', example: 50 })
  @IsNumber({}, { message: 'Base price must be a number' })
  @Min(0, { message: 'Base price must be non-negative' })
  basePrice: number;

  @ApiProperty({ 
    description: 'Type of pricing', 
    enum: ['hourly', 'daily', 'free'],
    example: 'hourly' 
  })
  @IsEnum(['hourly', 'daily', 'free'], { message: 'Price type must be hourly, daily, or free' })
  priceType: string;

  @ApiPropertyOptional({ description: 'Peak hours pricing configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PeakHoursDto)
  peakHours?: PeakHoursDto;

  @ApiPropertyOptional({ description: 'Off-peak price multiplier', example: 0.8 })
  @IsOptional()
  @IsNumber({}, { message: 'Off-peak multiplier must be a number' })
  @Min(0.1, { message: 'Off-peak multiplier must be at least 0.1' })
  @Max(2, { message: 'Off-peak multiplier must not exceed 2' })
  offPeakMultiplier?: number;

  @ApiPropertyOptional({ description: 'Weekend price multiplier', example: 1.2 })
  @IsOptional()
  @IsNumber({}, { message: 'Weekend multiplier must be a number' })
  @Min(0.1, { message: 'Weekend multiplier must be at least 0.1' })
  @Max(3, { message: 'Weekend multiplier must not exceed 3' })
  weekendMultiplier?: number;

  @ApiPropertyOptional({ description: 'Time block packages', type: [TimeBlockDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDto)
  timeBlocks?: TimeBlockDto[];

  @ApiPropertyOptional({ description: 'Monthly pass configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonthlyPassDto)
  monthlyPass?: MonthlyPassDto;

  @ApiPropertyOptional({ description: 'Special event pricing', type: [SpecialEventPricingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialEventPricingDto)
  specialEventPricing?: SpecialEventPricingDto[];
}

export class OperatingHourDto {
  @ApiProperty({ description: 'Opening time (HH:mm)', example: '09:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Open time must be in HH:mm format' })
  open: string;

  @ApiProperty({ description: 'Closing time (HH:mm)', example: '17:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Close time must be in HH:mm format' })
  close: string;

  @ApiPropertyOptional({ description: 'Whether the space is closed this day', default: false })
  @IsOptional()
  @IsBoolean()
  closed?: boolean;
}

export class OperatingHoursDto {
  @ApiProperty({ type: OperatingHourDto })
  @ValidateNested()
  @Type(() => OperatingHourDto)
  monday: OperatingHourDto;

  @ApiProperty({ type: OperatingHourDto })
  @ValidateNested()
  @Type(() => OperatingHourDto)
  tuesday: OperatingHourDto;

  @ApiProperty({ type: OperatingHourDto })
  @ValidateNested()
  @Type(() => OperatingHourDto)
  wednesday: OperatingHourDto;

  @ApiProperty({ type: OperatingHourDto })
  @ValidateNested()
  @Type(() => OperatingHourDto)
  thursday: OperatingHourDto;

  @ApiProperty({ type: OperatingHourDto })
  @ValidateNested()
  @Type(() => OperatingHourDto)
  friday: OperatingHourDto;

  @ApiProperty({ type: OperatingHourDto })
  @ValidateNested()
  @Type(() => OperatingHourDto)
  saturday: OperatingHourDto;

  @ApiProperty({ type: OperatingHourDto })
  @ValidateNested()
  @Type(() => OperatingHourDto)
  sunday: OperatingHourDto;
}

export class CreateSpaceDto {
  @ApiProperty({ description: 'Space name', example: 'Downtown Creative Hub' })
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @ApiProperty({ 
    description: 'Space description', 
    example: 'A modern coworking space in the heart of downtown...' 
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description: string;

  @ApiProperty({ description: 'Space address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ description: 'Maximum capacity', example: 20 })
  @IsNumber({}, { message: 'Capacity must be a number' })
  @Min(1, { message: 'Capacity must be at least 1' })
  @Max(10000, { message: 'Capacity must not exceed 10000' })
  capacity: number;

  @ApiProperty({ 
    description: 'Space category',
    enum: ['coworking', 'event', 'meeting', 'casual'],
    example: 'coworking'
  })
  @IsEnum(['coworking', 'event', 'meeting', 'casual'], {
    message: 'Category must be one of: coworking, event, meeting, casual'
  })
  category: string;

  @ApiProperty({ 
    description: 'Available amenities',
    example: ['wifi', 'projector', 'coffee', 'parking'],
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one amenity is required' })
  @IsString({ each: true })
  amenities: string[];

  @ApiPropertyOptional({ 
    description: 'Space images URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Pricing configuration', type: PricingDto })
  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  @ApiProperty({ description: 'Operating hours', type: OperatingHoursDto })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours: OperatingHoursDto;

  @ApiPropertyOptional({ 
    description: 'Blackout dates (unavailable dates)',
    example: ['2024-12-25T00:00:00Z', '2024-01-01T00:00:00Z'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true, message: 'Each blackout date must be a valid ISO date string' })
  blackoutDates?: string[];
}