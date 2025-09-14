import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiscountResponseDto {
  @ApiProperty({ example: 'promo' })
  type: string;

  @ApiProperty({ example: 100 })
  amount: number;

  @ApiProperty({ example: 'Welcome discount' })
  description: string;
}

export class PricingResponseDto {
  @ApiProperty({ example: 1000 })
  baseAmount: number;

  @ApiProperty({ type: [DiscountResponseDto] })
  discounts: DiscountResponseDto[];

  @ApiProperty({ example: 180 })
  taxes: number;

  @ApiProperty({ example: 1080 })
  totalAmount: number;

  @ApiPropertyOptional({ example: 'WELCOME20' })
  promoCode?: string;
}

export class PaymentResponseDto {
  @ApiPropertyOptional({ example: 'order_123456789' })
  orderId?: string;

  @ApiPropertyOptional({ example: 'pay_123456789' })
  paymentId?: string;

  @ApiPropertyOptional({ example: 'razorpay_signature_123' })
  signature?: string;

  @ApiPropertyOptional({ example: 'card' })
  method?: string;

  @ApiProperty({ example: 'paid', enum: ['pending', 'paid', 'failed', 'refunded'] })
  status: string;
}

export class CustomerDetailsResponseDto {
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+919876543210' })
  phone: string;

  @ApiPropertyOptional({ example: 'Team meeting' })
  eventPurpose?: string;

  @ApiPropertyOptional({ example: 'Need projector setup' })
  specialRequests?: string;

  @ApiProperty({ example: 10 })
  guestCount: number;
}

export class SpaceInfoResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Conference Room A' })
  name: string;

  @ApiProperty({ example: '123 Business Street, Mumbai' })
  address: string;

  @ApiProperty({ example: 50 })
  capacity: number;

  @ApiPropertyOptional({ example: ['Projector', 'WiFi', 'AC'] })
  amenities?: string[];
}

export class BookingResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'BK12345ABC' })
  bookingCode: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  spaceId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  customerId: string;

  @ApiProperty({ example: '2024-12-01T00:00:00.000Z' })
  bookingDate: Date;

  @ApiProperty({ example: '09:00' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  endTime: string;

  @ApiProperty({ example: 8 })
  duration: number;

  @ApiProperty({ type: CustomerDetailsResponseDto })
  customerDetails: CustomerDetailsResponseDto;

  @ApiProperty({ type: PricingResponseDto })
  pricing: PricingResponseDto;

  @ApiProperty({ type: PaymentResponseDto })
  payment: PaymentResponseDto;

  @ApiProperty({ 
    example: 'confirmed', 
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show']
  })
  status: string;

  @ApiProperty({ example: '2024-11-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '2024-11-15T11:00:00.000Z' })
  cancelledAt?: Date;

  @ApiPropertyOptional({ example: '2024-12-01T09:00:00.000Z' })
  checkedInAt?: Date;

  @ApiPropertyOptional({ example: '2024-12-01T17:00:00.000Z' })
  checkedOutAt?: Date;

  @ApiPropertyOptional({ example: 'Customer requested cancellation' })
  cancellationReason?: string;

  @ApiPropertyOptional({ example: 900 })
  refundAmount?: number;

  @ApiPropertyOptional({ example: 'Customer arrived early' })
  notes?: string;

  @ApiPropertyOptional({ example: 15 })
  bufferTime?: number;

  @ApiPropertyOptional({ example: false })
  reminderSent?: boolean;

  @ApiPropertyOptional({ example: 5 })
  rating?: number;

  @ApiPropertyOptional({ example: 'Great space!' })
  review?: string;

  @ApiPropertyOptional({ type: SpaceInfoResponseDto })
  space?: SpaceInfoResponseDto;
}

export class AvailabilitySlotDto {
  @ApiProperty({ example: '09:00' })
  startTime: string;

  @ApiProperty({ example: '10:00' })
  endTime: string;

  @ApiProperty({ example: true })
  available: boolean;

  @ApiPropertyOptional({ example: 500 })
  price?: number;
}

export class AvailabilityResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  spaceId: string;

  @ApiProperty({ example: '2024-12-01' })
  date: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ type: [AvailabilitySlotDto] })
  availableSlots: AvailabilitySlotDto[];

  @ApiProperty({ type: [BookingResponseDto] })
  existingBookings: BookingResponseDto[];

  @ApiProperty({ example: '09:00' })
  spaceOpenTime: string;

  @ApiProperty({ example: '22:00' })
  spaceCloseTime: string;

  @ApiPropertyOptional({ example: 'Space is closed on this day' })
  unavailabilityReason?: string;
}

export class BookingAnalyticsDto {
  @ApiProperty({ example: 150 })
  totalBookings: number;

  @ApiProperty({ example: 120 })
  confirmedBookings: number;

  @ApiProperty({ example: 10 })
  cancelledBookings: number;

  @ApiProperty({ example: 5 })
  noShowBookings: number;

  @ApiProperty({ example: 50000 })
  totalRevenue: number;

  @ApiProperty({ example: 45000 })
  paidRevenue: number;

  @ApiProperty({ example: 80 })
  occupancyRate: number;

  @ApiProperty({ example: 4.5 })
  averageRating: number;

  @ApiProperty({ example: 85 })
  reviewCount: number;
}

export class PaginatedBookingResponseDto {
  @ApiProperty({ type: [BookingResponseDto] })
  data: BookingResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}