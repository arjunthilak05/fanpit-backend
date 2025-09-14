import { Injectable, Logger } from '@nestjs/common';
import { PipelineStage } from 'mongoose';

@Injectable()
export class AggregationPipelinesService {
  private readonly logger = new Logger(AggregationPipelinesService.name);

  /**
   * Space Analytics Pipeline
   */
  getSpaceAnalyticsPipeline(
    spaceId?: string,
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Match stage
    const matchCondition: any = {};
    if (spaceId) matchCondition.spaceId = spaceId;
    if (startDate || endDate) {
      matchCondition.bookingDate = {};
      if (startDate) matchCondition.bookingDate.$gte = startDate;
      if (endDate) matchCondition.bookingDate.$lte = endDate;
    }
    
    if (Object.keys(matchCondition).length > 0) {
      pipeline.push({ $match: matchCondition });
    }

    // Group by date and space
    const groupByFormats = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
      week: { $dateToString: { format: '%Y-W%U', date: '$bookingDate' } },
      month: { $dateToString: { format: '%Y-%m', date: '$bookingDate' } }
    };

    pipeline.push({
      $group: {
        _id: {
          period: groupByFormats[groupBy],
          spaceId: '$spaceId'
        },
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageBookingValue: { $avg: '$pricing.totalAmount' },
        uniqueCustomers: { $addToSet: '$customerId' },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalHours: { $sum: '$duration' },
        averageDuration: { $avg: '$duration' }
      }
    });

