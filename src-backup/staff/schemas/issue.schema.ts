import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';

export type IssueDocument = Issue & Document;

export enum IssueType {
  CLEANLINESS = 'cleanliness',
  EQUIPMENT_FAILURE = 'equipment-failure',
  SAFETY_CONCERN = 'safety-concern',
  CUSTOMER_COMPLAINT = 'customer-complaint',
  BOOKING_CONFLICT = 'booking-conflict',
  OTHER = 'other'
}

export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

@Schema({ 
  _id: false,
  versionKey: false 
})
export class IssueResolution {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  resolvedBy: Types.ObjectId;

  @Prop({ 
    type: Date, 
    required: true,
    default: Date.now 
  })
  resolvedAt: Date;

  @Prop({ 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 1000 
  })
  resolutionNotes: string;

  @Prop({ 
    type: [String], 
    default: [] 
  })
  actionsTaken: string[];

  @Prop({ 
    type: Number, 
    min: 1, 
    max: 5 
  })
  satisfactionRating?: number;

  @Prop({ type: String, trim: true })
  followUpRequired?: string;

  @Prop({ type: Date })
  verifiedAt?: Date;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User' 
  })
  verifiedBy?: Types.ObjectId;
}

export const IssueResolutionSchema = SchemaFactory.createForClass(IssueResolution);

@Schema({ 
  _id: false,
  versionKey: false 
})
export class IssueAttachment {
  @Prop({ 
    type: String, 
    required: true, 
    trim: true 
  })
  url: string;

  @Prop({ 
    type: String, 
    required: true, 
    trim: true 
  })
  filename: string;

  @Prop({ 
    type: String, 
    trim: true 
  })
  description?: string;

  @Prop({ 
    type: Date, 
    default: Date.now 
  })
  uploadedAt: Date;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User' 
  })
  uploadedBy: Types.ObjectId;
}

export const IssueAttachmentSchema = SchemaFactory.createForClass(IssueAttachment);

@Schema({
  timestamps: true,
  collection: 'issues'
})
export class Issue {
  @Transform(({ value }) => value?.toString())
  _id: Types.ObjectId;

  // Instance methods declarations
  assignTo(userId: Types.ObjectId, assignedBy?: Types.ObjectId): Promise<void>;
  escalate(reason?: string): Promise<void>;
  resolve(resolvedBy: Types.ObjectId, resolutionNotes: string, actionsTaken?: string[]): Promise<void>;
  close(): Promise<void>;
  addAttachment(url: string, filename: string, uploadedBy: Types.ObjectId, description?: string): Promise<void>;
  isCriticalAndRecent(): boolean;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  })
  reportedBy: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Booking',
    index: true 
  })
  bookingId?: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Space', 
    required: true,
    index: true 
  })
  spaceId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(IssueType),
    required: true,
    index: true 
  })
  type: IssueType;

  @Prop({ 
    type: String, 
    enum: Object.values(IssueSeverity),
    default: IssueSeverity.MEDIUM,
    index: true 
  })
  severity: IssueSeverity;

  @Prop({ 
    type: String, 
    required: true, 
    trim: true,
    minlength: 10,
    maxlength: 1000 
  })
  description: string;

  @Prop({ 
    type: String, 
    enum: Object.values(IssueStatus),
    default: IssueStatus.OPEN,
    index: true 
  })
  status: IssueStatus;

  @Prop({ 
    type: IssueResolutionSchema 
  })
  resolution?: IssueResolution;

  @Prop({ 
    type: [IssueAttachmentSchema], 
    default: [] 
  })
  attachments: IssueAttachment[];

  @Prop({ 
    type: String, 
    trim: true,
    unique: true,
    sparse: true 
  })
  ticketNumber?: string;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User',
    index: true 
  })
  assignedTo?: Types.ObjectId;

  @Prop({ type: Date })
  assignedAt?: Date;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: Number, default: 0 })
  escalationLevel: number;

  @Prop({ type: Date })
  lastEscalatedAt?: Date;

  @Prop({ 
    type: [String], 
    default: [] 
  })
  tags: string[];

  @Prop({ 
    type: String, 
    trim: true 
  })
  customerImpact?: string;

  @Prop({ type: Boolean, default: false })
  isRecurring: boolean;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Issue' 
  })
  relatedTo?: Types.ObjectId;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const IssueSchema = SchemaFactory.createForClass(Issue);

// Indexes for better query performance
IssueSchema.index({ reportedBy: 1, createdAt: -1 });
IssueSchema.index({ spaceId: 1, status: 1 });
IssueSchema.index({ type: 1, severity: 1 });
IssueSchema.index({ assignedTo: 1, status: 1 });
IssueSchema.index({ ticketNumber: 1 }, { unique: true, sparse: true });
IssueSchema.index({ status: 1, createdAt: -1 });
IssueSchema.index({ dueDate: 1, status: 1 });
IssueSchema.index({ escalationLevel: 1, status: 1 });

