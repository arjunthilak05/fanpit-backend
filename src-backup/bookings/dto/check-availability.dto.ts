import { 
  IsString, 
  IsDateString, 
  IsOptional, 
  IsArray,
  Matches, 
  IsNotEmpty,
  IsMongoId,
  ArrayMinSize
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({ 
    description: 'Space ID to check availability for', 
    example: '507f1f77bcf86cd799439011' 
  })
  @IsMongoId()
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ 
    description: 'Date to check availability for (ISO format)', 
    example: '2024-12-01' 
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ 
    description: 'Start time in HH:mm format', 
    example: '09:00' 
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format'
  })
  startTime?: string;

  @ApiPropertyOptional({ 
    description: 'End time in HH:mm format', 
    example: '17:00' 
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format'
  })
  endTime?: string;
}

export class BatchAvailabilityCheckDto {
  @ApiProperty({ 
    description: 'Array of space IDs to check availability for', 
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    isArray: true,
    type: String
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  spaceIds: string[];

  @ApiProperty({ 
    description: 'Date to check availability for (ISO format)', 
    example: '2024-12-01' 
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ 
    description: 'Start time in HH:mm format', 
    example: '09:00' 
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format'
  })
  startTime?: string;

  @ApiPropertyOptional({ 
    description: 'End time in HH:mm format', 
    example: '17:00' 
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format'
  })
  endTime?: string;
}