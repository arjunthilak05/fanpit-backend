import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/schemas/user.schema';
import { Space } from '../src/spaces/schemas/space.schema';
import { Booking } from '../src/bookings/schemas/booking.schema';

export class TestSetup {
  private app: INestApplication;
  private connection: Connection;

  async setup(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    // Apply the same configuration as production
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Get database connection for cleanup
    const userModel = this.app.get(getModelToken(User.name));
    this.connection = userModel.db;

    await this.app.init();

    // Clean database before tests
    await this.cleanDatabase();

    return this.app;
  }

  async teardown(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  private async cleanDatabase(): Promise<void> {
    if (this.connection) {
      const collections = this.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  }

  getApp(): INestApplication {
    return this.app;
  }

  getConnection(): Connection {
    return this.connection;
  }
}

// Test data factories
export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): Partial<User> {
    return {
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword123',
      role: 'consumer',
      isEmailVerified: false,
      isActive: true,
      ...overrides,
    };
  }

  static createSpace(ownerId: string, overrides: Partial<Space> = {}): Partial<Space> {
    return {
      name: 'Test Space',
      description: 'A test space for booking',
      address: {
        street: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        coordinates: [72.8777, 19.076],
      },
      capacity: 50,
      amenities: ['wifi', 'parking'],
      images: ['https://example.com/image.jpg'],
      pricing: {
        type: 'paid',
        baseRate: 500,
        rateType: 'hourly',
      },
      availability: {
        operatingHours: {
          monday: { start: '09:00', end: '18:00', closed: false },
          tuesday: { start: '09:00', end: '18:00', closed: false },
          wednesday: { start: '09:00', end: '18:00', closed: false },
          thursday: { start: '09:00', end: '18:00', closed: false },
          friday: { start: '09:00', end: '18:00', closed: false },
          saturday: { start: '10:00', end: '16:00', closed: false },
          sunday: { start: '10:00', end: '16:00', closed: false },
        },
        blockedDates: [],
        advanceBooking: 30,
        minBookingDuration: 1,
        maxBookingDuration: 8,
      },
      status: 'active',
      rating: 4.5,
      reviewCount: 10,
      totalBookings: 25,
      ownerId,
      ...overrides,
    };
  }

  static createBooking(userId: string, spaceId: string, overrides: Partial<Booking> = {}): Partial<Booking> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      spaceId,
      userId,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      duration: 2,
      totalAmount: 1000,
      breakdown: {
        baseAmount: 1000,
        peakCharges: 0,
        discounts: 0,
        taxes: 0,
      },
      paymentStatus: 'pending',
      bookingStatus: 'confirmed',
      checkInCode: 'ABC123',
      guestCount: 5,
      ...overrides,
    };
  }
}

// API test helpers
export class ApiTestHelper {
  constructor(private app: INestApplication) {}

  async registerUser(userData: any): Promise<any> {
    const response = await this.app
      .getHttpServer()
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    return response.body;
  }

  async loginUser(email: string, password: string): Promise<string> {
    const response = await this.app
      .getHttpServer()
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    return response.body.data.accessToken;
  }

  async createSpace(token: string, spaceData: any): Promise<any> {
    const response = await this.app
      .getHttpServer()
      .post('/api/v1/spaces')
      .set('Authorization', `Bearer ${token}`)
      .send(spaceData)
      .expect(201);

    return response.body;
  }

  async createBooking(token: string, bookingData: any): Promise<any> {
    const response = await this.app
      .getHttpServer()
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(bookingData)
      .expect(201);

    return response.body;
  }

  async get(endpoint: string, token?: string): Promise<any> {
    const request = this.app
      .getHttpServer()
      .get(endpoint);

    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }

    const response = await request.expect(200);
    return response.body;
  }

  async post(endpoint: string, data: any, token?: string): Promise<any> {
    const request = this.app
      .getHttpServer()
      .post(endpoint)
      .send(data);

    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }

    const response = await request.expect(201);
    return response.body;
  }

  async put(endpoint: string, data: any, token?: string): Promise<any> {
    const request = this.app
      .getHttpServer()
      .put(endpoint)
      .send(data);

    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }

    const response = await request.expect(200);
    return response.body;
  }

  async delete(endpoint: string, token?: string): Promise<any> {
    const request = this.app
      .getHttpServer()
      .delete(endpoint);

    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }

    const response = await request.expect(200);
    return response.body;
  }
}
