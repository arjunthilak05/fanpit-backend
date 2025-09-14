import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Issue, IssueDocument, IssueStatus, IssueSeverity } from '../schemas/issue.schema';
import { StaffActivity, StaffActivityDocument, StaffActionType } from '../schemas/staff-activity.schema';
import { 
  ReportIssueDto, 
  ResolveIssueDto, 
  UpdateIssueDto,
  IssueQueryDto,
  IssueResponseDto,
  PaginatedIssueResponseDto 
} from '../dto/issue.dto';

@Injectable()
export class IssueManagementService {
  private readonly logger = new Logger(IssueManagementService.name);

  constructor(
    @InjectModel(Issue.name) private issueModel: Model<IssueDocument>,
    @InjectModel(StaffActivity.name) private staffActivityModel: Model<StaffActivityDocument>,
    @InjectConnection() private connection: Connection
  ) {}

  /**
   * Report a new issue
   */
  async reportIssue(
    reportIssueDto: ReportIssueDto,
    staffId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IssueResponseDto> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Create new issue
      const issue = new this.issueModel({
        reportedBy: new Types.ObjectId(staffId),
        spaceId: new Types.ObjectId(reportIssueDto.spaceId),
        bookingId: reportIssueDto.bookingId ? new Types.ObjectId(reportIssueDto.bookingId) : undefined,
        type: reportIssueDto.type,
        severity: reportIssueDto.severity,
        description: reportIssueDto.description,
        tags: reportIssueDto.tags || [],
        customerImpact: reportIssueDto.customerImpact,
        attachments: this.buildAttachments(reportIssueDto.attachmentUrls, staffId)
      });

      await issue.save({ session });

      // Auto-assign based on severity and type
      await this.autoAssignIssue(issue, session);

      // Log staff activity
      await this.logStaffActivity({
        staffId: new Types.ObjectId(staffId),
        bookingId: issue.bookingId,
        spaceId: issue.spaceId,
        action: StaffActionType.REPORT_ISSUE,
        details: {
          issueId: issue._id.toString(),
          issueType: issue.type,
          severity: issue.severity,
          description: issue.description,
          ticketNumber: issue.ticketNumber
        },
        ipAddress,
        userAgent,
        session
      });

      await session.commitTransaction();

      // Populate for response
      await issue.populate([
        { path: 'reportedBy', select: 'name email' },
        { path: 'space', select: 'name location' },
        { path: 'assignedTo', select: 'name email' }
      ]);

      this.logger.log(`Issue reported successfully: ${issue.ticketNumber} by staff ${staffId}`);
      
      return this.transformToResponseDto(issue);

    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to report issue: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Resolve an issue
   */
  async resolveIssue(
    issueId: string,
    resolveDto: ResolveIssueDto,
    staffId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IssueResponseDto> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      const issue = await this.issueModel
        .findById(issueId)
        .session(session);

      if (!issue) {
        throw new NotFoundException('Issue not found');
      }

      // Check permissions
      await this.checkResolvePermissions(issue, staffId, userRole);

      // Update issue with resolution
      await issue.resolve(
        new Types.ObjectId(staffId),
        resolveDto.resolutionNotes,
        resolveDto.actionsTaken
      );

      // Add satisfaction rating and follow-up if provided
      if (issue.resolution) {
        if (resolveDto.satisfactionRating) {
          issue.resolution.satisfactionRating = resolveDto.satisfactionRating;
        }
        if (resolveDto.followUpRequired) {
          issue.resolution.followUpRequired = resolveDto.followUpRequired;
        }
      }

      await issue.save({ session });

      // Log staff activity
      await this.logStaffActivity({
        staffId: new Types.ObjectId(staffId),
        bookingId: issue.bookingId,
        spaceId: issue.spaceId,
        action: StaffActionType.RESOLVE_ISSUE,
        details: {
          issueId: issue._id.toString(),
          ticketNumber: issue.ticketNumber,
          resolutionNotes: resolveDto.resolutionNotes,
          actionsTaken: resolveDto.actionsTaken,
          satisfactionRating: resolveDto.satisfactionRating
        },
        ipAddress,
        userAgent,
        session
      });

      await session.commitTransaction();

      // Populate for response
      await issue.populate([
        { path: 'reportedBy', select: 'name email' },
        { path: 'space', select: 'name location' },
        { path: 'assignedTo', select: 'name email' },
        { path: 'resolution.resolvedBy', select: 'name email' }
      ]);

      this.logger.log(`Issue resolved successfully: ${issue.ticketNumber} by staff ${staffId}`);
      
      return this.transformToResponseDto(issue);

    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to resolve issue ${issueId}: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update issue details
   */
  async updateIssue(
    issueId: string,
    updateDto: UpdateIssueDto,
    staffId: string,
    userRole: string
  ): Promise<IssueResponseDto> {
    const issue = await this.issueModel.findById(issueId);

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Check permissions
    await this.checkUpdatePermissions(issue, staffId, userRole);

    // Update fields
    if (updateDto.status) {
      issue.status = updateDto.status;
    }
    
    if (updateDto.severity) {
      issue.severity = updateDto.severity;
    }
    
    if (updateDto.assignedTo) {
      await issue.assignTo(new Types.ObjectId(updateDto.assignedTo), new Types.ObjectId(staffId));
    }
    
    if (updateDto.tags) {
      issue.tags = updateDto.tags;
    }
    
    if (updateDto.dueDate) {
      issue.dueDate = new Date(updateDto.dueDate);
    }

    await issue.save();

    // Populate for response
    await issue.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'space', select: 'name location' },
      { path: 'assignedTo', select: 'name email' }
    ]);

