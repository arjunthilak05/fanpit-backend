import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Transform } from 'class-transformer';

export type PromoCodeDocument = PromoCode & Document;

export enum PromoCodeType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_HOURS = 'free_hours',
  BUY_ONE_GET_ONE = 'buy_one_get_one'
}

export enum PromoCodeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
  PAUSED = 'paused'
}

export enum DiscountScope {
  GLOBAL = 'global',
  CATEGORY = 'category',
  SPACE = 'space',
  USER = 'user',
  FIRST_TIME_USER = 'first_time_user'
}

@Schema({ _id: false })
export class UsageRestrictions {
  @Prop({ min: 0 })
  minOrderAmount?: number;

  @Prop({ min: 0 })
  maxOrderAmount?: number;

  @Prop({ min: 0 })
  maxDiscountAmount?: number;

  @Prop({ min: 1 })
  minBookingDuration?: number;

  @Prop({ min: 1 })
  maxBookingDuration?: number;

  @Prop({ type: [String], default: [] })
  applicableCategories: string[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Space', default: [] })
  applicableSpaces: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  applicableUsers: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  excludedUsers: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  applicableLocations: string[];

  @Prop({ type: [String], default: [] })
  excludedLocations: string[];

  @Prop({ type: [Number], default: [] })
  applicableDaysOfWeek: number[]; // 0-6, Sunday = 0

  @Prop({ type: [String], default: [] })
  applicableTimeSlots: string[]; // "09:00-12:00", "14:00-18:00"

  @Prop({ default: false })
  firstBookingOnly: boolean;

  @Prop({ default: false })
  newUsersOnly: boolean;

  @Prop({ min: 0 })
  maxUsesPerUser?: number;

  @Prop({ min: 0 })
  maxUsesPerDay?: number;

  @Prop({ min: 0 })
  cooldownPeriodHours?: number; // Hours between uses by same user
}

@Schema({ _id: false })
export class StackingRules {
  @Prop({ default: false })
  canStackWithOtherPromocodes: boolean;

  @Prop({ default: true })
  canStackWithPlatformDiscounts: boolean;

  @Prop({ default: true })
  canStackWithSpaceDiscounts: boolean;

  @Prop({ type: [String], default: [] })
  stackablePromocodes: string[];

  @Prop({ type: [String], default: [] })
  nonStackablePromocodes: string[];

  @Prop({ enum: ['best', 'first', 'last', 'stack'], default: 'best' })
  stackingStrategy: string;
}

@Schema({ _id: false })
export class PromoCodeUsage {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  })
  bookingId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, min: 0 })
  discountAmount: number;

  @Prop({ required: true, min: 0 })
  originalAmount: number;

  @Prop({ required: true, min: 0 })
  finalAmount: number;

  @Prop({ required: true, default: Date.now })
  usedAt: Date;

  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ trim: true })
  userAgent?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

@Schema({ _id: false })
export class PromoCodeAnalytics {
  @Prop({ default: 0 })
  totalViews: number;

  @Prop({ default: 0 })
  totalAttempts: number;

  @Prop({ default: 0 })
  successfulUses: number;

  @Prop({ default: 0 })
  failedUses: number;

  @Prop({ default: 0 })
  totalDiscountGiven: number;

  @Prop({ default: 0 })
  totalRevenueGenerated: number;

  @Prop({ default: 0 })
  averageDiscountAmount: number;

  @Prop({ default: 0 })
  conversionRate: number; // (successful uses / attempts) * 100

  @Prop({ type: Object, default: {} })
  usageByCategory: Record<string, number>;

  @Prop({ type: Object, default: {} })
  usageByLocation: Record<string, number>;

  @Prop({ type: Object, default: {} })
  usageByTimeSlot: Record<string, number>;

  @Prop({ type: Object, default: {} })
  failureReasons: Record<string, number>;
}

@Schema({ timestamps: true })
export class PromoCode {
  @Transform(({ value }) => value?.toString())
  _id: string;

