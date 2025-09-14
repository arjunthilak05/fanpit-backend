import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';

export type UserDocument = User & Document;

export enum UserRole {
  CONSUMER = 'consumer',
  BRAND_OWNER = 'brand_owner',
  STAFF = 'staff',
  ADMIN = 'admin'
}

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

@Schema({
  timestamps: true,
  collection: 'users'
})
export class User {
  @Transform(({ value }) => value?.toString())
  _id: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  })
  email: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  })
  name: string;

  @Prop({
    required: true,
    minlength: 8
  })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.CONSUMER
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: AccountStatus,
    default: AccountStatus.ACTIVE
  })
  status: AccountStatus;

  @Prop({
    type: Boolean,
    default: false
  })
  isEmailVerified: boolean;

  @Prop({
    type: Boolean,
    default: false
  })
  isPhoneVerified: boolean;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ type: String })
  organization?: string;

  @Prop({ type: [String], default: [] })
  refreshTokens: string[];

  @Prop({ type: String })
  passwordResetToken?: string;

  @Prop({ type: Date })
  passwordResetExpires?: Date;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({
    type: Boolean,
    default: true
  })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);