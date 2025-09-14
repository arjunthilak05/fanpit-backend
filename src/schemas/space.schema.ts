import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SpaceDocument = Space & Document;

export enum SpaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum SpaceType {
  COWORKING = 'coworking',
  EVENT_SPACE = 'event_space',
  MEETING_ROOM = 'meeting_room',
  CASUAL_SPACE = 'casual_space',
}

export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'hourly' | 'daily' | 'monthly' | 'bundle' | 'promo';
  basePrice: number;
  conditions: {
    timeSlots?: string[];
    dayOfWeek?: number[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    minDuration?: number;
    maxDuration?: number;
    peakMultiplier?: number;
  };
  discountPercentage?: number;
  promoCode?: string;
  isActive: boolean;
}

export interface Amenity {
  name: string;
  icon: string;
  description?: string;
}

export interface BusinessHours {
  day: number; // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "21:00"
}

@Schema({ timestamps: true })
export class Space {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object, required: true })
  location: Location;

  @Prop({ required: true, min: 1 })
  capacity: number;

  @Prop({ type: String, enum: SpaceType, required: true })
  type: SpaceType;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [Object], default: [] })
  amenities: Amenity[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  staffIds: Types.ObjectId[];

  @Prop({ type: [Object], required: true })
  pricingRules: PricingRule[];

  @Prop({ type: [Object], required: true })
  businessHours: BusinessHours[];

  @Prop({ type: String, enum: SpaceStatus, default: SpaceStatus.ACTIVE })
  status: SpaceStatus;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  metadata: {
    wifi: boolean;
    parking: boolean;
    airConditioning: boolean;
    kitchen: boolean;
    projector: boolean;
    whiteboard: boolean;
    soundSystem: boolean;
    security: boolean;
    [key: string]: any;
  };

  @Prop({ default: 0 })
  totalBookings: number;

  @Prop({ default: 0 })
  totalRevenue: number;

  @Prop()
  featuredImage?: string;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ type: Date })
  lastBookedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const SpaceSchema = SchemaFactory.createForClass(Space);