import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import * as bcrypt from 'bcryptjs';

export type UserDocument = User & Document;

export enum UserRole {
  CONSUMER = 'consumer',
  BRAND_OWNER = 'brand_owner',
  STAFF = 'staff',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

@Schema({ _id: false })
export class Preferences {
  @Prop({ default: true })
  notifications: boolean;

  @Prop({ default: false })
  marketing: boolean;

  @Prop({ default: 'en' })
  language: string;

  @Prop({ default: 'UTC' })
  timezone: string;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: false })
  smsNotifications: boolean;

  @Prop({ default: true })
  pushNotifications: boolean;
}

@Schema({ _id: false })
export class SecuritySettings {
  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop()
  twoFactorSecret?: string;

  @Prop({ type: [Date], default: [] })
  trustedDevices: Date[];

  @Prop({ type: [String], default: [] })
  passwordHistory: string[];

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  lastPasswordChange?: Date;

  @Prop({ default: false })
  requirePasswordChange: boolean;
}

@Schema({ _id: false })
export class Profile {
  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  gender?: string;

  @Prop()
  bio?: string;

  @Prop()
  website?: string;

  @Prop({ type: [String], default: [] })
  socialLinks: string[];

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  country?: string;

  @Prop()
  pincode?: string;

  @Prop({ default: 0, min: 0, max: 100 })
  completionPercentage: number;
}

@Schema({ _id: false })
export class ActivityLog {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  location?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

@Schema({ _id: false })
export class BusinessInfo {
  @Prop()
  companyName?: string;

  @Prop()
  businessType?: string;

  @Prop()
  gstNumber?: string;

  @Prop()
  panNumber?: string;

  @Prop()
  businessAddress?: string;

  @Prop()
  businessPhone?: string;

  @Prop()
  businessEmail?: string;

  @Prop()
  website?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop({ type: [String], default: [] })
  documents: string[];
}

@Schema({ timestamps: true })
export class User {
  @Transform(({ value }) => value?.toString())
  _id: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 100 })
  name: string;

  @Prop({ 
    required: true, 
    enum: Object.values(UserRole),
    default: UserRole.CONSUMER,
    index: true
  })
  role: UserRole;

  @Prop({ 
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING_VERIFICATION,
    index: true
  })
  status: UserStatus;

  @Prop()
  avatar?: string;

  @Prop({ unique: true, sparse: true })
  phone?: string;

  @Prop()
  organization?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ type: Preferences, default: {} })
  preferences: Preferences;

  @Prop({ type: Profile, default: {} })
  profile: Profile;

  @Prop({ type: SecuritySettings, default: {} })
  security: SecuritySettings;

  @Prop({ type: BusinessInfo })
  businessInfo?: BusinessInfo;

  // Staff-specific properties
  @Prop({ type: [{ type: 'ObjectId', ref: 'Space' }], default: [] })
  assignedSpaces: string[];

  @Prop({ type: [ActivityLog], default: [] })
  activityLog: ActivityLog[];

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastActiveAt?: Date;

  @Prop({ type: [String], default: [], select: false })
  refreshTokens: string[];

  @Prop({ select: false })
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop({ select: false })
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop({ select: false })
  phoneVerificationCode?: string;

  @Prop()
  phoneVerificationExpires?: Date;

  @Prop({ type: 'Object', default: {} })
  verification?: {
    emailVerified: boolean;
    phoneVerified: boolean;
    emailVerifiedAt?: Date;
    phoneVerifiedAt?: Date;
  };

  @Prop({ default: 0 })
  totalBookings: number;

  @Prop({ default: 0 })
  totalSpent: number;

  @Prop({ default: 0 })
  loyaltyPoints: number;

  @Prop({ default: 0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop()
  referralCode?: string;

  @Prop()
  referredBy?: string;

  @Prop({ default: 0 })
  referralCount: number;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  subscription?: string;

  @Prop()
  subscriptionExpires?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop()
  deletedBy?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ isActive: 1, isEmailVerified: 1 });
UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
UserSchema.index({ resetPasswordToken: 1 }, { sparse: true });
UserSchema.index({ emailVerificationToken: 1 }, { sparse: true });
UserSchema.index({ 'security.lockedUntil': 1 }, { sparse: true });
UserSchema.index({ lastActiveAt: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ totalSpent: -1 });
UserSchema.index({ averageRating: -1 });
UserSchema.index({ 'businessInfo.isVerified': 1, role: 1 });
UserSchema.index({ isDeleted: 1, deletedAt: 1 });

// Text search index
UserSchema.index({ 
  name: 'text',
  email: 'text',
  organization: 'text',
  'profile.bio': 'text'
});

// TTL index for deleted users (soft delete cleanup after 2 years)
UserSchema.index(
  { deletedAt: 1 },
  { 
    expireAfterSeconds: 2 * 365 * 24 * 60 * 60,
    partialFilterExpression: { isDeleted: true }
  }
);

