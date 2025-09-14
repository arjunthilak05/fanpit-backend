import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository, BaseDocument } from '../database/base-repository';
import { User, UserDocument, UserRole, UserStatus } from '../auth/schemas/user.schema';

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  search?: string;
  location?: string;
  hasBusinessInfo?: boolean;
}

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {
    super(userModel, ['businessInfo']);
  }

  /**
   * Find user by email or phone
   */
  async findByEmailOrPhone(identifier: string): Promise<UserDocument | null> {
    try {
      return await this.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phone: identifier }
        ]
      });
    } catch (error) {
      this.logger.error(`Find by email/phone failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.findOne({
        email: email.toLowerCase()
      });
    } catch (error) {
      this.logger.error(`Find by email failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find user by reset password token
   */
  async findByResetPasswordToken(token: string): Promise<UserDocument | null> {
    try {
      return await this.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      }, { lean: false });
    } catch (error) {
      this.logger.error(`Find by reset token failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find user by email verification token
   */
  async findByEmailVerificationToken(token: string): Promise<UserDocument | null> {
    try {
      return await this.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      }, { lean: false });
    } catch (error) {
      this.logger.error(`Find by email verification token failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find users with advanced filters
   */
  async findWithFilters(filters: UserFilters, paginationOptions: any = {}) {
    try {
      const query: any = {};

      // Role filter
      if (filters.role) {
        query.role = filters.role;
      }

      // Status filter
      if (filters.status) {
        query.status = filters.status;
      }

      // Email verification filter
      if (filters.isEmailVerified !== undefined) {
        query.isEmailVerified = filters.isEmailVerified;
      }

      // Phone verification filter
      if (filters.isPhoneVerified !== undefined) {
        query.isPhoneVerified = filters.isPhoneVerified;
      }

      // Active status filter
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // Location filter
      if (filters.location) {
        query.$or = [
          { 'profile.city': new RegExp(filters.location, 'i') },
          { 'profile.state': new RegExp(filters.location, 'i') },
          { 'businessInfo.businessAddress': new RegExp(filters.location, 'i') }
        ];
      }

      // Business info filter
      if (filters.hasBusinessInfo !== undefined) {
        if (filters.hasBusinessInfo) {
          query.businessInfo = { $exists: true };
          query['businessInfo.companyName'] = { $exists: true, $ne: null };
        } else {
          query.$or = [
            { businessInfo: { $exists: false } },
            { 'businessInfo.companyName': { $exists: false } }
          ];
        }
      }

      // Search filter
      if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        query.$and = [
          query.$or || {},
          {
            $or: [
              { name: searchRegex },
              { email: searchRegex },
              { organization: searchRegex },
              { 'profile.firstName': searchRegex },
              { 'profile.lastName': searchRegex },
              { 'businessInfo.companyName': searchRegex }
            ]
          }
        ];
      }

      return await this.findWithPagination(query, paginationOptions);
    } catch (error) {
      this.logger.error(`Find with filters failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<UserDocument[]> {
    try {
      return await this.find({
        role,
        isActive: true
      });
    } catch (error) {
      this.logger.error(`Find by role failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find verified business owners
   */
  async findVerifiedBusinessOwners(): Promise<UserDocument[]> {
    try {
      return await this.find({
        role: UserRole.BRAND_OWNER,
        'businessInfo.isVerified': true,
        isActive: true
      });
    } catch (error) {
      this.logger.error(`Find verified business owners failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId?: string) {
    try {
      const pipeline = [
        ...(userId ? [{ $match: { _id: new Types.ObjectId(userId) } }] : []),
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'customerId',
            as: 'bookings'
          }
        },
        {
          $lookup: {
            from: 'spaces',
            localField: '_id',
            foreignField: 'ownerId',
            as: 'ownedSpaces'
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'userId',
            as: 'reviews'
          }
        },
        {
          $addFields: {
            totalBookings: { $size: '$bookings' },
            completedBookings: {
              $size: {
                $filter: {
                  input: '$bookings',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            },
            totalSpending: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$bookings',
                      cond: { $eq: ['$$this.payment.status', 'paid'] }
                    }
                  },
                  as: 'booking',
                  in: '$$booking.pricing.totalAmount'
                }
              }
            },
            totalSpaces: { $size: '$ownedSpaces' },
            activeSpaces: {
              $size: {
                $filter: {
                  input: '$ownedSpaces',
                  cond: { $eq: ['$$this.isActive', true] }
                }
              }
            },
            totalReviews: { $size: '$reviews' },
            averageRatingGiven: { $avg: '$reviews.rating' }
          }
        }
      ];

      const results = await this.aggregate(pipeline);
      return userId ? results[0] : results;
    } catch (error) {
      this.logger.error(`Get user stats failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const pipeline = [
        { $match: { _id: new Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'bookings',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$customerId', '$$userId'] },
                  createdAt: { $gte: startDate }
                }
              },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                  bookings: { $sum: 1 },
                  spending: {
                    $sum: {
                      $cond: [
                        { $eq: ['$payment.status', 'paid'] },
                        '$pricing.totalAmount',
                        0
                      ]
                    }
                  }
                }
              },
              { $sort: { _id: 1 } }
            ],
            as: 'dailyActivity'
          }
        },
        {
          $lookup: {
            from: 'user_activities',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] },
                  timestamp: { $gte: startDate }
                }
              },
              {
                $group: {
                  _id: '$action',
                  count: { $sum: 1 }
                }
              }
            ],
            as: 'actionCounts'
          }
        }
      ];

      const [result] = await this.aggregate(pipeline);
      return result;
    } catch (error) {
      this.logger.error(`Get user activity summary failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find users for referral program
   */
  async findEligibleForReferral(criteria: {
    minBookings?: number;
    minSpending?: number;
    lastActiveWithinDays?: number;
  } = {}) {
    try {
      const pipeline = [
        { $match: { isActive: true, isEmailVerified: true } },
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'customerId',
            as: 'bookings'
          }
        },
        {
          $addFields: {
            totalBookings: { $size: '$bookings' },
            totalSpending: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$bookings',
                      cond: { $eq: ['$$this.payment.status', 'paid'] }
                    }
                  },
                  as: 'booking',
                  in: '$$booking.pricing.totalAmount'
                }
              }
            },
            daysSinceLastActive: {
              $divide: [
                { $subtract: [new Date(), '$lastActiveAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      ];

      // Apply criteria filters
      const matchConditions: any = {};

      if (criteria.minBookings) {
        matchConditions.totalBookings = { $gte: criteria.minBookings };
      }

      if (criteria.minSpending) {
        matchConditions.totalSpending = { $gte: criteria.minSpending };
      }

      if (criteria.lastActiveWithinDays) {
        matchConditions.daysSinceLastActive = { $lte: criteria.lastActiveWithinDays };
      }

      if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
      }

      return await this.aggregate(pipeline);
    } catch (error) {
      this.logger.error(`Find eligible for referral failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user last active timestamp
   */
  async updateLastActive(userId: string): Promise<void> {
    try {
      await this.updateById(userId, {
        lastActiveAt: new Date()
      });
    } catch (error) {
      this.logger.error(`Update last active failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add activity log entry
   */
  async addActivityLog(
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.updateById(userId, {
        $push: {
          activityLog: {
            action,
            timestamp: new Date(),
            metadata
          }
        }
      });
    } catch (error) {
      this.logger.error(`Add activity log failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Increment loyalty points
   */
  async incrementLoyaltyPoints(userId: string, points: number): Promise<void> {
    try {
      await this.updateById(userId, {
        $inc: { loyaltyPoints: points }
      });
    } catch (error) {
      this.logger.error(`Increment loyalty points failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user ratings
   */
  async updateUserRating(
    userId: string,
    newRating: number,
    reviewCount: number
  ): Promise<void> {
    try {
      await this.updateById(userId, {
        averageRating: newRating,
        reviewCount: reviewCount
      });
    } catch (error) {
      this.logger.error(`Update user rating failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find users requiring email verification reminder
   */
  async findUnverifiedUsers(olderThanHours: number = 24): Promise<UserDocument[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

      return await this.find({
        isEmailVerified: false,
        createdAt: { $lt: cutoffDate },
        isActive: true
      });
    } catch (error) {
      this.logger.error(`Find unverified users failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<{ modifiedCount: number }> {
    try {
      const result = await this.updateMany(
        {
          $or: [
            { resetPasswordExpires: { $lt: new Date() } },
            { emailVerificationExpires: { $lt: new Date() } },
            { phoneVerificationExpires: { $lt: new Date() } }
          ]
        },
        {
          $unset: {
            resetPasswordToken: 1,
            resetPasswordExpires: 1,
            emailVerificationToken: 1,
            emailVerificationExpires: 1,
            phoneVerificationCode: 1,
            phoneVerificationExpires: 1
          }
        }
      );

      return result;
    } catch (error) {
      this.logger.error(`Cleanup expired tokens failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get aggregated user metrics
   */
  async getAggregatedUserMetrics(filters: any = {}) {
    try {
      const pipeline = [
        { $match: filters },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            verifiedUsers: {
              $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] }
            },
            consumers: {
              $sum: { $cond: [{ $eq: ['$role', UserRole.CONSUMER] }, 1, 0] }
            },
            brandOwners: {
              $sum: { $cond: [{ $eq: ['$role', UserRole.BRAND_OWNER] }, 1, 0] }
            },
            staff: {
              $sum: { $cond: [{ $eq: ['$role', UserRole.STAFF] }, 1, 0] }
            },
            averageLoyaltyPoints: { $avg: '$loyaltyPoints' },
            totalLoyaltyPoints: { $sum: '$loyaltyPoints' }
          }
        }
      ];

      const [result] = await this.aggregate(pipeline);
      return result || {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        consumers: 0,
        brandOwners: 0,
        staff: 0,
        averageLoyaltyPoints: 0,
        totalLoyaltyPoints: 0
      };
    } catch (error) {
      this.logger.error(`Get aggregated user metrics failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}