    this.logger.log(`Issue updated successfully: ${issue.ticketNumber} by staff ${staffId}`);
    
    return this.transformToResponseDto(issue);
  }

  /**
   * Get issues with pagination and filtering
   */
  async getIssues(
    queryDto: IssueQueryDto,
    staffId: string,
    userRole: string
  ): Promise<PaginatedIssueResponseDto> {
    const { page = 1, limit = 10, ...filters } = queryDto;
    
    // Build query based on filters
    const query = this.buildIssueQuery(filters, staffId, userRole);
    
    // Execute paginated query
    const [issues, total] = await Promise.all([
      this.issueModel
        .find(query)
        .populate('reportedBy', 'name email')
        .populate('space', 'name location')
        .populate('assignedTo', 'name email')
        .populate('resolution.resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.issueModel.countDocuments(query)
    ]);

    // Get summary statistics
    const summary = await this.getIssuesSummary(filters, staffId, userRole);

    return {
      data: issues.map(issue => this.transformToResponseDto(issue)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary
    };
  }

  /**
   * Get issue by ID
   */
  async getIssueById(
    issueId: string,
    staffId: string,
    userRole: string
  ): Promise<IssueResponseDto> {
    const issue = await this.issueModel
      .findById(issueId)
      .populate('reportedBy', 'name email')
      .populate('space', 'name location')
      .populate('assignedTo', 'name email')
      .populate('resolution.resolvedBy', 'name email');

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Check read permissions
    await this.checkReadPermissions(issue, staffId, userRole);

    return this.transformToResponseDto(issue);
  }

  /**
   * Escalate issue
   */
  async escalateIssue(
    issueId: string,
    reason: string,
    staffId: string
  ): Promise<IssueResponseDto> {
    const issue = await this.issueModel.findById(issueId);

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    await issue.escalate(reason);
    
    // Log escalation activity
    await this.logStaffActivity({
      staffId: new Types.ObjectId(staffId),
      bookingId: issue.bookingId,
      spaceId: issue.spaceId,
      action: StaffActionType.REPORT_ISSUE, // Using report_issue for escalation
      details: {
        issueId: issue._id.toString(),
        ticketNumber: issue.ticketNumber,
        action: 'escalated',
        escalationLevel: issue.escalationLevel,
        reason
      }
    });

    // Populate for response
    await issue.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'space', select: 'name location' },
      { path: 'assignedTo', select: 'name email' }
    ]);

    this.logger.log(`Issue escalated: ${issue.ticketNumber} to level ${issue.escalationLevel}`);
    
    return this.transformToResponseDto(issue);
  }

  /**
   * Add attachment to issue
   */
  async addAttachment(
    issueId: string,
    url: string,
    filename: string,
    staffId: string,
    description?: string
  ): Promise<void> {
    const issue = await this.issueModel.findById(issueId);

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    await issue.addAttachment(url, filename, new Types.ObjectId(staffId), description);
    
    this.logger.log(`Attachment added to issue ${issue.ticketNumber}: ${filename}`);
  }

  /**
   * Get critical issues requiring immediate attention
   */
  async getCriticalIssues(): Promise<IssueResponseDto[]> {
    const issues = await this.issueModel.getCriticalIssues();
    return issues.map(issue => this.transformToResponseDto(issue));
  }

  /**
   * Get overdue issues
   */
  async getOverdueIssues(): Promise<IssueResponseDto[]> {
    const issues = await this.issueModel.getOverdueIssues();
    return issues.map(issue => this.transformToResponseDto(issue));
  }

  // Private helper methods

  private buildIssueQuery(filters: any, staffId: string, userRole: string): any {
    const query: any = {};

    // Role-based filtering
    if (userRole === 'staff') {
      // Staff can only see issues they reported or are assigned to
      query.$or = [
        { reportedBy: new Types.ObjectId(staffId) },
        { assignedTo: new Types.ObjectId(staffId) }
      ];
    }

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.severity) {
      query.severity = filters.severity;
    }

    if (filters.spaceId) {
      query.spaceId = new Types.ObjectId(filters.spaceId);
    }

    if (filters.assignedTo) {
      query.assignedTo = new Types.ObjectId(filters.assignedTo);
    }

    if (filters.tag) {
      query.tags = { $in: [filters.tag] };
    }

    if (filters.overdue) {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: [IssueStatus.RESOLVED, IssueStatus.CLOSED] };
    }

    // Date range filters
    if (filters.createdAfter || filters.createdBefore) {
      query.createdAt = {};
      if (filters.createdAfter) {
        query.createdAt.$gte = new Date(filters.createdAfter);
      }
      if (filters.createdBefore) {
        query.createdAt.$lte = new Date(filters.createdBefore);
      }
    }

    return query;
  }

  private async getIssuesSummary(filters: any, staffId: string, userRole: string): Promise<any> {
    const baseQuery = this.buildIssueQuery(filters, staffId, userRole);

    const [statusCounts] = await Promise.all([
      this.issueModel.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const summary = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };

    statusCounts.forEach((item: any) => {
      switch (item._id) {
        case IssueStatus.OPEN:
          summary.open = item.count;
          break;
        case IssueStatus.IN_PROGRESS:
          summary.inProgress = item.count;
          break;
        case IssueStatus.RESOLVED:
          summary.resolved = item.count;
          break;
        case IssueStatus.CLOSED:
          summary.closed = item.count;
          break;
      }
    });

    return summary;
  }

  private async autoAssignIssue(issue: IssueDocument, session: ClientSession): Promise<void> {
    // Simple auto-assignment logic based on severity
    // In a real system, this could be more sophisticated
    if (issue.severity === IssueSeverity.CRITICAL) {
      // Assign to on-duty manager (this would be dynamic)
      // For now, we just set a flag for manual assignment
      issue.escalationLevel = 1;
    }
  }

  private buildAttachments(urls: string[] = [], staffId: string): any[] {
    return urls.map(url => ({
      url,
      filename: this.extractFilenameFromUrl(url),
      uploadedAt: new Date(),
      uploadedBy: new Types.ObjectId(staffId)
    }));
  }

  private extractFilenameFromUrl(url: string): string {
    try {
      return url.split('/').pop() || 'attachment';
    } catch {
      return 'attachment';
    }
  }

  private async checkResolvePermissions(issue: IssueDocument, staffId: string, userRole: string): Promise<void> {
    if (userRole === 'staff') {
      // Staff can only resolve issues assigned to them or that they reported
      const staffObjectId = new Types.ObjectId(staffId);
      const canResolve = (
        issue.assignedTo?.equals(staffObjectId) ||
        issue.reportedBy.equals(staffObjectId)
      );

      if (!canResolve) {
        throw new ForbiddenException('You can only resolve issues assigned to you or that you reported');
      }
    }
  }

  private async checkUpdatePermissions(issue: IssueDocument, staffId: string, userRole: string): Promise<void> {
    if (userRole === 'staff') {
      // Staff can only update issues they are involved with
      const staffObjectId = new Types.ObjectId(staffId);
      const canUpdate = (
        issue.assignedTo?.equals(staffObjectId) ||
        issue.reportedBy.equals(staffObjectId)
      );

      if (!canUpdate) {
        throw new ForbiddenException('You can only update issues you are involved with');
      }
    }
  }

  private async checkReadPermissions(issue: IssueDocument, staffId: string, userRole: string): Promise<void> {
    if (userRole === 'staff') {
      // Staff can only read issues they are involved with
      const staffObjectId = new Types.ObjectId(staffId);
      const canRead = (
        issue.assignedTo?.equals(staffObjectId) ||
        issue.reportedBy.equals(staffObjectId)
      );

      if (!canRead) {
        throw new ForbiddenException('You can only view issues you are involved with');
      }
    }
  }

  private async logStaffActivity(params: {
    staffId: Types.ObjectId;
    bookingId?: Types.ObjectId;
    spaceId: Types.ObjectId;
    action: StaffActionType;
    details: any;
    ipAddress?: string;
    userAgent?: string;
    session?: ClientSession;
  }): Promise<void> {
    try {
      const activity = new this.staffActivityModel({
        staffId: params.staffId,
        bookingId: params.bookingId || new Types.ObjectId(), // Temporary fallback
        spaceId: params.spaceId,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        timestamp: new Date()
      });

      if (params.session) {
        await activity.save({ session: params.session });
      } else {
        await activity.save();
      }
    } catch (error) {
      this.logger.warn(`Failed to log staff activity: ${error.message}`);
    }
  }

  private transformToResponseDto(issue: IssueDocument): IssueResponseDto {
    return {
      id: issue._id.toString(),
      ticketNumber: issue.ticketNumber || 'N/A',
      type: issue.type,
      severity: issue.severity,
      description: issue.description,
      status: issue.status,
      reporter: {
        id: issue.reportedBy._id?.toString() || issue.reportedBy.toString(),
        name: (issue.reportedBy as any).name || 'Unknown',
        email: (issue.reportedBy as any).email || 'unknown@example.com'
      },
      space: {
        id: issue.spaceId._id?.toString() || issue.spaceId.toString(),
        name: (issue.spaceId as any).name || 'Unknown Space',
        location: (issue.spaceId as any).location || 'Unknown Location'
      },
      assignee: issue.assignedTo ? {
        id: issue.assignedTo._id?.toString() || issue.assignedTo.toString(),
        name: (issue.assignedTo as any).name || 'Unknown',
        email: (issue.assignedTo as any).email || 'unknown@example.com'
      } : undefined,
      tags: issue.tags,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      dueDate: issue.dueDate,
      ageInHours: (issue as any).ageInHours || 0,
      isOverdue: (issue as any).isOverdue || false,
      resolution: issue.resolution ? {
        resolvedBy: {
          id: issue.resolution.resolvedBy._id?.toString() || issue.resolution.resolvedBy.toString(),
          name: (issue.resolution.resolvedBy as any).name || 'Unknown',
          email: (issue.resolution.resolvedBy as any).email || 'unknown@example.com'
        },
        resolvedAt: issue.resolution.resolvedAt,
        resolutionNotes: issue.resolution.resolutionNotes,
        actionsTaken: issue.resolution.actionsTaken,
        resolutionTimeHours: (issue as any).resolutionTimeHours || 0
      } : undefined
    };
  }
}