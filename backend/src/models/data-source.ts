import { PrismaClient, DataSource, DataSourceType, CollectionFrequency } from '@prisma/client';

export class DataSourceModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    name: string;
    type: DataSourceType;
    connectionConfig: any;
    collectionFrequency: CollectionFrequency;
  }): Promise<DataSource> {
    // Validate connection config for API and database types
    if (!this.validateConnectionConfig(data.type, data.connectionConfig)) {
      throw new Error(`Invalid connection configuration for ${data.type} data source`);
    }

    return this.prisma.dataSource.create({
      data: {
        ...data,
        isActive: true,
        retryCount: 0
      }
    });
  }

  async updateLastFetch(id: string, success: boolean, errorMessage?: string): Promise<DataSource> {
    const updateData: any = {
      lastSuccessfulFetch: success ? new Date() : undefined,
      errorMessage: success ? null : errorMessage,
      retryCount: success ? 0 : { increment: 1 }
    };

    return this.prisma.dataSource.update({
      where: { id },
      data: updateData
    });
  }

  async getActiveDataSources(): Promise<DataSource[]> {
    return this.prisma.dataSource.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string): Promise<DataSource | null> {
    return this.prisma.dataSource.findUnique({
      where: { id },
      include: {
        metrics: {
          select: {
            id: true,
            name: true,
            lastCalculatedAt: true
          }
        }
      }
    });
  }

  async getIntegrationStatus(): Promise<Array<DataSource & {
    status: 'active' | 'error' | 'inactive';
    next_retry?: Date;
  }>> {
    const dataSources = await this.prisma.dataSource.findMany({
      orderBy: { name: 'asc' }
    });

    return dataSources.map(source => {
      let status: 'active' | 'error' | 'inactive' = 'inactive';

      if (!source.isActive) {
        status = 'inactive';
      } else if (source.errorMessage && source.retryCount > 0) {
        status = 'error';
      } else {
        status = 'active';
      }

      const result: DataSource & {
        status: 'active' | 'error' | 'inactive';
        next_retry?: Date;
      } = {
        ...source,
        status
      };

      // Calculate next retry time for failed sources
      if (status === 'error' && source.retryCount < 5) {
        const nextRetry = new Date();
        nextRetry.setMinutes(nextRetry.getMinutes() + (source.retryCount * 15)); // Exponential backoff
        result.next_retry = nextRetry;
      }

      return result;
    });
  }

  validateConnectionConfig(type: DataSourceType, config: any): boolean {
    if (type === 'api' || type === 'database') {
      return config && typeof config === 'object' && Object.keys(config).length > 0;
    }
    return true; // Manual and calculated sources don't need connection config
  }

  async markAsError(id: string, errorMessage: string): Promise<DataSource> {
    return this.updateLastFetch(id, false, errorMessage);
  }

  async markAsSuccess(id: string): Promise<DataSource> {
    return this.updateLastFetch(id, true);
  }
}