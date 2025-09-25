import { PrismaClient } from '@prisma/client';

const mockPrisma = global.mockPrisma;

class TimeSeriesDataModel {
  constructor(private prisma: PrismaClient) {}

  async addDataPoint(metricId: string, value: number, timestamp: Date, isEstimated = false) {
    const dataQualityScore = isEstimated ? 0.8 : 1.0;

    return this.prisma.timeSeriesData.create({
      data: {
        metricId,
        value,
        timestamp,
        isEstimated,
        dataQualityScore
      }
    });
  }

  async getHistoryForPeriod(metricId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.timeSeriesData.findMany({
      where: {
        metricId,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  validateDataQuality(score: number): boolean {
    return score >= 0.0 && score <= 1.0;
  }

  estimateValueFromTrend(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;

    const recent = historicalData.slice(-3);
    const sum = recent.reduce((acc, curr) => acc + curr.value, 0);
    return sum / recent.length;
  }
}

describe('TimeSeriesData Model', () => {
  let timeSeriesModel: TimeSeriesDataModel;

  beforeEach(() => {
    timeSeriesModel = new TimeSeriesDataModel(mockPrisma as any);
  });

  it('should add data point with quality tracking', async () => {
    const metricId = '550e8400-e29b-41d4-a716-446655440001';
    const value = 42.5;
    const timestamp = new Date();

    const expectedData = {
      metricId, value, timestamp,
      isEstimated: false,
      dataQualityScore: 1.0
    };

    mockPrisma.timeSeriesData.create.mockResolvedValue(expectedData);

    await timeSeriesModel.addDataPoint(metricId, value, timestamp);

    expect(mockPrisma.timeSeriesData.create).toHaveBeenCalledWith({
      data: expectedData
    });
  });

  it('should handle estimated values with lower quality scores per clarification', async () => {
    const metricId = '550e8400-e29b-41d4-a716-446655440001';

    await timeSeriesModel.addDataPoint(metricId, 40.0, new Date(), true);

    const createCall = mockPrisma.timeSeriesData.create.mock.calls[0];
    expect(createCall[0].data.isEstimated).toBe(true);
    expect(createCall[0].data.dataQualityScore).toBeLessThan(1.0);
  });

  it('should retrieve historical data for trend analysis', async () => {
    const metricId = '550e8400-e29b-41d4-a716-446655440001';
    const mockHistory = [
      { timestamp: new Date('2025-09-20'), value: 38.0 },
      { timestamp: new Date('2025-09-21'), value: 40.0 },
      { timestamp: new Date('2025-09-22'), value: 41.0 }
    ];

    mockPrisma.timeSeriesData.findMany.mockResolvedValue(mockHistory);

    await timeSeriesModel.getHistoryForPeriod(metricId, 7);

    expect(mockPrisma.timeSeriesData.findMany).toHaveBeenCalledWith({
      where: {
        metricId,
        timestamp: { gte: expect.any(Date) }
      },
      orderBy: { timestamp: 'asc' }
    });
  });

  it('should validate data quality scores', () => {
    expect(timeSeriesModel.validateDataQuality(1.0)).toBe(true);
    expect(timeSeriesModel.validateDataQuality(0.8)).toBe(true);
    expect(timeSeriesModel.validateDataQuality(0.0)).toBe(true);
    expect(timeSeriesModel.validateDataQuality(-0.1)).toBe(false);
    expect(timeSeriesModel.validateDataQuality(1.1)).toBe(false);
  });

  it('should support value estimation for missing data', () => {
    const mockData = [
      { value: 40 }, { value: 42 }, { value: 44 }
    ];

    const estimated = timeSeriesModel.estimateValueFromTrend(mockData);
    expect(estimated).toBe(42); // Average of recent values

    const insufficient = timeSeriesModel.estimateValueFromTrend([{ value: 40 }]);
    expect(insufficient).toBe(0);
  });
});