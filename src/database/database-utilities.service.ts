import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, PipelineStage } from 'mongoose';

export interface AggregationOptions {
  match?: Record<string, any>;
  project?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  group?: Record<string, any>;
  lookup?: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
  }[];
  unwind?: string[];
  facet?: Record<string, PipelineStage[]>;
}

@Injectable()
export class DatabaseUtilitiesService {
  private readonly logger = new Logger(DatabaseUtilitiesService.name);

  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Execute a complex aggregation pipeline with built-in error handling and logging
   */
  async executeAggregation<T>(
    model: Model<any>,
    pipeline: PipelineStage[],
    options?: {
      allowDiskUse?: boolean;
      maxTimeMS?: number;
      hint?: Record<string, any>;
    }
  ): Promise<T[]> {
    try {
      const startTime = Date.now();
      
      const result = await model.aggregate<T>(pipeline, {
        allowDiskUse: options?.allowDiskUse ?? true,
        maxTimeMS: options?.maxTimeMS ?? 30000,
        hint: options?.hint
      });

      const duration = Date.now() - startTime;
      this.logger.debug(`Aggregation completed in ${duration}ms`);

      return result;
    } catch (error) {
      this.logger.error(`Aggregation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Build aggregation pipeline from options
   */
  buildAggregationPipeline(options: AggregationOptions): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Match stage
    if (options.match && Object.keys(options.match).length > 0) {
      pipeline.push({ $match: options.match });
    }

    // Lookup stages
    if (options.lookup) {
      options.lookup.forEach(lookup => {
        pipeline.push({
          $lookup: {
            from: lookup.from,
            localField: lookup.localField,
            foreignField: lookup.foreignField,
            as: lookup.as
          }
        });
      });
    }

    // Unwind stages
    if (options.unwind) {
      options.unwind.forEach(field => {
        pipeline.push({
          $unwind: {
            path: field.startsWith('$') ? field : `$${field}`,
            preserveNullAndEmptyArrays: true
          }
        });
      });
    }

    // Project stage
    if (options.project && Object.keys(options.project).length > 0) {
      pipeline.push({ $project: options.project });
    }

    // Group stage
    if (options.group && Object.keys(options.group).length > 0) {
      pipeline.push({ $group: options.group });
    }

    // Sort stage
    if (options.sort && Object.keys(options.sort).length > 0) {
      pipeline.push({ $sort: options.sort });
    }

    // Skip stage
    if (options.skip && options.skip > 0) {
      pipeline.push({ $skip: options.skip });
    }

    // Limit stage
    if (options.limit && options.limit > 0) {
      pipeline.push({ $limit: options.limit });
    }

    // Facet stage (for complex multi-stage aggregations)
    if (options.facet) {
      pipeline.push({ $facet: options.facet });
    }

    return pipeline;
  }

  /**
   * Execute paginated aggregation with count
   */
  async executeAggregationWithPagination<T>(
    model: Model<any>,
    basePipeline: PipelineStage[],
    page: number = 1,
    limit: number = 10,
    countPipeline?: PipelineStage[]
  ): Promise<{
    data: T[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const skip = (page - 1) * limit;

    // Create faceted aggregation for data and count
    const facetPipeline: PipelineStage[] = [
      ...basePipeline,
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          count: countPipeline || [
            { $count: 'total' }
          ]
        }
      }
    ];

    const [result] = await this.executeAggregation(model, facetPipeline);
    
    const data = result.data || [];
    const totalCount = result.count?.[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }

  /**
   * Create search aggregation pipeline with text search and filters
   */
  createSearchPipeline(
    searchQuery?: string,
    filters?: Record<string, any>,
    textFields?: string[]
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Text search stage
    if (searchQuery && searchQuery.trim()) {
      if (textFields && textFields.length > 0) {
        // Custom text search using regex on specific fields
        const searchRegex = new RegExp(searchQuery, 'i');
        const textSearchConditions = textFields.map(field => ({
          [field]: { $regex: searchRegex }
        }));
        
        pipeline.push({
          $match: {
            $or: textSearchConditions
          }
        });
      } else {
        // MongoDB text search (requires text index)
        pipeline.push({
          $match: {
            $text: {
              $search: searchQuery,
              $caseSensitive: false,
              $diacriticSensitive: false
            }
          }
        });
        
        // Add text score for relevance sorting
        pipeline.push({
          $addFields: {
            textScore: { $meta: 'textScore' }
          }
        });
      }
    }

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      const matchConditions: Record<string, any> = {};
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            matchConditions[key] = { $in: value };
          } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            matchConditions[key] = { $gte: value.min, $lte: value.max };
          } else {
            matchConditions[key] = value;
          }
        }
      });

      if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
      }
    }

    return pipeline;
  }

  /**
   * Create geo-spatial search pipeline
   */
  createGeoSearchPipeline(
    coordinates: [number, number], // [longitude, latitude]
    maxDistanceMeters: number,
    coordinateField: string = 'location.coordinates'
  ): PipelineStage[] {
    return [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates
          },
          distanceField: 'distance',
          distanceMultiplier: 1,
          maxDistance: maxDistanceMeters,
          spherical: true,
          key: coordinateField
        }
      }
    ];
  }

  /**
   * Create date range aggregation pipeline
   */
  createDateRangeAggregation(
    dateField: string,
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' | 'year' = 'day'
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Date range filter
    if (startDate || endDate) {
      const dateMatch: Record<string, any> = {};
      if (startDate) dateMatch.$gte = startDate;
      if (endDate) dateMatch.$lte = endDate;
      
      pipeline.push({
        $match: {
          [dateField]: dateMatch
        }
      });
    }

    // Group by date period
    const groupByFormats = {
      day: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
      week: { $dateToString: { format: '%Y-W%U', date: `$${dateField}` } },
      month: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } },
      year: { $dateToString: { format: '%Y', date: `$${dateField}` } }
    };

    pipeline.push({
      $group: {
        _id: groupByFormats[groupBy],
        count: { $sum: 1 },
        date: { $first: `$${dateField}` }
      }
    });

    pipeline.push({ $sort: { _id: 1 } });

    return pipeline;
  }

  /**
   * Execute bulk operations with error handling
   */
  async executeBulkWrite(
    model: Model<any>,
    operations: any[],
    options?: {
      ordered?: boolean;
      bypassDocumentValidation?: boolean;
    }
  ): Promise<any> {
    try {
      const result = await model.bulkWrite(operations, {
        ordered: options?.ordered ?? false,
        bypassDocumentValidation: options?.bypassDocumentValidation ?? false
      });

      this.logger.debug(`Bulk operation completed: ${result.modifiedCount} modified, ${result.insertedCount} inserted`);
      return result;
    } catch (error) {
      this.logger.error(`Bulk operation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create database indexes
   */
  async createIndexes(
    model: Model<any>,
    indexes: Array<{
      fields: Record<string, 1 | -1 | 'text' | '2dsphere'>;
      options?: Record<string, any>;
    }>
  ): Promise<void> {
    try {
      for (const index of indexes) {
        await model.createIndex(index.fields, index.options);
        this.logger.debug(`Index created: ${JSON.stringify(index.fields)}`);
      }
    } catch (error) {
      this.logger.error(`Index creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const db = this.connection.db;
      const stats = await db.stats();
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize,
        avgObjSize: stats.avgObjSize,
        objects: stats.objects
      };
    } catch (error) {
      this.logger.error(`Failed to get database stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionName: string): Promise<any> {
    try {
      const db = this.connection.db;
      const collection = db.collection(collectionName);
      const stats = await collection.stats();
      
      return {
        count: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize,
        storageSize: stats.storageSize,
        totalIndexSize: stats.totalIndexSize,
        indexSizes: stats.indexSizes
      };
    } catch (error) {
      this.logger.error(`Failed to get collection stats for ${collectionName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Explain query execution plan
   */
  async explainQuery(
    model: Model<any>,
    query: Record<string, any>,
    options?: Record<string, any>
  ): Promise<any> {
    try {
      const explanation = await model
        .find(query, null, options)
        .explain('executionStats');
      
      return {
        executionTimeMillis: explanation.executionStats.executionTimeMillis,
        totalDocsExamined: explanation.executionStats.totalDocsExamined,
        totalDocsReturned: explanation.executionStats.totalDocsReturned,
        indexesUsed: explanation.executionStats.executionStages
      };
    } catch (error) {
      this.logger.error(`Query explanation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const startTime = Date.now();
      
      // Simple ping to test connection
      await this.connection.db.admin().ping();
      
      const responseTime = Date.now() - startTime;
      const dbState = this.connection.readyState;
      const dbName = this.connection.db.databaseName;

      return {
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        details: {
          databaseName: dbName,
          connectionState: dbState,
          responseTimeMs: responseTime,
          host: this.connection.host,
          port: this.connection.port
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          connectionState: this.connection.readyState
        }
      };
    }
  }

  /**
   * Clean up expired documents
   */
  async cleanupExpiredDocuments(
    model: Model<any>,
    expirationField: string,
    batchSize: number = 1000
  ): Promise<{ deletedCount: number }> {
    try {
      let totalDeleted = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await model.deleteMany({
          [expirationField]: { $lt: new Date() }
        }).limit(batchSize);

        totalDeleted += result.deletedCount;
        hasMore = result.deletedCount === batchSize;

        if (hasMore) {
          // Small delay between batches to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.logger.debug(`Cleanup completed: ${totalDeleted} expired documents removed`);
      return { deletedCount: totalDeleted };
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Archive old documents to another collection
   */
  async archiveOldDocuments(
    sourceModel: Model<any>,
    archiveModel: Model<any>,
    archiveCondition: Record<string, any>,
    batchSize: number = 100
  ): Promise<{ archivedCount: number }> {
    try {
      let totalArchived = 0;
      let hasMore = true;

      while (hasMore) {
        const documents = await sourceModel
          .find(archiveCondition)
          .limit(batchSize)
          .lean();

        if (documents.length === 0) {
          hasMore = false;
          continue;
        }

        // Insert into archive collection
        await archiveModel.insertMany(documents);

        // Remove from source collection
        const ids = documents.map(doc => doc._id);
        await sourceModel.deleteMany({ _id: { $in: ids } });

        totalArchived += documents.length;
        hasMore = documents.length === batchSize;

        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.logger.debug(`Archive completed: ${totalArchived} documents archived`);
      return { archivedCount: totalArchived };
    } catch (error) {
      this.logger.error(`Archive failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Run database maintenance tasks
   */
  async runMaintenance(): Promise<void> {
    try {
      this.logger.log('Starting database maintenance...');

      // Get database stats before maintenance
      const statsBefore = await this.getDatabaseStats();

      // Run maintenance commands
      const db = this.connection.db;
      
      // Compact collections (MongoDB 4.4+)
      try {
        const collections = await db.listCollections().toArray();
        for (const collection of collections) {
          await db.command({ compact: collection.name });
        }
      } catch (error) {
        this.logger.warn(`Compact operation failed: ${error.message}`);
      }

      // Get stats after maintenance
      const statsAfter = await this.getDatabaseStats();

      this.logger.log('Database maintenance completed', {
        before: statsBefore,
        after: statsAfter
      });
    } catch (error) {
      this.logger.error(`Database maintenance failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}