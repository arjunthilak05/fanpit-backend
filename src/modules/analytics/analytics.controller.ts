import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('owner')
  async getOwnerAnalytics(@CurrentUser() user: any) {
    const analytics = await this.analyticsService.getOwnerAnalytics(user._id);
    return { success: true, analytics };
  }

  @Get('space/:spaceId')
  async getSpaceAnalytics(@Param('spaceId') spaceId: string) {
    const analytics = await this.analyticsService.getSpaceAnalytics(spaceId);
    return { success: true, analytics };
  }
}