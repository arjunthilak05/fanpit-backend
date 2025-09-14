import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthSimpleController {
  
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() registerDto: any) {
    // Mock registration - in real app, this would save to database
    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: '1',
        name: registerDto.name,
        email: registerDto.email,
        role: 'consumer'
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: any) {
    // Mock login - in real app, this would verify credentials
    return {
      success: true,
      message: 'Login successful',
      user: {
        id: '1',
        name: 'Test User',
        email: loginDto.email,
        role: 'consumer'
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User data retrieved' })
  async getCurrentUser(@Request() req: any) {
    // Mock current user - in real app, this would get from JWT token
    return {
      success: true,
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'consumer'
      }
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    return {
      success: true,
      message: 'Logout successful'
    };
  }
}
