import { Logger } from '@nestjs/common';
import { 
  Model, 
  Document, 
  FilterQuery, 
  UpdateQuery, 
  QueryOptions, 
  PipelineStage,
  Types,
  AggregatePaginateModel,
  AggregatePaginateResult
} from 'mongoose';

export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  populate?: string | string[];
}

export interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
  pagingCounter: number;
}

export abstract class BaseRepository<T extends BaseDocument> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly model: Model<T>,
    protected readonly populateOnFind: string[] = []
  ) {}

  /**
   * Create a new document
   */
  async create(createDto: Partial<T>): Promise<T> {
    try {
      const created = new this.model(createDto);
      const saved = await created.save();
      
      if (this.populateOnFind.length > 0) {
        return await this.model
          .findById(saved._id)
          .populate(this.populateOnFind.join(' '))
          .lean(false) as T;
      }
      
      return saved;
    } catch (error) {
      this.logger.error(`Create failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create multiple documents
   */
  async createMany(createDtos: Partial<T>[]): Promise<T[]> {
    try {
      const created = await this.model.insertMany(createDtos);
      
      if (this.populateOnFind.length > 0) {
        const ids = created.map(doc => doc._id);
        return await this.model
          .find({ _id: { $in: ids } })
          .populate(this.populateOnFind.join(' '))
          .lean(false) as T[];
      }
      
      return created as T[];
    } catch (error) {
      this.logger.error(`Create many failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find document by ID
   */
  async findById(
    id: string | Types.ObjectId, 
    options: {
      populate?: string | string[];
      select?: string;
      lean?: boolean;
    } = {}
  ): Promise<T | null> {
    try {
      let query = this.model.findById(id);

      // Handle soft delete by default
      if (this.model.schema.paths.isDeleted) {
        query = query.where({ isDeleted: { $ne: true } });
      }

      if (options.populate) {
        const populateFields = Array.isArray(options.populate) 
          ? options.populate 
          : [options.populate];
        query = query.populate(populateFields.join(' '));
      } else if (this.populateOnFind.length > 0) {
        query = query.populate(this.populateOnFind.join(' '));
      }

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.lean !== false) {
        query = query.lean();
      }

      return await query.exec();
    } catch (error) {
      this.logger.error(`Find by ID failed for ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find one document by filter
   */
  async findOne(
    filter: FilterQuery<T>,
    options: {
      populate?: string | string[];
      select?: string;
      sort?: any;
      lean?: boolean;
    } = {}
  ): Promise<T | null> {
    try {
      // Add soft delete filter by default
      if (this.model.schema.paths.isDeleted) {
        filter = { ...filter, isDeleted: { $ne: true } };
      }

      let query = this.model.findOne(filter);

      if (options.populate) {
        const populateFields = Array.isArray(options.populate) 
          ? options.populate 
          : [options.populate];
        query = query.populate(populateFields.join(' '));
      } else if (this.populateOnFind.length > 0) {
        query = query.populate(this.populateOnFind.join(' '));
      }

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.sort) {
        query = query.sort(options.sort);
      }

      if (options.lean !== false) {
        query = query.lean();
      }

      return await query.exec();
    } catch (error) {
      this.logger.error(`Find one failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find multiple documents
   */
  async find(
    filter: FilterQuery<T> = {},
    options: {
      populate?: string | string[];
      select?: string;
      sort?: any;
      limit?: number;
      skip?: number;
      lean?: boolean;
    } = {}
  ): Promise<T[]> {
    try {
      // Add soft delete filter by default
      if (this.model.schema.paths.isDeleted) {
        filter = { ...filter, isDeleted: { $ne: true } };
      }

      let query = this.model.find(filter);

      if (options.populate) {
        const populateFields = Array.isArray(options.populate) 
          ? options.populate 
          : [options.populate];
        query = query.populate(populateFields.join(' '));
      } else if (this.populateOnFind.length > 0) {
        query = query.populate(this.populateOnFind.join(' '));
      }

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.sort) {
        query = query.sort(options.sort);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.skip) {
        query = query.skip(options.skip);
      }

      if (options.lean !== false) {
        query = query.lean();
      }

      return await query.exec();
    } catch (error) {
      this.logger.error(`Find failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find with pagination
   */
  async findWithPagination(
    filter: FilterQuery<T> = {},
    paginationOptions: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        populate
      } = paginationOptions;

      // Add soft delete filter by default
      if (this.model.schema.paths.isDeleted) {
        filter = { ...filter, isDeleted: { $ne: true } };
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Execute count and find queries in parallel
      const [totalDocs, docs] = await Promise.all([
        this.model.countDocuments(filter),
        this.find(filter, {
          sort,
          limit,
          skip,
          populate: populate || this.populateOnFind,
          lean: true
        })
      ]);

      const totalPages = Math.ceil(totalDocs / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        docs,
        totalDocs,
        limit,
        page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : undefined,
        prevPage: hasPrevPage ? page - 1 : undefined,
        pagingCounter: skip + 1
      };
    } catch (error) {
      this.logger.error(`Find with pagination failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update document by ID
   */
  async updateById(
    id: string | Types.ObjectId,
    updateDto: UpdateQuery<T>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    try {
      const updated = await this.model.findByIdAndUpdate(
        id,
        updateDto,
        {
          new: true,
          runValidators: true,
          ...options
        }
      );

      if (!updated) {
        return null;
      }

      if (this.populateOnFind.length > 0) {
        return await this.model
          .findById(updated._id)
          .populate(this.populateOnFind.join(' '))
          .lean(false) as T;
      }

      return updated;
    } catch (error) {
      this.logger.error(`Update by ID failed for ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update one document by filter
   */
  async updateOne(
    filter: FilterQuery<T>,
    updateDto: UpdateQuery<T>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    try {
      // Add soft delete filter by default
      if (this.model.schema.paths.isDeleted) {
        filter = { ...filter, isDeleted: { $ne: true } };
      }

      const updated = await this.model.findOneAndUpdate(
        filter,
        updateDto,
        {
          new: true,
          runValidators: true,
          ...options
        }
      );

      if (!updated) {
        return null;
      }

      if (this.populateOnFind.length > 0) {
        return await this.model
          .findById(updated._id)
          .populate(this.populateOnFind.join(' '))
          .lean(false) as T;
      }

      return updated;
    } catch (error) {
      this.logger.error(`Update one failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update many documents
   */
  async updateMany(
    filter: FilterQuery<T>,
    updateDto: UpdateQuery<T>,
    options: QueryOptions = {}
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    try {
      // Add soft delete filter by default
      if (this.model.schema.paths.isDeleted) {
        filter = { ...filter, isDeleted: { $ne: true } };
      }

      const result = await this.model.updateMany(filter, updateDto, {
        runValidators: true,
        ...options
      });

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      this.logger.error(`Update many failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Soft delete document by ID
   */
  async softDeleteById(
    id: string | Types.ObjectId,
    deletedBy?: string
  ): Promise<T | null> {
    try {
      if (!this.model.schema.paths.isDeleted) {
        throw new Error('Soft delete not supported on this model');
      }

      const updateData: any = {
        isDeleted: true,
        deletedAt: new Date()
      };

      if (deletedBy) {
        updateData.deletedBy = deletedBy;
      }

      return await this.updateById(id, updateData);
    } catch (error) {
      this.logger.error(`Soft delete by ID failed for ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Hard delete document by ID
   */
  async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      this.logger.error(`Delete by ID failed for ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete many documents
   */
  async deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    try {
      const result = await this.model.deleteMany(filter);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this.logger.error(`Delete many failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      // Add soft delete filter by default
      if (this.model.schema.paths.isDeleted) {
        filter = { ...filter, isDeleted: { $ne: true } };
      }

      return await this.model.countDocuments(filter);
    } catch (error) {
      this.logger.error(`Count failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      // Add soft delete filter by default
      if (this.model.schema.paths.isDeleted) {
        filter = { ...filter, isDeleted: { $ne: true } };
      }

      const count = await this.model.countDocuments(filter).limit(1);
      return count > 0;
    } catch (error) {
      this.logger.error(`Exists check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Execute aggregation pipeline
   */
  async aggregate<R = any>(
    pipeline: PipelineStage[],
    options?: {
      allowDiskUse?: boolean;
      maxTimeMS?: number;
    }
  ): Promise<R[]> {
    try {
      const result = await this.model.aggregate<R>(pipeline, {
        allowDiskUse: options?.allowDiskUse ?? true,
        maxTimeMS: options?.maxTimeMS ?? 30000
      });

      return result;
    } catch (error) {
      this.logger.error(`Aggregation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Execute aggregation with pagination
   */
  async aggregateWithPagination<R = any>(
    pipeline: PipelineStage[],
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: R[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Create faceted aggregation for data and count
      const facetPipeline: PipelineStage[] = [
        ...pipeline,
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit }
            ],
            count: [
              { $count: 'total' }
            ]
          }
        }
      ];

      const [result] = await this.aggregate<{
        data: R[];
        count: Array<{ total: number }>;
      }>(facetPipeline);

      const data = result?.data || [];
      const totalCount = result?.count?.[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };
    } catch (error) {
      this.logger.error(`Paginated aggregation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk write operations
   */
  async bulkWrite(operations: any[]): Promise<any> {
    try {
      return await this.model.bulkWrite(operations);
    } catch (error) {
      this.logger.error(`Bulk write failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find distinct values
   */
  async distinct(field: string, filter: FilterQuery<T> = {}): Promise<any[]> {
    try {
      // Add soft delete filter by default
      if (this.model.schema.paths.isDeleted) {
        filter = { ...filter, isDeleted: { $ne: true } };
      }

      return await this.model.distinct(field, filter);
    } catch (error) {
      this.logger.error(`Distinct failed for field ${field}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Watch for changes (MongoDB Change Streams)
   */
  watch(pipeline?: PipelineStage[], options?: any) {
    try {
      return this.model.watch(pipeline, options);
    } catch (error) {
      this.logger.error(`Watch failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Start a transaction session
   */
  async startSession() {
    return await this.model.db.startSession();
  }

  /**
   * Execute operations within a transaction
   */
  async withTransaction<R>(
    operations: (session: any) => Promise<R>
  ): Promise<R> {
    const session = await this.startSession();
    
    try {
      return await session.withTransaction(async () => {
        return await operations(session);
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Create search pipeline with text search
   */
  protected createSearchPipeline(
    searchQuery?: string,
    filters?: Record<string, any>
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [];

    // Add soft delete filter
    if (this.model.schema.paths.isDeleted) {
      pipeline.push({
        $match: { isDeleted: { $ne: true } }
      });
    }

    // Text search
    if (searchQuery && searchQuery.trim()) {
      pipeline.push({
        $match: {
          $text: {
            $search: searchQuery,
            $caseSensitive: false
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

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      const matchConditions: Record<string, any> = {};
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            matchConditions[key] = { $in: value };
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
   * Get model name
   */
  getModelName(): string {
    return this.model.modelName;
  }

  /**
   * Get model instance (for advanced operations)
   */
  getModel(): Model<T> {
    return this.model;
  }
}