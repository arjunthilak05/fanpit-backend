import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CONSUMER = 'consumer',
  BRAND_OWNER = 'brand_owner',
  STAFF = 'staff',
  ADMIN = 'admin'
}

@Schema({
  timestamps: true,
  collection: 'users'
})
export class User {
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
    type: Boolean,
    default: false
  })
  isEmailVerified: boolean;

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

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);