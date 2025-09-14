import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  IsEnum,
  IsMongoId,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsArray,
  ArrayMaxSize
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { StaffActionType } from '../schemas/staff-activity.schema';

export class StaffActivityDetailsDto {
  @ApiPropertyOptional({ 
    example: 'BK12345678',
    description: 'Booking code for the activity' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bookingCode?: string;

  @ApiPropertyOptional({ 
    example: 'John Doe',
    description: 'Customer name' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  customerName?: string;

  @ApiPropertyOptional({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Check-in time' 
  })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ 
    example: '2024-01-15T12:30:00Z',
    description: 'Check-out time' 
  })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiPropertyOptional({ 
    example: 'Customer arrived 15 minutes early',
    description: 'Additional notes about the activity' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;

  @ApiPropertyOptional({ 
    example: 'equipment-failure',
    description: 'Type of issue (if applicable)' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  issueType?: string;

  @ApiPropertyOptional({ 
    example: 'Projector not working properly',
    description: 'Description of the issue' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  issueDescription?: string;

  @ApiPropertyOptional({ 
    example: 'pending',
    description: 'Previous status' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  previousStatus?: string;

  @ApiPropertyOptional({ 
    example: 'confirmed',
    description: 'New status' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  newStatus?: string;

  @ApiPropertyOptional({ 
    example: 1500,
    description: 'Processing time in milliseconds' 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  processingTimeMs?: number;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether this activity requires follow-up' 
  })
  @IsOptional()
  @IsBoolean()
  requiresFollowUp?: boolean;
}

export class CreateStaffActivityDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Staff member ID performing the activity' 
  })
  @IsMongoId()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439012',
    description: 'Booking ID for the activity' 
  })
  @IsMongoId()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439013',
    description: 'Space ID where the activity occurred' 
  })
  @IsMongoId()
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ 
    example: StaffActionType.CHECK_IN,
    description: 'Type of staff action',
    enum: StaffActionType 
  })
  @IsEnum(StaffActionType)
  action: StaffActionType;

  @ApiProperty({ 
    description: 'Details of the staff activity' 
  })
  @ValidateNested()
  @Type(() => StaffActivityDetailsDto)
  details: StaffActivityDetailsDto;

  @ApiPropertyOptional({ 
    example: '192.168.1.1',
    description: 'IP address of the staff member' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ipAddress?: string;

  @ApiPropertyOptional({ 
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    description: 'User agent string' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userAgent?: string;

  @ApiPropertyOptional({ 
    example: 'sess_abc123def456',
    description: 'Session ID for tracking' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sessionId?: string;

  @ApiPropertyOptional({ 
    example: false,
    description: 'Whether this activity was system-generated' 
  })
  @IsOptional()
  @IsBoolean()
  isSystemGenerated?: boolean;
}

export class UpdateStaffActivityDto {
  @ApiPropertyOptional({ 
    description: 'Updated details of the staff activity' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StaffActivityDetailsDto)
  details?: StaffActivityDetailsDto;

  @ApiPropertyOptional({ 
    example: 'Updated notes about the activity',
    description: 'Additional notes' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether this activity requires follow-up' 
  })
  @IsOptional()
  @IsBoolean()
  requiresFollowUp?: boolean;
}

export class StaffActivityQueryDto {
  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by staff member ID' 
  })
  @IsOptional()
  @IsMongoId()
  staffId?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439012',
    description: 'Filter by booking ID' 
  })
  @IsOptional()
  @IsMongoId()
  bookingId?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439013',
    description: 'Filter by space ID' 
  })
  @IsOptional()
  @IsMongoId()
  spaceId?: string;

  @ApiPropertyOptional({ 
    example: StaffActionType.CHECK_IN,
    description: 'Filter by action type',
    enum: StaffActionType 
  })
  @IsOptional()
  @IsEnum(StaffActionType)
  action?: StaffActionType;

  @ApiPropertyOptional({ 
    example: '2024-01-01',
    description: 'Filter activities from this date' 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    example: '2024-01-31',
    description: 'Filter activities until this date' 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Page number for pagination',
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    example: 10,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    example: 'timestamp',
    description: 'Field to sort by' 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortBy?: string = 'timestamp';

  @ApiPropertyOptional({ 
    example: 'desc',
    description: 'Sort order',
    enum: ['asc', 'desc'] 
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class StaffActivityResponseDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439014',
    description: 'Activity ID' 
  })
  _id: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Staff member ID' 
  })
  staffId: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439012',
    description: 'Booking ID' 
  })
  bookingId: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439013',
    description: 'Space ID' 
  })
  spaceId: string;

