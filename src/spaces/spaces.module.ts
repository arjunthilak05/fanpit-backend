import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { PricingService } from './services/pricing.service';
import { Space, SpaceSchema } from './schemas/space.schema';

// Import file upload service
import { FileUploadService } from '../common/services/file-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Space.name, schema: SpaceSchema }]),
  ],
  controllers: [SpacesController],
  providers: [SpacesService, PricingService, FileUploadService],
  exports: [SpacesService, PricingService],
})
export class SpacesModule {}