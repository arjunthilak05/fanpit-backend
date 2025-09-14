import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsArray,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  MinLength
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchSpacesDto {
  @ApiPropertyOptional({ description: 'Search query for name/description', example: 'coworking downtown' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  query?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by category',
    enum: ['coworking', 'event', 'meeting', 'casual'],
    example: 'coworking'
  })
  @IsOptional()
  @IsEnum(['coworking', 'event', 'meeting', 'casual'])
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by city', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state', example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Minimum price', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Minimum price must be a number' })
  @Min(0, { message: 'Minimum price must be non-negative' })
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Maximum price must be a number' })
  @Min(0, { message: 'Maximum price must be non-negative' })
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum capacity', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Minimum capacity must be a number' })
  @Min(1, { message: 'Minimum capacity must be at least 1' })
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Maximum capacity', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Maximum capacity must be a number' })
  @Min(1, { message: 'Maximum capacity must be at least 1' })
  maxCapacity?: number;

  @ApiPropertyOptional({ 
    description: 'Required amenities (comma-separated)',
    example: 'wifi,projector,coffee'
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',').map(s => s.trim()) : value)
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Minimum rating', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Minimum rating must be a number' })
  @Min(0, { message: 'Minimum rating must be between 0 and 5' })
  @Max(5, { message: 'Minimum rating must be between 0 and 5' })
  minRating?: number;

  // Location-based search
  @ApiPropertyOptional({ description: 'Latitude for location search', example: 40.7128 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude must be a number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for location search', example: -74.0060 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude must be a number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  lng?: number;

  @ApiPropertyOptional({ description: 'Radius for location search in kilometers', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Radius must be a number' })
  @Min(0.1, { message: 'Radius must be at least 0.1 km' })
  @Max(100, { message: 'Radius must not exceed 100 km' })
  radius?: number;

  // Availability filtering
  @ApiPropertyOptional({ description: 'Check availability for this date', example: '2024-12-01T00:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'Available date must be a valid ISO date string' })
  availableDate?: string;

  @ApiPropertyOptional({ description: 'Check availability from this time (HH:mm)', example: '09:00' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ description: 'Check availability to this time (HH:mm)', example: '17:00' })
  @IsOptional()
  @IsString()
  availableTo?: string;

  // Status filters
  @ApiPropertyOptional({ description: 'Show only featured spaces', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Show only verified spaces', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verified?: boolean;

  // Sorting
  @ApiPropertyOptional({ 
    description: 'Sort by field',
    enum: ['createdAt', 'rating', 'price', 'capacity', 'distance'],
    example: 'rating'
  })
  @IsOptional()
  @IsEnum(['createdAt', 'rating', 'price', 'capacity', 'distance'])
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  // Pagination
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number;
}