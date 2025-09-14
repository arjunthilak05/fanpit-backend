import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  NotFoundException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { PasswordUtil } from './utils/password.util';
import { TokenUtil } from './utils/token.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthResponseDto, TokenResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxRefreshTokens = 5; // Maximum number of active refresh tokens per user

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password strength
    const passwordValidation = PasswordUtil.validatePasswordStrength(registerDto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hashPassword(registerDto.password);

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    this.logger.log(`User registered successfully: ${user.email}`);

    return {
      success: true,
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    
    // Validate user credentials
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token and clean old ones
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    // Update last login
    await this.usersService.updateLastLogin(user._id.toString());

    this.logger.log(`User logged in successfully: ${user.email}`);

    return {
      success: true,
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Find user and verify refresh token exists
      const user = await this.usersService.findByEmailWithTokens(payload.email);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Remove old refresh token and generate new tokens
      const filteredTokens = user.refreshTokens.filter(token => token !== refreshToken);
      const newTokens = await this.generateTokens(user);

      // Store new refresh token
      await this.usersService.updateRefreshTokens(
        user._id.toString(), 
        [...filteredTokens, newTokens.refreshToken].slice(-this.maxRefreshTokens)
      );

      this.logger.log(`Tokens refreshed for user: ${user.email}`);

      return newTokens;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = PasswordUtil.generateResetToken();
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save reset token
    await this.usersService.setPasswordReset(user._id.toString(), resetToken, resetExpires);

    // TODO: Send email with reset token (implement email service)
    this.logger.log(`Password reset requested for: ${user.email}, token: ${resetToken}`);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    // Find user by reset token
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password
    const passwordValidation = PasswordUtil.validatePasswordStrength(resetPasswordDto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    // Hash new password
    const hashedPassword = await PasswordUtil.hashPassword(resetPasswordDto.password);

    // Update password and clear reset fields
    await this.usersService.updatePassword(user._id.toString(), hashedPassword);

    this.logger.log(`Password reset successful for user: ${user.email}`);

    return { message: 'Password has been reset successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.usersService.update(userId, updateProfileDto as any);
    return this.sanitizeUser(updatedUser);
  }

  async logout(userId: string, refreshToken?: string): Promise<{ message: string }> {
    if (refreshToken) {
      // Remove specific refresh token
      const user = await this.usersService.findByEmailWithTokens((await this.usersService.findById(userId)).email);
      if (user) {
        const filteredTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await this.usersService.updateRefreshTokens(userId, filteredTokens);
      }
    } else {
      // Clear all refresh tokens
      await this.usersService.updateRefreshTokens(userId, []);
    }

    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(userId: string): Promise<{ message: string }> {
    await this.usersService.updateRefreshTokens(userId, []);
    this.logger.log(`User logged out from all devices: ${userId}`);
    return { message: 'Logged out from all devices successfully' };
  }

  // Private helper methods
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await PasswordUtil.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  private async generateTokens(user: any): Promise<TokenResponseDto> {
    return TokenUtil.generateTokenPair(
      this.jwtService,
      this.configService,
      user._id.toString(),
      user.email,
      user.role,
    );
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const user = await this.usersService.findByEmailWithTokens((await this.usersService.findById(userId)).email);
    if (user) {
      const tokens = [...user.refreshTokens, refreshToken].slice(-this.maxRefreshTokens);
      await this.usersService.updateRefreshTokens(userId, tokens);
    }
  }

  private sanitizeUser(user: any) {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      phone: user.phone,
      organization: user.organization,
      preferences: user.preferences,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}