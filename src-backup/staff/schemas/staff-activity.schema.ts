import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StaffActivityDocument = StaffActivity & Document;

export enum StaffActionType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  NO_SHOW = 'no_show',
  MARK_NO_SHOW = 'mark_no_show',
  ISSUE_REPORTED = 'issue_reported',
  REPORT_ISSUE = 'report_issue',
  ISSUE_RESOLVED = 'issue_resolved',
  RESOLVE_ISSUE = 'resolve_issue',
  EMERGENCY_ALERT = 'emergency_alert',
  MAINTENANCE_REQUEST = 'maintenance_request',
  SPACE_ACCESS = 'space_access',
  GUEST_ASSISTANCE = 'guest_assistance',
  PAYMENT_ISSUE = 'payment_issue',
  BOOKING_MODIFICATION = 'booking_modification',
  VERIFY_BOOKING = 'verify_booking',
  OTHER = 'other'
}

@Schema({ timestamps: true })
export class StaffActivity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  staffId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: false })
  bookingId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space', required: false })
  spaceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Issue', required: false })
  issueId?: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(StaffActionType), 
    required: true 
  })
  action: StaffActionType;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: false })
  notes?: string;

  @Prop({ type: String, required: false })
  location?: string;

  @Prop({ type: String, required: false })
  ipAddress?: string;

  @Prop({ type: String, required: false })
  userAgent?: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: Object, required: false })
  metadata?: {
    guestCount?: number;
    duration?: number;
    amount?: number;
    reason?: string;
    [key: string]: any;
  };

  @Prop({ type: Object, required: false })
  details?: {
    processingTimeMs?: number;
    responseTimeMs?: number;
    errorMessage?: string;
    [key: string]: any;
  };

  @Prop({ type: Boolean, default: false })
  isEmergency: boolean;

  @Prop({ type: String, required: false })
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @Prop({ type: Date, required: false })
  resolvedAt?: Date;

  @Prop({ type: String, required: false })
  resolution?: string;
}

export const StaffActivitySchema = SchemaFactory.createForClass(StaffActivity);

// Static methods
StaffActivitySchema.statics = {
  async getStaffMetrics(staffId: Types.ObjectId, startDate?: Date, endDate?: Date) {
    const query: any = { staffId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const activities = await this.find(query);

    const metrics = {
      totalActivities: activities.length,
      checkIns: activities.filter(a => a.action === StaffActionType.CHECK_IN).length,
      checkOuts: activities.filter(a => a.action === StaffActionType.CHECK_OUT).length,
      issuesReported: activities.filter(a => a.action === StaffActionType.REPORT_ISSUE).length,
      issuesResolved: activities.filter(a => a.action === StaffActionType.RESOLVE_ISSUE).length,
      averageProcessingTime: 0,
      emergencyAlerts: activities.filter(a => a.isEmergency).length
    };

    // Calculate average processing time
    const activitiesWithTime = activities.filter(a => a.details?.processingTimeMs);
    if (activitiesWithTime.length > 0) {
      const totalTime = activitiesWithTime.reduce((sum, a) => sum + (a.details?.processingTimeMs || 0), 0);
      metrics.averageProcessingTime = totalTime / activitiesWithTime.length;
    }

    return metrics;
  }
};

// Indexes for better query performance
StaffActivitySchema.index({ staffId: 1, timestamp: -1 });
StaffActivitySchema.index({ bookingId: 1 });
StaffActivitySchema.index({ spaceId: 1, timestamp: -1 });
StaffActivitySchema.index({ action: 1, timestamp: -1 });
StaffActivitySchema.index({ isEmergency: 1, timestamp: -1 });
StaffActivitySchema.index({ timestamp: -1 });