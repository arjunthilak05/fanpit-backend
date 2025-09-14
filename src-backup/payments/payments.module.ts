import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RazorpayService } from './services/razorpay.service';
import { WebhookService } from './services/webhook.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema }
    ])
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    RazorpayService,
    WebhookService
  ],
  exports: [
    PaymentsService,
    RazorpayService,
    WebhookService
  ],
})
export class PaymentsModule {}