// Virtual fields
UserSchema.virtual('fullName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.name;
});

UserSchema.virtual('isAccountLocked').get(function() {
  return this.security?.lockedUntil && this.security.lockedUntil > new Date();
});

UserSchema.virtual('isPremium').get(function() {
  return this.subscription && this.subscriptionExpires && this.subscriptionExpires > new Date();
});

UserSchema.virtual('profileCompletionPercentage').get(function() {
  let completion = 20; // Base for email verification
  
  if (this.profile?.firstName) completion += 10;
  if (this.profile?.lastName) completion += 10;
  if (this.phone && this.isPhoneVerified) completion += 15;
  if (this.profile?.dateOfBirth) completion += 10;
  if (this.profile?.address) completion += 10;
  if (this.avatar) completion += 10;
  if (this.profile?.bio) completion += 10;
  if (this.businessInfo?.isVerified && this.role === UserRole.BRAND_OWNER) completion += 15;
  
  return Math.min(completion, 100);
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateEmailVerificationToken = function(): string {
  const token = Math.random().toString(36).substr(2, 32);
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

UserSchema.methods.generatePhoneVerificationCode = function(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneVerificationCode = code;
  this.phoneVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return code;
};

UserSchema.methods.generateResetPasswordToken = function(): string {
  const token = Math.random().toString(36).substr(2, 32);
  this.resetPasswordToken = token;
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

UserSchema.methods.addToRefreshTokens = function(token: string): void {
  this.refreshTokens.push(token);
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

UserSchema.methods.removeRefreshToken = function(token: string): void {
  this.refreshTokens = this.refreshTokens.filter(t => t !== token);
};

UserSchema.methods.lockAccount = function(duration: number = 30 * 60 * 1000): void {
  this.security.lockedUntil = new Date(Date.now() + duration);
  this.security.failedLoginAttempts = 0;
};

UserSchema.methods.unlockAccount = function(): void {
  this.security.lockedUntil = undefined;
  this.security.failedLoginAttempts = 0;
};

UserSchema.methods.incrementFailedLoginAttempts = function(): void {
  this.security.failedLoginAttempts += 1;
  
  if (this.security.failedLoginAttempts >= 5) {
    this.lockAccount();
  }
};

UserSchema.methods.resetFailedLoginAttempts = function(): void {
  this.security.failedLoginAttempts = 0;
  this.security.lockedUntil = undefined;
};

UserSchema.methods.addActivityLog = function(
  action: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): void {
  this.activityLog.push({
    action,
    timestamp: new Date(),
    ipAddress,
    userAgent,
    metadata
  });
  
  // Keep only last 100 activity logs
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
};

UserSchema.methods.updateLastActive = function(): void {
  this.lastActiveAt = new Date();
};

UserSchema.methods.softDelete = function(deletedBy?: string): void {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.isActive = false;
};

// Static methods
UserSchema.statics.findByEmailOrPhone = function(identifier: string) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phone: identifier }
    ],
    isDeleted: { $ne: true }
  });
};

UserSchema.statics.findActiveUsers = function(filters: any = {}) {
  return this.find({
    ...filters,
    isActive: true,
    isDeleted: { $ne: true }
  });
};

UserSchema.statics.getUsersByRole = function(role: UserRole) {
  return this.find({
    role,
    isActive: true,
    isDeleted: { $ne: true }
  });
};

UserSchema.statics.getBusinessOwners = function(verified = true) {
  return this.find({
    role: UserRole.BRAND_OWNER,
    'businessInfo.isVerified': verified,
    isActive: true,
    isDeleted: { $ne: true }
  });
};

// Pre-save middleware
UserSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    
    // Add to password history
    if (this.security.passwordHistory.length >= 5) {
      this.security.passwordHistory.shift();
    }
    this.security.passwordHistory.push(this.password);
    this.security.lastPasswordChange = new Date();
  }
  
  // Generate referral code for new users
  if (this.isNew && !this.referralCode) {
    this.referralCode = `REF_${this.name.substring(0, 3).toUpperCase()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  
  // Update profile completion percentage
  if (this.profile) {
    const completionPercentage = this.get('profileCompletionPercentage');
    this.profile.completionPercentage = completionPercentage;
  }
  
  // Update timestamps
  if (this.isNew) {
    this.lastActiveAt = new Date();
  }
  
  next();
});

// Pre-find middleware to exclude deleted users by default
// UserSchema.pre(/^find/, function() {
//   this.where({ isDeleted: { $ne: true } });
// });

// Virtual population options
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.resetPasswordToken;
    delete ret.emailVerificationToken;
    delete ret.phoneVerificationCode;
    delete ret.security?.twoFactorSecret;
    delete ret.security?.passwordHistory;
    return ret;
  }
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.resetPasswordToken;
    delete ret.emailVerificationToken;
    delete ret.phoneVerificationCode;
    delete ret.security?.twoFactorSecret;
    delete ret.security?.passwordHistory;
    return ret;
  }
});