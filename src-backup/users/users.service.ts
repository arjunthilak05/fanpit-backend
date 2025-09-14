import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).select('-password').exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const query = this.userModel.findOne({ email, isActive: true });

    if (includePassword) {
      query.select('+password +refreshTokens');
    }

    return query.exec();
  }

  async findByEmailWithTokens(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email, isActive: true })
      .select('+password +refreshTokens')
      .exec();
  }

  async updateRefreshTokens(userId: string, refreshTokens: string[]): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { refreshTokens },
      { new: true }
    ).exec();
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
        isActive: true,
      })
      .exec();
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
        refreshTokens: [], // Clear all refresh tokens
      },
      { new: true }
    ).exec();
  }

  async setPasswordReset(userId: string, token: string, expires: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
      { new: true }
    ).exec();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { lastLoginAt: new Date() },
      { new: true }
    ).exec();
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException('User not found');
    }
  }
}