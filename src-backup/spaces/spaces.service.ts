import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException,
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Space, SpaceDocument } from './schemas/space.schema';
import { PricingService } from './services/pricing.service';
import { FileUploadService } from '../common/services/file-upload.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { SearchSpacesDto } from './dto/search-spaces.dto';
import { CreatePromoCodeDto, ValidatePromoCodeDto } from './dto/promo-code.dto';
import { PaginationResult, PaginationUtil } from '../common/utils/pagination.util';
import { SearchUtil } from '../common/utils/search.util';
import { SpaceResponseDto, PaginatedSpacesResponseDto, SpaceAnalyticsDto } from './dto/space-response.dto';

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);
  private readonly allowedSortFields = ['createdAt', 'rating', 'price', 'capacity', 'distance'];

  constructor(
    @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>,
    private pricingService: PricingService,
    private fileUploadService: FileUploadService,
  ) {}

  // CRUD Operations

  /**
   * Create a new space
   */
  async create(createSpaceDto: CreateSpaceDto, ownerId: string): Promise<SpaceResponseDto> {
    try {
      this.logger.log(`Creating new space: ${createSpaceDto.name} for owner: ${ownerId}`);

      const space = new this.spaceModel({
        ...createSpaceDto,
        ownerId,
      });

      const savedSpace = await space.save();
      await savedSpace.populate('ownerId', 'name organization');

      this.logger.log(`Space created successfully: ${savedSpace._id}`);
      return this.formatSpaceResponse(savedSpace);
    } catch (error) {
      this.logger.error(`Failed to create space: ${error.message}`);
      if (error.code === 11000) {
        throw new BadRequestException('A space with similar details already exists');
      }
      throw new BadRequestException(`Failed to create space: ${error.message}`);
    }
  }

  /**
   * Get all spaces with search and filtering
   */
  async findAll(searchDto: SearchSpacesDto): Promise<PaginatedSpacesResponseDto> {
    try {
      const { page = 1, limit = 10, sortBy, sortOrder = 'desc', ...filters } = searchDto;

      // Build aggregation pipeline
      const pipeline = SearchUtil.buildSearchPipeline(filters);

      // Add sort stage
      const hasTextSearch = !!filters.query;
      const hasGeoSearch = !!(filters.lat && filters.lng && filters.radius);
      const sortStage = SearchUtil.buildSortStage(sortBy, sortOrder, hasTextSearch, hasGeoSearch);
      pipeline.push(sortStage);

      // Add projection stage
      pipeline.push(SearchUtil.buildProjectionStage());

      // Execute aggregation with pagination
      const skip = (page - 1) * limit;
      const [spaces, totalCount] = await Promise.all([
        this.spaceModel.aggregate([
          ...pipeline,
          { $skip: skip },
          { $limit: limit },
        ]),
        this.spaceModel.aggregate([
          ...pipeline.slice(0, -2), // Remove sort and projection for count
          { $count: 'total' },
        ]),
      ]);

      const total = totalCount[0]?.total || 0;
      const paginationResult = PaginationUtil.buildPaginationResponse(
        spaces.map(space => this.formatAggregatedSpaceResponse(space)),
        total,
        page,
        limit,
      );

      return {
        ...paginationResult,
        filters: this.buildAppliedFilters(searchDto),
      };
    } catch (error) {
      this.logger.error(`Failed to search spaces: ${error.message}`);
      throw new BadRequestException(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get space by ID
   */
  async findById(id: string, incrementView = false): Promise<SpaceResponseDto> {
    const space = await this.spaceModel
      .findById(id)
      .populate('ownerId', 'name organization')
      .exec();

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (!space.isActive) {
      throw new NotFoundException('Space is no longer available');
    }

    // Increment view count
    if (incrementView) {
      await this.spaceModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    }

    return this.formatSpaceResponse(space);
  }

  /**
   * Get spaces owned by user
   */
  async findByOwner(
    ownerId: string,
    page = 1,
    limit = 10,
    includeInactive = false,
  ): Promise<PaginatedSpacesResponseDto> {
    const filter: any = { ownerId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const { query, page: validPage, limit: validLimit } = PaginationUtil.applyPagination(
      this.spaceModel.find(filter).populate('ownerId', 'name organization'),
      { page, limit, sortBy: 'createdAt', sortOrder: 'desc' },
      this.allowedSortFields,
    );

    const [spaces, total] = await Promise.all([
      query.exec(),
      this.spaceModel.countDocuments(filter),
    ]);

    const formattedSpaces = spaces.map(space => this.formatSpaceResponse(space));
    const paginationResult = PaginationUtil.buildPaginationResponse(
      formattedSpaces,
      total,
      validPage,
      validLimit,
    );

    return paginationResult;
  }

  /**
   * Update space
   */
  async update(id: string, updateSpaceDto: UpdateSpaceDto, userId: string): Promise<SpaceResponseDto> {
    const space = await this.spaceModel.findById(id);
    
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check ownership (unless user is staff)
    if (space.ownerId.toString() !== userId) {
      // This check might be redundant if SpaceOwnershipGuard is used, but keeping for safety
      throw new ForbiddenException('You can only update your own spaces');
    }

    try {
      const updatedSpace = await this.spaceModel
        .findByIdAndUpdate(id, updateSpaceDto, { new: true, runValidators: true })
        .populate('ownerId', 'name organization')
        .exec();

      this.logger.log(`Space updated successfully: ${id}`);
      return this.formatSpaceResponse(updatedSpace!);
    } catch (error) {
      this.logger.error(`Failed to update space ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update space: ${error.message}`);
    }
  }

  /**
   * Delete space (soft delete)
   */
  async remove(id: string, userId: string): Promise<void> {
    const space = await this.spaceModel.findById(id);
    
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check ownership
    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own spaces');
    }

    await this.spaceModel.findByIdAndUpdate(id, { isActive: false });
    this.logger.log(`Space soft deleted: ${id}`);
  }

  // Promo Code Management

  /**
   * Add promo code to space
   */
  async addPromoCode(spaceId: string, createPromoCodeDto: CreatePromoCodeDto, ownerId: string): Promise<any> {
    const space = await this.spaceModel.findById(spaceId);
    
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You can only manage promo codes for your own spaces');
    }

    // Check if promo code already exists
    const existingPromo = space.promoCodes.find(
      promo => promo.code === createPromoCodeDto.code.toUpperCase()
    );
    
    if (existingPromo) {
      throw new BadRequestException('Promo code already exists for this space');
    }

    // Validate dates
    const validFrom = new Date(createPromoCodeDto.validFrom);
    const validTo = new Date(createPromoCodeDto.validTo);
    
    if (validTo <= validFrom) {
      throw new BadRequestException('Valid to date must be after valid from date');
    }

    const newPromoCode = {
      ...createPromoCodeDto,
      code: createPromoCodeDto.code.toUpperCase(),
      validFrom,
      validTo,
      usedCount: 0,
    };

    space.promoCodes.push(newPromoCode as any);
    await space.save();

    this.logger.log(`Promo code added to space ${spaceId}: ${newPromoCode.code}`);
    return newPromoCode;
  }

  /**
   * Validate and apply promo code
   */
  async validatePromoCode(spaceId: string, validateDto: ValidatePromoCodeDto): Promise<any> {
    const space = await this.spaceModel.findById(spaceId);
    
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const validation = this.pricingService.validatePromoCode(space, validateDto.code);
    
    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    // Calculate discount
    let discountAmount = 0;
    if (validation.promo.type === 'percentage') {
      discountAmount = validateDto.price * (validation.promo.discount / 100);
    } else {
      discountAmount = Math.min(validation.promo.discount, validateDto.price);
    }

    return {
      valid: true,
      promoCode: validation.promo,
      originalPrice: validateDto.price,
      discountAmount,
      finalPrice: validateDto.price - discountAmount,
    };
  }

  // Analytics

  /**
   * Get space analytics
   */
  async getAnalytics(spaceId: string, ownerId: string): Promise<SpaceAnalyticsDto> {
    const space = await this.spaceModel.findById(spaceId);
    
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You can only view analytics for your own spaces');
    }

    // TODO: When booking system is implemented, add real analytics
    // For now, return mock analytics based on space data
    const analytics: SpaceAnalyticsDto = {
      spaceId,
      totalBookings: space.totalBookings || 0,
      totalRevenue: space.totalRevenue || 0,
      averageBookingValue: space.totalBookings > 0 ? space.totalRevenue / space.totalBookings : 0,
      viewCount: space.viewCount || 0,
      conversionRate: space.viewCount > 0 ? (space.totalBookings / space.viewCount) : 0,
      peakHours: space.pricing.peakHours ? [`${space.pricing.peakHours.start}-${space.pricing.peakHours.end}`] : [],
      popularAmenities: space.amenities.slice(0, 5),
      monthlyData: [], // Will be populated when booking data is available
      revenueBreakdown: {
        hourly: space.totalRevenue * 0.7,
        timeBlocks: space.totalRevenue * 0.2,
        monthlyPass: space.totalRevenue * 0.1,
        special: 0,
      },
    };

    return analytics;
  }

  // Image Management

  /**
   * Upload images to space
   */
  async uploadImages(spaceId: string, files: Express.Multer.File[], userId: string): Promise<SpaceResponseDto> {
    try {
      const space = await this.spaceModel.findById(spaceId);
      if (!space) {
        throw new NotFoundException('Space not found');
      }

      // Verify ownership
      if (space.ownerId.toString() !== userId) {
        throw new ForbiddenException('You can only manage your own spaces');
      }

      // Check image limit (max 10 images per space)
      const remainingSlots = 10 - space.images.length;
      if (remainingSlots <= 0) {
        throw new BadRequestException('Maximum 10 images allowed per space');
      }

      const imagesToUpload = files.slice(0, remainingSlots);

      // Upload images using file upload service
      const uploadedImages = await Promise.all(
        imagesToUpload.map(async (file) => {
          // Validate file
          this.fileUploadService.validateFile(file, {
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            maxSize: 10 * 1024 * 1024, // 10MB
          });

          // Upload and process image
          const result = await this.fileUploadService.uploadImageWithSizes(file, `spaces/${spaceId}`);
          return result.original.url; // Store original image URL
        })
      );

      // Add images to space
      space.images.push(...uploadedImages);
      space.updatedAt = new Date();
      await space.save();

      return this.transformToResponseDto(space);
    } catch (error) {
      this.logger.error(`Error uploading images to space ${spaceId}:`, error);
      throw error;
    }
  }

  /**
   * Add image to space
   */
  async addImage(spaceId: string, imageUrl: string, ownerId: string): Promise<SpaceResponseDto> {
    const space = await this.spaceModel.findById(spaceId);

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You can only manage images for your own spaces');
    }

    if (space.images.length >= 10) {
      throw new BadRequestException('Maximum of 10 images allowed per space');
    }

    space.images.push(imageUrl);
    await space.save();

    this.logger.log(`Image added to space ${spaceId}: ${imageUrl}`);
    return this.formatSpaceResponse(space);
  }

  /**
   * Remove image from space
   */
  async removeImage(spaceId: string, imageUrl: string, ownerId: string): Promise<SpaceResponseDto> {
    const space = await this.spaceModel.findById(spaceId);
    
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You can only manage images for your own spaces');
    }

    const imageIndex = space.images.indexOf(imageUrl);
    if (imageIndex === -1) {
      throw new NotFoundException('Image not found in space');
    }

    space.images.splice(imageIndex, 1);
    await space.save();

    this.logger.log(`Image removed from space ${spaceId}: ${imageUrl}`);
    return this.formatSpaceResponse(space);
  }

  // Helper Methods

  /**
   * Format space response for API
   */
  private formatSpaceResponse(space: any): SpaceResponseDto {
    return {
      id: space._id.toString(),
      name: space.name,
      description: space.description,
      address: space.address,
      capacity: space.capacity,
      category: space.category,
      amenities: space.amenities,
      images: space.images,
      pricing: {
        basePrice: space.pricing.basePrice,
        priceType: space.pricing.priceType,
        peakHours: space.pricing.peakHours,
        offPeakMultiplier: space.pricing.offPeakMultiplier,
        weekendMultiplier: space.pricing.weekendMultiplier,
        timeBlocks: space.pricing.timeBlocks,
        monthlyPass: space.pricing.monthlyPass,
      },
      operatingHours: space.operatingHours,
      rating: space.rating,
      reviewCount: space.reviewCount,
      totalBookings: space.totalBookings,
      owner: {
        id: space.ownerId._id || space.ownerId,
        name: space.ownerId.name || 'Unknown',
        organization: space.ownerId.organization,
      },
      isFeatured: space.isFeatured,
      isVerified: space.isVerified,
      createdAt: space.createdAt.toISOString(),
      updatedAt: space.updatedAt.toISOString(),
    };
  }

  /**
   * Format aggregated space response
   */
  private formatAggregatedSpaceResponse(space: any): SpaceResponseDto {
    const formatted = this.formatSpaceResponse(space);
    
    // Add distance if available from geospatial search
    if (space.distance !== undefined) {
      formatted.distance = Math.round(space.distance / 1000 * 100) / 100; // Convert to km and round
    }

    return formatted;
  }

  /**
   * Build applied filters summary
   */
  private buildAppliedFilters(searchDto: SearchSpacesDto): Record<string, any> {
    const filters: Record<string, any> = {};

    if (searchDto.query) filters.query = searchDto.query;
    if (searchDto.category) filters.category = searchDto.category;
    if (searchDto.city) filters.city = searchDto.city;
    if (searchDto.state) filters.state = searchDto.state;
    if (searchDto.minPrice || searchDto.maxPrice) {
      filters.priceRange = `${searchDto.minPrice || 0}-${searchDto.maxPrice || '∞'}`;
    }
    if (searchDto.minCapacity || searchDto.maxCapacity) {
      filters.capacityRange = `${searchDto.minCapacity || 0}-${searchDto.maxCapacity || '∞'}`;
    }
    if (searchDto.amenities && searchDto.amenities.length > 0) {
      filters.amenities = searchDto.amenities;
    }
    if (searchDto.minRating) filters.minRating = searchDto.minRating;
    if (searchDto.featured) filters.featured = true;
    if (searchDto.verified) filters.verified = true;

    return filters;
  }
}