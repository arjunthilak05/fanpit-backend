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
    try {
      const order = await this.razorpayService.createOrder(amount, bookingId);

      console.log('Razorpay order created successfully:', order.id);
      console.log('Amount:', amount / 100, 'INR');
      console.log('Booking ID:', bookingId);
      
      // Return order with additional metadata for frontend
      return {
        ...order,
        booking_notes: {
          bookingId,
          originalAmount: amount,
          currency: 'INR'
        }
      };
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentData: any) {
    try {
      const verificationResult = await this.razorpayService.verifyPayment(paymentData);
      const { orderId, paymentId, signature } = paymentData;

      console.log('Razorpay payment verified successfully:', paymentId);
      console.log('Order ID:', orderId);
      console.log('Verification result:', verificationResult.verified);

      return {
        success: true,
        verified: verificationResult.verified,
        payment: {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          signature: signature,
          status: 'captured',
          capturedAt: new Date(),
          amount: paymentData.amount || 0,
          currency: 'INR'
        },
        message: verificationResult.verified ? 'Payment verified successfully' : 'Payment verification failed'
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  async handleWebhook(payload: any) {
    try {
      const { event, payload: eventPayload } = payload;

      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(eventPayload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(eventPayload);
          break;
        case 'payment.authorized':
          await this.handlePaymentAuthorized(eventPayload);
          break;
        case 'refund.created':
          await this.handleRefundCreated(eventPayload);
          break;
        default:
          console.log('Unhandled webhook event:', event);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  private async handlePaymentCaptured(payload: any) {
    const { payment } = payload;

    // Update payment status in database
    const paymentDoc = await this.paymentModel.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      {
        status: 'captured',
        capturedAt: new Date(),
        razorpayResponse: payment,
        'metadata.paymentSource': 'webhook'
      },
      { new: true }
    );

    if (paymentDoc) {
      console.log(`Payment ${payment.id} captured successfully`);
    }
  }

  private async handlePaymentFailed(payload: any) {
    const { payment } = payload;

    // Update payment status in database
    await this.paymentModel.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      {
        status: 'failed',
        failedAt: new Date(),
        failureReason: payment.error_description || 'Payment failed',
        razorpayResponse: payment,
        'metadata.paymentSource': 'webhook'
      }
    );

    console.log(`Payment ${payment.id} failed`);
  }

  private async handlePaymentAuthorized(payload: any) {
    const { payment } = payload;

    // Update payment status in database
    await this.paymentModel.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      {
        status: 'authorized',
        authorizedAt: new Date(),
        razorpayResponse: payment,
        'metadata.paymentSource': 'webhook'
      }
    );

    console.log(`Payment ${payment.id} authorized`);
  }

  private async handleRefundCreated(payload: any) {
    const { refund } = payload;

    // Update payment with refund details
    await this.paymentModel.findOneAndUpdate(
      { razorpayPaymentId: refund.payment_id },
      {
        $push: {
          refunds: {
            refundId: refund.id,
            amount: refund.amount,
            reason: refund.notes?.reason || 'Refund processed',
            processedAt: new Date(refund.created_at * 1000),
            notes: refund.notes
          }
        },
        'metadata.paymentSource': 'webhook'
      }
    );

    console.log(`Refund ${refund.id} created for payment ${refund.payment_id}`);
  }

  async getPaymentHistory(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const payments = await this.paymentModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('bookingId')
      .populate('userId', 'name email');

    const total = await this.paymentModel.countDocuments();

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPayment(paymentId: string) {
    return this.paymentModel
      .findById(paymentId)
      .populate('bookingId')
      .populate('userId', 'name email');
  }

  async getBookingPayments(bookingId: string) {
    return this.paymentModel
      .find({ bookingId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
  }

  async processRefund(paymentId: string, refundData: { amount?: number; reason: string; notes?: string }) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!payment.razorpayPaymentId) {
      throw new Error('Payment not completed, cannot process refund');
    }

    // Create refund through Razorpay
    const refund = await this.razorpayService.createRefund(payment.razorpayPaymentId, refundData);

    // Update payment record with refund
    await this.paymentModel.findByIdAndUpdate(paymentId, {
      $push: {
        refunds: {
          refundId: refund.id,
          amount: refund.amount,
          reason: refundData.reason,
          processedAt: new Date(),
          notes: refundData.notes
        }
      }
    });

    return refund;
  }

  async getRefundStatus(paymentId: string, refundId: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const refund = payment.refunds.find((r: any) => r.refundId === refundId);
    if (!refund) {
      throw new Error('Refund not found');
    }

    // Get refund details from Razorpay
    const refundDetails = await this.razorpayService.getRefund(refundId);

    return {
      refundId: refund.refundId,
      amount: refund.amount,
      status: refundDetails.status,
      processedAt: refund.processedAt,
      reason: refund.reason,
      notes: refund.notes
    };
  }

  async getPaymentAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const payments = await this.paymentModel.find({
      createdAt: { $gte: startDate }
    });

    const totalRevenue = payments
      .filter(p => p.status === 'captured')
      .reduce((sum, p) => sum + (p.amount / 100), 0); // Convert from paise to rupees

    const totalTransactions = payments.length;
    const successfulTransactions = payments.filter(p => p.status === 'captured').length;
    const failedTransactions = payments.filter(p => p.status === 'failed').length;

    return {
      totalRevenue,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
      averageTransactionValue: totalTransactions > 0 ? totalRevenue / successfulTransactions : 0,
      period
    };
  }

  async getPaymentStats() {
    const totalPayments = await this.paymentModel.countDocuments();
    const capturedPayments = await this.paymentModel.countDocuments({ status: 'captured' });
    const failedPayments = await this.paymentModel.countDocuments({ status: 'failed' });
    const pendingPayments = await this.paymentModel.countDocuments({ status: 'pending' });

    // Calculate today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPayments = await this.paymentModel.find({
      status: 'captured',
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayRevenue = todayPayments.reduce((sum, p) => sum + (p.amount / 100), 0);

    // Calculate total revenue
    const allCapturedPayments = await this.paymentModel.find({ status: 'captured' });
    const totalRevenue = allCapturedPayments.reduce((sum, p) => sum + (p.amount / 100), 0);

    // Calculate refunded amount
    const refundedAmount = allCapturedPayments.reduce((sum, p) => {
      return sum + p.refunds.reduce((refundSum, r: any) => refundSum + (r.amount / 100), 0);
    }, 0);

    return {
      totalRevenue,
      totalTransactions: totalPayments,
      pendingPayments,
      failedPayments,
      refundedAmount,
      todayRevenue,
      capturedPayments
    };
  }
}