import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;
  private isDemoMode: boolean = false;

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('razorpay.keyId');
    const keySecret = this.configService.get<string>('razorpay.keySecret');

    // Check if we're in demo mode (no valid keys)
    this.isDemoMode = !keyId || !keySecret || keyId.includes('demo') || keySecret.includes('demo');

    if (!this.isDemoMode) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      console.log('Razorpay service running in demo mode');
    }
  }

  async createOrder(amount: number, bookingId: string) {
    if (this.isDemoMode) {
      // Demo mode: simulate order creation
      const demoOrder = {
        id: `order_demo_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR',
        receipt: bookingId,
        status: 'created'
      };
      console.log('Demo mode: Created mock order', demoOrder);
      return demoOrder;
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: bookingId,
      payment_capture: 1,
    };

    return this.razorpay.orders.create(options);
  }

  async verifyPayment(paymentData: any) {
    const { orderId, paymentId, signature } = paymentData;

    if (this.isDemoMode) {
      // Demo mode: always verify as successful
      console.log('Demo mode: Payment verification successful for', paymentId);
      return {
        verified: true,
        orderId,
        paymentId,
        signature: signature || 'demo_signature'
      };
    }

    const secret = this.configService.get<string>('razorpay.keySecret');

    // Create the expected signature using crypto
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    // Verify the signature
    if (expectedSignature === signature) {
      return {
        verified: true,
        orderId,
        paymentId,
        signature
      };
    } else {
      throw new Error('Payment verification failed: Invalid signature');
    }
  }

  async createRefund(paymentId: string, refundData: { amount?: number; reason: string; notes?: string }) {
    if (this.isDemoMode) {
      // Demo mode: simulate refund creation
      const demoRefund = {
        id: `refund_demo_${Date.now()}`,
        payment_id: paymentId,
        amount: refundData.amount || 1000, // Default amount in paise
        status: 'processed',
        notes: {
          reason: refundData.reason,
          ...refundData.notes && { notes: refundData.notes }
        }
      };
      console.log('Demo mode: Created mock refund', demoRefund);
      return demoRefund;
    }

    try {
      const refundOptions = {
        payment_id: paymentId,
        amount: refundData.amount, // Optional: full refund if not specified
        notes: {
          reason: refundData.reason,
          ...refundData.notes && { notes: refundData.notes }
        }
      };

      return await this.razorpay.payments.refund(paymentId, refundOptions);
    } catch (error) {
      console.error('Refund creation error:', error);
      throw new Error('Failed to create refund');
    }
  }

  async getRefund(refundId: string) {
    if (this.isDemoMode) {
      // Demo mode: simulate refund fetch
      const demoRefund = {
        id: refundId,
        status: 'processed',
        amount: 1000,
        created_at: Date.now() / 1000
      };
      console.log('Demo mode: Fetched mock refund', demoRefund);
      return demoRefund;
    }

    try {
      return await this.razorpay.refunds.fetch(refundId);
    } catch (error) {
      console.error('Refund fetch error:', error);
      throw new Error('Failed to fetch refund details');
    }
  }

  async getPaymentDetails(paymentId: string) {
    if (this.isDemoMode) {
      // Demo mode: simulate payment fetch
      const demoPayment = {
        id: paymentId,
        status: 'captured',
        amount: 1000,
        currency: 'INR'
      };
      console.log('Demo mode: Fetched mock payment', demoPayment);
      return demoPayment;
    }

    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Payment fetch error:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  async capturePayment(paymentId: string, amount: number) {
    if (this.isDemoMode) {
      // Demo mode: simulate payment capture
      const demoCapture = {
        id: paymentId,
        status: 'captured',
        amount: amount * 100
      };
      console.log('Demo mode: Captured mock payment', demoCapture);
      return demoCapture;
    }

    try {
      return await this.razorpay.payments.capture(paymentId, amount * 100, 'INR');
    } catch (error) {
      console.error('Payment capture error:', error);
      throw new Error('Failed to capture payment');
    }
  }
}