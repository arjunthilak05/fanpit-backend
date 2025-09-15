import { Controller, Post, Body, UseGuards, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService
  ) {}

  @Public()
  @Post('create-order')
  async createOrder(@Body() createOrderDto: any) {
    const order = await this.paymentsService.createOrder(
      createOrderDto.amount,
      createOrderDto.bookingId,
    );
    return {
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: this.configService.get<string>('razorpay.keyId')
      }
    };
  }

  @Public()
  @Post('verify')
  async verifyPayment(@Body() verifyPaymentDto: any) {
    const result = await this.paymentsService.verifyPayment(verifyPaymentDto);
    return { success: true, ...result };
  }

  @Public()
  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    try {
      // Verify webhook signature if secret is configured
      const webhookSecret = this.configService.get<string>('razorpay.webhookSecret');
      if (webhookSecret) {
        // In a real implementation, you would verify the signature here
        // This is a simplified version for demo purposes
        console.log('Webhook received:', payload.event);
      }

      const result = await this.paymentsService.handleWebhook(payload);
      return result;
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  @Get('history')
  @ApiBearerAuth('access-token')
  async getPaymentHistory(
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    try {
      const payments = await this.paymentsService.getPaymentHistory(+page, +limit);
      return { success: true, data: payments };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get(':paymentId')
  @ApiBearerAuth('access-token')
  async getPayment(@Param('paymentId') paymentId: string) {
    try {
      const payment = await this.paymentsService.getPayment(paymentId);
      return { success: true, data: payment };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('booking/:bookingId')
  @ApiBearerAuth('access-token')
  async getBookingPayments(@Param('bookingId') bookingId: string) {
    try {
      const payments = await this.paymentsService.getBookingPayments(bookingId);
      return { success: true, data: payments };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post(':paymentId/refund')
  @ApiBearerAuth('access-token')
  async processRefund(
    @Param('paymentId') paymentId: string,
    @Body() refundData: { amount?: number; reason: string; notes?: string }
  ) {
    try {
      const result = await this.paymentsService.processRefund(paymentId, refundData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get(':paymentId/refund/:refundId')
  @ApiBearerAuth('access-token')
  async getRefundStatus(
    @Param('paymentId') paymentId: string,
    @Param('refundId') refundId: string
  ) {
    try {
      const result = await this.paymentsService.getRefundStatus(paymentId, refundId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('analytics/overview')
  @ApiBearerAuth('access-token')
  async getPaymentAnalytics(@Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month') {
    try {
      const analytics = await this.paymentsService.getPaymentAnalytics(period);
      return { success: true, data: analytics };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('stats/summary')
  @ApiBearerAuth('access-token')
  async getPaymentStats() {
    try {
      const stats = await this.paymentsService.getPaymentStats();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}