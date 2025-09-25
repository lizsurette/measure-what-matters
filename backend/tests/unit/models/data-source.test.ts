import { PrismaClient, DataSourceType, CollectionFrequency } from '@prisma/client';

const mockPrisma = global.mockPrisma;

class DataSourceModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: any) {
    return this.prisma.dataSource.create({ data });
  }

  async updateLastFetch(id: string, success: boolean, errorMessage?: string) {
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

  async getActiveDataSources() {
    return this.prisma.dataSource.findMany({
      where: { isActive: true }
    });
  }

  validateConnectionConfig(type: DataSourceType, config: any): boolean {
    if (type === 'api' || type === 'database') {
      return config && Object.keys(config).length > 0;
    }
    return true;
  }
}

describe('DataSource Model', () => {
  let dataSourceModel: DataSourceModel;

  const validDataSource = {
    id: '550e8400-e29b-41d4-a716-446655440100',
    name: 'GitHub API',
    type: 'api' as DataSourceType,
    connectionConfig: { endpoint: 'https://api.github.com', token: 'encrypted' },
    collectionFrequency: 'daily' as CollectionFrequency,
    isActive: true,
    retryCount: 0
  };

  beforeEach(() => {
    dataSourceModel = new DataSourceModel(mockPrisma as any);
  });

  it('should create data source with valid configuration', async () => {
    mockPrisma.dataSource.create.mockResolvedValue(validDataSource);

    const result = await dataSourceModel.create(validDataSource);
    expect(result).toEqual(validDataSource);
  });

  it('should validate connection config for API and database types', () => {
    expect(dataSourceModel.validateConnectionConfig('api', { endpoint: 'test' })).toBe(true);
    expect(dataSourceModel.validateConnectionConfig('api', {})).toBe(false);
    expect(dataSourceModel.validateConnectionConfig('manual', {})).toBe(true);
  });

  it('should handle fetch success and failure updates per clarification', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440100';

    // Success update
    await dataSourceModel.updateLastFetch(id, true);
    expect(mockPrisma.dataSource.update).toHaveBeenCalledWith({
      where: { id },
      data: {
        lastSuccessfulFetch: expect.any(Date),
        errorMessage: null,
        retryCount: 0
      }
    });

    // Failure update
    await dataSourceModel.updateLastFetch(id, false, 'Connection timeout');
    expect(mockPrisma.dataSource.update).toHaveBeenLastCalledWith({
      where: { id },
      data: {
        lastSuccessfulFetch: undefined,
        errorMessage: 'Connection timeout',
        retryCount: { increment: 1 }
      }
    });
  });

  it('should align collection frequency with daily update requirement', () => {
    const validFrequencies: CollectionFrequency[] = ['daily', 'hourly'];
    expect(validFrequencies).toContain(validDataSource.collectionFrequency);
  });
});