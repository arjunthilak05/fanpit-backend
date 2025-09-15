import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Space, SpaceDocument, SpaceStatus } from '../../schemas/space.schema';
import { PricingService } from './pricing.service';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';

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

  async uploadImages(spaceId: string, files: Express.Multer.File[], userId: string) {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only upload images to your own spaces');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'spaces', spaceId);
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedImages: string[] = [];

    for (const file of files) {
      try {
        // Generate unique filename
        const fileName = `${uuidv4()}.webp`;
        const filePath = path.join(uploadDir, fileName);

        // Process image with Sharp (resize and convert to WebP)
        const processedBuffer = await sharp(file.buffer)
          .resize(1200, 800, { fit: 'cover', position: 'center' })
          .webp({ quality: 85 })
          .toBuffer();

        await fs.writeFile(filePath, processedBuffer);

        // Generate thumbnail
        const thumbnailName = `${uuidv4()}_thumb.webp`;
        const thumbnailPath = path.join(uploadDir, thumbnailName);

        await sharp(file.buffer)
          .resize(400, 267, { fit: 'cover', position: 'center' })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);

        uploadedImages.push(`/uploads/spaces/${spaceId}/${fileName}`);
      } catch (error) {
        console.error('Error processing image:', error);
        throw new BadRequestException(`Failed to process image: ${file.originalname}`);
      }
    }

    // Update space with new images
    const updatedImages = [...(space.images || []), ...uploadedImages];
    await this.spaceModel.findByIdAndUpdate(spaceId, { images: updatedImages });

    return {
      message: `Successfully uploaded ${files.length} image(s)`,
      uploadedImages,
      totalImages: updatedImages.length
    };
  }

  async deleteImage(spaceId: string, imageIndex: number, userId: string) {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete images from your own spaces');
    }

    if (!space.images || !space.images[imageIndex]) {
      throw new NotFoundException('Image not found');
    }

    const imageUrl = space.images[imageIndex];
    const imagePath = path.join(process.cwd(), imageUrl);

    try {
      await fs.unlink(imagePath);
    } catch (error) {
      console.warn('Failed to delete image file:', error);
    }

    // Remove image from space
    const updatedImages = space.images.filter((_, index) => index !== imageIndex);
    await this.spaceModel.findByIdAndUpdate(spaceId, { images: updatedImages });

    return {
      message: 'Image deleted successfully',
      deletedImage: imageUrl,
      remainingImages: updatedImages.length
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    await fs.mkdir(uploadDir, { recursive: true });

    try {
      // Generate unique filename
      const fileName = `${userId}_${uuidv4()}.webp`;
      const filePath = path.join(uploadDir, fileName);

      // Process avatar with Sharp (resize to square and convert to WebP)
      const processedBuffer = await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toBuffer();

      await fs.writeFile(filePath, processedBuffer);

      const avatarUrl = `/uploads/avatars/${fileName}`;

      // Update user avatar (we'll need to implement this in users service)
      // For now, return the URL
      return {
        message: 'Avatar uploaded successfully',
        avatarUrl
      };
    } catch (error) {
      console.error('Error processing avatar:', error);
      throw new BadRequestException('Failed to process avatar image');
    }
  }
}