// Virtual for reporter information
IssueSchema.virtual('reporter', {
  ref: 'User',
  localField: 'reportedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for booking information
IssueSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

// Virtual for space information
IssueSchema.virtual('space', {
  ref: 'Space',
  localField: 'spaceId',
  foreignField: '_id',
  justOne: true
});

// Virtual for assigned user information
IssueSchema.virtual('assignee', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true
});

// Virtual for resolution time (in hours)
IssueSchema.virtual('resolutionTimeHours').get(function() {
  if (this.resolution?.resolvedAt && this.createdAt) {
    const diffMs = this.resolution.resolvedAt.getTime() - this.createdAt.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }
  return null;
});

// Virtual for age in hours
IssueSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const diffMs = now.getTime() - this.createdAt.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
});

// Virtual for is overdue
IssueSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && this.status !== IssueStatus.RESOLVED && this.status !== IssueStatus.CLOSED;
});

// Static methods
IssueSchema.statics = {
  // Get issues by space and date range
  async getIssuesForSpace(
    spaceId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ) {
    const query: any = { spaceId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    return this.find(query)
      .populate('reporter', 'name email')
      .populate('assignee', 'name email')
      .populate('space', 'name location')
      .sort({ createdAt: -1 });
  },

  // Get overdue issues
  async getOverdueIssues() {
    return this.find({
      dueDate: { $lt: new Date() },
      status: { $nin: [IssueStatus.RESOLVED, IssueStatus.CLOSED] }
    })
    .populate('reporter', 'name email')
    .populate('assignee', 'name email')
    .populate('space', 'name location')
    .sort({ dueDate: 1 });
  },

  // Get critical issues
  async getCriticalIssues() {
    return this.find({
      severity: IssueSeverity.CRITICAL,
      status: { $nin: [IssueStatus.RESOLVED, IssueStatus.CLOSED] }
    })
    .populate('reporter', 'name email')
    .populate('assignee', 'name email')
    .populate('space', 'name location')
    .sort({ createdAt: 1 });
  },

  // Get issues requiring escalation
  async getIssuesForEscalation() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return this.find({
      status: IssueStatus.OPEN,
      createdAt: { $lt: twentyFourHoursAgo },
      escalationLevel: { $lt: 2 }
    })
    .populate('reporter', 'name email')
    .populate('space', 'name location')
    .sort({ createdAt: 1 });
  },

  // Generate ticket number
  async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await this.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    return `ISS${year}${month}${sequence}`;
  }
};

// Instance methods
IssueSchema.methods = {
  // Assign issue to user
  async assignTo(userId: Types.ObjectId, assignedBy?: Types.ObjectId): Promise<void> {
    this.assignedTo = userId;
    this.assignedAt = new Date();
    await this.save();
  },

  // Escalate issue
  async escalate(reason?: string): Promise<void> {
    this.escalationLevel += 1;
    this.lastEscalatedAt = new Date();
    
    // Auto-assign based on escalation level
    if (this.escalationLevel >= 2) {
      // Assign to manager or senior staff
      // Implementation depends on your user role structure
    }
    
    await this.save();
  },

  // Resolve issue
  async resolve(
    resolvedBy: Types.ObjectId,
    resolutionNotes: string,
    actionsTaken: string[] = []
  ): Promise<void> {
    this.status = IssueStatus.RESOLVED;
    this.resolution = {
      resolvedBy,
      resolvedAt: new Date(),
      resolutionNotes,
      actionsTaken
    };
    await this.save();
  },

  // Close issue
  async close(): Promise<void> {
    this.status = IssueStatus.CLOSED;
    await this.save();
  },

  // Add attachment
  async addAttachment(
    url: string,
    filename: string,
    uploadedBy: Types.ObjectId,
    description?: string
  ): Promise<void> {
    this.attachments.push({
      url,
      filename,
      description,
      uploadedAt: new Date(),
      uploadedBy
    });
    await this.save();
  },

  // Check if issue is critical and recent
  isCriticalAndRecent(): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.severity === IssueSeverity.CRITICAL && this.createdAt > oneHourAgo;
  }
};

// Pre-save middleware
IssueSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    this.ticketNumber = await (this.constructor as any).generateTicketNumber();
  }
  
  // Set due date based on severity
  if (this.isNew && !this.dueDate) {
    const now = new Date();
    switch (this.severity) {
      case IssueSeverity.CRITICAL:
        this.dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        break;
      case IssueSeverity.HIGH:
        this.dueDate = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
        break;
      case IssueSeverity.MEDIUM:
        this.dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case IssueSeverity.LOW:
        this.dueDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
        break;
    }
  }
  
  next();
});

// Post-save middleware for notifications
IssueSchema.post('save', function(doc, next) {
  // Emit real-time updates for critical issues
  if (doc.isCriticalAndRecent()) {
    // Implementation for real-time notifications
    // This will be handled by the WebSocket gateway
  }
  
  next();
});