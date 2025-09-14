import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SpacesModule } from './spaces/spaces.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { StaffModule } from './staff/staff.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting with different tiers for auth endpoints
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 second
        limit: 3,   // 3 requests per second
      },
      {
        name: 'medium', 
        ttl: 10000, // 10 seconds
        limit: 10,  // 10 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 60 seconds
        limit: 50,  // 50 requests per minute
      },
      {
        name: 'auth',
        ttl: 300000, // 5 minutes
        limit: 10,   // 10 auth requests per 5 minutes
      },
    ]),

    // Database connection
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    // SpacesModule, // Temporarily disabled - schema compilation errors
    // BookingsModule, // Temporarily disabled - schema compilation errors
    // PaymentsModule, // Temporarily disabled - schema compilation errors
    // StaffModule, // Temporarily disabled - schema compilation errors
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}