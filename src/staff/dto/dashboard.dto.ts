import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum BookingStatusFilter {
  ALL = 'all',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked-in',
  COMPLETED = 'completed',
  NO_SHOW = 'no-show',
  CANCELLED = 'cancelled'
}

export enum TimeWindow {
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  THIS_WEEK = 'this-week',
  NEXT_WEEK = 'next-week',
  CUSTOM = 'custom'
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ 
    example: '2024-11-15',
    description: 'Date for dashboard data (YYYY-MM-DD format)' 
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by specific space ID' 
  })
  @IsString()
  @IsOptional()
  spaceId?: string;

  @ApiPropertyOptional({ 
    example: BookingStatusFilter.ALL,
    description: 'Filter bookings by status',
    enum: BookingStatusFilter 
  })
  @IsEnum(BookingStatusFilter)
  @IsOptional()
  status?: BookingStatusFilter;

  @ApiPropertyOptional({ 
    example: TimeWindow.TODAY,
    description: 'Time window for data',
    enum: TimeWindow 
  })
  @IsEnum(TimeWindow)
  @IsOptional()
  timeWindow?: TimeWindow;
}

export class StatsQueryDto {
  @ApiPropertyOptional({ 
    example: '2024-11-15',
    description: 'Start date for stats (YYYY-MM-DD format)' 
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ 
    example: '2024-11-16',
    description: 'End date for stats (YYYY-MM-DD format)' 
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by specific space ID' 
  })
  @IsString()
  @IsOptional()
  spaceId?: string;
}

