import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private razorpayService: RazorpayService,
  ) {}

  async createOrder(amount: number, bookingId: string) {
    return this.razorpayService.createOrder(amount, bookingId);
  }

  async verifyPayment(paymentData: any) {
    return this.razorpayService.verifyPayment(paymentData);
  }

  async handleWebhook(payload: any) {
    // Handle Razorpay webhooks
    return { success: true };
  }
}