import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface SystemMetrics {
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
}

export interface ApplicationMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  database: {
    connections: number;
    activeConnections: number;
    queryCount: number;
    averageQueryTime: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    size: number;
  };
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      responseTimes: number[];
    };
    database: {
      connections: number;
      activeConnections: number;
      queryCount: number;
      queryTimes: number[];
    };
    cache: {
      hits: number;
      misses: number;
      size: number;
    };
  };

  constructor(private configService: ConfigService) {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        responseTimes: [],
      },
      database: {
        connections: 0,
        activeConnections: 0,
        queryCount: 0,
        queryTimes: [],
      },
      cache: {
        hits: 0,
        misses: 0,
        size: 0,
      },
    };

    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  /**
   * Record request metrics
   */
  recordRequest(success: boolean, responseTime: number): void {
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Keep only last 1000 response times for memory efficiency
    this.metrics.requests.responseTimes.push(responseTime);
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes.shift();
    }
  }

  /**
   * Record database metrics
   */
  recordDatabaseQuery(queryTime: number): void {
    this.metrics.database.queryCount++;
    this.metrics.database.queryTimes.push(queryTime);

    // Keep only last 1000 query times
    if (this.metrics.database.queryTimes.length > 1000) {
      this.metrics.database.queryTimes.shift();
    }
  }

  /**
   * Record cache metrics
   */
  recordCacheHit(): void {
    this.metrics.cache.hits++;
  }

  recordCacheMiss(): void {
    this.metrics.cache.misses++;
  }

  updateCacheSize(size: number): void {
    this.metrics.cache.size = size;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      uptime: os.uptime(),
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercentage: (usedMemory / totalMemory) * 100,
      },
      cpu: {
        usage: this.getCpuUsage(),
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      disk: this.getDiskUsage(),
    };
  }

  /**
   * Get application metrics
   */
  getApplicationMetrics(): ApplicationMetrics {
    const requestMetrics = this.metrics.requests;
    const dbMetrics = this.metrics.database;
    const cacheMetrics = this.metrics.cache;

    // Calculate averages
    const avgResponseTime = requestMetrics.responseTimes.length > 0
      ? requestMetrics.responseTimes.reduce((a, b) => a + b, 0) / requestMetrics.responseTimes.length
      : 0;

    const avgQueryTime = dbMetrics.queryTimes.length > 0
      ? dbMetrics.queryTimes.reduce((a, b) => a + b, 0) / dbMetrics.queryTimes.length
      : 0;

    const totalCacheRequests = cacheMetrics.hits + cacheMetrics.misses;
    const cacheHitRate = totalCacheRequests > 0 ? (cacheMetrics.hits / totalCacheRequests) * 100 : 0;

    return {
      requests: {
        total: requestMetrics.total,
        successful: requestMetrics.successful,
        failed: requestMetrics.failed,
        averageResponseTime: avgResponseTime,
      },
      database: {
        connections: dbMetrics.connections,
        activeConnections: dbMetrics.activeConnections,
        queryCount: dbMetrics.queryCount,
        averageQueryTime: avgQueryTime,
      },
      cache: {
        hitRate: cacheHitRate,
        missRate: 100 - cacheHitRate,
        size: cacheMetrics.size,
      },
    };
  }

  /**
   * Get CPU usage percentage
   */
  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - ~~(100 * totalIdle / totalTick);
  }

  /**
   * Get disk usage
   */
  private getDiskUsage(): { total: number; free: number; used: number; usagePercentage: number } {
    try {
      // For Linux systems
      const fs = require('fs').promises;
      const { execSync } = require('child_process');

      const output = execSync('df -BG / | tail -1', { encoding: 'utf8' });
      const parts = output.trim().split(/\s+/);

      const total = parseInt(parts[1]) * 1024 * 1024 * 1024; // Convert GB to bytes
      const used = parseInt(parts[2]) * 1024 * 1024 * 1024;
      const free = parseInt(parts[3]) * 1024 * 1024 * 1024;

      return {
        total,
        free,
        used,
        usagePercentage: (used / total) * 100,
      };
    } catch (error) {
      this.logger.error('Failed to get disk usage:', error);
      return {
        total: 0,
        free: 0,
        used: 0,
        usagePercentage: 0,
      };
    }
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      const systemMetrics = this.getSystemMetrics();

      // Log warnings for high resource usage
      if (systemMetrics.memory.usagePercentage > 90) {
        this.logger.warn(`High memory usage: ${systemMetrics.memory.usagePercentage.toFixed(1)}%`);
      }

      if (systemMetrics.cpu.usage > 90) {
        this.logger.warn(`High CPU usage: ${systemMetrics.cpu.usage.toFixed(1)}%`);
      }

      if (systemMetrics.disk.usagePercentage > 90) {
        this.logger.warn(`High disk usage: ${systemMetrics.disk.usagePercentage.toFixed(1)}%`);
      }

      // Log metrics every 5 minutes
      const fiveMinutes = 5 * 60 * 1000;
      setInterval(() => {
        const appMetrics = this.getApplicationMetrics();
        this.logger.log(`Application Metrics: ${JSON.stringify(appMetrics)}`);
      }, fiveMinutes);

    }, 30000); // Every 30 seconds
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): string {
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getApplicationMetrics();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      application: appMetrics,
    }, null, 2);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    memory: any;
    database: boolean;
  }> {
    try {
      // Basic health checks
      const memoryUsage = process.memoryUsage();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        database: true, // TODO: Implement actual database health check
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: {},
        database: false,
      };
    }
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(route: string, method: string, responseTime: number, statusCode: number): void {
    const level = statusCode >= 400 ? 'error' : 'info';

    this.logger.log(
      `Performance: ${method} ${route} - ${responseTime}ms - ${statusCode}`,
      {
        route,
        method,
        responseTime,
        statusCode,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
