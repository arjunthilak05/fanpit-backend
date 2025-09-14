import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CoreModule } from './core/core.module';
import { AuthModule } from './core/auth.module';

@Module({
  imports: [
    CoreModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 second
        limit: 3,   // 3 requests per second
      },
      {
        name: 'medium', 
        ttl: 10000, // 10 seconds
        limit: 20,  // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 60 seconds
        limit: 100,  // 100 requests per minute
      },
      {
        name: 'auth',
        ttl: 300000, // 5 minutes
        limit: 10,   // 10 auth requests per 5 minutes
      },
    ]),
    AuthModule,
  ],
})
export class SimpleAppModule {}