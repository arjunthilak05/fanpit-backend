import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcrypt';

export interface SeedData {
  users?: any[];
  spaces?: any[];
  bookings?: any[];
  payments?: any[];
  staffActivities?: any[];
  issues?: any[];
  analytics?: any[];
}

@Injectable()
export class SeedingService {
  private readonly logger = new Logger(SeedingService.name);

  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Seed the database with initial data
   */
  async seedDatabase(force: boolean = false): Promise<void> {
    try {
      if (!force) {
        const hasData = await this.checkIfDataExists();
        if (hasData) {
          this.logger.log('Database already contains data. Use force=true to override.');
          return;
        }
      }

      this.logger.log('Starting database seeding...');

      await this.seedUsers();
      await this.seedSpaces();
      await this.seedBookings();
      await this.seedPayments();
      await this.seedStaffActivities();
      await this.seedIssues();
      await this.seedAnalytics();

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clear all data from the database
   */
  async clearDatabase(): Promise<void> {
    try {
      this.logger.log('Clearing database...');

      const collections = [
        'users', 'spaces', 'bookings', 'payments', 
        'staff_activities', 'issues', 'analytics', 'audit_logs'
      ];

      for (const collectionName of collections) {
        try {
          await this.connection.db.collection(collectionName).deleteMany({});
          this.logger.log(`Cleared collection: ${collectionName}`);
        } catch (error) {
          this.logger.warn(`Failed to clear collection ${collectionName}:`, error.message);
        }
      }

      this.logger.log('Database cleared successfully');
    } catch (error) {
      this.logger.error('Failed to clear database:', error);
      throw error;
    }
  }

  /**
   * Seed specific data
   */
  async seedSpecificData(data: SeedData): Promise<void> {
    try {
      if (data.users) {
        await this.seedUsers(data.users);
      }
      if (data.spaces) {
        await this.seedSpaces(data.spaces);
      }
      if (data.bookings) {
        await this.seedBookings(data.bookings);
      }
      if (data.payments) {
        await this.seedPayments(data.payments);
      }
      if (data.staffActivities) {
        await this.seedStaffActivities(data.staffActivities);
      }
      if (data.issues) {
        await this.seedIssues(data.issues);
      }
      if (data.analytics) {
        await this.seedAnalytics(data.analytics);
      }
    } catch (error) {
      this.logger.error('Failed to seed specific data:', error);
      throw error;
    }
  }

  /**
   * Check if database already contains data
   */
  private async checkIfDataExists(): Promise<boolean> {
    const userCount = await this.connection.db.collection('users').countDocuments();
    const spaceCount = await this.connection.db.collection('spaces').countDocuments();
    
    return userCount > 0 || spaceCount > 0;
  }

  /**
   * Seed users
   */
  private async seedUsers(customUsers?: any[]): Promise<void> {
    const users = customUsers || this.getDefaultUsers();
    
    for (const user of users) {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }

    await this.connection.db.collection('users').insertMany(users);
    this.logger.log(`Seeded ${users.length} users`);
  }

  /**
   * Seed spaces
   */
  private async seedSpaces(customSpaces?: any[]): Promise<void> {
    const spaces = customSpaces || this.getDefaultSpaces();
    await this.connection.db.collection('spaces').insertMany(spaces);
    this.logger.log(`Seeded ${spaces.length} spaces`);
  }

  /**
   * Seed bookings
   */
  private async seedBookings(customBookings?: any[]): Promise<void> {
    const bookings = customBookings || this.getDefaultBookings();
    await this.connection.db.collection('bookings').insertMany(bookings);
    this.logger.log(`Seeded ${bookings.length} bookings`);
  }

  /**
   * Seed payments
   */
  private async seedPayments(customPayments?: any[]): Promise<void> {
    const payments = customPayments || this.getDefaultPayments();
    await this.connection.db.collection('payments').insertMany(payments);
    this.logger.log(`Seeded ${payments.length} payments`);
  }

  /**
   * Seed staff activities
   */
  private async seedStaffActivities(customActivities?: any[]): Promise<void> {
    const activities = customActivities || this.getDefaultStaffActivities();
    await this.connection.db.collection('staff_activities').insertMany(activities);
    this.logger.log(`Seeded ${activities.length} staff activities`);
  }

  /**
   * Seed issues
   */
  private async seedIssues(customIssues?: any[]): Promise<void> {
    const issues = customIssues || this.getDefaultIssues();
    await this.connection.db.collection('issues').insertMany(issues);
    this.logger.log(`Seeded ${issues.length} issues`);
  }

  /**
   * Seed analytics
   */
  private async seedAnalytics(customAnalytics?: any[]): Promise<void> {
    const analytics = customAnalytics || this.getDefaultAnalytics();
    await this.connection.db.collection('analytics').insertMany(analytics);
    this.logger.log(`Seeded ${analytics.length} analytics records`);
  }

  /**
   * Get default users data
   */
  private getDefaultUsers(): any[] {
    return [
      {
        email: 'admin@fanpit.com',
        name: 'Admin User',
        password: 'Admin123!',
        role: 'admin',
        status: 'active',
        isActive: true,
        isEmailVerified: true,
        phone: '+919876543210',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=random',
        profile: {
          bio: 'System Administrator',
          company: 'Fanpit',
          website: 'https://fanpit.com'
        },
        address: {
          street: '123 Admin Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'en',
          timezone: 'Asia/Kolkata'
        },
        security: {
          twoFactorEnabled: false,
          loginAttempts: 0,
          lastPasswordChange: new Date()
        },
        verification: {
          emailVerified: true,
          phoneVerified: true,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date()
        },
        metrics: {
          totalBookings: 0,
          totalSpending: 0,
          loyaltyPoints: 0,
          averageRating: 0,
          reviewCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        password: 'Password123!',
        role: 'consumer',
        status: 'active',
        isActive: true,
        isEmailVerified: true,
        phone: '+919876543211',
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
        profile: {
          bio: 'Regular user of Fanpit',
          company: 'Tech Corp',
          website: 'https://techcorp.com'
        },
        address: {
          street: '456 Consumer Avenue',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          language: 'en',
          timezone: 'Asia/Kolkata'
        },
        security: {
          twoFactorEnabled: false,
          loginAttempts: 0,
          lastPasswordChange: new Date()
        },
        verification: {
          emailVerified: true,
          phoneVerified: true,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date()
        },
        metrics: {
          totalBookings: 5,
          totalSpending: 15000,
          loyaltyPoints: 150,
          averageRating: 4.5,
          reviewCount: 3
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        password: 'Password123!',
        role: 'brand_owner',
        status: 'active',
        isActive: true,
        isEmailVerified: true,
        phone: '+919876543212',
        avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
        profile: {
          bio: 'Space owner and entrepreneur',
          company: 'Smith Enterprises',
          website: 'https://smithenterprises.com'
        },
        address: {
          street: '789 Business Park',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        },
        businessProfile: {
          businessName: 'Smith Enterprises',
          businessType: 'corporation',
          gstNumber: '29ABCDE1234F1Z5',
          panNumber: 'ABCDE1234F',
          businessAddress: {
            street: '789 Business Park',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
            country: 'India'
          },
          documents: ['gst_certificate.pdf', 'pan_card.pdf'],
          isVerified: true,
          verificationDate: new Date()
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'en',
          timezone: 'Asia/Kolkata'
        },
        security: {
          twoFactorEnabled: true,
          loginAttempts: 0,
          lastPasswordChange: new Date()
        },
        verification: {
          emailVerified: true,
          phoneVerified: true,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date()
        },
        metrics: {
          totalBookings: 0,
          totalSpending: 0,
          loyaltyPoints: 0,
          averageRating: 0,
          reviewCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'staff@fanpit.com',
        name: 'Staff Member',
        password: 'Password123!',
        role: 'staff',
        status: 'active',
        isActive: true,
        isEmailVerified: true,
        phone: '+919876543213',
        avatar: 'https://ui-avatars.com/api/?name=Staff+Member&background=random',
        profile: {
          bio: 'Fanpit staff member',
          company: 'Fanpit',
          website: 'https://fanpit.com'
        },
        address: {
          street: '321 Staff Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        staffProfile: {
          employeeId: 'EMP001',
          department: 'operations',
          position: 'space_manager',
          hireDate: new Date(),
          salary: 500000,
          isActive: true,
          skills: ['customer_service', 'space_management', 'booking_management'],
          certifications: ['customer_service_cert', 'safety_training'],
          performanceRating: 4.5
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'en',
          timezone: 'Asia/Kolkata'
        },
        security: {
          twoFactorEnabled: false,
          loginAttempts: 0,
          lastPasswordChange: new Date()
        },
        verification: {
          emailVerified: true,
          phoneVerified: true,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date()
        },
        metrics: {
          totalBookings: 0,
          totalSpending: 0,
          loyaltyPoints: 0,
          averageRating: 0,
          reviewCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get default spaces data
   */
  private getDefaultSpaces(): any[] {
    return [
      {
        name: 'Modern Conference Room A',
        description: 'A spacious and well-equipped conference room perfect for business meetings, presentations, and team collaborations.',
        category: 'conference-room',
        capacity: 12,
        pricing: {
          basePrice: 2500, // ₹25 per hour in paise
          hourlyRate: 2500,
          dailyRate: 15000,
          currency: 'INR',
          discounts: {
            earlyBird: { percentage: 10, hoursBefore: 24 },
            bulk: { percentage: 15, minHours: 8 }
          }
        },
        location: {
          address: '123 Business District, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
          coordinates: {
            type: 'Point',
            coordinates: [72.8777, 19.0760] // Mumbai coordinates
          }
        },
        amenities: [
          'projector',
          'whiteboard',
          'video_conferencing',
          'air_conditioning',
          'wifi',
          'parking'
        ],
        images: [
          'conference-room-a-1.jpg',
          'conference-room-a-2.jpg',
          'conference-room-a-3.jpg'
        ],
        operatingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '10:00', close: '16:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: false }
        },
        rules: [
          'No smoking allowed',
          'Food and beverages allowed',
          'Maximum capacity: 12 people',
          'Booking must be made at least 2 hours in advance'
        ],
        isActive: true,
        status: 'active',
        ownerId: null, // Will be set to Jane Smith's ID
        averageRating: 4.5,
        reviewCount: 15,
        totalBookings: 45,
        totalRevenue: 112500,
        totalViews: 250,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Creative Coworking Space',
        description: 'An inspiring coworking space designed for freelancers, entrepreneurs, and remote workers.',
        category: 'coworking',
        capacity: 25,
        pricing: {
          basePrice: 1500, // ₹15 per hour in paise
          hourlyRate: 1500,
          dailyRate: 8000,
          currency: 'INR',
          discounts: {
            earlyBird: { percentage: 5, hoursBefore: 12 },
            bulk: { percentage: 20, minHours: 40 }
          }
        },
        location: {
          address: '456 Startup Hub, Bangalore',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India',
          coordinates: {
            type: 'Point',
            coordinates: [77.5946, 12.9716] // Bangalore coordinates
          }
        },
        amenities: [
          'high_speed_wifi',
          'ergonomic_chairs',
          'standing_desks',
          'printer_scanner',
          'kitchen',
          'meeting_rooms',
          'phone_booths',
          'parking'
        ],
        images: [
          'coworking-space-1.jpg',
          'coworking-space-2.jpg',
          'coworking-space-3.jpg'
        ],
        operatingHours: {
          monday: { open: '08:00', close: '20:00', closed: false },
          tuesday: { open: '08:00', close: '20:00', closed: false },
          wednesday: { open: '08:00', close: '20:00', closed: false },
          thursday: { open: '08:00', close: '20:00', closed: false },
          friday: { open: '08:00', close: '20:00', closed: false },
          saturday: { open: '09:00', close: '18:00', closed: false },
          sunday: { open: '09:00', close: '18:00', closed: false }
        },
        rules: [
          'Respect other members',
          'Keep noise levels low',
          'Clean up after yourself',
          'No pets allowed'
        ],
        isActive: true,
        status: 'active',
        ownerId: null, // Will be set to Jane Smith's ID
        averageRating: 4.8,
        reviewCount: 28,
        totalBookings: 120,
        totalRevenue: 180000,
        totalViews: 450,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get default bookings data
   */
  private getDefaultBookings(): any[] {
    return [
      {
        bookingCode: 'BK12345678',
        spaceId: null, // Will be set to first space ID
        customerId: null, // Will be set to John Doe's ID
        bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        startTime: '10:00',
        endTime: '12:00',
        duration: 2,
        customerDetails: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+919876543211',
          company: 'Tech Corp',
          guestCount: 3
        },
        pricing: {
          basePrice: 2500,
          hourlyRate: 2500,
          totalHours: 2,
          subtotal: 5000,
          taxes: 900,
          fees: 100,
          totalAmount: 6000,
          currency: 'INR'
        },
        payment: {
          orderId: 'order_123456789',
          status: 'captured',
          amount: 6000,
          currency: 'INR'
        },
        status: 'confirmed',
        notes: 'Business meeting with clients',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get default payments data
   */
  private getDefaultPayments(): any[] {
    return [
      {
        orderId: 'order_123456789',
        paymentId: 'pay_123456789',
        signature: 'signature_123456789',
        bookingId: null, // Will be set to first booking ID
        customerId: null, // Will be set to John Doe's ID
        amount: 6000,
        currency: 'INR',
        status: 'captured',
        method: 'card',
        bank: 'HDFC Bank',
        cardLast4: '1234',
        cardNetwork: 'Visa',
        refunds: [],
        totalRefunded: 0,
        receipt: 'RCP_123456789',
        notes: {
          bookingCode: 'BK12345678',
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          customerPhone: '+919876543211'
        },
        description: 'Conference room booking payment',
        razorpayOrderData: {},
        razorpayPaymentData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get default staff activities data
   */
  private getDefaultStaffActivities(): any[] {
    return [
      {
        staffId: null, // Will be set to staff member ID
        bookingId: null, // Will be set to first booking ID
        spaceId: null, // Will be set to first space ID
        action: 'check-in',
        details: {
          bookingCode: 'BK12345678',
          customerName: 'John Doe',
          checkInTime: new Date(),
          notes: 'Customer arrived on time'
        },
        timestamp: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_123456789',
        isSystemGenerated: false,
        correlationId: 'ACT_1234567890_abc123',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get default issues data
   */
  private getDefaultIssues(): any[] {
    return [
      {
        reportedBy: null, // Will be set to staff member ID
        spaceId: null, // Will be set to first space ID
        type: 'equipment-failure',
        severity: 'medium',
        description: 'Projector is not working properly. Screen remains dim even after adjusting brightness.',
        status: 'open',
        ticketNumber: 'ISS2401001',
        assignedTo: null, // Will be set to staff member ID
        assignedAt: new Date(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        escalationLevel: 0,
        tags: ['equipment', 'projector', 'urgent'],
        customerImpact: 'Affects presentation quality for meetings',
        isRecurring: false,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get default analytics data
   */
  private getDefaultAnalytics(): any[] {
    return [
      {
        type: 'daily',
        metricType: 'revenue',
        date: new Date(),
        period: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        revenue: {
          totalRevenue: 6000,
          netRevenue: 5400,
          grossRevenue: 6000,
          refunds: 0,
          fees: 100,
          taxes: 900,
          averageBookingValue: 6000,
          revenuePerSpace: 3000,
          revenuePerUser: 6000,
          revenueByCategory: { 'conference-room': 6000 },
          revenueByLocation: { 'mumbai': 6000 },
          revenueByPaymentMethod: { 'card': 6000 }
        },
        rawData: {
          totalValue: 6000,
          bookingCount: 1
        },
        calculatedAt: new Date(),
        dataVersion: '1.0.0',
        tags: ['revenue', 'daily'],
        isComplete: true,
        hasAnomaly: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}
