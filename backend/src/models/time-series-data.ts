import { PrismaClient, TimeSeriesData, Prisma } from '@prisma/client';

export class TimeSeriesDataModel {
  constructor(private prisma: PrismaClient) {}

  async addDataPoint(
    metricId: string,
    value: number,
    timestamp: Date,
    isEstimated = false
  ): Promise<TimeSeriesData> {
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

  async getHistoryForPeriod(metricId: string, days: number): Promise<TimeSeriesData[]> {
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

  async getHistoryByPeriod(
    metricId: string,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<TimeSeriesData[]> {
    const periodDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    return this.getHistoryForPeriod(metricId, periodDays[period]);
  }

  validateDataQuality(score: number): boolean {
    return score >= 0.0 && score <= 1.0;
  }

  estimateValueFromTrend(historicalData: { value: number }[]): number {
    if (historicalData.length < 2) return 0;

    const recent = historicalData.slice(-3);
    const sum = recent.reduce((acc, curr) => acc + curr.value, 0);
    return sum / recent.length;
  }

  async getLatestValue(metricId: string): Promise<TimeSeriesData | null> {
    return this.prisma.timeSeriesData.findFirst({
      where: { metricId },
      orderBy: { timestamp: 'desc' }
    });
  }

  async createEstimatedValue(metricId: string): Promise<TimeSeriesData | null> {
    const historicalData = await this.getHistoryForPeriod(metricId, 7);

    if (historicalData.length < 2) {
      return null; // Can't estimate without sufficient history
    }

    const estimatedValue = this.estimateValueFromTrend(historicalData);

    return this.addDataPoint(metricId, estimatedValue, new Date(), true);
  }

  async bulkCreateDataPoints(dataPoints: Array<{
    metricId: string;
    value: number;
    timestamp: Date;
    isEstimated?: boolean;
  }>): Promise<void> {
    const createData = dataPoints.map(point => ({
      ...point,
      dataQualityScore: point.isEstimated ? 0.8 : 1.0,
      isEstimated: point.isEstimated || false
    }));

    await this.prisma.timeSeriesData.createMany({
      data: createData,
      skipDuplicates: true
    });
  }

  async cleanupOldData(retentionDays = 730): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.timeSeriesData.deleteMany({
      where: {
        timestamp: { lt: cutoffDate }
      }
    });

    return result.count;
  }
}