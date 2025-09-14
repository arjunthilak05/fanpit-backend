import { Injectable } from '@nestjs/common';

@Injectable()
export class AvailabilityService {
  constructor() {}

  async checkAvailability(spaceId: string, startTime: Date, endTime: Date) {
    // Simple availability check - always return available for demo
    return {
      available: true,
      conflicts: []
    };
  }
}