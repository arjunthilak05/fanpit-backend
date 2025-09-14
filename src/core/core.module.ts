import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fanpit',
      {
        autoIndex: true,
        retryWrites: true,
      }
    ),
  ],
  exports: [ConfigModule, MongooseModule],
})
export class CoreModule {}