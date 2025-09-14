import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor(private configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('razorpay.keyId'),
      key_secret: this.configService.get<string>('razorpay.keySecret'),
    });
  }

  async createOrder(amount: number, receipt: string) {
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt,
      payment_capture: 1,
    };

    return this.razorpay.orders.create(options);
  }

  async verifyPayment(paymentData: any) {
    // Implement payment verification logic
    return { verified: true };
  }
}