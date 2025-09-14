import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectConnection() private connection: Connection) {}

  async onModuleInit() {
    this.connection.on('connected', () => {
      this.logger.log('✅ MongoDB connected successfully');
    });

    this.connection.on('error', (error) => {
      this.logger.error('❌ MongoDB connection error:', error);
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('⚠️ MongoDB disconnected');
    });
  }

  getConnection(): Connection {
    return this.connection;
  }

  async checkConnection(): Promise<boolean> {
    try {
      return this.connection.readyState === 1;
    } catch (error) {
      this.logger.error('Database connection check failed:', error);
      return false;
    }
  }
}