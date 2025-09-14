import {
  IsString, IsNumber, IsArray, IsOptional, IsEnum, IsBoolean,
  IsEmail, IsDateString, ValidateNested, Min, Max, MinLength,
  MaxLength, Matches, IsObject, IsMongoId, ArrayMinSize,
  ArrayMaxSize, IsPhoneNumber, IsUUID
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked-in',
  CHECKED_OUT = 'checked-out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum DiscountType {
  PROMO = 'promo',
  PEAK_DISCOUNT = 'peak-discount',
  LOYALTY = 'loyalty',
  EARLY_BIRD = 'early-bird',
  BULK = 'bulk',
  FIRST_TIME = 'first-time',
  REFERRAL = 'referral'
}

export enum BookingSource {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
  STAFF = 'staff',
  PHONE = 'phone',
  WALK_IN = 'walk-in'
}

export enum CancellationReason {
  CUSTOMER_REQUEST = 'customer_request',
  SPACE_UNAVAILABLE = 'space_unavailable',
  PAYMENT_FAILED = 'payment_failed',
  FORCE_MAJEURE = 'force_majeure',
  MAINTENANCE = 'maintenance',
  POLICY_VIOLATION = 'policy_violation',
  DUPLICATE = 'duplicate',
  OTHER = 'other'
}

class CustomerDetailsDto {
  @ApiProperty({
    description: 'Customer full name',
    example: 'John Doe'
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'john.doe@example.com'
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+91-9876543210'
  })
  @IsPhoneNumber('IN')
  phone: string;

