import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Transform } from 'class-transformer';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged'
}

@Schema({ _id: false })
export class ReviewResponse {
  @Prop({ required: true, trim: true, maxlength: 1000 })
  message: string;

  @Prop({ 
    required: true, 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User' 
  })
  respondedBy: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  respondedAt: Date;

  @Prop({ default: true })
  isOwnerResponse: boolean;
}

@Schema({ _id: false })
export class ReviewModerationInfo {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User' 
  })
  moderatedBy?: MongooseSchema.Types.ObjectId;

  @Prop()
  moderatedAt?: Date;

  @Prop({ trim: true })
  moderationReason?: string;

  @Prop({ type: [String], default: [] })
  flags: string[];

  @Prop({ default: 0 })
  reportCount: number;
}

@Schema({ _id: false })
export class ReviewMetrics {
  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop({ default: 0 })
  notHelpfulCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  shareCount: number;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  helpfulVotes: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  notHelpfulVotes: MongooseSchema.Types.ObjectId[];
}

@Schema({ timestamps: true })
export class Review {
  @Transform(({ value }) => value?.toString())
  _id: string;

  @Prop({ 
    required: true, 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Booking',
    unique: true,
    index: true
  })
  bookingId: MongooseSchema.Types.ObjectId;

  @Prop({ 
    required: true, 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Space',
    index: true
  })
  spaceId: MongooseSchema.Types.ObjectId;

  @Prop({ 
    required: true, 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User',
    index: true
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ 
    required: true, 
    min: 1, 
    max: 5,
    index: true
  })
  rating: number;

  @Prop({ 
    required: true, 
    trim: true, 
    minlength: 10,
    maxlength: 100
  })
  title: string;

  @Prop({ 
    required: true, 
    trim: true, 
    minlength: 20,
    maxlength: 2000
  })
  comment: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  pros: string[];

  @Prop({ type: [String], default: [] })
  cons: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ 
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.PENDING,
    index: true
  })
  status: ReviewStatus;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop({ default: false })
  isRecommended: boolean;

  @Prop({ default: false })
  isHighlighted: boolean;

  @Prop({ default: false })
  isOwnerFavorite: boolean;

  @Prop({ type: ReviewResponse })
  response?: ReviewResponse;

  @Prop({ type: ReviewModerationInfo, default: {} })
  moderation: ReviewModerationInfo;

  @Prop({ type: ReviewMetrics, default: {} })
  metrics: ReviewMetrics;

  // Detailed ratings breakdown
  @Prop({ min: 1, max: 5 })
  cleanlinessRating?: number;

  @Prop({ min: 1, max: 5 })
  amenitiesRating?: number;

  @Prop({ min: 1, max: 5 })
  locationRating?: number;

  @Prop({ min: 1, max: 5 })
  valueForMoneyRating?: number;

  @Prop({ min: 1, max: 5 })
  serviceRating?: number;

  @Prop({ min: 1, max: 5 })
  communicationRating?: number;

  // Review context
  @Prop({ trim: true })
  visitPurpose?: string;

  @Prop({ enum: ['solo', 'couple', 'family', 'friends', 'business', 'group'] })
  visitorType?: string;

  @Prop()
  visitDate?: Date;

  @Prop({ min: 1 })
  groupSize?: number;

  @Prop({ min: 1 })
  durationHours?: number;

  // Metadata
  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ trim: true })
  userAgent?: string;

  @Prop({ trim: true })
  deviceInfo?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt?: Date;

  @Prop({ trim: true })
  editReason?: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ trim: true })
  deletedReason?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes for performance
ReviewSchema.index({ bookingId: 1 }, { unique: true });
ReviewSchema.index({ spaceId: 1, rating: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ rating: -1, status: 1 });
ReviewSchema.index({ isVerified: 1, status: 1 });
ReviewSchema.index({ isHighlighted: 1, rating: -1 });
ReviewSchema.index({ 'metrics.helpfulCount': -1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ isDeleted: 1, deletedAt: 1 });

// Text search index
ReviewSchema.index({
  title: 'text',
  comment: 'text',
  tags: 'text'
});

// Compound indexes for complex queries
ReviewSchema.index({ spaceId: 1, status: 1, rating: -1 });
ReviewSchema.index({ userId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, isVerified: 1, createdAt: -1 });

// Virtual for overall helpfulness
ReviewSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.metrics.helpfulCount + this.metrics.notHelpfulCount;
  return total > 0 ? this.metrics.helpfulCount / total : 0;
});

// Virtual for average detailed rating
ReviewSchema.virtual('averageDetailedRating').get(function() {
  const ratings = [
    this.cleanlinessRating,
    this.amenitiesRating,
    this.locationRating,
    this.valueForMoneyRating,
    this.serviceRating,
    this.communicationRating
  ].filter(rating => rating !== undefined);

  return ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
    : this.rating;
});

// Virtual for review age in days
ReviewSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for is recent (within last 30 days)
ReviewSchema.virtual('isRecent').get(function() {
  return this.ageInDays <= 30;
});

// Instance methods
ReviewSchema.methods.markHelpful = function(userId: string): void {
  if (!this.metrics.helpfulVotes.includes(userId)) {
    this.metrics.helpfulVotes.push(userId);
    this.metrics.helpfulCount += 1;
    
    // Remove from not helpful if exists
    const notHelpfulIndex = this.metrics.notHelpfulVotes.indexOf(userId);
    if (notHelpfulIndex > -1) {
      this.metrics.notHelpfulVotes.splice(notHelpfulIndex, 1);
      this.metrics.notHelpfulCount = Math.max(0, this.metrics.notHelpfulCount - 1);
    }
  }
};

