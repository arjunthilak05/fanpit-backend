import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('bookings')
export class BookingsController {
  constructor() {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBooking(@Body() bookingData: any, @Request() req: any) {
    // Simple booking creation for payment flow
    const booking = {
      id: `booking_${Date.now()}`,
      bookingCode: `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
      status: 'confirmed',
      spaceId: bookingData.spaceId,
      customerId: req.user.userId,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      totalAmount: bookingData.totalAmount,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      data: booking
    };
  }
}