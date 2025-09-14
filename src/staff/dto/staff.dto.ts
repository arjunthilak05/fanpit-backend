import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  IsDateString, 
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsObjectId,
  ValidateNested,
  IsNotEmpty
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Dashboard DTOs
export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Date for dashboard data (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Space ID to filter by' })
  @IsOptional()
  @IsString()
  spaceId?: string;
}

export class StatsQueryDto {
  @ApiPropertyOptional({ description: 'Start date for statistics (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for statistics (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ActivityLogQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Start date for activity log' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for activity log' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['check_in', 'check_out', 'no_show', 'issue_reported'], description: 'Filter by action type' })
  @IsOptional()
  @IsEnum(['check_in', 'check_out', 'no_show', 'issue_reported'])
  actionType?: string;
}

// Check-in/Check-out DTOs
export class CheckInDto {
  @ApiPropertyOptional({ description: 'Additional notes for check-in' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Guest count verification' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  guestCount?: number;
}

export class CheckOutDto {
  @ApiPropertyOptional({ description: 'Additional notes for check-out' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Any issues or feedback' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

// Issue Management DTOs
export class ReportIssueDto {
  @ApiProperty({ description: 'Space ID where issue occurred' })
  @IsString()
  @IsNotEmpty()
  spaceId: string;

  @ApiPropertyOptional({ description: 'Booking ID if related to a booking' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({ enum: ['maintenance', 'guest', 'security', 'other'], description: 'Type of issue' })
  @IsEnum(['maintenance', 'guest', 'security', 'other'])
  type: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'], description: 'Priority level' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority: string;

  @ApiProperty({ description: 'Issue title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Image URLs of the issue' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateIssueDto {
  @ApiPropertyOptional({ enum: ['open', 'in_progress', 'resolved', 'closed'], description: 'Issue status' })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'], description: 'Priority level' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Issue title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Issue description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Staff member assigned to the issue' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResolveIssueDto {
  @ApiProperty({ description: 'Resolution details' })
  @IsString()
  @IsNotEmpty()
  resolution: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class IssueQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['maintenance', 'guest', 'security', 'other'], description: 'Filter by issue type' })
  @IsOptional()
  @IsEnum(['maintenance', 'guest', 'security', 'other'])
  type?: string;

  @ApiPropertyOptional({ enum: ['open', 'in_progress', 'resolved', 'closed'], description: 'Filter by status' })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'], description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Filter by space ID' })
  @IsOptional()
  @IsString()
  spaceId?: string;
}

// Response DTOs
export class DashboardResponseDto {
  @ApiProperty({ description: 'Dashboard statistics' })
  statistics: {
    todaysBookings: number;
    checkedIn: number;
    noShows: number;
    occupancyRate: number;
    activeIssues: number;
    criticalIssues: number;
  };

  @ApiProperty({ description: 'Recent bookings' })
  recentBookings: any[];

  @ApiProperty({ description: 'Active issues' })
  activeIssues: any[];

  @ApiProperty({ description: 'Space occupancy data' })
  spaceOccupancy: any[];
}

export class StaffStatsResponseDto {
  @ApiProperty({ description: 'Staff performance statistics' })
  performance: {
    totalCheckIns: number;
    totalCheckOuts: number;
    totalNoShows: number;
    issuesReported: number;
    efficiency: number;
    period: {
      startDate: Date;
      endDate: Date;
    };
  };

  @ApiProperty({ description: 'Recent activity summary' })
  recentActivity: any[];
}

export class PaginatedActivityLogResponseDto {
  @ApiProperty({ description: 'Activity log entries' })
  activities: any[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CheckInResponseDto {
  @ApiProperty({ description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Check-in status' })
  status: string;

  @ApiProperty({ description: 'Check-in time' })
  checkInTime: Date;

  @ApiProperty({ description: 'Staff member who performed check-in' })
  staffMember: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class IssueResponseDto {
  @ApiProperty({ description: 'Issue ID' })
  id: string;

  @ApiProperty({ description: 'Issue type' })
  type: string;

  @ApiProperty({ description: 'Issue priority' })
  priority: string;

  @ApiProperty({ description: 'Issue title' })
  title: string;

  @ApiProperty({ description: 'Issue description' })
  description: string;

  @ApiProperty({ description: 'Issue status' })
  status: string;

  @ApiProperty({ description: 'Space information' })
  space: {
    id: string;
    name: string;
    address: string;
  };

  @ApiProperty({ description: 'Reporter information' })
  reporter: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ description: 'Assigned staff member' })
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ description: 'Issue images' })
  images: string[];

  @ApiProperty({ description: 'Issue creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Issue last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Resolution details' })
  resolution?: string;

  @ApiProperty({ description: 'Is emergency issue' })
  isEmergency: boolean;
}

export class PaginatedIssueResponseDto {
  @ApiProperty({ description: 'Issues list' })
  issues: IssueResponseDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  @ApiProperty({ description: 'Issue statistics' })
  statistics: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    critical: number;
  };
}