  @Prop({ 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[A-Z0-9_]+$/,
    index: true
  })
  code: string;

  @Prop({ 
    required: true, 
    trim: true,
    minlength: 5,
    maxlength: 200
  })
  description: string;

  @Prop({ 
    required: true,
    enum: Object.values(PromoCodeType),
    index: true
  })
  type: PromoCodeType;

  @Prop({ 
    enum: Object.values(DiscountScope),
    default: DiscountScope.GLOBAL,
    index: true
  })
  scope: DiscountScope;

  @Prop({ 
    required: true,
    min: 0,
    max: function() {
      return this.type === PromoCodeType.PERCENTAGE ? 100 : Number.MAX_SAFE_INTEGER;
    }
  })
  value: number; // percentage or fixed amount or free hours

  @Prop({ 
    enum: Object.values(PromoCodeStatus),
    default: PromoCodeStatus.ACTIVE,
    index: true
  })
  status: PromoCodeStatus;

  @Prop({ required: true, index: true })
  validFrom: Date;

  @Prop({ required: true, index: true })
  validUntil: Date;

  @Prop({ min: 1 })
  usageLimit?: number;

  @Prop({ default: 0, min: 0 })
  currentUsage: number;

  @Prop({ min: 1 })
  usageLimitPerUser?: number;

  @Prop({ type: UsageRestrictions, default: {} })
  restrictions: UsageRestrictions;

  @Prop({ type: StackingRules, default: {} })
  stackingRules: StackingRules;

  @Prop({ type: [PromoCodeUsage], default: [] })
  usageHistory: PromoCodeUsage[];

  @Prop({ type: PromoCodeAnalytics, default: {} })
  analytics: PromoCodeAnalytics;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User'
  })
  lastModifiedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  campaignName?: string;

  @Prop({ trim: true })
  campaignId?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ trim: true })
  internalNotes?: string;

  @Prop({ trim: true })
  publicMessage?: string; // Message shown to users when applying

  @Prop({ default: 0 })
  priority: number; // Higher priority codes apply first

  @Prop({ default: false })
  isAutomatic: boolean; // Automatically applied when conditions are met

  @Prop({ default: false })
  isHidden: boolean; // Hidden from public listings

  @Prop({ default: false })
  requiresApproval: boolean; // Requires manual approval for each use

  @Prop({ type: [String], default: [] })
  approvedBy: string[]; // List of user IDs who can approve usage

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ type: Date })
  pausedAt?: Date;

  @Prop({ trim: true })
  pauseReason?: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User'
  })
  deletedBy?: MongooseSchema.Types.ObjectId;
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);

// Indexes for performance
PromoCodeSchema.index({ code: 1 }, { unique: true });
PromoCodeSchema.index({ status: 1, validFrom: 1, validUntil: 1 });
PromoCodeSchema.index({ type: 1, scope: 1 });
PromoCodeSchema.index({ createdBy: 1, status: 1 });
PromoCodeSchema.index({ campaignId: 1, status: 1 });
PromoCodeSchema.index({ validUntil: 1, status: 1 });
PromoCodeSchema.index({ isAutomatic: 1, status: 1 });
PromoCodeSchema.index({ priority: -1, status: 1 });
PromoCodeSchema.index({ 'restrictions.applicableCategories': 1 });
PromoCodeSchema.index({ 'restrictions.applicableSpaces': 1 });
PromoCodeSchema.index({ 'restrictions.applicableUsers': 1 });
PromoCodeSchema.index({ isDeleted: 1, deletedAt: 1 });

// Text search index
PromoCodeSchema.index({
  code: 'text',
  description: 'text',
  campaignName: 'text',
  tags: 'text'
});

// TTL index for expired codes (cleanup after 1 year)
PromoCodeSchema.index(
  { validUntil: 1 },
  { 
    expireAfterSeconds: 365 * 24 * 60 * 60,
    partialFilterExpression: { 
      status: PromoCodeStatus.EXPIRED,
      isDeleted: true
    }
  }
);

