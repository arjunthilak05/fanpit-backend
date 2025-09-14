import { Injectable } from '@nestjs/common';

@Injectable()
export class BookingsService {
  constructor() {}

  async createBooking(bookingData: any) {
    // Simple booking creation for payment flow
    return {
      id: `booking_${Date.now()}`,
      bookingCode: `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
      status: 'confirmed',
      ...bookingData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}