export class ActivityLogQueryDto {
  @ApiPropertyOptional({ 
    example: '1',
    description: 'Page number for pagination' 
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ 
    example: '20',
    description: 'Number of items per page' 
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ 
    example: 'check-in',
    description: 'Filter by action type' 
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ 
    example: '2024-11-15',
    description: 'Filter activities from this date' 
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ 
    example: '2024-11-16',
    description: 'Filter activities until this date' 
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}

export class DashboardResponseDto {
  @ApiProperty({ example: '2024-11-15' })
  date: string;

  @ApiProperty({ 
    example: {
      total: 25,
      confirmed: 20,
      checkedIn: 8,
      completed: 5,
      noShow: 2,
      cancelled: 1,
      pending: 3
    }
  })
  bookingSummary: {
    total: number;
    confirmed: number;
    checkedIn: number;
    completed: number;
    noShow: number;
    cancelled: number;
    pending: number;
  };

  @ApiProperty({ 
    example: [
      {
        id: '507f1f77bcf86cd799439011',
        code: 'BK12345ABC',
        customerName: 'John Doe',
        spaceName: 'Conference Room A',
        startTime: '2024-11-15T10:00:00.000Z',
        endTime: '2024-11-15T12:00:00.000Z',
        status: 'confirmed',
        canCheckIn: true,
        timeUntilStart: '30 minutes',
        specialRequests: 'Need projector'
      }
    ]
  })
  upcomingBookings: Array<{
    id: string;
    code: string;
    customerName: string;
    spaceName: string;
    startTime: Date;
    endTime: Date;
    status: string;
    canCheckIn: boolean;
    timeUntilStart: string;
    specialRequests?: string;
  }>;

  @ApiProperty({ 
    example: [
      {
        id: '507f1f77bcf86cd799439012',
        code: 'BK12345DEF',
        customerName: 'Jane Smith',
        spaceName: 'Meeting Room B',
        checkInTime: '2024-11-15T09:05:00.000Z',
        expectedEndTime: '2024-11-15T11:00:00.000Z',
        canCheckOut: true,
        overtimeMinutes: 0
      }
    ]
  })
  activeBookings: Array<{
    id: string;
    code: string;
    customerName: string;
    spaceName: string;
    checkInTime: Date;
    expectedEndTime: Date;
    canCheckOut: boolean;
    overtimeMinutes: number;
  }>;

  @ApiProperty({ 
    example: [
      {
        id: '507f1f77bcf86cd799439013',
        ticketNumber: 'ISS241101',
        type: 'equipment-failure',
        severity: 'high',
        spaceName: 'Conference Room A',
        description: 'Projector not working',
        createdAt: '2024-11-15T08:00:00.000Z',
        ageInHours: 2.5
      }
    ]
  })
  activeIssues: Array<{
    id: string;
    ticketNumber: string;
    type: string;
    severity: string;
    spaceName: string;
    description: string;
    createdAt: Date;
    ageInHours: number;
  }>;

  @ApiProperty({ 
    example: {
      spacesOperational: 8,
      spacesWithIssues: 2,
      totalCapacity: 120,
      currentOccupancy: 45,
      utilizationRate: 37.5
    }
  })
  spaceStatus: {
    spacesOperational: number;
    spacesWithIssues: number;
    totalCapacity: number;
    currentOccupancy: number;
    utilizationRate: number;
  };

  @ApiProperty({ 
    example: {
      totalCheckIns: 15,
      totalCheckOuts: 12,
      totalNoShows: 2,
      averageProcessingTime: 45,
      issuesReported: 3,
      issuesResolved: 2
    }
  })
  dailyStats: {
    totalCheckIns: number;
    totalCheckOuts: number;
    totalNoShows: number;
    averageProcessingTime: number;
    issuesReported: number;
    issuesResolved: number;
  };

  @ApiProperty({ 
    example: [
      {
        time: '09:00',
        checkIns: 5,
        checkOuts: 0,
        noShows: 0
      },
      {
        time: '10:00',
        checkIns: 8,
        checkOuts: 2,
        noShows: 1
      }
    ]
  })
  hourlyActivity: Array<{
    time: string;
    checkIns: number;
    checkOuts: number;
    noShows: number;
  }>;

  @ApiProperty({ example: '2024-11-15T12:30:45.123Z' })
  lastUpdated: Date;
}

export class StaffStatsResponseDto {
  @ApiProperty({ example: '2024-11-15' })
  date: string;

  @ApiProperty({ 
    example: {
      totalActivities: 45,
      checkIns: 20,
      checkOuts: 18,
      noShows: 3,
      issuesReported: 2,
      issuesResolved: 1,
      averageProcessingTime: 38.5,
      customerSatisfactionScore: 4.2
    }
  })
  staffMetrics: {
    totalActivities: number;
    checkIns: number;
    checkOuts: number;
    noShows: number;
    issuesReported: number;
    issuesResolved: number;
    averageProcessingTime: number;
    customerSatisfactionScore?: number;
  };

  @ApiProperty({ 
    example: [
      {
        hour: 9,
        activities: 8,
        averageProcessingTime: 42
      },
      {
        hour: 10,
        activities: 12,
        averageProcessingTime: 35
      }
    ]
  })
  hourlyPerformance: Array<{
    hour: number;
    activities: number;
    averageProcessingTime: number;
  }>;

  @ApiProperty({ 
    example: {
      totalBookings: 100,
      successfulCheckIns: 95,
      noShowRate: 5,
      averageBookingDuration: 90,
      peakHours: ['10:00-11:00', '14:00-15:00'],
      mostCommonIssues: ['equipment-failure', 'cleanliness']
    }
  })
  operationalInsights: {
    totalBookings: number;
    successfulCheckIns: number;
    noShowRate: number;
    averageBookingDuration: number;
    peakHours: string[];
    mostCommonIssues: string[];
  };
}

export class ActivityLogResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'check-in' })
  action: string;

  @ApiProperty({ 
    example: {
      bookingCode: 'BK12345ABC',
      customerName: 'John Doe',
      checkInTime: '2024-11-15T10:05:00.000Z',
      notes: 'Customer arrived on time'
    }
  })
  details: Record<string, any>;

  @ApiProperty({ 
    example: {
      id: '507f1f77bcf86cd799439012',
      name: 'Conference Room A',
      location: 'Floor 2'
    }
  })
  space: {
    id: string;
    name: string;
    location: string;
  };

  @ApiProperty({ example: '2024-11-15T10:05:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: 'ACT_1731668700_ABC123' })
  correlationId: string;
}

export class PaginatedActivityLogResponseDto {
  @ApiProperty({ type: [ActivityLogResponseDto] })
  data: ActivityLogResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}