// Virtual fields
PromoCodeSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.status === PromoCodeStatus.ACTIVE &&
         this.validFrom <= now &&
         this.validUntil >= now &&
         (!this.usageLimit || this.currentUsage < this.usageLimit) &&
         !this.isDeleted;
});

PromoCodeSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

PromoCodeSchema.virtual('isExhausted').get(function() {
  return this.usageLimit && this.currentUsage >= this.usageLimit;
});

PromoCodeSchema.virtual('remainingUses').get(function() {
  if (!this.usageLimit) return null;
  return Math.max(0, this.usageLimit - this.currentUsage);
});

PromoCodeSchema.virtual('usagePercentage').get(function() {
  if (!this.usageLimit) return 0;
  return (this.currentUsage / this.usageLimit) * 100;
});

PromoCodeSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.validUntil.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance methods
PromoCodeSchema.methods.canBeUsedBy = function(
  userId: string,
  bookingDetails: any
): { canUse: boolean; reason?: string } {
  // Check if promo code is valid
  if (!this.isValid) {
    if (this.isExpired) return { canUse: false, reason: 'EXPIRED' };
    if (this.isExhausted) return { canUse: false, reason: 'EXHAUSTED' };
    if (this.status !== PromoCodeStatus.ACTIVE) return { canUse: false, reason: 'INACTIVE' };
    return { canUse: false, reason: 'INVALID' };
  }

  // Check user-specific restrictions
  if (this.restrictions.applicableUsers.length > 0) {
    if (!this.restrictions.applicableUsers.includes(userId)) {
      return { canUse: false, reason: 'USER_NOT_ELIGIBLE' };
    }
  }

  if (this.restrictions.excludedUsers.includes(userId)) {
    return { canUse: false, reason: 'USER_EXCLUDED' };
  }

  // Check per-user usage limit
  if (this.restrictions.maxUsesPerUser) {
    const userUsages = this.usageHistory.filter(usage => usage.userId.toString() === userId);
    if (userUsages.length >= this.restrictions.maxUsesPerUser) {
      return { canUse: false, reason: 'USER_LIMIT_EXCEEDED' };
    }
  }

  // Check cooldown period
  if (this.restrictions.cooldownPeriodHours) {
    const lastUsage = this.usageHistory
      .filter(usage => usage.userId.toString() === userId)
      .sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime())[0];
    
    if (lastUsage) {
      const cooldownEnd = new Date(lastUsage.usedAt.getTime() + (this.restrictions.cooldownPeriodHours * 60 * 60 * 1000));
      if (new Date() < cooldownEnd) {
        return { canUse: false, reason: 'COOLDOWN_ACTIVE' };
      }
    }
  }

  // Check booking-specific restrictions
  if (bookingDetails) {
    // Check minimum order amount
    if (this.restrictions.minOrderAmount && bookingDetails.amount < this.restrictions.minOrderAmount) {
      return { canUse: false, reason: 'MIN_ORDER_NOT_MET' };
    }

    // Check maximum order amount
    if (this.restrictions.maxOrderAmount && bookingDetails.amount > this.restrictions.maxOrderAmount) {
      return { canUse: false, reason: 'MAX_ORDER_EXCEEDED' };
    }

    // Check category restrictions
    if (this.restrictions.applicableCategories.length > 0) {
      if (!this.restrictions.applicableCategories.includes(bookingDetails.category)) {
        return { canUse: false, reason: 'CATEGORY_NOT_APPLICABLE' };
      }
    }

    // Check space restrictions
    if (this.restrictions.applicableSpaces.length > 0) {
      if (!this.restrictions.applicableSpaces.includes(bookingDetails.spaceId)) {
        return { canUse: false, reason: 'SPACE_NOT_APPLICABLE' };
      }
    }

    // Check location restrictions
    if (this.restrictions.applicableLocations.length > 0) {
      if (!this.restrictions.applicableLocations.includes(bookingDetails.location)) {
        return { canUse: false, reason: 'LOCATION_NOT_APPLICABLE' };
      }
    }

    if (this.restrictions.excludedLocations.includes(bookingDetails.location)) {
      return { canUse: false, reason: 'LOCATION_EXCLUDED' };
    }

    // Check day of week restrictions
    if (this.restrictions.applicableDaysOfWeek.length > 0) {
      const bookingDay = new Date(bookingDetails.bookingDate).getDay();
      if (!this.restrictions.applicableDaysOfWeek.includes(bookingDay)) {
        return { canUse: false, reason: 'DAY_NOT_APPLICABLE' };
      }
    }

    // Check duration restrictions
    if (this.restrictions.minBookingDuration && bookingDetails.duration < this.restrictions.minBookingDuration) {
      return { canUse: false, reason: 'MIN_DURATION_NOT_MET' };
    }

    if (this.restrictions.maxBookingDuration && bookingDetails.duration > this.restrictions.maxBookingDuration) {
      return { canUse: false, reason: 'MAX_DURATION_EXCEEDED' };
    }
  }

  return { canUse: true };
};

