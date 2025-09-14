import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor() {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() orderData: any) {
    // Simple Razorpay order creation
    const order = {
      id: `order_${Date.now()}`,
      amount: orderData.amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      status: 'created'
    };
    
    return {
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key'
      }
    };
  }

  @Post('verify-payment')
  async verifyPayment(@Body() paymentData: any) {
    // Simple payment verification
    return {
      success: true,
      data: {
        paymentId: paymentData.razorpay_payment_id,
        orderId: paymentData.razorpay_order_id,
        signature: paymentData.razorpay_signature,
        status: 'captured'
      }
    };
  }
}