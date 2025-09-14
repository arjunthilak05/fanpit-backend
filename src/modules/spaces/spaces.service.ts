import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Space, SpaceDocument, SpaceStatus } from '../../schemas/space.schema';
import { PricingService } from './pricing.service';

@Injectable()
export class SpacesService {
  constructor(
    @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>,
    private pricingService: PricingService,
  ) {}

  async findAll(filters: any = {}) {
    const query: any = { isPublished: true, status: SpaceStatus.ACTIVE };
    
    if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
    if (filters.type) query.type = filters.type;
    if (filters.minCapacity) query.capacity = { $gte: filters.minCapacity };
    
    return this.spaceModel.find(query).populate('ownerId', 'name email');
  }

  async findById(id: string) {
    const space = await this.spaceModel.findById(id).populate('ownerId', 'name email');
    if (!space) {
      throw new NotFoundException('Space not found');
    }
    return space;
  }

  async create(spaceData: any, ownerId: string) {
    const space = new this.spaceModel({ ...spaceData, ownerId });
    return space.save();
  }

  async update(id: string, updateData: any, userId: string) {
    const space = await this.spaceModel.findById(id);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own spaces');
    }

    return this.spaceModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async getOwnerSpaces(ownerId: string) {
    return this.spaceModel.find({ ownerId }).sort({ createdAt: -1 });
  }

  async calculatePrice(spaceId: string, date: Date, startTime: string, duration: number, promoCode?: string) {
    const space = await this.findById(spaceId);
    return this.pricingService.calculatePrice(
      space.pricingRules,
      date,
      startTime,
      duration,
      promoCode,
    );
  }

  async checkAvailability(spaceId: string, date: Date, startTime: string, endTime: string) {
    // Check against existing bookings
    // For now, return available
    return { available: true, conflicts: [] };
  }
}