PromoCodeSchema.methods.calculateDiscount = function(
  originalAmount: number,
  bookingDetails?: any
): { discountAmount: number; finalAmount: number } {
  let discountAmount = 0;

  switch (this.type) {
    case PromoCodeType.PERCENTAGE:
      discountAmount = (originalAmount * this.value) / 100;
      break;
    case PromoCodeType.FIXED_AMOUNT:
      discountAmount = Math.min(this.value, originalAmount);
      break;
    case PromoCodeType.FREE_HOURS:
      if (bookingDetails && bookingDetails.hourlyRate) {
        const freeAmount = this.value * bookingDetails.hourlyRate;
        discountAmount = Math.min(freeAmount, originalAmount);
      }
      break;
    case PromoCodeType.BUY_ONE_GET_ONE:
      if (bookingDetails && bookingDetails.quantity >= 2) {
        discountAmount = originalAmount / 2; // 50% off
      }
      break;
  }

  // Apply maximum discount limit
  if (this.restrictions.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, this.restrictions.maxDiscountAmount);
  }

  const finalAmount = Math.max(0, originalAmount - discountAmount);
  
  return { discountAmount, finalAmount };
};

PromoCodeSchema.methods.recordUsage = function(
  userId: string,
  bookingId: string,
  discountAmount: number,
  originalAmount: number,
  finalAmount: number,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): void {
  this.usageHistory.push({
    userId,
    bookingId,
    discountAmount,
    originalAmount,
    finalAmount,
    usedAt: new Date(),
    ipAddress,
    userAgent,
    metadata
  });

  this.currentUsage += 1;
  this.lastUsedAt = new Date();

  // Update analytics
  this.analytics.successfulUses += 1;
  this.analytics.totalDiscountGiven += discountAmount;
  this.analytics.totalRevenueGenerated += finalAmount;
  this.analytics.averageDiscountAmount = this.analytics.totalDiscountGiven / this.analytics.successfulUses;

  // Update status if exhausted
  if (this.usageLimit && this.currentUsage >= this.usageLimit) {
    this.status = PromoCodeStatus.EXHAUSTED;
  }
};

PromoCodeSchema.methods.recordFailure = function(reason: string): void {
  this.analytics.failedUses += 1;
  this.analytics.totalAttempts += 1;
  
  if (!this.analytics.failureReasons[reason]) {
    this.analytics.failureReasons[reason] = 0;
  }
  this.analytics.failureReasons[reason] += 1;

  this.analytics.conversionRate = (this.analytics.successfulUses / this.analytics.totalAttempts) * 100;
};

