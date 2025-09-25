import { PrismaClient, HealthStatus } from '@prisma/client';

const mockPrisma = global.mockPrisma;

class HealthIndicatorModel {
  constructor(private prisma: PrismaClient) {}

  async updateHealthStatus(metricId: string, metric: any) {
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

  calculateStatus(metric: any): HealthStatus {
    const { value, industryThresholdLow, industryThresholdMedium } = metric;

    if (value <= industryThresholdLow) return 'red';
    if (value <= industryThresholdMedium) return 'yellow';
    return 'green';
  }

  getAppliedThreshold(metric: any, status: HealthStatus): number {
    switch (status) {
      case 'red': return metric.industryThresholdLow;
      case 'yellow': return metric.industryThresholdMedium;
      case 'green': return metric.industryThresholdHigh;
    }
  }

  generateStatusReason(metric: any, status: HealthStatus): string {
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
}

describe('HealthIndicator Model', () => {
  let healthModel: HealthIndicatorModel;

  const sampleMetric = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Net Promoter Score',
    value: 25,
    unit: '%',
    industryThresholdLow: 10,
    industryThresholdMedium: 30,
    industryThresholdHigh: 50
  };

  beforeEach(() => {
    healthModel = new HealthIndicatorModel(mockPrisma as any);
  });

  it('should calculate correct health status based on industry thresholds', () => {
    // Red status
    const redMetric = { ...sampleMetric, value: 5 };
    expect(healthModel.calculateStatus(redMetric)).toBe('red');

    // Yellow status
    const yellowMetric = { ...sampleMetric, value: 25 };
    expect(healthModel.calculateStatus(yellowMetric)).toBe('yellow');

    // Green status
    const greenMetric = { ...sampleMetric, value: 55 };
    expect(healthModel.calculateStatus(greenMetric)).toBe('green');
  });

  it('should use predefined industry standard thresholds per clarification', () => {
    const status = healthModel.calculateStatus(sampleMetric);
    const appliedThreshold = healthModel.getAppliedThreshold(sampleMetric, status);

    expect(typeof appliedThreshold).toBe('number');
    expect(appliedThreshold).toBeGreaterThan(0);

    // Should use industry standards
    const validThresholds = [
      sampleMetric.industryThresholdLow,
      sampleMetric.industryThresholdMedium,
      sampleMetric.industryThresholdHigh
    ];
    expect(validThresholds).toContain(appliedThreshold);
  });

  it('should generate clear status explanations for simple progress tracking', () => {
    const redReason = healthModel.generateStatusReason(
      { ...sampleMetric, value: 5 }, 'red'
    );
    const yellowReason = healthModel.generateStatusReason(
      { ...sampleMetric, value: 25 }, 'yellow'
    );
    const greenReason = healthModel.generateStatusReason(
      { ...sampleMetric, value: 55 }, 'green'
    );

    // Should include metric name and value
    expect(redReason).toContain('Net Promoter Score');
    expect(redReason).toContain('5%');
    expect(yellowReason).toContain('25%');
    expect(greenReason).toContain('55%');

    // Should be human-readable
    expect(redReason.length).toBeGreaterThan(20);
    expect(yellowReason.length).toBeGreaterThan(20);
    expect(greenReason.length).toBeGreaterThan(20);
  });

  it('should update health indicator with timestamp tracking', async () => {
    const metricId = '550e8400-e29b-41d4-a716-446655440001';
    const expectedHealth = {
      metricId,
      status: 'yellow',
      thresholdApplied: 30,
      statusReason: expect.stringContaining('Net Promoter Score'),
      calculatedAt: expect.any(Date)
    };

    mockPrisma.healthIndicator.upsert.mockResolvedValue(expectedHealth);

    await healthModel.updateHealthStatus(metricId, sampleMetric);

    expect(mockPrisma.healthIndicator.upsert).toHaveBeenCalledWith({
      where: { metricId },
      update: expect.objectContaining({
        status: 'yellow',
        thresholdApplied: 30,
        calculatedAt: expect.any(Date)
      }),
      create: expect.objectContaining({
        metricId,
        status: 'yellow',
        thresholdApplied: 30,
        calculatedAt: expect.any(Date)
      })
    });
  });

  it('should validate status aligns with metric value vs thresholds', () => {
    const testCases = [
      { value: 5, expectedStatus: 'red' },
      { value: 10, expectedStatus: 'red' },
      { value: 20, expectedStatus: 'yellow' },
      { value: 30, expectedStatus: 'yellow' },
      { value: 40, expectedStatus: 'green' },
      { value: 60, expectedStatus: 'green' }
    ];

    testCases.forEach(({ value, expectedStatus }) => {
      const testMetric = { ...sampleMetric, value };
      const actualStatus = healthModel.calculateStatus(testMetric);
      expect(actualStatus).toBe(expectedStatus);
    });
  });
});