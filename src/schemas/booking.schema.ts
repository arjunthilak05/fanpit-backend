import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export interface PriceBreakdown {
  baseAmount: number;
  taxes: number;
  discounts: number;
  totalAmount: number;
  appliedRules: string[];
  promoCode?: string;
}

export interface CheckInDetails {
  checkedInAt: Date;
  checkedInBy: Types.ObjectId;
  notes?: string;
  actualStartTime?: string;
}

export interface CheckOutDetails {
  checkedOutAt: Date;
  checkedOutBy: Types.ObjectId;
  notes?: string;
  actualEndTime?: string;
  damageReported?: boolean;
  additionalCharges?: number;
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space', required: true })
  spaceId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string; // "10:00"

  @Prop({ required: true })
  endTime: string; // "14:00"

  @Prop({ required: true, min: 0 })
  duration: number; // in hours

  @Prop({ type: Object, required: true })
  priceBreakdown: PriceBreakdown;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ required: true, unique: true })
  bookingCode: string;

  @Prop()
  qrCode?: string;

  @Prop()
  paymentId?: string;

  @Prop()
  razorpayOrderId?: string;

  @Prop()
  razorpayPaymentId?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Object })
  checkInDetails?: CheckInDetails;

  @Prop({ type: Object })
  checkOutDetails?: CheckOutDetails;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundedAt?: Date;

  @Prop({ type: [String], default: [] })
  notifications: string[];

  @Prop({ default: false })
  reminderSent: boolean;

  @Prop({ default: false })
  feedbackRequested: boolean;

  @Prop({ type: Object })
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    bookingSource?: string;
    specialRequests?: string;
    guestCount?: number;
    [key: string]: any;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Generate booking code before saving
BookingSchema.pre('save', function (next) {
  if (!this.bookingCode) {
    this.bookingCode = `FP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  next();
});