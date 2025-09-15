import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'OK' },
        message: { type: 'string', example: 'Fanpit Backend API is running' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  getHealth() {
    return {
      status: 'OK',
      message: 'Fanpit Backend API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'API information',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        version: { type: 'string' },
        documentation: { type: 'string' },
        endpoints: { type: 'object' }
      }
    }
  })
  getRoot() {
    return {
      message: 'Fanpit Space Booking Platform API',
      version: '1.0.0',
      documentation: '/api/docs',
      endpoints: {
        health: '/api/v1/health',
        documentation: '/api/docs',
        auth: '/api/v1/auth',
        spaces: '/api/v1/spaces',
        bookings: '/api/v1/bookings',
        payments: '/api/v1/payments',
        staff: '/api/v1/staff',
        analytics: '/api/v1/analytics',
        users: '/api/v1/users'
      }
    };
  }
}