import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Roles(UserRole.STAFF, UserRole.BRAND_OWNER, UserRole.ADMIN)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('bookings/today/:spaceId')
  async getTodaysBookings(@Param('spaceId') spaceId: string) {
    const bookings = await this.staffService.getTodaysBookings(spaceId);
    return { success: true, bookings };
  }

  @Post('check-in/:bookingId')
  async checkIn(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    const booking = await this.staffService.checkInGuest(bookingId, user._id);
    return { success: true, booking };
  }

  @Post('check-out/:bookingId')
  async checkOut(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    const booking = await this.staffService.checkOutGuest(bookingId, user._id);
    return { success: true, booking };
  }
}