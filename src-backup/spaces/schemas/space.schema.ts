import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SpaceDocument = Space & Document;

@Schema({ timestamps: true })
export class Address {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  zipCode: string;

  @Prop({
    type: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 }
    },
    required: false,
    _id: false
  })
  coordinates?: {
    lat: number;
    lng: number;
  };
}

@Schema({ _id: false })
export class PeakHours {
  @Prop({ required: true })
  start: string; // HH:mm format

  @Prop({ required: true })
  end: string; // HH:mm format

  @Prop({ required: true, min: 0.1, max: 10 })
  multiplier: number;
}

@Schema({ _id: false })
export class TimeBlock {
  @Prop({ required: true, min: 1 })
  duration: number; // in hours

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true })
  title: string;
}

@Schema({ _id: false })
export class MonthlyPass {
  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: false })
  unlimited: boolean;
}

@Schema({ _id: false })
export class SpecialEventPricing {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, min: 0 })
  price: number;
}

@Schema({ _id: false })
export class Pricing {
  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ 
    required: true, 
    enum: ['hourly', 'daily', 'free'],
    default: 'hourly'
  })
  priceType: string;

  @Prop({ type: PeakHours })
  peakHours?: PeakHours;

  @Prop({ min: 0.1, max: 2, default: 1 })
  offPeakMultiplier?: number;

  @Prop({ min: 0.1, max: 3, default: 1 })
  weekendMultiplier?: number;

  @Prop({ type: [TimeBlock] })
  timeBlocks?: TimeBlock[];

  @Prop({ type: MonthlyPass })
  monthlyPass?: MonthlyPass;

  @Prop({ type: [SpecialEventPricing] })
  specialEventPricing?: SpecialEventPricing[];
}

@Schema({ _id: false })
export class PromoCode {
  @Prop({ required: true, uppercase: true, unique: true })
  code: string;

  @Prop({ required: true, min: 0 })
  discount: number;

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  type: string;

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true })
  validTo: Date;

  @Prop({ min: 1 })
  usageLimit?: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ _id: false })
export class OperatingHour {
  @Prop({ required: true })
  open: string; // HH:mm format

  @Prop({ required: true })
  close: string; // HH:mm format

  @Prop({ default: false })
  closed: boolean;
}

@Schema({ timestamps: true })
export class Space {
  @Prop({ required: true, trim: true, minlength: 3, maxlength: 100 })
  name: string;

  @Prop({ required: true, trim: true, minlength: 10, maxlength: 2000 })
  description: string;

  @Prop({ required: true, type: Address })
  address: Address;

  @Prop({ required: true, min: 1, max: 10000 })
  capacity: number;

  @Prop({ 
    required: true, 
    enum: ['coworking', 'event', 'meeting', 'casual'],
    lowercase: true
  })
  category: string;

  @Prop({ 
    type: [String], 
    required: true,
    validate: {
      validator: function(amenities: string[]) {
        return amenities && amenities.length > 0;
      },
      message: 'At least one amenity is required'
    }
  })
  amenities: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  })
  ownerId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: Pricing })
  pricing: Pricing;

  @Prop({ type: [PromoCode], default: [] })
  promoCodes: PromoCode[];

  // Operating hours - simplified for now
  @Prop({ type: Object, default: {} })
  operatingHours: any;

  @Prop({ type: [Date], default: [] })
  blackoutDates: Date[];

  // Analytics and Stats
  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @Prop({ default: 0, min: 0 })
  totalBookings: number;

  @Prop({ default: 0, min: 0 })
  totalRevenue: number;

  @Prop({ default: 0, min: 0 })
  viewCount: number;

  // Status
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isVerified: boolean;
}

export const SpaceSchema = SchemaFactory.createForClass(Space);

// Database indexes for performance optimization
SpaceSchema.index({ 'address.coordinates': '2dsphere' });
SpaceSchema.index({ category: 1, isActive: 1, createdAt: -1 });
SpaceSchema.index({ ownerId: 1, isActive: 1 });
SpaceSchema.index({ 'pricing.basePrice': 1, category: 1 });
SpaceSchema.index({ rating: -1, reviewCount: -1 });
SpaceSchema.index({ totalBookings: -1 });
SpaceSchema.index({ totalRevenue: -1 });
SpaceSchema.index({ viewCount: -1 });
SpaceSchema.index({ capacity: 1 });
SpaceSchema.index({ 'address.city': 1 });
SpaceSchema.index({ 'address.state': 1 });
SpaceSchema.index({ isActive: 1 });
SpaceSchema.index({ createdAt: -1 });
SpaceSchema.index({ updatedAt: -1 });

// Text index for search functionality
SpaceSchema.index({
  name: 'text',
  description: 'text',
  'address.street': 'text',
  'address.city': 'text',
  amenities: 'text'
});

// Compound indexes for complex queries
SpaceSchema.index({ category: 1, 'address.city': 1, isActive: 1 });
SpaceSchema.index({ 'pricing.basePrice': 1, capacity: 1, isActive: 1 });
SpaceSchema.index({ rating: -1, totalBookings: -1, isActive: 1 });
SpaceSchema.index({ ownerId: 1, isActive: 1, createdAt: -1 });
SpaceSchema.index({ 'address.city': 1, category: 1, rating: -1 });

// Virtual fields and computed properties
SpaceSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

SpaceSchema.virtual('isAvailable').get(function() {
  return this.isActive;
});

SpaceSchema.virtual('occupancyRate').get(function() {
  if (this.totalBookings === 0) return 0;
  // This would need to be calculated based on actual bookings
  return Math.min(100, (this.totalBookings / 30) * 100); // Simplified calculation
});

SpaceSchema.virtual('revenuePerBooking').get(function() {
  if (this.totalBookings === 0) return 0;
  return this.totalRevenue / this.totalBookings;
});

SpaceSchema.virtual('ratingStars').get(function() {
  const rating = this.rating || 0;
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
});

SpaceSchema.virtual('isPopular').get(function() {
  return this.totalBookings >= 50 && this.rating >= 4.0;
});

SpaceSchema.virtual('isNew').get(function() {
  const now = new Date();
  const createdAt = this.createdAt || now;
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
});

SpaceSchema.virtual('pricePerHourFormatted').get(function() {
  return `₹${this.pricing.basePrice.toLocaleString('en-IN')}`;
});

SpaceSchema.virtual('amenitiesList').get(function() {
  return this.amenities.join(', ');
});

SpaceSchema.virtual('hasHighRating').get(function() {
  return this.rating >= 4.5;
});

SpaceSchema.virtual('isFullyBooked').get(function() {
  return this.occupancyRate >= 100;
});

// Schema relationships and population strategies
SpaceSchema.virtual('owner', {
  ref: 'User',
  localField: 'ownerId',
  foreignField: '_id',
  justOne: true
});

SpaceSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'spaceId',
  justOne: false
});

SpaceSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'spaceId',
  justOne: false
});



// Pre-save middleware
SpaceSchema.pre('save', function(next) {
  // Validate operating hours
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of days) {
    const hours = this.operatingHours[day];
    if (hours && !hours.closed) {
      if (!hours.open || !hours.close) {
        return next(new Error(`Operating hours for ${day} are incomplete`));
      }
      if (hours.open >= hours.close) {
        return next(new Error(`Invalid operating hours for ${day}: open time must be before close time`));
      }
    }
  }

  // Validate pricing
  if (this.pricing.peakHours && this.pricing.peakHours.start >= this.pricing.peakHours.end) {
    return next(new Error('Peak hours: start time must be before end time'));
  }

  next();
});