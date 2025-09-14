import { Injectable } from '@nestjs/common';

@Injectable()
export class RazorpayService {
  constructor() {}

  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    return {
      id: `order_${Date.now()}`,
      amount: amount * 100, // Convert to paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      status: 'created'
    };
  }

  async verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
    // Simple signature verification - in production, use proper Razorpay signature verification
    return true;
  }

  getKeyId() {
    return process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key';
  }
}