import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../../schemas/user.schema';
import * as multer from 'multer';

@ApiTags('Spaces')
@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all published spaces' })
  async findAll(@Query() filters: any) {
    const spaces = await this.spacesService.findAll(filters);
    return { success: true, spaces };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get space by ID' })
  async findOne(@Param('id') id: string) {
    const space = await this.spacesService.findById(id);
    return { success: true, space };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new space' })
  async create(@Body() createSpaceDto: any, @CurrentUser() user: any) {
    const space = await this.spacesService.create(createSpaceDto, user._id);
    return { success: true, space };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a space' })
  async update(
    @Param('id') id: string,
    @Body() updateSpaceDto: any,
    @CurrentUser() user: any,
  ) {
    const space = await this.spacesService.update(id, updateSpaceDto, user._id);
    return { success: true, space };
  }

  @Get('owner/my-spaces')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get spaces owned by current user' })
  async getMySpaces(@CurrentUser() user: any) {
    const spaces = await this.spacesService.getOwnerSpaces(user._id);
    return { success: true, spaces };
  }

  @Post(':id/pricing/calculate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Calculate pricing for a booking' })
  async calculatePrice(
    @Param('id') spaceId: string,
    @Body() pricingDto: any,
  ) {
    const pricing = await this.spacesService.calculatePrice(
      spaceId,
      new Date(pricingDto.date),
      pricingDto.startTime,
      pricingDto.duration,
      pricingDto.promoCode,
    );
    return { success: true, pricing };
  }

  @Post(':id/availability/check')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Check space availability' })
  async checkAvailability(
    @Param('id') spaceId: string,
    @Body() availabilityDto: any,
  ) {
    const availability = await this.spacesService.checkAvailability(
      spaceId,
      new Date(availabilityDto.date),
      availabilityDto.startTime,
      availabilityDto.endTime,
    );
    return { success: true, ...availability };
  }

  @Post(':id/images')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload images for a space' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
  }))
  async uploadImages(
    @Param('id') spaceId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    const result = await this.spacesService.uploadImages(spaceId, files, user._id);
    return { success: true, ...result };
  }

  @Delete(':id/images/:imageIndex')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a specific image from a space' })
  async deleteImage(
    @Param('id') spaceId: string,
    @Param('imageIndex') imageIndex: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.spacesService.deleteImage(spaceId, parseInt(imageIndex), user._id);
    return { success: true, ...result };
  }

  @Post('upload/avatar')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('avatar', 1, {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB per file
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
  }))
  async uploadAvatar(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    const result = await this.spacesService.uploadAvatar(user._id, files[0]);
    return { success: true, ...result };
  }
}