PromoCodeSchema.methods.recordView = function(): void {
  this.analytics.totalViews += 1;
};

PromoCodeSchema.methods.pause = function(reason?: string): void {
  this.status = PromoCodeStatus.PAUSED;
  this.pausedAt = new Date();
  this.pauseReason = reason;
};

PromoCodeSchema.methods.resume = function(): void {
  if (this.isExpired) {
    this.status = PromoCodeStatus.EXPIRED;
  } else if (this.isExhausted) {
    this.status = PromoCodeStatus.EXHAUSTED;
  } else {
    this.status = PromoCodeStatus.ACTIVE;
  }
  this.pausedAt = undefined;
  this.pauseReason = undefined;
};

PromoCodeSchema.methods.softDelete = function(deletedBy?: string): void {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.status = PromoCodeStatus.INACTIVE;
};

// Static methods
PromoCodeSchema.statics.findActivePromoCodes = function(filters: any = {}) {
  const now = new Date();
  return this.find({
    ...filters,
    status: PromoCodeStatus.ACTIVE,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    isDeleted: { $ne: true }
  });
};

PromoCodeSchema.statics.findByCode = function(code: string) {
  return this.findOne({
    code: code.toUpperCase(),
    isDeleted: { $ne: true }
  });
};

PromoCodeSchema.statics.findApplicablePromoCodes = function(
  userId: string,
  bookingDetails: any
) {
  const now = new Date();
  const query: any = {
    status: PromoCodeStatus.ACTIVE,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    isDeleted: { $ne: true },
    $or: [
      { usageLimit: { $exists: false } },
      { $expr: { $lt: ['$currentUsage', '$usageLimit'] } }
    ]
  };

  // Add scope-based filters
  if (bookingDetails.category) {
    query.$and = [
      {
        $or: [
          { scope: DiscountScope.GLOBAL },
          { 
            scope: DiscountScope.CATEGORY,
            'restrictions.applicableCategories': bookingDetails.category
          },
          {
            scope: DiscountScope.SPACE,
            'restrictions.applicableSpaces': bookingDetails.spaceId
          }
        ]
      }
    ];
  }

  return this.find(query).sort({ priority: -1, createdAt: -1 });
};

PromoCodeSchema.statics.getUsageAnalytics = function(
  startDate?: Date,
  endDate?: Date,
  filters: any = {}
) {
  const matchStage: any = { isDeleted: { $ne: true } };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  Object.assign(matchStage, filters);

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPromoCodes: { $sum: 1 },
        activePromoCodes: {
          $sum: { $cond: [{ $eq: ['$status', PromoCodeStatus.ACTIVE] }, 1, 0] }
        },
        totalUsage: { $sum: '$currentUsage' },
        totalDiscountGiven: { $sum: '$analytics.totalDiscountGiven' },
        totalRevenueGenerated: { $sum: '$analytics.totalRevenueGenerated' },
        averageConversionRate: { $avg: '$analytics.conversionRate' }
      }
    }
  ]);
};

// Pre-save middleware
PromoCodeSchema.pre('save', function(next) {
  // Auto-update status based on conditions
  if (this.isExpired && this.status === PromoCodeStatus.ACTIVE) {
    this.status = PromoCodeStatus.EXPIRED;
  }

  if (this.isExhausted && this.status === PromoCodeStatus.ACTIVE) {
    this.status = PromoCodeStatus.EXHAUSTED;
  }

  // Ensure code is uppercase
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }

  // Initialize analytics if new
  if (this.isNew && !this.analytics) {
    this.analytics = new PromoCodeAnalytics();
  }

  next();
});

// Pre-find middleware to exclude deleted codes by default
PromoCodeSchema.pre(/^find/, function() {
  this.where({ isDeleted: { $ne: true } });
});

// Transform output
PromoCodeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.internalNotes;
    delete ret.analytics.failureReasons;
    delete ret.usageHistory; // Hide detailed usage history in public APIs
    return ret;
  }
});