import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { PasswordUtil } from '../utils/password.util';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password
    const passwordValidation = PasswordUtil.validatePasswordStrength(registerDto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    // Hash password and create user
    const hashedPassword = await PasswordUtil.hashPassword(registerDto.password);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshTokens(user._id.toString(), [tokens.refreshToken]);

    return {
      success: true,
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.generateTokens(user);

    // Update refresh tokens and last login
    const currentTokens = user.refreshTokens || [];
    await this.usersService.updateRefreshTokens(
      user._id.toString(), 
      [...currentTokens, tokens.refreshToken].slice(-5) // Keep only last 5 tokens
    );
    await this.usersService.updateLastLogin(user._id.toString());

    return {
      success: true,
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findByEmail(payload.email, true);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newTokens = await this.generateTokens(user);
      const filteredTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await this.usersService.updateRefreshTokens(
        user._id.toString(), 
        [...filteredTokens, newTokens.refreshToken].slice(-5)
      );

      return newTokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = PasswordUtil.generateResetToken();
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.usersService.setPasswordReset(user._id.toString(), resetToken, resetExpires);

    // TODO: Send email with reset token
    this.logger.log(`Password reset requested for: ${user.email}, token: ${resetToken}`);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordValidation = PasswordUtil.validatePasswordStrength(resetPasswordDto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    const hashedPassword = await PasswordUtil.hashPassword(resetPasswordDto.password);
    await this.usersService.updatePassword(user._id.toString(), hashedPassword);

    return { message: 'Password has been reset successfully' };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const user = await this.usersService.findById(userId);
      if (user) {
        const userData = await this.usersService.findByEmail(user.email, true);
        if (userData) {
          const filteredTokens = userData.refreshTokens.filter(token => token !== refreshToken);
          await this.usersService.updateRefreshTokens(userId, filteredTokens);
        }
      }
    } else {
      await this.usersService.updateRefreshTokens(userId, []);
    }

    return { message: 'Logged out successfully' };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await PasswordUtil.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken, expiresIn: 900 }; // 15 minutes
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
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}