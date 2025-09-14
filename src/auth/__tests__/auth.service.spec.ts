import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';

import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { PasswordUtil } from '../utils/password.util';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    _id: '64a7b8c9d0e1f2a3b4c5d6e7',
    email: 'test@example.com',
    name: 'Test User',
    role: 'consumer',
    password: 'hashedPassword123',
    isActive: true,
    isEmailVerified: false,
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByEmailWithTokens: jest.fn(),
    findById: jest.fn(),
    findByResetToken: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateRefreshTokens: jest.fn(),
    updateLastLogin: jest.fn(),
    setPasswordReset: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Setup default mock returns
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        JWT_ACCESS_SECRET: 'access_secret',
        JWT_REFRESH_SECRET: 'refresh_secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key] || defaultValue;
    });

    mockJwtService.signAsync.mockResolvedValue('mock_token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePassword123!',
      role: 'consumer' as any,
    };

    it('should successfully register a new user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockUsersService.findByEmailWithTokens.mockResolvedValue({
        ...mockUser,
        refreshTokens: [],
      });

      jest.spyOn(PasswordUtil, 'validatePasswordStrength').mockReturnValue({
        isValid: true,
        errors: [],
      });
      jest.spyOn(PasswordUtil, 'hashPassword').mockResolvedValue('hashedPassword123');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword123',
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for weak password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      jest.spyOn(PasswordUtil, 'validatePasswordStrength').mockReturnValue({
        isValid: false,
        errors: ['Password too weak'],
      });

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
    };

    it('should successfully login a user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findByEmailWithTokens.mockResolvedValue({
        ...mockUser,
        refreshTokens: [],
      });

      jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(mockUser._id.toString());
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid_refresh_token';

    it('should successfully refresh tokens', async () => {
      const payload = { email: 'test@example.com', sub: mockUser._id };
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findByEmailWithTokens.mockResolvedValue({
        ...mockUser,
        refreshTokens: [refreshToken],
      });

      const result = await service.refresh(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { email: 'test@example.com', sub: mockUser._id };
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findByEmailWithTokens.mockResolvedValue(null);

      await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token not found in user', async () => {
      const payload = { email: 'test@example.com', sub: mockUser._id };
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findByEmailWithTokens.mockResolvedValue({
        ...mockUser,
        refreshTokens: ['different_token'],
      });

      await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto = { email: 'test@example.com' };

    it('should return success message even if user not found (security)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('If the email exists');
      expect(mockUsersService.setPasswordReset).not.toHaveBeenCalled();
    });

    it('should set password reset token for existing user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'generateResetToken').mockReturnValue('reset_token_123');

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('If the email exists');
      expect(mockUsersService.setPasswordReset).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid_reset_token',
      password: 'NewSecurePassword123!',
    };

    it('should successfully reset password', async () => {
      mockUsersService.findByResetToken.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'validatePasswordStrength').mockReturnValue({
        isValid: true,
        errors: [],
      });
      jest.spyOn(PasswordUtil, 'hashPassword').mockResolvedValue('newHashedPassword');

      const result = await service.resetPassword(resetPasswordDto);

      expect(result.message).toContain('Password has been reset successfully');
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'newHashedPassword',
      );
    });

    it('should throw BadRequestException for invalid reset token', async () => {
      mockUsersService.findByResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for weak password', async () => {
      mockUsersService.findByResetToken.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'validatePasswordStrength').mockReturnValue({
        isValid: false,
        errors: ['Password too weak'],
      });

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    const userId = mockUser._id.toString();

    it('should logout user and clear all refresh tokens', async () => {
      const result = await service.logout(userId);

      expect(result.message).toBe('Logged out successfully');
      expect(mockUsersService.updateRefreshTokens).toHaveBeenCalledWith(userId, []);
    });

    it('should logout user and remove specific refresh token', async () => {
      const refreshToken = 'specific_token';
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.findByEmailWithTokens.mockResolvedValue({
        ...mockUser,
        refreshTokens: [refreshToken, 'other_token'],
      });

      const result = await service.logout(userId, refreshToken);

      expect(result.message).toBe('Logged out successfully');
      expect(mockUsersService.updateRefreshTokens).toHaveBeenCalledWith(userId, ['other_token']);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove sensitive information from user object', () => {
      const sensitiveUser = {
        ...mockUser,
        password: 'secretPassword',
        refreshTokens: ['token1', 'token2'],
      };

      // Access private method through service instance
      const sanitized = (service as any).sanitizeUser(sensitiveUser);

      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('refreshTokens');
      expect(sanitized).toHaveProperty('id', mockUser._id.toString());
      expect(sanitized).toHaveProperty('email', mockUser.email);
      expect(sanitized).toHaveProperty('name', mockUser.name);
      expect(sanitized).toHaveProperty('role', mockUser.role);
    });
  });
});