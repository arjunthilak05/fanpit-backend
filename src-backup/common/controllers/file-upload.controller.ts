import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  Delete,
  Get,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { FileUploadService, UploadResult, ProcessedImage } from '../services/file-upload.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../decorators/user.decorator';

@ApiTags('File Upload')
@Controller('upload')
@UseGuards(ThrottlerGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('single')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        folder: {
          type: 'string',
          description: 'Upload folder (optional)',
          example: 'spaces',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            key: { type: 'string' },
            bucket: { type: 'string' },
            size: { type: 'number' },
            mimetype: { type: 'string' },
            originalName: { type: 'string' },
          },
        },
      },
    },
  })
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { folder?: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; data: UploadResult }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file
    this.fileUploadService.validateFile(file);

    const folder = body.folder || 'uploads';
    const result = await this.fileUploadService.uploadFile(file, folder);

    return {
      success: true,
      data: result,
    };
  }

  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Files to upload (max 10)',
        },
        folder: {
          type: 'string',
          description: 'Upload folder (optional)',
          example: 'spaces',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              key: { type: 'string' },
              bucket: { type: 'string' },
              size: { type: 'number' },
              mimetype: { type: 'string' },
              originalName: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { folder?: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; data: UploadResult[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed');
    }

    // Validate all files
    files.forEach(file => this.fileUploadService.validateFile(file));

    const folder = body.folder || 'uploads';
    const results = await this.fileUploadService.uploadMultipleFiles(files, folder);

    return {
      success: true,
      data: results,
    };
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload and process image with multiple sizes' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
        folder: {
          type: 'string',
          description: 'Upload folder (optional)',
          example: 'spaces',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded and processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            original: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                key: { type: 'string' },
                bucket: { type: 'string' },
                size: { type: 'number' },
                mimetype: { type: 'string' },
                originalName: { type: 'string' },
              },
            },
            thumbnail: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                key: { type: 'string' },
                bucket: { type: 'string' },
                size: { type: 'number' },
                mimetype: { type: 'string' },
                originalName: { type: 'string' },
              },
            },
            medium: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                key: { type: 'string' },
                bucket: { type: 'string' },
                size: { type: 'number' },
                mimetype: { type: 'string' },
                originalName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { folder?: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; data: ProcessedImage }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate image file
    this.fileUploadService.validateFile(file, {
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 10 * 1024 * 1024, // 10MB for images
    });

    const folder = body.folder || 'images';
    const result = await this.fileUploadService.uploadImageWithSizes(file, folder);

    return {
      success: true,
      data: result,
    };
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete file from storage' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'File deleted successfully' },
      },
    },
  })
  async deleteFile(
    @Param('key') key: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    await this.fileUploadService.deleteFile(key);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Get('presigned/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate presigned URL for secure file access' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        url: { type: 'string', description: 'Presigned URL for secure access' },
        expiresIn: { type: 'number', description: 'URL expiration time in seconds' },
      },
    },
  })
  async generatePresignedUrl(
    @Param('key') key: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; url: string; expiresIn: number }> {
    const url = await this.fileUploadService.generatePresignedUrl(key, 3600); // 1 hour

    return {
      success: true,
      url,
      expiresIn: 3600,
    };
  }
}
