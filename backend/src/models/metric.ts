import { PrismaClient, HealthStatus, Metric, Prisma } from '@prisma/client';

export class MetricModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.MetricCreateInput): Promise<Metric> {
    // Validate thresholds before creating
    if (!this.validateThresholds(
      Number(data.industryThresholdLow),
      Number(data.industryThresholdMedium),
      Number(data.industryThresholdHigh)
    )) {
      throw new Error('Invalid threshold ordering: low < medium < high required');
    }

    // Validate non-negative values for count-based metrics
    if (data.unit === 'count' && Number(data.value) < 0) {
      throw new Error('Count-based metrics must have non-negative values');
    }

    // Ensure calculation method is provided for calculated metrics
    if (typeof data.calculationMethod === 'string' && data.calculationMethod.trim().length === 0) {
      throw new Error('Calculation method cannot be empty');
    }

    return this.prisma.metric.create({
      data,
      include: {
        category: true,
        dataSource: true,
        healthIndicator: true
      }
    });
  }

  async findById(id: string): Promise<Metric | null> {
    return this.prisma.metric.findUnique({
      where: { id },
      include: {
        category: true,
        dataSource: true,
        healthIndicator: true,
        timeSeriesData: {
          orderBy: { timestamp: 'desc' },
          take: 1 // Get most recent data point
        }
      }
    });
  }

  async findByCategory(categoryId: string): Promise<Metric[]> {
    return this.prisma.metric.findMany({
      where: { categoryId },
      include: {
        category: true,
        dataSource: true,
        healthIndicator: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async updateValue(id: string, value: number): Promise<Metric> {
    const metric = await this.findById(id);
    if (!metric) {
      throw new Error('Metric not found');
    }

    // Calculate new health status based on updated value
    const healthStatus = this.calculateHealthStatus({
      ...metric,
      value
    });

    return this.prisma.metric.update({
      where: { id },
      data: {
        value,
        healthStatus,
        lastCalculatedAt: new Date()
      },
      include: {
        category: true,
        dataSource: true,
        healthIndicator: true
      }
    });
  }

  calculateHealthStatus(metric: {
    value: number | any;
    industryThresholdLow: number | any;
    industryThresholdMedium: number | any;
  }): HealthStatus {
    const value = Number(metric.value);
    const low = Number(metric.industryThresholdLow);
    const medium = Number(metric.industryThresholdMedium);

    if (value <= low) return 'red';
    if (value <= medium) return 'yellow';
    return 'green';
  }

  validateThresholds(low: number, medium: number, high: number): boolean {
    return low < medium && medium < high;
  }

  async findAll(options?: {
    category?: string;
    includeTrends?: boolean;
  }): Promise<Metric[]> {
    const where: Prisma.MetricWhereInput = {};

    if (options?.category) {
      where.category = { name: options.category };
    }

    const include: Prisma.MetricInclude = {
      category: true,
      dataSource: true,
      healthIndicator: true
    };

    if (options?.includeTrends) {
      include.timeSeriesData = {
        orderBy: { timestamp: 'desc' },
        take: 30 // Last 30 data points for trends
      };
    }

    return this.prisma.metric.findMany({
      where,
      include,
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { name: 'asc' }
      ]
    });
  }

  async getHealthSummaryByCategory(): Promise<Record<string, {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  }>> {
    const metrics = await this.prisma.metric.findMany({
      include: { category: true }
    });

    const summary: Record<string, {
      total: number;
      healthy: number;
      warning: number;
      critical: number;
    }> = {};

    metrics.forEach(metric => {
      const categoryName = metric.category.name;

      if (!summary[categoryName]) {
        summary[categoryName] = {
          total: 0,
          healthy: 0,
          warning: 0,
          critical: 0
        };
      }

      summary[categoryName].total++;

      switch (metric.healthStatus) {
        case 'green':
          summary[categoryName].healthy++;
          break;
        case 'yellow':
          summary[categoryName].warning++;
          break;
        case 'red':
          summary[categoryName].critical++;
          break;
      }
    });

    return summary;
  }
}