  @ApiProperty({ 
    example: StaffActionType.CHECK_IN,
    description: 'Action type',
    enum: StaffActionType 
  })
  action: StaffActionType;

  @ApiProperty({ 
    description: 'Activity details' 
  })
  details: StaffActivityDetailsDto;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Activity timestamp' 
  })
  timestamp: string;

  @ApiPropertyOptional({ 
    example: '192.168.1.1',
    description: 'IP address' 
  })
  ipAddress?: string;

  @ApiPropertyOptional({ 
    example: 'sess_abc123def456',
    description: 'Session ID' 
  })
  sessionId?: string;

  @ApiProperty({ 
    example: false,
    description: 'Whether system-generated' 
  })
  isSystemGenerated: boolean;

  @ApiProperty({ 
    example: 'ACT_1705312200000_abc123',
    description: 'Correlation ID for tracking' 
  })
  correlationId: string;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Creation timestamp' 
  })
  createdAt: string;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Last update timestamp' 
  })
  updatedAt: string;

  // Populated fields
  @ApiPropertyOptional({ 
    description: 'Staff member information' 
  })
  staff?: {
    _id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ 
    description: 'Booking information' 
  })
  booking?: {
    _id: string;
    bookingCode: string;
    customerName: string;
    startTime: string;
    endTime: string;
  };

  @ApiPropertyOptional({ 
    description: 'Space information' 
  })
  space?: {
    _id: string;
    name: string;
    location: {
      address: string;
      city: string;
    };
  };
}

export class StaffPerformanceMetricsDto {
  @ApiProperty({ 
    example: 150,
    description: 'Total number of activities' 
  })
  totalActivities: number;

  @ApiProperty({ 
    example: 75,
    description: 'Number of check-ins performed' 
  })
  checkIns: number;

  @ApiProperty({ 
    example: 70,
    description: 'Number of check-outs performed' 
  })
  checkOuts: number;

  @ApiProperty({ 
    example: 5,
    description: 'Number of no-shows marked' 
  })
  noShows: number;

  @ApiProperty({ 
    example: 10,
    description: 'Number of issues reported' 
  })
  issuesReported: number;

  @ApiProperty({ 
    example: 8,
    description: 'Number of issues resolved' 
  })
  issuesResolved: number;

  @ApiProperty({ 
    example: 1250.5,
    description: 'Average processing time in milliseconds' 
  })
  averageProcessingTime: number;

  @ApiProperty({ 
    example: 95.5,
    description: 'Performance score (0-100)' 
  })
  performanceScore: number;

  @ApiProperty({ 
    example: '2024-01-01',
    description: 'Start date of the metrics period' 
  })
  periodStart: string;

  @ApiProperty({ 
    example: '2024-01-31',
    description: 'End date of the metrics period' 
  })
  periodEnd: string;
}

export class StaffActivitySummaryDto {
  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Staff member ID' 
  })
  staffId: string;

  @ApiProperty({ 
    example: 'John Smith',
    description: 'Staff member name' 
  })
  staffName: string;

  @ApiProperty({ 
    example: 25,
    description: 'Total activities today' 
  })
  todayActivities: number;

  @ApiProperty({ 
    example: 150,
    description: 'Total activities this week' 
  })
  weekActivities: number;

  @ApiProperty({ 
    example: 600,
    description: 'Total activities this month' 
  })
  monthActivities: number;

  @ApiProperty({ 
    example: 95.5,
    description: 'Performance score' 
  })
  performanceScore: number;

  @ApiProperty({ 
    example: 2,
    description: 'Number of pending follow-ups' 
  })
  pendingFollowUps: number;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Last activity timestamp' 
  })
  lastActivityAt: string;
}
