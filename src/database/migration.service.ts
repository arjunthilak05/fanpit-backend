import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface Migration {
  version: string;
  name: string;
  up: (connection: Connection) => Promise<void>;
  down: (connection: Connection) => Promise<void>;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly migrations: Migration[] = [];

  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Register a migration
   */
  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      await this.ensureMigrationCollection();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const pendingMigrations = this.migrations.filter(
        migration => !appliedMigrations.includes(migration.version)
      );

      if (pendingMigrations.length === 0) {
        this.logger.log('No pending migrations found');
        return;
      }

      this.logger.log(`Running ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }

      this.logger.log('All migrations completed successfully');
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback the last migration
   */
  async rollbackLastMigration(): Promise<void> {
    try {
      await this.ensureMigrationCollection();
      
      const appliedMigrations = await this.getAppliedMigrations();
      if (appliedMigrations.length === 0) {
        this.logger.log('No migrations to rollback');
        return;
      }

      const lastMigrationVersion = appliedMigrations[appliedMigrations.length - 1];
      const migration = this.migrations.find(m => m.version === lastMigrationVersion);
      
      if (!migration) {
        throw new Error(`Migration ${lastMigrationVersion} not found`);
      }

      await this.rollbackMigration(migration);
      this.logger.log(`Rolled back migration ${migration.version}: ${migration.name}`);
    } catch (error) {
      this.logger.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    applied: string[];
    pending: string[];
    total: number;
  }> {
    await this.ensureMigrationCollection();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = this.migrations
      .filter(migration => !appliedMigrations.includes(migration.version))
      .map(migration => migration.version);

    return {
      applied: appliedMigrations,
      pending: pendingMigrations,
      total: this.migrations.length
    };
  }

  /**
   * Run a specific migration
   */
  private async runMigration(migration: Migration): Promise<void> {
    this.logger.log(`Running migration ${migration.version}: ${migration.name}`);
    
    try {
      await migration.up(this.connection);
      await this.recordMigration(migration.version, migration.name, 'up');
      this.logger.log(`Migration ${migration.version} completed successfully`);
    } catch (error) {
      this.logger.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback a specific migration
   */
  private async rollbackMigration(migration: Migration): Promise<void> {
    this.logger.log(`Rolling back migration ${migration.version}: ${migration.name}`);
    
    try {
      await migration.down(this.connection);
      await this.removeMigrationRecord(migration.version);
      this.logger.log(`Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      this.logger.error(`Rollback of migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Ensure migration collection exists
   */
  private async ensureMigrationCollection(): Promise<void> {
    const collection = this.connection.collection('migrations');
    
    // Create index on version field
    await collection.createIndex({ version: 1 }, { unique: true });
  }

  /**
   * Get list of applied migrations
   */
  private async getAppliedMigrations(): Promise<string[]> {
    const collection = this.connection.collection('migrations');
    const migrations = await collection.find({}, { projection: { version: 1 } }).toArray();
    return migrations.map(m => m.version).sort();
  }

  /**
   * Record a migration as applied
   */
  private async recordMigration(version: string, name: string, direction: string): Promise<void> {
    const collection = this.connection.collection('migrations');
    await collection.insertOne({
      version,
      name,
      direction,
      appliedAt: new Date()
    });
  }

  /**
   * Remove a migration record
   */
  private async removeMigrationRecord(version: string): Promise<void> {
    const collection = this.connection.collection('migrations');
    await collection.deleteOne({ version });
  }
}

// Pre-defined migrations
export const createInitialMigrations = (migrationService: MigrationService): void => {
  // Migration 1: Create initial indexes
  migrationService.registerMigration({
    version: '1.0.0',
    name: 'Create initial indexes',
    up: async (connection: Connection) => {
      const db = connection.db;
      
      // User indexes
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ role: 1, createdAt: -1 });
      await db.collection('users').createIndex({ status: 1, createdAt: -1 });
      await db.collection('users').createIndex({ 'address.city': 1 });
      await db.collection('users').createIndex({ lastActiveAt: -1 });
      
      // Space indexes
      await db.collection('spaces').createIndex({ 'location.coordinates': '2dsphere' });
      await db.collection('spaces').createIndex({ category: 1, isActive: 1, createdAt: -1 });
      await db.collection('spaces').createIndex({ ownerId: 1, isActive: 1 });
      await db.collection('spaces').createIndex({ 'pricing.basePrice': 1, category: 1 });
      await db.collection('spaces').createIndex({ averageRating: -1, reviewCount: -1 });
      await db.collection('spaces').createIndex({ totalBookings: -1 });
      
      // Booking indexes
      await db.collection('bookings').createIndex({ bookingCode: 1 }, { unique: true });
      await db.collection('bookings').createIndex({ customerId: 1, createdAt: -1 });
      await db.collection('bookings').createIndex({ spaceId: 1, bookingDate: 1, status: 1 });
      await db.collection('bookings').createIndex({ bookingDate: 1, status: 1 });
      await db.collection('bookings').createIndex({ status: 1, createdAt: -1 });
      
      // Payment indexes
      await db.collection('payments').createIndex({ orderId: 1 }, { unique: true });
      await db.collection('payments').createIndex({ paymentId: 1 });
      await db.collection('payments').createIndex({ bookingId: 1, status: 1 });
      await db.collection('payments').createIndex({ customerId: 1, createdAt: -1 });
      await db.collection('payments').createIndex({ status: 1, createdAt: -1 });
      
      // Staff Activity indexes
      await db.collection('staff_activities').createIndex({ staffId: 1, timestamp: -1 });
      await db.collection('staff_activities').createIndex({ bookingId: 1, action: 1 });
      await db.collection('staff_activities').createIndex({ spaceId: 1, timestamp: -1 });
      await db.collection('staff_activities').createIndex({ 'details.bookingCode': 1 });
      await db.collection('staff_activities').createIndex({ timestamp: -1 });
      
      // Issue indexes
      await db.collection('issues').createIndex({ reportedBy: 1, createdAt: -1 });
      await db.collection('issues').createIndex({ spaceId: 1, status: 1 });
      await db.collection('issues').createIndex({ type: 1, severity: 1 });
      await db.collection('issues').createIndex({ assignedTo: 1, status: 1 });
      await db.collection('issues').createIndex({ ticketNumber: 1 }, { unique: true, sparse: true });
      await db.collection('issues').createIndex({ status: 1, createdAt: -1 });
      await db.collection('issues').createIndex({ dueDate: 1, status: 1 });
      await db.collection('issues').createIndex({ escalationLevel: 1, status: 1 });
      
      // Analytics indexes
      await db.collection('analytics').createIndex({ type: 1, period: 1 });
      await db.collection('analytics').createIndex({ metricType: 1, date: -1 });
      await db.collection('analytics').createIndex({ spaceId: 1, type: 1, date: -1 });
      await db.collection('analytics').createIndex({ userId: 1, type: 1, date: -1 });
      await db.collection('analytics').createIndex({ category: 1, type: 1, date: -1 });
      await db.collection('analytics').createIndex({ location: 1, type: 1, date: -1 });
      await db.collection('analytics').createIndex({ date: -1, type: 1 });
      await db.collection('analytics').createIndex({ calculatedAt: -1 });
    },
    down: async (connection: Connection) => {
      const db = connection.db;
      
      // Drop all indexes (this is a destructive operation)
      const collections = ['users', 'spaces', 'bookings', 'payments', 'staff_activities', 'issues', 'analytics'];
      
      for (const collectionName of collections) {
        try {
          await db.collection(collectionName).dropIndexes();
        } catch (error) {
          // Ignore errors for non-existent indexes
        }
      }
    }
  });

  // Migration 2: Add soft delete support
  migrationService.registerMigration({
    version: '1.1.0',
    name: 'Add soft delete support',
    up: async (connection: Connection) => {
      const db = connection.db;
      
      // Add isDeleted and deletedAt fields to relevant collections
      const collections = ['users', 'spaces', 'bookings'];
      
      for (const collectionName of collections) {
        await db.collection(collectionName).updateMany(
          { isDeleted: { $exists: false } },
          { $set: { isDeleted: false } }
        );
        
        await db.collection(collectionName).createIndex({ isDeleted: 1 });
      }
    },
    down: async (connection: Connection) => {
      const db = connection.db;
      
      const collections = ['users', 'spaces', 'bookings'];
      
      for (const collectionName of collections) {
        await db.collection(collectionName).updateMany(
          {},
          { $unset: { isDeleted: 1, deletedAt: 1 } }
        );
        
        try {
          await db.collection(collectionName).dropIndex({ isDeleted: 1 });
        } catch (error) {
          // Ignore errors for non-existent indexes
        }
      }
    }
  });

  // Migration 3: Add full-text search indexes
  migrationService.registerMigration({
    version: '1.2.0',
    name: 'Add full-text search indexes',
    up: async (connection: Connection) => {
      const db = connection.db;
      
      // Add text indexes for search functionality
      await db.collection('spaces').createIndex({
        name: 'text',
        description: 'text',
        'location.address': 'text',
        'location.city': 'text',
        amenities: 'text'
      });
      
      await db.collection('users').createIndex({
        name: 'text',
        email: 'text',
        'address.city': 'text'
      });
    },
    down: async (connection: Connection) => {
      const db = connection.db;
      
      try {
        await db.collection('spaces').dropIndex('name_text_description_text_location.address_text_location.city_text_amenities_text');
        await db.collection('users').dropIndex('name_text_email_text_address.city_text');
      } catch (error) {
        // Ignore errors for non-existent indexes
      }
    }
  });

  // Migration 4: Add audit trail support
  migrationService.registerMigration({
    version: '1.3.0',
    name: 'Add audit trail support',
    up: async (connection: Connection) => {
      const db = connection.db;
      
      // Create audit collection
      await db.createCollection('audit_logs');
      await db.collection('audit_logs').createIndex({ entityType: 1, entityId: 1, createdAt: -1 });
      await db.collection('audit_logs').createIndex({ userId: 1, createdAt: -1 });
      await db.collection('audit_logs').createIndex({ action: 1, createdAt: -1 });
    },
    down: async (connection: Connection) => {
      const db = connection.db;
      
      try {
        await db.collection('audit_logs').drop();
      } catch (error) {
        // Ignore errors if collection doesn't exist
      }
    }
  });

  // Migration 5: Add performance monitoring indexes
  migrationService.registerMigration({
    version: '1.4.0',
    name: 'Add performance monitoring indexes',
    up: async (connection: Connection) => {
      const db = connection.db;
      
      // Add compound indexes for better query performance
      await db.collection('bookings').createIndex({ 
        spaceId: 1, 
        bookingDate: 1, 
        status: 1, 
        startTime: 1 
      });
      
      await db.collection('payments').createIndex({ 
        status: 1, 
        createdAt: -1, 
        amount: 1 
      });
      
      await db.collection('analytics').createIndex({ 
        type: 1, 
        metricType: 1, 
        date: -1, 
        isComplete: 1 
      });
      
      // Add partial indexes for better performance
      await db.collection('users').createIndex(
        { email: 1 },
        { 
          partialFilterExpression: { isDeleted: false },
          unique: true 
        }
      );
      
      await db.collection('spaces').createIndex(
        { 'location.coordinates': '2dsphere' },
        { 
          partialFilterExpression: { isActive: true } 
        }
      );
    },
    down: async (connection: Connection) => {
      const db = connection.db;
      
      try {
        await db.collection('bookings').dropIndex('spaceId_1_bookingDate_1_status_1_startTime_1');
        await db.collection('payments').dropIndex('status_1_createdAt_-1_amount_1');
        await db.collection('analytics').dropIndex('type_1_metricType_1_date_-1_isComplete_1');
        await db.collection('users').dropIndex('email_1');
        await db.collection('spaces').dropIndex('location.coordinates_2dsphere');
      } catch (error) {
        // Ignore errors for non-existent indexes
      }
    }
  });
};
