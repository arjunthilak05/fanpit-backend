import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { PricingService } from './pricing.service';
import { Space, SpaceSchema } from '../../schemas/space.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Space.name, schema: SpaceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SpacesController],
  providers: [SpacesService, PricingService],
  exports: [SpacesService, PricingService],
})
export class SpacesModule {}