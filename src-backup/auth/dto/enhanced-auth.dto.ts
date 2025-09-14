import { 
  IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength, 
  Matches, IsDateString, IsUrl, IsBoolean, ValidateNested,
  IsPhoneNumber, IsStrongPassword, IsObject
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform, Exclude } from 'class-transformer';
import { UserRole, UserStatus } from '../schemas/user.schema';

class BusinessInfoDto {
  @ApiProperty({
    description: 'Company/Business name',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName: string;

  @ApiPropertyOptional({
    description: 'Type of business',
    example: 'Event Management'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  businessType?: string;

  @ApiPropertyOptional({
    description: 'GST registration number',
    example: '22AAAAA0000A1Z5'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Please provide a valid GST number'
  })
  gstNumber?: string;

  @ApiPropertyOptional({
    description: 'PAN number',
    example: 'AAAAA0000A'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Please provide a valid PAN number'
  })
  panNumber?: string;

  @ApiPropertyOptional({
    description: 'Business address',
    example: '123 Business Street, City'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessAddress?: string;

  @ApiPropertyOptional({
    description: 'Business phone number',
    example: '+91-9876543210'
  })
  @IsOptional()
  @IsPhoneNumber('IN')
  businessPhone?: string;

  @ApiPropertyOptional({
    description: 'Business email address',
    example: 'business@company.com'
  })
  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @ApiPropertyOptional({
    description: 'Business website URL',
    example: 'https://www.company.com'
  })
  @IsOptional()
  @IsUrl()
  website?: string;
}

class ProfileInfoDto {
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-01'
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    example: 'male'
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string;

  @ApiPropertyOptional({
    description: 'User bio/description',
    example: 'Event organizer with 5+ years experience'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Personal website URL',
    example: 'https://johndoe.com'
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Full address',
    example: '123 Main Street, City, State'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'India'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal/PIN code',
    example: '400001'
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pincode?: string;
}

class PreferencesDto {
  @ApiPropertyOptional({
    description: 'Enable notifications',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  notifications?: boolean = true;

  @ApiPropertyOptional({
    description: 'Enable marketing communications',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean = false;

  @ApiPropertyOptional({
    description: 'Preferred language',
    default: 'en'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}$/, { message: 'Language must be a 2-letter code' })
  language?: string = 'en';

  @ApiPropertyOptional({
    description: 'Timezone',
    default: 'UTC',
    example: 'Asia/Kolkata'
  })
  @IsOptional()
  @IsString()
  timezone?: string = 'UTC';

  @ApiPropertyOptional({
    description: 'Preferred currency',
    default: 'INR'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter code' })
  currency?: string = 'INR';

  @ApiPropertyOptional({
    description: 'Enable email notifications',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean = true;

  @ApiPropertyOptional({
    description: 'Enable SMS notifications',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean = false;

  @ApiPropertyOptional({
    description: 'Enable push notifications',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean = true;
}

export class EnhancedRegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Strong password with complexity requirements',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  }, {
    message: 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one symbol'
  })
  password: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.CONSUMER,
  })
  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  role: UserRole;

  @ApiPropertyOptional({
    description: 'User phone number with country code',
    example: '+91-9876543210',
  })
  @IsOptional()
  @IsPhoneNumber('IN', { message: 'Please provide a valid Indian phone number' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Organization name (required for brand owners)',
    example: 'Acme Corporation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Organization name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  organization?: string;

  @ApiPropertyOptional({
    description: 'User profile information',
    type: ProfileInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileInfoDto)
  profile?: ProfileInfoDto;

  @ApiPropertyOptional({
    description: 'Business information (for brand owners)',
    type: BusinessInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessInfoDto)
  businessInfo?: BusinessInfoDto;

  @ApiPropertyOptional({
    description: 'User preferences and settings',
    type: PreferencesDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;

  @ApiPropertyOptional({
    description: 'Referral code from existing user',
    example: 'REF_ABC_123456'
  })
  @IsOptional()
  @IsString()
  @Matches(/^REF_[A-Z0-9_]+$/, { message: 'Invalid referral code format' })
  referredBy?: string;

  @ApiProperty({
    description: 'Terms and conditions acceptance',
    default: true
  })
  @IsBoolean()
  acceptTerms: boolean = true;

  @ApiProperty({
    description: 'Privacy policy acceptance',
    default: true
  })
  @IsBoolean()
  acceptPrivacyPolicy: boolean = true;

  @ApiPropertyOptional({
    description: 'Marketing communications consent',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean = false;
}

export class EnhancedLoginDto {
  @ApiProperty({
    description: 'Email address or phone number',
    example: 'user@example.com'
  })
  @IsString()
  @MinLength(1)
  identifier: string; // email or phone

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!'
  })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({
    description: 'Remember me for extended session',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean = false;

  @ApiPropertyOptional({
    description: 'Two-factor authentication code',
    example: '123456'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: '2FA code must be 6 digits' })
  twoFactorCode?: string;

  @ApiPropertyOptional({
    description: 'Device information for trusted device tracking',
    example: 'Mozilla/5.0...'
  })
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address for password reset',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'abc123def456'
  })
  @IsString()
  @MinLength(1)
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!'
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewSecurePassword123!'
  })
  @IsString()
  confirmPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!'
  })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!'
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewSecurePassword123!'
  })
  @IsString()
  confirmPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @MinLength(1)
  refreshToken: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'abc123def456'
  })
  @IsString()
  @MinLength(1)
  token: string;
}

export class VerifyPhoneDto {
  @ApiProperty({
    description: 'Phone verification code',
    example: '123456'
  })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Verification code must be 6 digits' })
  code: string;

  @ApiProperty({
    description: 'Phone number to verify',
    example: '+91-9876543210'
  })
  @IsPhoneNumber('IN')
  phone: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Type of verification to resend',
    enum: ['email', 'phone'],
    example: 'email'
  })
  @IsEnum(['email', 'phone'])
  type: 'email' | 'phone';

  @ApiPropertyOptional({
    description: 'Phone number (required for phone verification)',
    example: '+91-9876543210'
  })
  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe Updated'
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+91-9876543210'
  })
  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  @ApiPropertyOptional({
    description: 'Organization name',
    example: 'Updated Corp'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  organization?: string;

  @ApiPropertyOptional({
    description: 'Avatar/profile picture URL',
    example: 'https://example.com/avatar.jpg'
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Profile information',
    type: ProfileInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileInfoDto)
  profile?: ProfileInfoDto;

  @ApiPropertyOptional({
    description: 'Business information',
    type: BusinessInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessInfoDto)
  businessInfo?: BusinessInfoDto;

  @ApiPropertyOptional({
    description: 'User preferences',
    type: PreferencesDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;
}

export class Setup2FADto {
  @ApiProperty({
    description: 'Whether to enable 2FA',
    example: true
  })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({
    description: '2FA verification code (required when enabling)',
    example: '123456'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: '2FA code must be 6 digits' })
  verificationCode?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer'
  })
  tokenType: string;

  @ApiProperty({
    description: 'User information',
    type: 'object'
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    profileCompletionPercentage: number;
  };

  @ApiPropertyOptional({
    description: 'Whether 2FA is required',
    default: false
  })
  requiresTwoFactor?: boolean = false;

  @ApiPropertyOptional({
    description: '2FA setup information if first time',
    type: 'object'
  })
  twoFactorSetup?: {
    qrCodeUrl: string;
    secret: string;
    backupCodes: string[];
  };
}

export class UserQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for user name or email',
    example: 'john'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: UserRole
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: UserStatus
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filter by email verification status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by phone verification status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe'
  })
  name: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CONSUMER
  })
  role: UserRole;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE
  })
  status: UserStatus;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+91-9876543210'
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Organization name',
    example: 'Acme Corp'
  })
  organization?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg'
  })
  avatar?: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Phone verification status',
    example: false
  })
  isPhoneVerified: boolean;

  @ApiProperty({
    description: 'Account active status',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Profile completion percentage',
    example: 85
  })
  profileCompletionPercentage: number;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2023-12-01T10:00:00Z'
  })
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2023-11-01T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-12-01T10:00:00Z'
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Profile information',
    type: ProfileInfoDto
  })
  profile?: ProfileInfoDto;

  @ApiPropertyOptional({
    description: 'Business information',
    type: BusinessInfoDto
  })
  businessInfo?: BusinessInfoDto;

  @ApiPropertyOptional({
    description: 'User preferences',
    type: PreferencesDto
  })
  preferences?: PreferencesDto;

  @ApiProperty({
    description: 'User statistics'
  })
  stats: {
    totalBookings: number;
    totalSpending: number;
    loyaltyPoints: number;
    averageRating: number;
    reviewCount: number;
  };

  // Exclude sensitive fields
  @Exclude()
  password: string;

  @Exclude()
  refreshTokens: string[];

  @Exclude()
  resetPasswordToken: string;

  @Exclude()
  emailVerificationToken: string;

  @Exclude()
  phoneVerificationCode: string;
}