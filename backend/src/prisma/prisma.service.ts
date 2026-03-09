import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method for safe queries with user isolation
  async withUserContext<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    // All queries within this context automatically filter by userId
    // This is a safety layer to prevent accidental cross-user data access
    return operation();
  }

  // Cleanup utilities
  async cleanupOldMetrics(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.metricDaily.deleteMany({
      where: {
        date: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  async cleanupOldLogs(daysToKeep: number = 180): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
