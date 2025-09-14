import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../../schemas/booking.schema';
import { Space, SpaceDocument } from '../../schemas/space.schema';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async getOwnerAnalytics(ownerId: string) {
    const totalSpaces = await this.spaceModel.countDocuments({ ownerId });
    const totalBookings = await this.bookingModel.countDocuments({
      spaceId: { $in: await this.spaceModel.find({ ownerId }).distinct('_id') },
    });

    return {
      totalSpaces,
      totalBookings,
      totalRevenue: 0, // Calculate from payments
    };
  }

  async getSpaceAnalytics(spaceId: string) {
    const totalBookings = await this.bookingModel.countDocuments({ spaceId });
    const occupancyRate = 75; // Calculate based on bookings vs available slots

    return {
      totalBookings,
      occupancyRate,
      averageRating: 4.5, // Calculate from reviews
    };
  }
}