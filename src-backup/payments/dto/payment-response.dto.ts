import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundInfoResponseDto {
  @ApiProperty({ example: 'rfnd_abc123' })
  refundId: string;

  @ApiProperty({ example: 25000 })
  amount: number;

  @ApiProperty({ example: 250 })
  amountInRupees: number;

  @ApiProperty({ example: 'Customer requested cancellation' })
  reason: string;

  @ApiProperty({ example: 'processed', enum: ['pending', 'processed', 'failed'] })
  status: string;

  @ApiProperty({ example: '2024-11-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-11-15T10:35:00.000Z' })
  processedAt?: Date;

  @ApiPropertyOptional({ example: 'Insufficient balance' })
  failureReason?: string;
}

export class PaymentNotesResponseDto {
  @ApiProperty({ example: 'BK12345ABC' })
  bookingCode: string;

  @ApiProperty({ example: 'john@example.com' })
  customerEmail: string;

  @ApiProperty({ example: 'Conference Room A' })
  spaceName: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  customerName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  customerPhone?: string;
}

export class PaymentResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'order_abc123' })
  orderId: string;

  @ApiPropertyOptional({ example: 'pay_xyz789' })
  paymentId?: string;

  @ApiPropertyOptional({ example: 'generated_signature_hash' })
  signature?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  bookingId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  customerId: string;

  @ApiProperty({ example: 100000 })
  amount: number;

  @ApiProperty({ example: 1000 })
  amountInRupees: number;

  @ApiProperty({ example: 'INR' })
  currency: string;

  @ApiProperty({ 
    example: 'captured', 
    enum: ['created', 'authorized', 'captured', 'refunded', 'failed', 'cancelled']
  })
  status: string;

  @ApiPropertyOptional({ example: 'card' })
  method?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  bank?: string;

  @ApiPropertyOptional({ example: 'paytm' })
  wallet?: string;

  @ApiPropertyOptional({ example: 'john@paytm' })
  vpa?: string;

  @ApiPropertyOptional({ example: '1234' })
  cardLast4?: string;

  @ApiPropertyOptional({ example: 'Visa' })
  cardNetwork?: string;

  @ApiProperty({ type: [RefundInfoResponseDto] })
  refunds: RefundInfoResponseDto[];

  @ApiProperty({ example: 0 })
  totalRefunded: number;

  @ApiProperty({ example: 0 })
  totalRefundedInRupees: number;

  @ApiProperty({ example: 100000 })
  netAmount: number;

  @ApiProperty({ example: 1000 })
  netAmountInRupees: number;

  @ApiProperty({ example: 'RCP_123456789' })
  receipt: string;

  @ApiProperty({ type: PaymentNotesResponseDto })
  notes: PaymentNotesResponseDto;

  @ApiPropertyOptional({ example: 'Conference room booking payment' })
  description?: string;

  @ApiPropertyOptional({ example: 'PAYMENT_FAILED' })
  errorCode?: string;

  @ApiPropertyOptional({ example: 'Insufficient funds' })
  errorDescription?: string;

  @ApiProperty({ example: 0 })
  retryCount: number;

  @ApiPropertyOptional({ example: '2024-11-15T10:25:00.000Z' })
  lastRetryAt?: Date;

  @ApiProperty({ example: 2000 })
  fee: number;

  @ApiProperty({ example: 360 })
  tax: number;

  @ApiProperty({ example: '2024-11-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '2024-11-15T10:31:00.000Z' })
  authorizedAt?: Date;

  @ApiPropertyOptional({ example: '2024-11-15T10:31:30.000Z' })
  capturedAt?: Date;

  @ApiPropertyOptional({ example: '2024-11-15T10:32:00.000Z' })
  failedAt?: Date;

  @ApiPropertyOptional({ example: '2024-11-15T10:32:00.000Z' })
  cancelledAt?: Date;

  @ApiProperty({ example: true })
  isRefundable: boolean;

  @ApiProperty({ example: 2.5 })
  ageInHours: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: 'order_abc123' })
  orderId: string;

  @ApiProperty({ example: 100000 })
  amount: number;

  @ApiProperty({ example: 1000 })
  amountInRupees: number;

  @ApiProperty({ example: 'INR' })
  currency: string;

  @ApiProperty({ example: 'RCP_123456789' })
  receipt: string;

  @ApiProperty({ example: 'Conference room booking payment' })
  description: string;

  @ApiProperty({ type: PaymentNotesResponseDto })
  notes: PaymentNotesResponseDto;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  bookingId: string;

  @ApiProperty({ example: 'rzp_test_abc123' })
  key: string; // Razorpay key for frontend
}

export class PaymentAnalyticsDto {
  @ApiProperty({ example: 150 })
  totalPayments: number;

  @ApiProperty({ example: 140 })
  successfulPayments: number;

  @ApiProperty({ example: 8 })
  failedPayments: number;

  @ApiProperty({ example: 2 })
  cancelledPayments: number;

  @ApiProperty({ example: 15000000 })
  totalAmount: number;

  @ApiProperty({ example: 150000 })
  totalAmountInRupees: number;

  @ApiProperty({ example: 14000000 })
  capturedAmount: number;

  @ApiProperty({ example: 140000 })
  capturedAmountInRupees: number;

  @ApiProperty({ example: 500000 })
  totalRefunded: number;

  @ApiProperty({ example: 5000 })
  totalRefundedInRupees: number;

  @ApiProperty({ example: 13500000 })
  netRevenue: number;

  @ApiProperty({ example: 135000 })
  netRevenueInRupees: number;

  @ApiProperty({ example: 100000 })
  averageAmount: number;

  @ApiProperty({ example: 1000 })
  averageAmountInRupees: number;

  @ApiProperty({ example: 93.33 })
  successRate: number;

  @ApiProperty({ example: ['card', 'upi', 'netbanking', 'wallet'] })
  paymentMethods: string[];
}

export class PaginatedPaymentResponseDto {
  @ApiProperty({ type: [PaymentResponseDto] })
  data: PaymentResponseDto[];

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

export class WebhookResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Webhook processed successfully' })
  message: string;

  @ApiProperty({ example: 'payment.captured' })
  eventType?: string;

  @ApiProperty({ example: 'pay_xyz789' })
  paymentId?: string;
}