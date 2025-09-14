import { IsString, IsOptional, MinLength, MaxLength, Matches, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe Updated',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s-()]+$/, { message: 'Please provide a valid phone number' })
  phone?: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Updated Corporation',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Organization name must not exceed 100 characters' })
  organization?: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'User preferences',
    example: {
      notifications: true,
      marketing: false,
      language: 'en'
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  preferences?: {
    notifications?: boolean;
    marketing?: boolean;
    language?: string;
  };
}