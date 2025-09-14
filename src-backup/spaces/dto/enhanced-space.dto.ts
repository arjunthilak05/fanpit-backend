import {
  IsString, IsNumber, IsArray, IsOptional, IsEnum, IsBoolean,
  IsUrl, IsDateString, ValidateNested, Min, Max, MinLength,
  MaxLength, Matches, IsObject, IsUUID, IsMongoId, ArrayMinSize,
  ArrayMaxSize, IsLatitude, IsLongitude, IsPhoneNumber, IsEmail
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export enum SpaceCategory {
  COWORKING = 'coworking',
  EVENT = 'event',
  MEETING = 'meeting',
  CASUAL = 'casual',
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  TRAINING = 'training',
  EXHIBITION = 'exhibition'
}

export enum SpaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  MAINTENANCE = 'maintenance'
}

export enum PricingType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  FREE = 'free',
  CUSTOM = 'custom'
}

export enum BookingRuleType {
  ADVANCE_NOTICE = 'advance_notice',
  MAX_DURATION = 'max_duration',
  MIN_DURATION = 'min_duration',
  BUFFER_TIME = 'buffer_time',
  CANCELLATION_POLICY = 'cancellation_policy'
}

class AddressDto {
  @ApiProperty({
    description: 'Street address',
    example: '123 Business Street'
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  street: string;

  @ApiProperty({
    description: 'City',
    example: 'Mumbai'
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'Maharashtra'
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state: string;

  @ApiProperty({
    description: 'ZIP/Postal code',
    example: '400001'
  })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'ZIP code must be 6 digits' })
  zipCode: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'India',
    default: 'India'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string = 'India';

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 19.0760
  })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 72.8777
  })
  @IsOptional()
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({
    description: 'Landmark or additional location details',
    example: 'Near Metro Station'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;
}

class OperatingHoursDto {
  @ApiProperty({
    description: 'Opening time',
    example: '09:00'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  open: string;

  @ApiProperty({
    description: 'Closing time',
    example: '18:00'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  close: string;

  @ApiPropertyOptional({
    description: 'Whether the space is closed on this day',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  closed?: boolean = false;
}

class WeeklyOperatingHoursDto {
  @ApiProperty({
    description: 'Monday operating hours',
    type: OperatingHoursDto
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  monday: OperatingHoursDto;

  @ApiProperty({
    description: 'Tuesday operating hours',
    type: OperatingHoursDto
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  tuesday: OperatingHoursDto;

  @ApiProperty({
    description: 'Wednesday operating hours',
    type: OperatingHoursDto
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  wednesday: OperatingHoursDto;

  @ApiProperty({
    description: 'Thursday operating hours',
    type: OperatingHoursDto
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  thursday: OperatingHoursDto;

  @ApiProperty({
    description: 'Friday operating hours',
    type: OperatingHoursDto
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  friday: OperatingHoursDto;

  @ApiProperty({
    description: 'Saturday operating hours',
    type: OperatingHoursDto
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  saturday: OperatingHoursDto;

  @ApiProperty({
    description: 'Sunday operating hours',
    type: OperatingHoursDto
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  sunday: OperatingHoursDto;
}

class PeakHoursDto {
  @ApiProperty({
    description: 'Peak hours start time',
    example: '09:00'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  start: string;

  @ApiProperty({
    description: 'Peak hours end time',
    example: '18:00'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  end: string;

  @ApiProperty({
    description: 'Price multiplier for peak hours',
    example: 1.5,
    minimum: 0.1,
    maximum: 10
  })
  @IsNumber()
  @Min(0.1)
  @Max(10)
  multiplier: number;
}

class TimeBlockDto {
  @ApiProperty({
    description: 'Duration in hours',
    example: 4,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Price for this time block',
    example: 500,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Title/name for this time block',
    example: 'Half Day Package'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of what\'s included',
    example: 'Includes basic amenities and setup'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

class MonthlyPassDto {
  @ApiProperty({
    description: 'Monthly pass price',
    example: 5000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Whether unlimited access is included',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  unlimited?: boolean = false;

  @ApiPropertyOptional({
    description: 'Number of hours included in the pass',
    example: 40
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  hoursIncluded?: number;

  @ApiPropertyOptional({
    description: 'Benefits included with the pass'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];
}

class SpecialEventPricingDto {
  @ApiProperty({
    description: 'Date of special event',
    example: '2024-12-31'
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Special event price',
    example: 1000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Event name or reason for special pricing',
    example: 'New Year\'s Eve Premium'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  eventName: string;

  @ApiPropertyOptional({
    description: 'Special event description',
    example: 'Premium pricing for New Year celebrations'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

class PricingDto {
  @ApiProperty({
    description: 'Base price',
    example: 100,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Pricing type',
    enum: PricingType,
    example: PricingType.HOURLY
  })
  @IsEnum(PricingType)
  priceType: PricingType;

  @ApiPropertyOptional({
    description: 'Peak hours configuration',
    type: PeakHoursDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PeakHoursDto)
  peakHours?: PeakHoursDto;

  @ApiPropertyOptional({
    description: 'Off-peak multiplier',
    example: 0.8,
    minimum: 0.1,
    maximum: 2
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2)
  offPeakMultiplier?: number = 1;

  @ApiPropertyOptional({
    description: 'Weekend multiplier',
    example: 1.2,
    minimum: 0.1,
    maximum: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(3)
  weekendMultiplier?: number = 1;

  @ApiPropertyOptional({
    description: 'Time block pricing options',
    type: [TimeBlockDto]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDto)
  @IsArray()
  timeBlocks?: TimeBlockDto[];

  @ApiPropertyOptional({
    description: 'Monthly pass configuration',
    type: MonthlyPassDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonthlyPassDto)
  monthlyPass?: MonthlyPassDto;

  @ApiPropertyOptional({
    description: 'Special event pricing',
    type: [SpecialEventPricingDto]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SpecialEventPricingDto)
  @IsArray()
  specialEventPricing?: SpecialEventPricingDto[];

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'INR',
    default: 'INR'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter code' })
  currency?: string = 'INR';

  @ApiPropertyOptional({
    description: 'Security deposit required',
    example: 500,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number = 0;

  @ApiPropertyOptional({
    description: 'Setup fee for events',
    example: 200,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  setupFee?: number = 0;
}

class BookingRuleDto {
  @ApiProperty({
    description: 'Type of booking rule',
    enum: BookingRuleType
  })
  @IsEnum(BookingRuleType)
  type: BookingRuleType;

  @ApiProperty({
    description: 'Rule value (hours, days, etc.)',
    example: 24
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({
    description: 'Rule description',
    example: 'Must book at least 24 hours in advance'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this rule is strictly enforced',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  enforced?: boolean = true;
}

class ContactInfoDto {
  @ApiProperty({
    description: 'Contact phone number',
    example: '+91-9876543210'
  })
  @IsPhoneNumber('IN')
  phone: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'space@example.com'
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://myspace.com'
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number (if different from phone)',
    example: '+91-9876543210'
  })
  @IsOptional()
  @IsPhoneNumber('IN')
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Contact person name',
    example: 'John Doe'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactPerson?: string;
}

class PoliciesDto {
  @ApiProperty({
    description: 'Cancellation policy description',
    example: 'Free cancellation up to 24 hours before booking'
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  cancellation: string;

  @ApiProperty({
    description: 'Payment policy description',
    example: 'Full payment required at time of booking'
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  payment: string;

  @ApiProperty({
    description: 'Space usage rules',
    example: ['No smoking', 'No outside food', 'Maintain cleanliness']
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  rules: string[];

  @ApiPropertyOptional({
    description: 'Additional terms and conditions',
    example: 'Damage charges may apply'
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalTerms?: string;
}

class SafetyMeasuresDto {
  @ApiPropertyOptional({
    description: 'Fire safety measures',
    example: ['Fire extinguishers', 'Smoke detectors', 'Emergency exits']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fireSafety?: string[];

  @ApiPropertyOptional({
    description: 'Security measures',
    example: ['CCTV surveillance', '24/7 security guard', 'Access control']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  security?: string[];

  @ApiPropertyOptional({
    description: 'Health and hygiene measures',
    example: ['Regular sanitization', 'Hand sanitizer stations', 'Air purifiers']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hygiene?: string[];

  @ApiPropertyOptional({
    description: 'COVID-19 specific measures',
    example: ['Mask mandatory', 'Social distancing', 'Temperature check']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  covidMeasures?: string[];
}

export class CreateSpaceDto {
  @ApiProperty({
    description: 'Space name',
    example: 'Modern Conference Room A',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Space description',
    example: 'A well-equipped conference room perfect for business meetings',
    minLength: 10,
    maxLength: 2000
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Space address',
    type: AddressDto
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    description: 'Maximum capacity',
    example: 50,
    minimum: 1,
    maximum: 10000
  })
  @IsNumber()
  @Min(1)
  @Max(10000)
  capacity: number;

  @ApiProperty({
    description: 'Space category',
    enum: SpaceCategory,
    example: SpaceCategory.MEETING
  })
  @IsEnum(SpaceCategory)
  category: SpaceCategory;

  @ApiProperty({
    description: 'Available amenities',
    example: ['WiFi', 'Projector', 'Air Conditioning', 'Parking'],
    minItems: 1
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  amenities: string[];

  @ApiProperty({
    description: 'Space images URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUrl({}, { each: true })
  images: string[];

  @ApiProperty({
    description: 'Pricing configuration',
    type: PricingDto
  })
  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  @ApiProperty({
    description: 'Operating hours for each day of the week',
    type: WeeklyOperatingHoursDto
  })
  @ValidateNested()
  @Type(() => WeeklyOperatingHoursDto)
  operatingHours: WeeklyOperatingHoursDto;

  @ApiPropertyOptional({
    description: 'Blackout dates when space is not available',
    example: ['2024-12-25', '2024-01-01']
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  blackoutDates?: string[];

  @ApiPropertyOptional({
    description: 'Booking rules and restrictions',
    type: [BookingRuleDto]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BookingRuleDto)
  @IsArray()
  bookingRules?: BookingRuleDto[];

  @ApiProperty({
    description: 'Contact information',
    type: ContactInfoDto
  })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;

  @ApiProperty({
    description: 'Policies and rules',
    type: PoliciesDto
  })
  @ValidateNested()
  @Type(() => PoliciesDto)
  policies: PoliciesDto;

  @ApiPropertyOptional({
    description: 'Safety measures in place',
    type: SafetyMeasuresDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SafetyMeasuresDto)
  safetyMeasures?: SafetyMeasuresDto;

  @ApiPropertyOptional({
    description: 'Special features or highlights',
    example: ['Rooftop view', 'Natural lighting', 'Sound system']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  specialFeatures?: string[];

  @ApiPropertyOptional({
    description: 'Accessibility features',
    example: ['Wheelchair accessible', 'Elevator access', 'Disabled parking']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  accessibility?: string[];

  @ApiPropertyOptional({
    description: 'Space layout type',
    example: 'U-shaped'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  layout?: string;

  @ApiPropertyOptional({
    description: 'Floor number',
    example: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  floor?: number;

  @ApiPropertyOptional({
    description: 'Total floor area in square feet',
    example: 1200
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  area?: number;

  @ApiPropertyOptional({
    description: 'Tags for better searchability',
    example: ['modern', 'downtown', 'tech-friendly']
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}

export class UpdateSpaceDto {
  @ApiPropertyOptional({
    description: 'Space name',
    example: 'Updated Conference Room A'
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Space description',
    example: 'An updated description'
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Space address',
    type: AddressDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Maximum capacity',
    example: 60
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Space category',
    enum: SpaceCategory
  })
  @IsOptional()
  @IsEnum(SpaceCategory)
  category?: SpaceCategory;

  @ApiPropertyOptional({
    description: 'Available amenities'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Space images URLs'
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Pricing configuration',
    type: PricingDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingDto)
  pricing?: PricingDto;

  @ApiPropertyOptional({
    description: 'Operating hours',
    type: WeeklyOperatingHoursDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyOperatingHoursDto)
  operatingHours?: WeeklyOperatingHoursDto;

  @ApiPropertyOptional({
    description: 'Blackout dates'
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  blackoutDates?: string[];

  @ApiPropertyOptional({
    description: 'Contact information',
    type: ContactInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;

  @ApiPropertyOptional({
    description: 'Policies and rules',
    type: PoliciesDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PoliciesDto)
  policies?: PoliciesDto;

  @ApiPropertyOptional({
    description: 'Space status',
    enum: SpaceStatus
  })
  @IsOptional()
  @IsEnum(SpaceStatus)
  status?: SpaceStatus;

  @ApiPropertyOptional({
    description: 'Whether space is featured',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class SpaceSearchDto {
  @ApiPropertyOptional({
    description: 'Search query',
    example: 'conference room'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @ApiPropertyOptional({
    description: 'Space category',
    enum: SpaceCategory
  })
  @IsOptional()
  @IsEnum(SpaceCategory)
  category?: SpaceCategory;

  @ApiPropertyOptional({
    description: 'Location (city or area)',
    example: 'Mumbai'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'Minimum price per hour',
    example: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price per hour',
    example: 500
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum capacity',
    example: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Maximum capacity',
    example: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: 'Required amenities',
    example: ['WiFi', 'Projector']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Availability date',
    example: '2024-01-15'
  })
  @IsOptional()
  @IsDateString()
  availabilityDate?: string;

  @ApiPropertyOptional({
    description: 'Start time for availability check',
    example: '09:00'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time for availability check',
    example: '17:00'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Minimum rating',
    example: 4.0,
    minimum: 0,
    maximum: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Only verified spaces',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({
    description: 'Only featured spaces',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Distance from coordinates (in km)',
    example: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  distance?: number;

  @ApiPropertyOptional({
    description: 'Latitude for distance search',
    example: 19.0760
  })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for distance search',
    example: 72.8777
  })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
    maximum: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'rating',
    enum: ['createdAt', 'rating', 'price', 'name', 'popularity', 'distance']
  })
  @IsOptional()
  @IsEnum(['createdAt', 'rating', 'price', 'name', 'popularity', 'distance'])
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

export class SpaceAvailabilityDto {
  @ApiProperty({
    description: 'Space ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  spaceId: string;

  @ApiProperty({
    description: 'Date to check availability',
    example: '2024-01-15'
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Duration in hours',
    example: 2,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  duration?: number = 1;
}

export class SpaceResponseDto {
  @ApiProperty({
    description: 'Space ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Space name',
    example: 'Modern Conference Room A'
  })
  name: string;

  @ApiProperty({
    description: 'Space description',
    example: 'A well-equipped conference room'
  })
  description: string;

  @ApiProperty({
    description: 'Space category',
    enum: SpaceCategory
  })
  category: SpaceCategory;

  @ApiProperty({
    description: 'Space status',
    enum: SpaceStatus
  })
  status: SpaceStatus;

  @ApiProperty({
    description: 'Maximum capacity'
  })
  capacity: number;

  @ApiProperty({
    description: 'Space address',
    type: AddressDto
  })
  address: AddressDto;

  @ApiProperty({
    description: 'Available amenities'
  })
  amenities: string[];

  @ApiProperty({
    description: 'Space images'
  })
  images: string[];

  @ApiProperty({
    description: 'Pricing information',
    type: PricingDto
  })
  pricing: PricingDto;

  @ApiProperty({
    description: 'Operating hours',
    type: WeeklyOperatingHoursDto
  })
  operatingHours: WeeklyOperatingHoursDto;

  @ApiProperty({
    description: 'Contact information',
    type: ContactInfoDto
  })
  contactInfo: ContactInfoDto;

  @ApiProperty({
    description: 'Space owner ID',
    example: '507f1f77bcf86cd799439011'
  })
  ownerId: string;

  @ApiProperty({
    description: 'Average rating',
    example: 4.5
  })
  rating: number;

  @ApiProperty({
    description: 'Number of reviews',
    example: 25
  })
  reviewCount: number;

  @ApiProperty({
    description: 'Total bookings',
    example: 150
  })
  totalBookings: number;

  @ApiProperty({
    description: 'View count',
    example: 500
  })
  viewCount: number;

  @ApiProperty({
    description: 'Whether space is verified',
    example: true
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Whether space is featured',
    example: false
  })
  isFeatured: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-12-01T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-12-15T10:00:00Z'
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Distance from search point (if applicable)',
    example: 2.5
  })
  distance?: number;

  @ApiPropertyOptional({
    description: 'Availability status for searched date/time',
    example: true
  })
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Next available slot',
    example: '14:00'
  })
  nextAvailableSlot?: string;
}