  @ApiPropertyOptional({
    description: 'Event purpose or reason for booking',
    example: 'Business meeting with clients'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  eventPurpose?: string;

  @ApiPropertyOptional({
    description: 'Special requests or requirements',
    example: 'Need extra chairs and whiteboard setup'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string;

  @ApiProperty({
    description: 'Number of guests/attendees',
    example: 15,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  @Max(10000)
  guestCount: number;

  @ApiPropertyOptional({
    description: 'Company or organization name',
    example: 'Tech Corp Inc.'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional({
    description: 'Event type',
    example: 'Corporate Meeting',
    enum: ['meeting', 'conference', 'workshop', 'training', 'presentation', 'interview', 'social', 'other']
  })
  @IsOptional()
  @IsEnum(['meeting', 'conference', 'workshop', 'training', 'presentation', 'interview', 'social', 'other'])
  eventType?: string;

  @ApiPropertyOptional({
    description: 'Expected attendee count breakdown',
    example: { internal: 10, external: 5 }
  })
  @IsOptional()
  @IsObject()
  attendeeBreakdown?: {
    internal?: number;
    external?: number;
    vip?: number;
  };

  @ApiPropertyOptional({
    description: 'Accessibility requirements',
    example: ['wheelchair_access', 'hearing_assistance']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessibilityNeeds?: string[];

  @ApiPropertyOptional({
    description: 'Catering requirements',
    example: 'Coffee and snacks for 15 people'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  catering?: string;

  @ApiPropertyOptional({
    description: 'Technical equipment needs',
    example: ['projector', 'microphone', 'video_conferencing']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentNeeds?: string[];
}

class DiscountDto {
  @ApiProperty({
    description: 'Discount type',
    enum: DiscountType
  })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({
    description: 'Discount amount',
    example: 100,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Discount description',
    example: 'Early bird discount - 10%'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description: string;

  @ApiPropertyOptional({
    description: 'Discount code or reference',
    example: 'EARLY10'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    description: 'Discount percentage (if applicable)',
    example: 10,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;
}

class PricingDetailsDto {
  @ApiProperty({
    description: 'Base amount before discounts',
    example: 1000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @ApiPropertyOptional({
    description: 'Applied discounts',
    type: [DiscountDto]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscountDto)
  @IsArray()
  discounts?: DiscountDto[];

  @ApiProperty({
    description: 'Tax amount',
    example: 180,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  taxes: number;

  @ApiProperty({
    description: 'Total amount to be paid',
    example: 1080,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Security deposit amount',
    example: 500,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number = 0;

  @ApiPropertyOptional({
    description: 'Setup fee amount',
    example: 200,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  setupFee?: number = 0;

  @ApiPropertyOptional({
    description: 'Cleaning fee amount',
    example: 100,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cleaningFee?: number = 0;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'INR',
    default: 'INR'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string = 'INR';

  @ApiPropertyOptional({
    description: 'Applied promo code',
    example: 'SAVE20'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  promoCode?: string;

  @ApiPropertyOptional({
    description: 'Hourly rate applied',
    example: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Peak hour multiplier applied',
    example: 1.5
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  peakMultiplier?: number;

  @ApiPropertyOptional({
    description: 'Weekend multiplier applied',
    example: 1.2
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  weekendMultiplier?: number;
}

class PaymentInfoDto {
  @ApiPropertyOptional({
    description: 'Razorpay order ID',
    example: 'order_ABC123'
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Razorpay payment ID',
    example: 'pay_DEF456'
  })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Payment signature for verification',
    example: 'abc123def456'
  })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: 'card',
    enum: ['card', 'netbanking', 'upi', 'wallet', 'cash']
  })
  @IsOptional()
  @IsEnum(['card', 'netbanking', 'upi', 'wallet', 'cash'])
  method?: string;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Payment gateway used',
    example: 'razorpay'
  })
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional({
    description: 'Payment timestamp',
    example: '2024-01-15T10:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({
    description: 'Payment failure reason',
    example: 'Insufficient funds'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;

  @ApiPropertyOptional({
    description: 'Bank reference number',
    example: 'BNK123456789'
  })
  @IsOptional()
  @IsString()
  bankReference?: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Space ID to book',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  spaceId: string;

  @ApiProperty({
    description: 'Date of booking',
    example: '2024-01-15'
  })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({
    description: 'Start time',
    example: '09:00'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format'
  })
  startTime: string;

  @ApiProperty({
    description: 'End time',
    example: '17:00'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format'
  })
  endTime: string;

  @ApiProperty({
    description: 'Duration in hours',
    example: 8,
    minimum: 0.5,
    maximum: 24
  })
  @IsNumber()
  @Min(0.5)
  @Max(24)
  duration: number;

  @ApiProperty({
    description: 'Customer details',
    type: CustomerDetailsDto
  })
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customerDetails: CustomerDetailsDto;

  @ApiProperty({
    description: 'Pricing details',
    type: PricingDetailsDto
  })
  @ValidateNested()
  @Type(() => PricingDetailsDto)
  pricing: PricingDetailsDto;

  @ApiProperty({
    description: 'Payment information',
    type: PaymentInfoDto
  })
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  payment: PaymentInfoDto;

  @ApiPropertyOptional({
    description: 'Buffer time around booking in minutes',
    example: 15,
    minimum: 0,
    maximum: 60,
    default: 15
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  bufferTime?: number = 15;

  @ApiPropertyOptional({
    description: 'Source of booking',
    enum: BookingSource,
    example: BookingSource.WEB
  })
  @IsOptional()
  @IsEnum(BookingSource)
  source?: BookingSource = BookingSource.WEB;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Please ensure projector is working'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Booking reference from external system',
    example: 'EXT-REF-123'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalReference?: string;

  @ApiPropertyOptional({
    description: 'Recurring booking configuration'
  })
  @IsOptional()
  @IsObject()
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // every N days/weeks/months
    endDate?: string;
    occurrences?: number;
    daysOfWeek?: number[]; // for weekly: 0=Sunday, 1=Monday, etc.
  };

  @ApiPropertyOptional({
    description: 'Terms and conditions acceptance',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  acceptedTerms?: boolean = true;

  @ApiPropertyOptional({
    description: 'Marketing consent',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean = false;
}

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'New date for the booking',
    example: '2024-01-16'
  })
  @IsOptional()
  @IsDateString()
  bookingDate?: string;

  @ApiPropertyOptional({
    description: 'New start time',
    example: '10:00'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @ApiPropertyOptional({
    description: 'New end time',
    example: '18:00'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Updated duration in hours',
    example: 8
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Updated customer details',
    type: CustomerDetailsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customerDetails?: CustomerDetailsDto;

  @ApiPropertyOptional({
    description: 'Booking status',
    enum: BookingStatus
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Updated requirements'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Staff notes (internal)',
    example: 'Customer called to confirm setup'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  staffNotes?: string;

  @ApiPropertyOptional({
    description: 'Payment information updates',
    type: PaymentInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  payment?: PaymentInfoDto;
}

export class CancelBookingDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    enum: CancellationReason,
    example: CancellationReason.CUSTOMER_REQUEST
  })
  @IsEnum(CancellationReason)
  reason: CancellationReason;

  @ApiPropertyOptional({
    description: 'Additional cancellation details',
    example: 'Meeting postponed to next month'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;

  @ApiPropertyOptional({
    description: 'Whether to process refund',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  processRefund?: boolean = true;

  @ApiPropertyOptional({
    description: 'Refund amount (if different from policy)',
    example: 800
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @ApiPropertyOptional({
    description: 'Request reschedule instead of cancellation',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  requestReschedule?: boolean = false;

  @ApiPropertyOptional({
    description: 'Preferred reschedule options'
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  rescheduleOptions?: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
}

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'Space ID to check',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  spaceId: string;

  @ApiProperty({
    description: 'Date to check',
    example: '2024-01-15'
  })
  @IsDateString()
  date: string;

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
    description: 'Duration in hours',
    example: 2,
    minimum: 0.5
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Exclude specific booking from check',
    example: '507f1f77bcf86cd799439012'
  })
  @IsOptional()
  @IsMongoId()
  excludeBookingId?: string;
}

export class BookingQueryDto {
  @ApiPropertyOptional({
    description: 'Search by booking code',
    example: 'BK12345678'
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bookingCode?: string;

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
    description: 'Filter by booking status',
    enum: BookingStatus
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatus
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Filter by date range - start date',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by date range - end date',
    example: '2024-01-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer email',
    example: 'customer@example.com'
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer phone',
    example: '+91-9876543210'
  })
  @IsOptional()
  @IsPhoneNumber('IN')
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum amount',
    example: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum amount',
    example: 5000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter by booking source',
    enum: BookingSource
  })
  @IsOptional()
  @IsEnum(BookingSource)
  source?: BookingSource;

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
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'bookingDate',
    enum: ['bookingDate', 'createdAt', 'totalAmount', 'status']
  })
  @IsOptional()
  @IsEnum(['bookingDate', 'createdAt', 'totalAmount', 'status'])
  sortBy?: string = 'bookingDate';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class BookingStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for stats',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for stats',
    example: '2024-01-31'
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
    description: 'Group by period',
    enum: ['day', 'week', 'month', 'year'],
    example: 'day'
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: string = 'day';
}

export class BookingResponseDto {
  @ApiProperty({
    description: 'Booking ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Unique booking code',
    example: 'BK12345678'
  })
  bookingCode: string;

  @ApiProperty({
    description: 'Space ID',
    example: '507f1f77bcf86cd799439011'
  })
  spaceId: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '507f1f77bcf86cd799439011'
  })
  customerId: string;

  @ApiProperty({
    description: 'Booking date',
    example: '2024-01-15'
  })
  bookingDate: string;

  @ApiProperty({
    description: 'Start time',
    example: '09:00'
  })
  startTime: string;

  @ApiProperty({
    description: 'End time',
    example: '17:00'
  })
  endTime: string;

  @ApiProperty({
    description: 'Duration in hours',
    example: 8
  })
  duration: number;

  @ApiProperty({
    description: 'Customer details',
    type: CustomerDetailsDto
  })
  customerDetails: CustomerDetailsDto;

  @ApiProperty({
    description: 'Pricing details',
    type: PricingDetailsDto
  })
  pricing: PricingDetailsDto;

  @ApiProperty({
    description: 'Payment information',
    type: PaymentInfoDto
  })
  payment: PaymentInfoDto;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus
  })
  status: BookingStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-10T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-10T11:00:00Z'
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Cancellation timestamp'
  })
  cancelledAt?: Date;

  @ApiPropertyOptional({
    description: 'Check-in timestamp'
  })
  checkedInAt?: Date;

  @ApiPropertyOptional({
    description: 'Check-out timestamp'
  })
  checkedOutAt?: Date;

  @ApiPropertyOptional({
    description: 'Cancellation reason'
  })
  cancellationReason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes'
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Staff notes'
  })
  staffNotes?: string;

  @ApiPropertyOptional({
    description: 'Rating given by customer (1-5)',
    example: 5
  })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Review text from customer',
    example: 'Great space and excellent service!'
  })
  review?: string;

  @ApiPropertyOptional({
    description: 'Space information (if populated)'
  })
  space?: {
    id: string;
    name: string;
    category: string;
    address: {
      street: string;
      city: string;
      state: string;
    };
    images: string[];
  };

  @ApiPropertyOptional({
    description: 'Customer information (if populated)'
  })
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export class AvailabilityResponseDto {
  @ApiProperty({
    description: 'Space ID',
    example: '507f1f77bcf86cd799439011'
  })
  spaceId: string;

  @ApiProperty({
    description: 'Date checked',
    example: '2024-01-15'
  })
  date: string;

  @ApiProperty({
    description: 'Whether space is available',
    example: true
  })
  available: boolean;

  @ApiProperty({
    description: 'Available time slots',
    example: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '18:00' }
    ]
  })
  availableSlots: {
    start: string;
    end: string;
    durationHours: number;
  }[];

  @ApiProperty({
    description: 'Booked time slots',
    example: [
      { start: '12:00', end: '14:00', bookingId: '507f1f77bcf86cd799439012' }
    ]
  })
  bookedSlots: {
    start: string;
    end: string;
    bookingId: string;
    status: BookingStatus;
  }[];

  @ApiProperty({
    description: 'Operating hours for the day'
  })
  operatingHours: {
    open: string;
    close: string;
    closed: boolean;
  };

  @ApiPropertyOptional({
    description: 'Reason if not available',
    example: 'Space is closed on this date'
  })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Next available date',
    example: '2024-01-16'
  })
  nextAvailableDate?: string;
}