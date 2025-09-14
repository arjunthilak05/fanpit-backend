import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  MaxLength, 
  MinLength,
  IsEnum,
  IsArray,
  IsMongoId,
  ArrayMaxSize,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IssueType, IssueSeverity, IssueStatus } from '../schemas/issue.schema';

export class ReportIssueDto {
  @ApiProperty({ 
    example: IssueType.EQUIPMENT_FAILURE,
    description: 'Type of issue being reported',
    enum: IssueType 
  })
  @IsEnum(IssueType)
  type: IssueType;

  @ApiProperty({ 
    example: IssueSeverity.HIGH,
    description: 'Severity level of the issue',
    enum: IssueSeverity 
  })
  @IsEnum(IssueSeverity)
  severity: IssueSeverity;

  @ApiProperty({ 
    example: 'The projector in the conference room is not working. Screen remains black even after trying different cables.',
    description: 'Detailed description of the issue' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Space ID where the issue occurred' 
  })
  @IsMongoId()
  spaceId: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439012',
    description: 'Related booking ID (if applicable)' 
  })
  @IsMongoId()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ 
    example: ['equipment', 'urgent', 'conference-room'],
    description: 'Tags to categorize the issue' 
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ 
    example: 'Customer meeting scheduled in 1 hour, need immediate attention',
    description: 'Impact on customers or operations' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  customerImpact?: string;

  @ApiPropertyOptional({ 
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'URLs of attached images or documents' 
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  @IsOptional()
  attachmentUrls?: string[];
}

export class ResolveIssueDto {
  @ApiProperty({ 
    example: 'Replaced faulty HDMI cable and reset projector. Tested with laptop connection - working properly now.',
    description: 'Detailed resolution notes' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  resolutionNotes: string;

  @ApiProperty({ 
    example: ['Replaced HDMI cable', 'Reset projector settings', 'Tested with multiple devices'],
    description: 'List of actions taken to resolve the issue' 
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  actionsTaken: string[];

  @ApiPropertyOptional({ 
    example: 4,
    description: 'Customer satisfaction rating (1-5)' 
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  satisfactionRating?: number;

  @ApiPropertyOptional({ 
    example: 'Schedule monthly maintenance check for all AV equipment',
    description: 'Follow-up actions required' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  followUpRequired?: string;
}

export class UpdateIssueDto {
  @ApiPropertyOptional({ 
    example: IssueStatus.IN_PROGRESS,
    description: 'Updated status of the issue',
    enum: IssueStatus 
  })
  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;

  @ApiPropertyOptional({ 
    example: IssueSeverity.CRITICAL,
    description: 'Updated severity level',
    enum: IssueSeverity 
  })
  @IsEnum(IssueSeverity)
  @IsOptional()
  severity?: IssueSeverity;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439013',
    description: 'ID of user to assign the issue to' 
  })
  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ 
    example: ['equipment', 'urgent', 'resolved'],
    description: 'Updated tags for the issue' 
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ 
    example: '2024-11-16T10:00:00.000Z',
    description: 'New due date for resolution' 
  })
  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class IssueQueryDto {
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
    example: '10',
    description: 'Number of items per page' 
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ 
    example: IssueStatus.OPEN,
    description: 'Filter by issue status',
    enum: IssueStatus 
  })
  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;

  @ApiPropertyOptional({ 
    example: IssueType.EQUIPMENT_FAILURE,
    description: 'Filter by issue type',
    enum: IssueType 
  })
  @IsEnum(IssueType)
  @IsOptional()
  type?: IssueType;

  @ApiPropertyOptional({ 
    example: IssueSeverity.HIGH,
    description: 'Filter by severity level',
    enum: IssueSeverity 
  })
  @IsEnum(IssueSeverity)
  @IsOptional()
  severity?: IssueSeverity;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by space ID' 
  })
  @IsMongoId()
  @IsOptional()
  spaceId?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439013',
    description: 'Filter by assigned user ID' 
  })
  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ 
    example: 'equipment',
    description: 'Filter by tag' 
  })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ 
    example: 'true',
    description: 'Show only overdue issues' 
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  overdue?: boolean;

  @ApiPropertyOptional({ 
    example: '2024-11-15',
    description: 'Filter issues created after this date' 
  })
  @IsString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({ 
    example: '2024-11-16',
    description: 'Filter issues created before this date' 
  })
  @IsString()
  @IsOptional()
  createdBefore?: string;
}

export class IssueResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'ISS241101' })
  ticketNumber: string;

  @ApiProperty({ example: IssueType.EQUIPMENT_FAILURE, enum: IssueType })
  type: IssueType;

  @ApiProperty({ example: IssueSeverity.HIGH, enum: IssueSeverity })
  severity: IssueSeverity;

  @ApiProperty({ example: 'Projector not working in conference room' })
  description: string;

  @ApiProperty({ example: IssueStatus.OPEN, enum: IssueStatus })
  status: IssueStatus;

  @ApiProperty({ 
    example: {
      id: '507f1f77bcf86cd799439012',
      name: 'John Doe',
      email: 'john@example.com'
    }
  })
  reporter: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ 
    example: {
      id: '507f1f77bcf86cd799439013',
      name: 'Conference Room A',
      location: 'Floor 2, Building A'
    }
  })
  space: {
    id: string;
    name: string;
    location: string;
  };

  @ApiPropertyOptional({ 
    example: {
      id: '507f1f77bcf86cd799439014',
      name: 'Jane Smith',
      email: 'jane@example.com'
    }
  })
  assignee?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ example: ['equipment', 'urgent'] })
  tags: string[];

  @ApiProperty({ example: '2024-11-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '2024-11-16T10:00:00.000Z' })
  dueDate?: Date;

  @ApiProperty({ example: 6.5 })
  ageInHours: number;

  @ApiProperty({ example: false })
  isOverdue: boolean;

  @ApiPropertyOptional({ 
    example: {
      resolvedBy: {
        id: '507f1f77bcf86cd799439015',
        name: 'Tech Support',
        email: 'tech@example.com'
      },
      resolvedAt: '2024-11-15T14:00:00.000Z',
      resolutionNotes: 'Replaced faulty cable',
      actionsTaken: ['Diagnosed issue', 'Replaced cable', 'Tested system'],
      resolutionTimeHours: 4.0
    }
  })
  resolution?: {
    resolvedBy: {
      id: string;
      name: string;
      email: string;
    };
    resolvedAt: Date;
    resolutionNotes: string;
    actionsTaken: string[];
    resolutionTimeHours: number;
  };
}

export class PaginatedIssueResponseDto {
  @ApiProperty({ type: [IssueResponseDto] })
  data: IssueResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  @ApiProperty({
    example: {
      open: 45,
      inProgress: 20,
      resolved: 30,
      closed: 5
    }
  })
  summary: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
}