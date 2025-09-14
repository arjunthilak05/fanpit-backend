import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../../schemas/booking.schema';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async getTodaysBookings(spaceId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.bookingModel
      .find({
        spaceId,
        date: { $gte: startOfDay, $lte: endOfDay },
      })
      .populate('userId')
      .sort({ startTime: 1 });
  }

  async checkInGuest(bookingId: string, staffId: string) {
    return this.bookingModel.findByIdAndUpdate(
      bookingId,
      {
        status: BookingStatus.CHECKED_IN,
        checkInDetails: {
          checkedInAt: new Date(),
          checkedInBy: staffId,
        },
      },
      { new: true },
    );
  }

  async checkOutGuest(bookingId: string, staffId: string) {
    return this.bookingModel.findByIdAndUpdate(
      bookingId,
      {
        status: BookingStatus.CHECKED_OUT,
        checkOutDetails: {
          checkedOutAt: new Date(),
          checkedOutBy: staffId,
        },
      },
      { new: true },
    );
  }
}