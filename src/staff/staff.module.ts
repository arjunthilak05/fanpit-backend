import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { DashboardService } from './services/dashboard.service';
import { CheckInService } from './services/check-in.service';
import { IssueManagementService } from './services/issue-management.service';

// Schemas
import { User, UserSchema } from '../users/schemas/user.schema';
import { Space, SpaceSchema } from '../spaces/schemas/space.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Issue, IssueSchema } from './schemas/issue.schema';
import { StaffActivity, StaffActivitySchema } from './schemas/staff-activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Space.name, schema: SpaceSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Issue.name, schema: IssueSchema },
      { name: StaffActivity.name, schema: StaffActivitySchema },
    ]),
  ],
  controllers: [StaffController],
  providers: [
    StaffService,
    DashboardService,
    CheckInService,
    IssueManagementService,
  ],
  exports: [
    StaffService,
    DashboardService,
    CheckInService,
    IssueManagementService,
  ],
})
export class StaffModule {}