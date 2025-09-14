import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

@Schema({
  timestamps: true,
  collection: 'bookings'
})
export class Booking {
  @Prop({ required: true })
  bookingCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space', required: true })
  spaceId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({
    type: String,
    enum: BookingStatus,
    default: BookingStatus.PENDING
  })
  status: BookingStatus;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 0 })
  amountPaid: number;

  @Prop({ type: Object })
  customerDetails?: {
    name: string;
    email: string;
    phone?: string;
    specialRequests?: string;
  };

  @Prop({ type: Object })
  pricing?: {
    baseAmount: number;
    totalAmount: number;
    currency: string;
  };
}

export const BookingSchema = SchemaFactory.createForClass(Booking);