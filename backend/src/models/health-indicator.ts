import { PrismaClient, HealthIndicator, HealthStatus } from '@prisma/client';

export class HealthIndicatorModel {
  constructor(private prisma: PrismaClient) {}

  async updateHealthStatus(metricId: string, metric: {
    name: string;
    value: number;
    unit: string;
    industryThresholdLow: number;
    industryThresholdMedium: number;
    industryThresholdHigh: number;
  }): Promise<HealthIndicator> {
    const status = this.calculateStatus(metric);
    const thresholdApplied = this.getAppliedThreshold(metric, status);
    const statusReason = this.generateStatusReason(metric, status);

    return this.prisma.healthIndicator.upsert({
      where: { metricId },
      update: {
        status,
        thresholdApplied,
        statusReason,
        calculatedAt: new Date()
      },
      create: {
        metricId,
        status,
        thresholdApplied,
        statusReason,
        calculatedAt: new Date()
      }
    });
  }

  calculateStatus(metric: {
    value: number;
    industryThresholdLow: number;
    industryThresholdMedium: number;
  }): HealthStatus {
    const { value, industryThresholdLow, industryThresholdMedium } = metric;

    if (value <= industryThresholdLow) return 'red';
    if (value <= industryThresholdMedium) return 'yellow';
    return 'green';
  }

  getAppliedThreshold(metric: {
    industryThresholdLow: number;
    industryThresholdMedium: number;
    industryThresholdHigh: number;
  }, status: HealthStatus): number {
    switch (status) {
      case 'red': return metric.industryThresholdLow;
      case 'yellow': return metric.industryThresholdMedium;
      case 'green': return metric.industryThresholdHigh;
    }
  }

  generateStatusReason(metric: {
    name: string;
    value: number;
    unit: string;
  }, status: HealthStatus): string {
    const { name, value, unit } = metric;

    switch (status) {
      case 'red':
        return `${name} is ${value}${unit}, below critical threshold`;
      case 'yellow':
        return `${name} is ${value}${unit}, needs improvement`;
      case 'green':
        return `${name} is ${value}${unit}, meeting targets`;
    }
  }

  async findByMetricId(metricId: string): Promise<HealthIndicator | null> {
    return this.prisma.healthIndicator.findUnique({
      where: { metricId },
      include: {
        metric: {
          include: {
            category: true
          }
        }
      }
    });
  }

  async getHealthIndicatorsByCategory(categoryId: string): Promise<HealthIndicator[]> {
    return this.prisma.healthIndicator.findMany({
      where: {
        metric: {
          categoryId
        }
      },
      include: {
        metric: true
      },
      orderBy: {
        metric: {
          name: 'asc'
        }
      }
    });
  }

  async getCriticalMetrics(): Promise<HealthIndicator[]> {
    return this.prisma.healthIndicator.findMany({
      where: {
        status: 'red'
      },
      include: {
        metric: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        calculatedAt: 'desc'
      }
    });
  }

  async getOverallHealthSummary(): Promise<{
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    healthPercentage: number;
  }> {
    const indicators = await this.prisma.healthIndicator.findMany();

    const summary = {
      total: indicators.length,
      healthy: indicators.filter(i => i.status === 'green').length,
      warning: indicators.filter(i => i.status === 'yellow').length,
      critical: indicators.filter(i => i.status === 'red').length,
      healthPercentage: 0
    };

    if (summary.total > 0) {
      summary.healthPercentage = Math.round((summary.healthy / summary.total) * 100);
    }

    return summary;
  }

  async validateStatusAlignment(metric: {
    value: number;
    industryThresholdLow: number;
    industryThresholdMedium: number;
    industryThresholdHigh: number;
  }, status: HealthStatus): Promise<boolean> {
    const calculatedStatus = this.calculateStatus(metric);
    return calculatedStatus === status;
  }
}