import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimetype: string;
  originalName: string;
}

export interface ProcessedImage {
  original: UploadResult;
  thumbnail?: UploadResult;
  medium?: UploadResult;
  large?: UploadResult;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    // Initialize AWS S3
    AWS.config.update({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
    });

    this.s3 = new AWS.S3();
  }

  /**
   * Upload single file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    options: {
      resize?: { width: number; height: number };
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<UploadResult> {
    try {
      const bucket = this.configService.get<string>('AWS_S3_BUCKET');
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${fileName}`;

      let fileBuffer = file.buffer;
      let processedSize = file.size;

      // Process image if options provided
      if (options.resize || options.quality || options.format) {
        const sharpInstance = sharp(file.buffer);

        if (options.resize) {
          sharpInstance.resize(options.resize.width, options.resize.height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        if (options.quality) {
          sharpInstance.jpeg({ quality: options.quality });
        }

        if (options.format) {
          switch (options.format) {
            case 'jpeg':
              sharpInstance.jpeg();
              break;
            case 'png':
              sharpInstance.png();
              break;
            case 'webp':
              sharpInstance.webp();
              break;
          }
        }

        fileBuffer = await sharpInstance.toBuffer();
        processedSize = fileBuffer.length;
      }

      const uploadParams = {
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      };

      const result = await this.s3.upload(uploadParams).promise();

      return {
        url: result.Location,
        key: result.Key,
        bucket,
        size: processedSize,
        mimetype: file.mimetype,
        originalName: file.originalname,
      };
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw new BadRequestException('File upload failed');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
    options: {
      resize?: { width: number; height: number };
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Process and upload image with multiple sizes
   */
  async uploadImageWithSizes(
    file: Express.Multer.File,
    folder: string = 'images'
  ): Promise<ProcessedImage> {
    try {
      const original = await this.uploadFile(file, folder);

      // Generate thumbnail (200x200)
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailFile = {
        ...file,
        buffer: thumbnailBuffer,
        originalname: `thumb_${file.originalname}`,
      };

      const thumbnail = await this.uploadFile(thumbnailFile, `${folder}/thumbnails`);

      // Generate medium size (800x600)
      const mediumBuffer = await sharp(file.buffer)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const mediumFile = {
        ...file,
        buffer: mediumBuffer,
        originalname: `medium_${file.originalname}`,
      };

      const medium = await this.uploadFile(mediumFile, `${folder}/medium`);

      return {
        original,
        thumbnail,
        medium,
      };
    } catch (error) {
      this.logger.error('Image processing failed:', error);
      throw new BadRequestException('Image processing failed');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const bucket = this.configService.get<string>('AWS_S3_BUCKET');

      await this.s3.deleteObject({
        Bucket: bucket,
        Key: key,
      }).promise();

      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error('File deletion failed:', error);
      throw new BadRequestException('File deletion failed');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(keys: string[]): Promise<void> {
    const deletePromises = keys.map(key => this.deleteFile(key));
    await Promise.all(deletePromises);
  }

  /**
   * Validate file type and size
   */
  validateFile(file: Express.Multer.File, options: {
    allowedTypes?: string[];
    maxSize?: number; // in bytes
  } = {}): void {
    const { allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024 } = options;

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new BadRequestException(`File size ${file.size} exceeds maximum size ${maxSize}`);
    }
  }

  /**
   * Generate presigned URL for secure access
   */
  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const bucket = this.configService.get<string>('AWS_S3_BUCKET');

      const params = {
        Bucket: bucket,
        Key: key,
        Expires: expiresIn,
      };

      return this.s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      this.logger.error('Presigned URL generation failed:', error);
      throw new BadRequestException('Failed to generate secure URL');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const bucket = this.configService.get<string>('AWS_S3_BUCKET');

      return await this.s3.headObject({
        Bucket: bucket,
        Key: key,
      }).promise();
    } catch (error) {
      this.logger.error('File metadata retrieval failed:', error);
      throw new BadRequestException('Failed to get file metadata');
    }
  }
}
