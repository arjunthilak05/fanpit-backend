import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async findAll() {
    const bookings = await this.bookingsService.findAll();
    return { success: true, bookings };
  }

  @Post()
  async create(@Body() createBookingDto: any) {
    const booking = await this.bookingsService.create(createBookingDto);
    return { success: true, booking };
  }
}