ReviewSchema.methods.markNotHelpful = function(userId: string): void {
  if (!this.metrics.notHelpfulVotes.includes(userId)) {
    this.metrics.notHelpfulVotes.push(userId);
    this.metrics.notHelpfulCount += 1;
    
    // Remove from helpful if exists
    const helpfulIndex = this.metrics.helpfulVotes.indexOf(userId);
    if (helpfulIndex > -1) {
      this.metrics.helpfulVotes.splice(helpfulIndex, 1);
      this.metrics.helpfulCount = Math.max(0, this.metrics.helpfulCount - 1);
    }
  }
};

ReviewSchema.methods.removeVote = function(userId: string): void {
  const helpfulIndex = this.metrics.helpfulVotes.indexOf(userId);
  const notHelpfulIndex = this.metrics.notHelpfulVotes.indexOf(userId);
  
  if (helpfulIndex > -1) {
    this.metrics.helpfulVotes.splice(helpfulIndex, 1);
    this.metrics.helpfulCount = Math.max(0, this.metrics.helpfulCount - 1);
  }
  
  if (notHelpfulIndex > -1) {
    this.metrics.notHelpfulVotes.splice(notHelpfulIndex, 1);
    this.metrics.notHelpfulCount = Math.max(0, this.metrics.notHelpfulCount - 1);
  }
};

ReviewSchema.methods.addResponse = function(
  message: string,
  respondedBy: string,
  isOwnerResponse = true
): void {
  this.response = {
    message,
    respondedBy,
    respondedAt: new Date(),
    isOwnerResponse
  };
};

ReviewSchema.methods.flagReview = function(reason: string): void {
  if (!this.moderation.flags.includes(reason)) {
    this.moderation.flags.push(reason);
    this.moderation.reportCount += 1;
    
    if (this.moderation.reportCount >= 5) {
      this.status = ReviewStatus.FLAGGED;
    }
  }
};

ReviewSchema.methods.moderate = function(
  status: ReviewStatus,
  moderatedBy: string,
  reason?: string
): void {
  this.status = status;
  this.moderation.moderatedBy = moderatedBy;
  this.moderation.moderatedAt = new Date();
  if (reason) {
    this.moderation.moderationReason = reason;
  }
};

ReviewSchema.methods.incrementViewCount = function(): void {
  this.metrics.viewCount += 1;
};

ReviewSchema.methods.incrementShareCount = function(): void {
  this.metrics.shareCount += 1;
};

ReviewSchema.methods.softDelete = function(reason?: string): void {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedReason = reason;
};

// Static methods
ReviewSchema.statics.findBySpace = function(spaceId: string, options: any = {}) {
  const query = { 
    spaceId,
    status: ReviewStatus.APPROVED,
    isDeleted: { $ne: true }
  };

  return this.find(query)
    .populate('userId', 'name avatar')
    .sort({ [options.sortBy || 'createdAt']: options.sortOrder || -1 })
    .limit(options.limit || 20);
};

ReviewSchema.statics.getSpaceAverageRating = function(spaceId: string) {
  return this.aggregate([
    {
      $match: {
        spaceId,
        status: ReviewStatus.APPROVED,
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: {
            rating: '$rating',
            createdAt: '$createdAt'
          }
        }
      }
    },
    {
      $addFields: {
        averageRating: { $round: ['$averageRating', 1] }
      }
    }
  ]);
};

ReviewSchema.statics.getDetailedSpaceRatings = function(spaceId: string) {
  return this.aggregate([
    {
      $match: {
        spaceId,
        status: ReviewStatus.APPROVED,
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        averageCleanliness: { $avg: '$cleanlinessRating' },
        averageAmenities: { $avg: '$amenitiesRating' },
        averageLocation: { $avg: '$locationRating' },
        averageValueForMoney: { $avg: '$valueForMoneyRating' },
        averageService: { $avg: '$serviceRating' },
        averageCommunication: { $avg: '$communicationRating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
};

ReviewSchema.statics.getUserReviewStats = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        userId,
        status: ReviewStatus.APPROVED,
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        totalHelpfulVotes: { $sum: '$metrics.helpfulCount' },
        verifiedReviews: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        }
      }
    }
  ]);
};

// Pre-save middleware
ReviewSchema.pre('save', function(next) {
  // Auto-verify reviews from verified bookings
  if (this.isNew && this.bookingId) {
    // This would be populated from the booking verification status
    // For now, we'll set it based on some criteria
    this.isVerified = true;
    this.verifiedAt = new Date();
  }

  // Auto-approve reviews from verified users with no flags
  if (this.isNew && this.isVerified && this.moderation.reportCount === 0) {
    this.status = ReviewStatus.APPROVED;
  }

  next();
});

// Pre-find middleware to exclude deleted reviews by default
ReviewSchema.pre(/^find/, function() {
  this.where({ isDeleted: { $ne: true } });
});

// Transform output to hide sensitive data
ReviewSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.ipAddress;
    delete ret.userAgent;
    delete ret.deviceInfo;
    delete ret.moderation.flags;
    delete ret.moderation.reportCount;
    return ret;
  }
});