    // Add computed fields
    pipeline.push({
      $addFields: {
        uniqueCustomerCount: { $size: '$uniqueCustomers' },
        completionRate: {
          $cond: [
            { $gt: ['$totalBookings', 0] },
            { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] },
            0
          ]
        },
        cancellationRate: {
          $cond: [
            { $gt: ['$totalBookings', 0] },
            { $multiply: [{ $divide: ['$cancelledBookings', '$totalBookings'] }, 100] },
            0
          ]
        },
        revenuePerHour: {
          $cond: [
            { $gt: ['$totalHours', 0] },
            { $divide: ['$totalRevenue', '$totalHours'] },
            0
          ]
        }
      }
    });

    // Remove the uniqueCustomers array as it's no longer needed
    pipeline.push({
      $project: {
        uniqueCustomers: 0
      }
    });

    // Sort by period
    pipeline.push({ $sort: { '_id.period': 1 } });

    return pipeline;
  }

  /**
   * Revenue Analytics Pipeline
   */
  getRevenueAnalyticsPipeline(
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' | 'year' = 'day',
    filters?: {
      spaceCategory?: string;
      location?: string;
      paymentStatus?: string;
    }
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Match bookings with payment data
    const matchCondition: any = {
      'payment.status': 'paid'
    };

    if (startDate || endDate) {
      matchCondition.bookingDate = {};
      if (startDate) matchCondition.bookingDate.$gte = startDate;
      if (endDate) matchCondition.bookingDate.$lte = endDate;
    }

    pipeline.push({ $match: matchCondition });

    // Lookup space details if filtering by category or location
    if (filters?.spaceCategory || filters?.location) {
      pipeline.push({
        $lookup: {
          from: 'spaces',
          localField: 'spaceId',
          foreignField: '_id',
          as: 'space'
        }
      });

      pipeline.push({
        $unwind: '$space'
      });

      // Additional filters
      const spaceMatchCondition: any = {};
      if (filters.spaceCategory) {
        spaceMatchCondition['space.category'] = filters.spaceCategory;
      }
      if (filters.location) {
        spaceMatchCondition['space.address.city'] = filters.location;
      }

      if (Object.keys(spaceMatchCondition).length > 0) {
        pipeline.push({ $match: spaceMatchCondition });
      }
    }

    // Group by time period
    const groupByFormats = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
      week: { $dateToString: { format: '%Y-W%U', date: '$bookingDate' } },
      month: { $dateToString: { format: '%Y-%m', date: '$bookingDate' } },
      year: { $dateToString: { format: '%Y', date: '$bookingDate' } }
    };

    pipeline.push({
      $group: {
        _id: groupByFormats[groupBy],
        totalRevenue: { $sum: '$pricing.totalAmount' },
        netRevenue: {
          $sum: {
            $subtract: [
              '$pricing.totalAmount',
              { $add: ['$pricing.taxes', { $ifNull: ['$pricing.setupFee', 0] }] }
            ]
          }
        },
        totalBookings: { $sum: 1 },
        averageBookingValue: { $avg: '$pricing.totalAmount' },
        totalTaxes: { $sum: '$pricing.taxes' },
        totalDiscounts: {
          $sum: {
            $reduce: {
              input: { $ifNull: ['$pricing.discounts', []] },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.amount'] }
            }
          }
        },
        paymentMethods: {
          $push: '$payment.method'
        },
        revenueByHour: {
          $push: {
            hour: { $hour: '$bookingDate' },
            amount: '$pricing.totalAmount'
          }
        }
      }
    });

    // Add computed metrics
    pipeline.push({
      $addFields: {
        growthRate: 0, // Will be calculated separately with previous period data
        averageRevenuePerHour: {
          $avg: '$revenueByHour.amount'
        },
        paymentMethodDistribution: {
          $reduce: {
            input: '$paymentMethods',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $cond: [
                    { $eq: [{ $type: { $getField: { field: '$$this', input: '$$value' } } }, 'missing'] },
                    { $literal: { ['$$this']: 1 } },
                    {
                      $let: {
                        vars: { currentCount: { $getField: { field: '$$this', input: '$$value' } } },
                        in: { $literal: { ['$$this']: { $add: ['$$currentCount', 1] } } }
                      }
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    });

    // Clean up temporary fields
    pipeline.push({
      $project: {
        paymentMethods: 0,
        revenueByHour: 0
      }
    });

    // Sort by period
    pipeline.push({ $sort: { _id: 1 } });

    return pipeline;
  }

  /**
   * Customer Analytics Pipeline
   */
  getCustomerAnalyticsPipeline(
    startDate?: Date,
    endDate?: Date,
    customerSegment?: 'new' | 'returning' | 'vip'
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Match stage
    const matchCondition: any = {};
    if (startDate || endDate) {
      matchCondition.createdAt = {};
      if (startDate) matchCondition.createdAt.$gte = startDate;
      if (endDate) matchCondition.createdAt.$lte = endDate;
    }

    if (Object.keys(matchCondition).length > 0) {
      pipeline.push({ $match: matchCondition });
    }

    // Lookup user bookings to calculate customer metrics
    pipeline.push({
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'customerId',
        as: 'bookings'
      }
    });

    // Calculate customer metrics
    pipeline.push({
      $addFields: {
        totalBookings: { $size: '$bookings' },
        totalSpent: {
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
        lastBookingDate: { $max: '$bookings.bookingDate' },
        firstBookingDate: { $min: '$bookings.bookingDate' },
        averageBookingValue: {
          $avg: {
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
        }
      }
    });

    // Customer segmentation
    pipeline.push({
      $addFields: {
        customerType: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$totalBookings', 1] },
                then: 'new'
              },
              {
                case: {
                  $and: [
                    { $gte: ['$totalBookings', 2] },
                    { $lt: ['$totalBookings', 10] }
                  ]
                },
                then: 'returning'
              },
              {
                case: { $gte: ['$totalBookings', 10] },
                then: 'vip'
              }
            ],
            default: 'new'
          }
        },
        customerLifetimeDays: {
          $divide: [
            { $subtract: ['$lastBookingDate', '$firstBookingDate'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    });

    // Filter by customer segment if specified
    if (customerSegment) {
      pipeline.push({
        $match: { customerType: customerSegment }
      });
    }

    // Group by customer type and calculate aggregate metrics
    pipeline.push({
      $group: {
        _id: '$customerType',
        customerCount: { $sum: 1 },
        totalRevenue: { $sum: '$totalSpent' },
        averageLifetimeValue: { $avg: '$totalSpent' },
        averageBookingsPerCustomer: { $avg: '$totalBookings' },
        averageCustomerLifetime: { $avg: '$customerLifetimeDays' },
        customers: {
          $push: {
            id: '$_id',
            name: '$name',
            email: '$email',
            totalBookings: '$totalBookings',
            totalSpent: '$totalSpent',
            lastBookingDate: '$lastBookingDate'
          }
        }
      }
    });

    return pipeline;
  }

  /**
   * Occupancy Rate Pipeline
   */
  getOccupancyRatePipeline(
    spaceId?: string,
    startDate?: Date,
    endDate?: Date
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Match confirmed/completed bookings
    const matchCondition: any = {
      status: { $in: ['confirmed', 'completed', 'checked-in', 'checked-out'] }
    };

    if (spaceId) matchCondition.spaceId = spaceId;
    if (startDate || endDate) {
      matchCondition.bookingDate = {};
      if (startDate) matchCondition.bookingDate.$gte = startDate;
      if (endDate) matchCondition.bookingDate.$lte = endDate;
    }

    pipeline.push({ $match: matchCondition });

    // Lookup space details to get operating hours
    pipeline.push({
      $lookup: {
        from: 'spaces',
        localField: 'spaceId',
        foreignField: '_id',
        as: 'space'
      }
    });

    pipeline.push({ $unwind: '$space' });

    // Group by space and date
    pipeline.push({
      $group: {
        _id: {
          spaceId: '$spaceId',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
          dayOfWeek: { $dayOfWeek: '$bookingDate' }
        },
        totalBookedHours: { $sum: '$duration' },
        bookingCount: { $sum: 1 },
        spaceName: { $first: '$space.name' },
        operatingHours: { $first: '$space.operatingHours' }
      }
    });

    // Calculate available hours based on day of week
    pipeline.push({
      $addFields: {
        availableHours: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$_id.dayOfWeek', 1] }, // Sunday
                then: {
                  $cond: [
                    '$operatingHours.sunday.closed',
                    0,
                    {
                      $divide: [
                        {
                          $subtract: [
                            { $dateFromString: { dateString: { $concat: ['2000-01-01T', '$operatingHours.sunday.close', ':00Z'] } } },
                            { $dateFromString: { dateString: { $concat: ['2000-01-01T', '$operatingHours.sunday.open', ':00Z'] } } }
                          ]
                        },
                        1000 * 60 * 60
                      ]
                    }
                  ]
                }
              },
              {
                case: { $eq: ['$_id.dayOfWeek', 2] }, // Monday
                then: {
                  $cond: [
                    '$operatingHours.monday.closed',
                    0,
                    {
                      $divide: [
                        {
                          $subtract: [
                            { $dateFromString: { dateString: { $concat: ['2000-01-01T', '$operatingHours.monday.close', ':00Z'] } } },
                            { $dateFromString: { dateString: { $concat: ['2000-01-01T', '$operatingHours.monday.open', ':00Z'] } } }
                          ]
                        },
                        1000 * 60 * 60
                      ]
                    }
                  ]
                }
              }
              // Add similar cases for other days...
            ],
            default: 8 // Default 8 hours if calculation fails
          }
        }
      }
    });

    // Calculate occupancy rate
    pipeline.push({
      $addFields: {
        occupancyRate: {
          $cond: [
            { $gt: ['$availableHours', 0] },
            {
              $multiply: [
                { $divide: ['$totalBookedHours', '$availableHours'] },
                100
              ]
            },
            0
          ]
        }
      }
    });

    // Sort by date
    pipeline.push({ $sort: { '_id.date': 1 } });

    return pipeline;
  }

  /**
   * Popular Spaces Pipeline
   */
  getPopularSpacesPipeline(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
    metric: 'bookings' | 'revenue' | 'rating' = 'bookings'
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Match stage for date range
    if (startDate || endDate) {
      const matchCondition: any = {};
      if (startDate || endDate) {
        matchCondition.bookingDate = {};
        if (startDate) matchCondition.bookingDate.$gte = startDate;
        if (endDate) matchCondition.bookingDate.$lte = endDate;
      }
      pipeline.push({ $match: matchCondition });
    }

    // Group by space
    pipeline.push({
      $group: {
        _id: '$spaceId',
        totalBookings: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$payment.status', 'paid'] },
              '$pricing.totalAmount',
              0
            ]
          }
        },
        averageBookingValue: {
          $avg: {
            $cond: [
              { $eq: ['$payment.status', 'paid'] },
              '$pricing.totalAmount',
              null
            ]
          }
        },
        uniqueCustomers: { $addToSet: '$customerId' },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalHours: { $sum: '$duration' }
      }
    });

    // Lookup space details
    pipeline.push({
      $lookup: {
        from: 'spaces',
        localField: '_id',
        foreignField: '_id',
        as: 'space'
      }
    });

    pipeline.push({ $unwind: '$space' });

    // Lookup reviews for rating
    pipeline.push({
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'spaceId',
        pipeline: [
          { $match: { status: 'approved' } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 }
            }
          }
        ],
        as: 'reviewStats'
      }
    });

    // Add computed fields
    pipeline.push({
      $addFields: {
        uniqueCustomerCount: { $size: '$uniqueCustomers' },
        averageRating: {
          $ifNull: [{ $arrayElemAt: ['$reviewStats.averageRating', 0] }, 0]
        },
        reviewCount: {
          $ifNull: [{ $arrayElemAt: ['$reviewStats.reviewCount', 0] }, 0]
        },
        popularityScore: {
          $add: [
            { $multiply: ['$totalBookings', 0.4] },
            { $multiply: ['$uniqueCustomerCount', 0.3] },
            { $multiply: [{ $ifNull: [{ $arrayElemAt: ['$reviewStats.averageRating', 0] }, 0] }, 0.2] },
            { $multiply: [{ $divide: ['$totalRevenue', 1000] }, 0.1] }
          ]
        }
      }
    });

    // Sort by the specified metric
    const sortField = {
      bookings: 'totalBookings',
      revenue: 'totalRevenue',
      rating: 'averageRating'
    }[metric];

    pipeline.push({ $sort: { [sortField]: -1, popularityScore: -1 } });

    // Limit results
    pipeline.push({ $limit: limit });

    // Project final fields
    pipeline.push({
      $project: {
        spaceId: '$_id',
        spaceName: '$space.name',
        category: '$space.category',
        location: {
          city: '$space.address.city',
          state: '$space.address.state'
        },
        images: { $slice: ['$space.images', 3] },
        totalBookings: 1,
        totalRevenue: 1,
        averageBookingValue: 1,
        uniqueCustomerCount: 1,
        averageRating: 1,
        reviewCount: 1,
        totalHours: 1,
        popularityScore: 1,
        _id: 0
      }
    });

    return pipeline;
  }

  /**
   * Booking Trends Pipeline
   */
  getBookingTrendsPipeline(
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: Date,
    endDate?: Date
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Match stage
    const matchCondition: any = {};
    if (startDate || endDate) {
      matchCondition.bookingDate = {};
      if (startDate) matchCondition.bookingDate.$gte = startDate;
      if (endDate) matchCondition.bookingDate.$lte = endDate;
    }

    if (Object.keys(matchCondition).length > 0) {
      pipeline.push({ $match: matchCondition });
    }

    // Group by time period
    const groupByFormats = {
      hourly: {
        period: {
          $dateToString: {
            format: '%Y-%m-%d %H:00',
            date: '$createdAt'
          }
        },
        hour: { $hour: '$createdAt' }
      },
      daily: {
        period: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        dayOfWeek: { $dayOfWeek: '$createdAt' }
      },
      weekly: {
        period: {
          $dateToString: {
            format: '%Y-W%U',
            date: '$createdAt'
          }
        }
      },
      monthly: {
        period: {
          $dateToString: {
            format: '%Y-%m',
            date: '$createdAt'
          }
        }
      }
    };

    const groupId = groupByFormats[period];

    pipeline.push({
      $group: {
        _id: groupId,
        totalBookings: { $sum: 1 },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$payment.status', 'paid'] },
              '$pricing.totalAmount',
              0
            ]
          }
        },
        averageBookingValue: {
          $avg: {
            $cond: [
              { $eq: ['$payment.status', 'paid'] },
              '$pricing.totalAmount',
              null
            ]
          }
        }
      }
    });

    // Add conversion rates
    pipeline.push({
      $addFields: {
        confirmationRate: {
          $cond: [
            { $gt: ['$totalBookings', 0] },
            { $multiply: [{ $divide: ['$confirmedBookings', '$totalBookings'] }, 100] },
            0
          ]
        },
        cancellationRate: {
          $cond: [
            { $gt: ['$totalBookings', 0] },
            { $multiply: [{ $divide: ['$cancelledBookings', '$totalBookings'] }, 100] },
            0
          ]
        },
        completionRate: {
          $cond: [
            { $gt: ['$totalBookings', 0] },
            { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] },
            0
          ]
        }
      }
    });

    // Sort by period
    pipeline.push({ $sort: { '_id.period': 1 } });

    return pipeline;
  }

  /**
   * Search Analytics Pipeline
   */
  getSearchAnalyticsPipeline(
    startDate?: Date,
    endDate?: Date
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // This would work with a search_logs collection that tracks search queries
    const matchCondition: any = {};
    if (startDate || endDate) {
      matchCondition.createdAt = {};
      if (startDate) matchCondition.createdAt.$gte = startDate;
      if (endDate) matchCondition.createdAt.$lte = endDate;
    }

    if (Object.keys(matchCondition).length > 0) {
      pipeline.push({ $match: matchCondition });
    }

    // Group by search terms
    pipeline.push({
      $group: {
        _id: {
          query: { $toLower: '$searchQuery' },
          category: '$filters.category',
          location: '$filters.location'
        },
        searchCount: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        resultsFound: { $avg: '$resultsCount' },
        clickThroughRate: {
          $avg: { $cond: [{ $gt: ['$clickedResults', 0] }, 1, 0] }
        }
      }
    });

    // Add computed fields
    pipeline.push({
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' },
        popularityScore: {
          $multiply: ['$searchCount', { $add: ['$clickThroughRate', 0.1] }]
        }
      }
    });

    // Sort by popularity
    pipeline.push({ $sort: { popularityScore: -1 } });

    // Limit to top results
    pipeline.push({ $limit: 100 });

    return pipeline;
  }
}