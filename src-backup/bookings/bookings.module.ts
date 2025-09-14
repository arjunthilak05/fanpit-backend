import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { AvailabilityService } from './services/availability.service';
import { PricingService } from './services/pricing.service';
import { BookingLifecycleService } from './services/booking-lifecycle.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Space, SpaceSchema } from '../spaces/schemas/space.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Space.name, schema: SpaceSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    AvailabilityService,
    PricingService,
    BookingLifecycleService
  ],
  exports: [
    BookingsService,
    AvailabilityService,
    PricingService,
    BookingLifecycleService
  ],
})
export class BookingsModule {}