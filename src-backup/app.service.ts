import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      success: true,
      message: 'Fanpit API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  getHealth() {
    return {
      success: true,
      message: 'Service is healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}