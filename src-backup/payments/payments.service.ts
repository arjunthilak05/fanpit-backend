import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  constructor() {}

  async createOrder(amount: number, currency: string = 'INR') {
    return {
      id: `order_${Date.now()}`,
      amount: amount * 100, // Convert to paise
      currency: currency,
      status: 'created'
    };
  }

  async verifyPayment(paymentData: any) {
    return {
      success: true,
      paymentId: paymentData.razorpay_payment_id,
      status: 'captured'
    };
  }
}