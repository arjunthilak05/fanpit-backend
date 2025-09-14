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
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';

import { SpacesService } from './spaces.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/user.decorator';
import { RequireSpaceOwnership } from '../common/decorators/space-owner.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { SearchSpacesDto } from './dto/search-spaces.dto';
import { CreatePromoCodeDto, ValidatePromoCodeDto } from './dto/promo-code.dto';
import { 
  SpaceResponseDto, 
  PaginatedSpacesResponseDto, 
  SpaceAnalyticsDto 
} from './dto/space-response.dto';

@ApiTags('Spaces')
@Controller('spaces')
@UseGuards(ThrottlerGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  // Public Endpoints

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse all spaces with search and filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Spaces retrieved successfully',
    type: PaginatedSpacesResponseDto 
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, enum: ['coworking', 'event', 'meeting', 'casual'] })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'minCapacity', required: false, type: Number })
  @ApiQuery({ name: 'maxCapacity', required: false, type: Number })
  @ApiQuery({ name: 'amenities', required: false, description: 'Comma-separated amenities' })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'Latitude for location search' })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'Longitude for location search' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Radius in km for location search' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'rating', 'price', 'capacity', 'distance'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  async findAll(@Query() searchDto: SearchSpacesDto): Promise<PaginatedSpacesResponseDto> {
    return this.spacesService.findAll(searchDto);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Advanced space search (alias for GET /spaces)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    type: PaginatedSpacesResponseDto 
  })
  async search(@Query() searchDto: SearchSpacesDto): Promise<PaginatedSpacesResponseDto> {
    return this.spacesService.findAll(searchDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get space details by ID' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Space details retrieved successfully',
    type: SpaceResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async findById(@Param('id') id: string): Promise<SpaceResponseDto> {
    return this.spacesService.findById(id, true); // Increment view count
  }

  @Public()
  @Post(':id/validate-promo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate promo code for a space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Promo code validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        promoCode: { type: 'object' },
        originalPrice: { type: 'number' },
        discountAmount: { type: 'number' },
        finalPrice: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid promo code' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async validatePromoCode(
    @Param('id') spaceId: string,
    @Body() validateDto: ValidatePromoCodeDto,
  ) {
    return this.spacesService.validatePromoCode(spaceId, validateDto);
  }

  // Protected Endpoints (Brand Owners only)

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BRAND_OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new space (Brand Owners only)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 201, 
    description: 'Space created successfully',
    type: SpaceResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Brand Owner role required' })
  async create(
    @Body() createSpaceDto: CreateSpaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SpaceResponseDto> {
    return this.spacesService.create(createSpaceDto, user.id);
  }

  @Get('owner/my-spaces')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BRAND_OWNER)
  @ApiOperation({ summary: 'Get spaces owned by current user' })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ 
    status: 200, 
    description: 'Owner spaces retrieved successfully',
    type: PaginatedSpacesResponseDto 
  })
  async getMySpaces(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<PaginatedSpacesResponseDto> {
    return this.spacesService.findByOwner(user.id, page, limit, includeInactive);
  }

  @Put(':id')
  @RequireSpaceOwnership()
  @ApiOperation({ summary: 'Update space (owners and staff only)' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Space updated successfully',
    type: SpaceResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - not space owner' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SpaceResponseDto> {
    return this.spacesService.update(id, updateSpaceDto, user.id);
  }

  @Delete(':id')
  @RequireSpaceOwnership()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete space (soft delete - owners and staff only)' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({ status: 204, description: 'Space deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not space owner' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.spacesService.remove(id, user.id);
  }

  // Promo Code Management

  @Post(':id/promo-codes')
  @RequireSpaceOwnership()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add promo code to space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'Promo code added successfully' 
  })
  @ApiResponse({ status: 400, description: 'Validation failed or promo code exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - not space owner' })
  async addPromoCode(
    @Param('id') spaceId: string,
    @Body() createPromoCodeDto: CreatePromoCodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.spacesService.addPromoCode(spaceId, createPromoCodeDto, user.id);
  }

  // Image Management

  @Post(':id/images/upload')
  @RequireSpaceOwnership()
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload images to space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files to upload (max 10)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    type: SpaceResponseDto
  })
  @ApiResponse({ status: 400, description: 'Maximum images limit reached or invalid files' })
  @ApiResponse({ status: 403, description: 'Forbidden - not space owner' })
  async uploadImages(
    @Param('id') spaceId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SpaceResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }

    return this.spacesService.uploadImages(spaceId, files, user.id);
  }

  @Post(':id/images')
  @RequireSpaceOwnership()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add image URL to space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: 201,
    description: 'Image added successfully',
    type: SpaceResponseDto
  })
  @ApiResponse({ status: 400, description: 'Maximum images limit reached or invalid URL' })
  @ApiResponse({ status: 403, description: 'Forbidden - not space owner' })
  async addImage(
    @Param('id') spaceId: string,
    @Body() body: { imageUrl: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SpaceResponseDto> {
    return this.spacesService.addImage(spaceId, body.imageUrl, user.id);
  }

  @Delete(':id/images')
  @RequireSpaceOwnership()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove image from space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image removed successfully',
    type: SpaceResponseDto 
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not space owner' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async removeImage(
    @Param('id') spaceId: string,
    @Body() body: { imageUrl: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SpaceResponseDto> {
    return this.spacesService.removeImage(spaceId, body.imageUrl, user.id);
  }

  // Analytics

  @Get(':id/analytics')
  @RequireSpaceOwnership()
  @ApiOperation({ summary: 'Get space analytics (owners only)' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics retrieved successfully',
    type: SpaceAnalyticsDto 
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not space owner' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async getAnalytics(
    @Param('id') spaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SpaceAnalyticsDto> {
    return this.spacesService.getAnalytics(spaceId, user.id);
  }
}