import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  CREATED = 'created',
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CARD = 'card',
  UPI = 'upi',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
}

export interface RefundDetails {
  refundId: string;
  amount: number;
  reason: string;
  processedAt: Date;
  notes?: string;
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  razorpayOrderId: string;

  @Prop()
  razorpayPaymentId?: string;

  @Prop({ required: true, min: 0 })
  amount: number; // in paise

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.CREATED })
  status: PaymentStatus;

  @Prop({ type: String, enum: PaymentMethod })
  method?: PaymentMethod;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  razorpayResponse?: any;

  @Prop({ type: [Object], default: [] })
  refunds: RefundDetails[];

  @Prop()
  failureReason?: string;

  @Prop()
  capturedAt?: Date;

  @Prop()
  authorizedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop({ type: Object })
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    paymentSource?: string;
    [key: string]: any;
  };

  @Prop({ type: Object })
  webhookEvents: {
    eventId: string;
    eventType: string;
    processedAt: Date;
    payload: any;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);