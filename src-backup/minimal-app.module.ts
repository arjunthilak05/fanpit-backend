import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/fanpit'),
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
    AuthModule,
    AgentsModule,
  ],
})
export class MinimalAppModule {}
