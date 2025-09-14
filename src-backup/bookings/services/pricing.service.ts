import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  constructor() {}

  async calculatePrice(spaceId: string, startTime: Date, endTime: Date) {
    // Simple pricing calculation - fixed rate for demo
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
    const hourlyRate = 500; // ₹500 per hour
    const totalAmount = duration * hourlyRate;

    return {
      baseAmount: totalAmount,
      totalAmount: totalAmount,
      currency: 'INR'
    };
  }
}