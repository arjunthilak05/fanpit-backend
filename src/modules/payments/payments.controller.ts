import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @ApiBearerAuth('access-token')
  async createOrder(@Body() createOrderDto: any) {
    const order = await this.paymentsService.createOrder(
      createOrderDto.amount,
      createOrderDto.bookingId,
    );
    return { success: true, order };
  }

  @Post('verify')
  @ApiBearerAuth('access-token')
  async verifyPayment(@Body() verifyPaymentDto: any) {
    const result = await this.paymentsService.verifyPayment(verifyPaymentDto);
    return { success: true, ...result };
  }

  @Public()
  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    const result = await this.paymentsService.handleWebhook(payload);
    return result;
  }
}