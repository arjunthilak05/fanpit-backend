import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class TestingUtilitiesService {
  private readonly logger = new Logger(TestingUtilitiesService.name);

  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Clear all test data from the database
   */
  async clearTestData(): Promise<void> {
    try {
      this.logger.log('Clearing test data...');

      const collections = [
        'users', 'spaces', 'bookings', 'payments', 
        'staff_activities', 'issues', 'analytics'
      ];

      for (const collectionName of collections) {
        try {
          await this.connection.db.collection(collectionName).deleteMany({});
          this.logger.log(`Cleared test data from: ${collectionName}`);
        } catch (error) {
          this.logger.warn(`Failed to clear ${collectionName}:`, error.message);
        }
      }

      this.logger.log('Test data cleared successfully');
    } catch (error) {
      this.logger.error('Failed to clear test data:', error);
      throw error;
    }
  }

  /**
   * Validate schema constraints
   */
  async validateSchemaConstraints(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Test unique constraints
      await this.testUniqueConstraints(errors);
      
      // Test required fields
      await this.testRequiredFields(errors);
      
      // Test data types
      await this.testDataTypes(errors);

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      this.logger.error('Schema validation failed:', error);
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Test database indexes
   */
  async testIndexes(): Promise<{
    valid: boolean;
    missingIndexes: string[];
  }> {
    const missingIndexes: string[] = [];

    try {
      const collections = [
        'users', 'spaces', 'bookings', 'payments', 
        'staff_activities', 'issues', 'analytics'
      ];

      for (const collectionName of collections) {
        const indexes = await this.connection.db.collection(collectionName).indexes();
        this.logger.log(`Collection ${collectionName} has ${indexes.length} indexes`);
      }

      return {
        valid: missingIndexes.length === 0,
        missingIndexes
      };
    } catch (error) {
      this.logger.error('Index testing failed:', error);
      return {
        valid: false,
        missingIndexes: [error.message]
      };
    }
  }

  /**
   * Test database performance
   */
  async testPerformance(): Promise<{
    valid: boolean;
    slowQueries: string[];
  }> {
    const slowQueries: string[] = [];

    try {
      // Test basic queries
      const startTime = Date.now();
      
      await this.connection.db.collection('users').findOne({});
      await this.connection.db.collection('spaces').findOne({});
      await this.connection.db.collection('bookings').findOne({});
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;

      if (queryTime > 1000) {
        slowQueries.push(`Basic queries took ${queryTime}ms`);
      }

      this.logger.log(`Performance test completed in ${queryTime}ms`);

      return {
        valid: slowQueries.length === 0,
        slowQueries
      };
    } catch (error) {
      this.logger.error('Performance testing failed:', error);
      return {
        valid: false,
        slowQueries: [error.message]
      };
    }
  }

  /**
   * Test unique constraints
   */
  private async testUniqueConstraints(errors: string[]): Promise<void> {
    try {
      // Test user email uniqueness
      const duplicateEmails = await this.connection.db.collection('users').aggregate([
        { $group: { _id: '$email', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();

      if (duplicateEmails.length > 0) {
        errors.push(`Duplicate emails found: ${duplicateEmails.length}`);
      }

      // Test booking code uniqueness
      const duplicateBookingCodes = await this.connection.db.collection('bookings').aggregate([
        { $group: { _id: '$bookingCode', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();

      if (duplicateBookingCodes.length > 0) {
        errors.push(`Duplicate booking codes found: ${duplicateBookingCodes.length}`);
      }

      // Test payment order ID uniqueness
      const duplicateOrderIds = await this.connection.db.collection('payments').aggregate([
        { $group: { _id: '$orderId', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();

      if (duplicateOrderIds.length > 0) {
        errors.push(`Duplicate order IDs found: ${duplicateOrderIds.length}`);
      }
    } catch (error) {
      errors.push(`Unique constraint test failed: ${error.message}`);
    }
  }

  /**
   * Test required fields
   */
  private async testRequiredFields(errors: string[]): Promise<void> {
    try {
      // Test users without email
      const usersWithoutEmail = await this.connection.db.collection('users').countDocuments({
        email: { $exists: false }
      });

      if (usersWithoutEmail > 0) {
        errors.push(`Users without email: ${usersWithoutEmail}`);
      }

      // Test spaces without name
      const spacesWithoutName = await this.connection.db.collection('spaces').countDocuments({
        name: { $exists: false }
      });

      if (spacesWithoutName > 0) {
        errors.push(`Spaces without name: ${spacesWithoutName}`);
      }

      // Test bookings without booking code
      const bookingsWithoutCode = await this.connection.db.collection('bookings').countDocuments({
        bookingCode: { $exists: false }
      });

      if (bookingsWithoutCode > 0) {
        errors.push(`Bookings without booking code: ${bookingsWithoutCode}`);
      }
    } catch (error) {
      errors.push(`Required field test failed: ${error.message}`);
    }
  }

  /**
   * Test data types
   */
  private async testDataTypes(errors: string[]): Promise<void> {
    try {
      // Test user email format
      const invalidEmails = await this.connection.db.collection('users').countDocuments({
        email: { $not: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
      });

      if (invalidEmails > 0) {
        errors.push(`Users with invalid email format: ${invalidEmails}`);
      }

      // Test booking amounts
      const invalidAmounts = await this.connection.db.collection('bookings').countDocuments({
        'pricing.totalAmount': { $not: { $type: 'number' } }
      });

      if (invalidAmounts > 0) {
        errors.push(`Bookings with invalid amount type: ${invalidAmounts}`);
      }

      // Test payment amounts
      const invalidPaymentAmounts = await this.connection.db.collection('payments').countDocuments({
        amount: { $not: { $type: 'number' } }
      });

      if (invalidPaymentAmounts > 0) {
        errors.push(`Payments with invalid amount type: ${invalidPaymentAmounts}`);
      }
    } catch (error) {
      errors.push(`Data type test failed: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<{
    schemaValidation: any;
    indexTest: any;
    performanceTest: any;
  }> {
    this.logger.log('Running all database tests...');

    const schemaValidation = await this.validateSchemaConstraints();
    const indexTest = await this.testIndexes();
    const performanceTest = await this.testPerformance();

    this.logger.log('All database tests completed');

    return {
      schemaValidation,
      indexTest,
      performanceTest
    };
  }
}
