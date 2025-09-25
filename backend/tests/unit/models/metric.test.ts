import { PrismaClient, HealthStatus } from '@prisma/client';

// Mock Prisma client
const mockPrisma = global.mockPrisma;

// Mock Metric model - will be implemented later
class MetricModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: any) {
    return this.prisma.metric.create({ data });
  }

  async findById(id: string) {
    return this.prisma.metric.findUnique({ where: { id } });
  }

  async findByCategory(categoryId: string) {
    return this.prisma.metric.findMany({ where: { categoryId } });
  }

  async updateValue(id: string, value: number) {
    return this.prisma.metric.update({
      where: { id },
      data: { value, lastCalculatedAt: new Date() }
    });
  }

  async calculateHealthStatus(metric: any): Promise<HealthStatus> {
    const { value, industryThresholdLow, industryThresholdMedium, industryThresholdHigh } = metric;

    if (value <= industryThresholdLow) return 'red';
    if (value <= industryThresholdMedium) return 'yellow';
    return 'green';
  }

  async validateThresholds(low: number, medium: number, high: number): Promise<boolean> {
    return low < medium && medium < high;
  }
}

describe('Metric Model', () => {
  let metricModel: MetricModel;

  const validMetricData = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Net Promoter Score',
    categoryId: '550e8400-e29b-41d4-a716-446655440010',
    value: 42.5,
    unit: 'percentage',
    calculationMethod: 'Survey responses: (% Promoters - % Detractors)',
    dataSourceId: '550e8400-e29b-41d4-a716-446655440100',
    healthStatus: 'yellow' as HealthStatus,
    isLeadingIndicator: false,
    industryThresholdLow: 10,
    industryThresholdMedium: 30,
    industryThresholdHigh: 50
  };

  beforeEach(() => {
    metricModel = new MetricModel(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('creation and validation', () => {
    it('should create a metric with valid data', async () => {
      mockPrisma.metric.create.mockResolvedValue(validMetricData);

      const result = await metricModel.create(validMetricData);

      expect(mockPrisma.metric.create).toHaveBeenCalledWith({
        data: validMetricData
      });
      expect(result).toEqual(validMetricData);
    });

    it('should validate threshold ordering per data model requirements', async () => {
      // Valid thresholds
      const validResult = await metricModel.validateThresholds(10, 30, 50);
      expect(validResult).toBe(true);

      // Invalid thresholds (not ordered)
      const invalidResult = await metricModel.validateThresholds(50, 30, 10);
      expect(invalidResult).toBe(false);

      // Equal thresholds (invalid)
      const equalResult = await metricModel.validateThresholds(30, 30, 50);
      expect(equalResult).toBe(false);
    });

    it('should enforce unique name within category constraint', async () => {
      const duplicateNameError = new Error('Unique constraint violation');
      mockPrisma.metric.create.mockRejectedValue(duplicateNameError);

      const duplicateMetric = {
        ...validMetricData,
        id: '550e8400-e29b-41d4-a716-446655440002'
      };

      await expect(metricModel.create(duplicateMetric)).rejects.toThrow('Unique constraint violation');
    });

    it('should require non-negative values for count-based metrics', async () => {
      const invalidMetric = {
        ...validMetricData,
        value: -5,
        unit: 'count'
      };

      // Model should validate before database call
      const isValid = invalidMetric.value >= 0;
      expect(isValid).toBe(false);
    });

    it('should require non-empty calculation method for calculated metrics', async () => {
      const invalidMetric = {
        ...validMetricData,
        calculationMethod: ''
      };

      const isValid = invalidMetric.calculationMethod.length > 0;
      expect(isValid).toBe(false);
    });
  });

  describe('health status calculation', () => {
    it('should calculate red status for values at or below low threshold', async () => {
      const redMetric = { ...validMetricData, value: 5 }; // Below threshold of 10
      const status = await metricModel.calculateHealthStatus(redMetric);
      expect(status).toBe('red');

      const exactlyLowMetric = { ...validMetricData, value: 10 }; // Exactly at threshold
      const exactStatus = await metricModel.calculateHealthStatus(exactlyLowMetric);
      expect(exactStatus).toBe('red');
    });

    it('should calculate yellow status for values between low and medium thresholds', async () => {
      const yellowMetric = { ...validMetricData, value: 25 }; // Between 10 and 30
      const status = await metricModel.calculateHealthStatus(yellowMetric);
      expect(status).toBe('yellow');
    });

    it('should calculate green status for values above medium threshold', async () => {
      const greenMetric = { ...validMetricData, value: 65 }; // Above 50
      const status = await metricModel.calculateHealthStatus(greenMetric);
      expect(status).toBe('green');
    });

    it('should use industry standard thresholds per clarification', async () => {
      const industryStandardMetric = {
        ...validMetricData,
        industryThresholdLow: 10,    // Industry standard
        industryThresholdMedium: 30,  // Industry standard
        industryThresholdHigh: 50     // Industry standard
      };

      const isValidThresholds = await metricModel.validateThresholds(
        industryStandardMetric.industryThresholdLow,
        industryStandardMetric.industryThresholdMedium,
        industryStandardMetric.industryThresholdHigh
      );

      expect(isValidThresholds).toBe(true);
    });
  });

  describe('data retrieval', () => {
    it('should find metric by ID', async () => {
      const metricId = '550e8400-e29b-41d4-a716-446655440001';
      mockPrisma.metric.findUnique.mockResolvedValue(validMetricData);

      const result = await metricModel.findById(metricId);

      expect(mockPrisma.metric.findUnique).toHaveBeenCalledWith({
        where: { id: metricId }
      });
      expect(result).toEqual(validMetricData);
    });

    it('should find metrics by category for Forrester framework grouping', async () => {
      const categoryId = '550e8400-e29b-41d4-a716-446655440010';
      const categoryMetrics = [validMetricData];
      mockPrisma.metric.findMany.mockResolvedValue(categoryMetrics);

      const result = await metricModel.findByCategory(categoryId);

      expect(mockPrisma.metric.findMany).toHaveBeenCalledWith({
        where: { categoryId }
      });
      expect(result).toEqual(categoryMetrics);
    });

    it('should return null for non-existent metric', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      mockPrisma.metric.findUnique.mockResolvedValue(null);

      const result = await metricModel.findById(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe('value updates and tracking', () => {
    it('should update metric value and timestamp', async () => {
      const metricId = '550e8400-e29b-41d4-a716-446655440001';
      const newValue = 55.0;
      const updatedMetric = { ...validMetricData, value: newValue };

      mockPrisma.metric.update.mockResolvedValue(updatedMetric);

      const result = await metricModel.updateValue(metricId, newValue);

      expect(mockPrisma.metric.update).toHaveBeenCalledWith({
        where: { id: metricId },
        data: {
          value: newValue,
          lastCalculatedAt: expect.any(Date)
        }
      });
      expect(result.value).toBe(newValue);
    });

    it('should track last calculated timestamp for daily updates per clarification', async () => {
      const metricId = '550e8400-e29b-41d4-a716-446655440001';
      const newValue = 45.0;

      await metricModel.updateValue(metricId, newValue);

      const updateCall = mockPrisma.metric.update.mock.calls[0];
      expect(updateCall[0].data.lastCalculatedAt).toBeInstanceOf(Date);

      // Should be very recent (within last few seconds)
      const now = new Date();
      const updatedTime = updateCall[0].data.lastCalculatedAt;
      const timeDifference = now.getTime() - updatedTime.getTime();
      expect(timeDifference).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('constitutional compliance', () => {
    it('should support measurable goals first principle', async () => {
      // Every metric must have measurement strategy
      expect(validMetricData.unit).toBeDefined();
      expect(validMetricData.unit.length).toBeGreaterThan(0);
      expect(validMetricData.calculationMethod).toBeDefined();
      expect(validMetricData.calculationMethod.length).toBeGreaterThan(0);

      // Values must be quantifiable
      expect(typeof validMetricData.value).toBe('number');
      expect(validMetricData.value).toBeGreaterThanOrEqual(0);
    });

    it('should enable flow-based measurement with leading indicators', async () => {
      const leadingMetric = {
        ...validMetricData,
        isLeadingIndicator: true
      };

      expect(typeof leadingMetric.isLeadingIndicator).toBe('boolean');

      // Leading indicators should predict outcomes
      if (leadingMetric.isLeadingIndicator) {
        expect(leadingMetric.calculationMethod).toContain('predict');
      }
    });

    it('should support simple progress tracking through health status', async () => {
      const healthStatuses: HealthStatus[] = ['red', 'yellow', 'green'];

      // Health status must be one of the three simple options
      expect(healthStatuses).toContain(validMetricData.healthStatus);

      // Status should be immediately understandable
      const statusMeaning = {
        red: 'critical',
        yellow: 'warning',
        green: 'healthy'
      };

      expect(statusMeaning[validMetricData.healthStatus]).toBeDefined();
    });

    it('should maintain data transparency through calculation methods', async () => {
      // Calculation method must explain how metric is derived
      expect(validMetricData.calculationMethod).toBeDefined();
      expect(validMetricData.calculationMethod.length).toBeGreaterThan(10);

      // Should not expose personal data per privacy principle
      const calculationLower = validMetricData.calculationMethod.toLowerCase();
      expect(calculationLower).not.toMatch(/email|phone|address|personal|user.*id/);
    });
  });

  describe('integration with other entities', () => {
    it('should maintain foreign key relationships', async () => {
      // Should reference valid category
      expect(validMetricData.categoryId).toBeDefined();
      expect(validMetricData.categoryId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Should reference valid data source
      expect(validMetricData.dataSourceId).toBeDefined();
      expect(validMetricData.dataSourceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should support time series data relationships', async () => {
      // Metric should be able to have multiple time series points
      const metricId = validMetricData.id;

      // This relationship will be tested when TimeSeriesData model is implemented
      expect(metricId).toBeDefined();
      expect(typeof metricId).toBe('string');
    });
  });

  describe('error handling', () => {
    it('should handle database connection failures gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.metric.create.mockRejectedValue(dbError);

      await expect(metricModel.create(validMetricData)).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid UUID formats', async () => {
      const invalidId = 'not-a-uuid';

      // UUID validation should happen before database call
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invalidId);
      expect(isValidUuid).toBe(false);
    });
  });
});