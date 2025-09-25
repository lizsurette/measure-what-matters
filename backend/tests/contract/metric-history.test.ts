import request from 'supertest';
import { PrismaClient } from '@prisma/client';

// Mock the app - will be created during implementation
let app: any;

// Mock historical data matching OpenAPI TimeSeriesPoint schema
const mockHistoryData = {
  metric_id: '550e8400-e29b-41d4-a716-446655440001',
  data_points: [
    {
      timestamp: '2025-09-20T10:00:00.000Z',
      value: 38.2,
      is_estimated: false,
      data_quality_score: 1.0
    },
    {
      timestamp: '2025-09-21T10:00:00.000Z',
      value: 40.1,
      is_estimated: false,
      data_quality_score: 0.95
    },
    {
      timestamp: '2025-09-22T10:00:00.000Z',
      value: 41.8,
      is_estimated: true,
      data_quality_score: 0.8
    },
    {
      timestamp: '2025-09-23T10:00:00.000Z',
      value: 42.5,
      is_estimated: false,
      data_quality_score: 1.0
    }
  ]
};

describe('GET /api/metrics/:id/history', () => {
  const validMetricId = '550e8400-e29b-41d4-a716-446655440001';
  const invalidMetricId = '550e8400-e29b-41d4-a716-446655440999';

  beforeAll(() => {
    // App will be imported during implementation
    // app = require('../../src/app').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should return historical data with correct structure', async () => {
      // This test will fail until implementation exists
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Validate response structure matches OpenAPI spec
      expect(response.body).toHaveProperty('metric_id');
      expect(response.body).toHaveProperty('data_points');
      expect(Array.isArray(response.body.data_points)).toBe(true);
      expect(response.body.metric_id).toBe(validMetricId);

      // Validate each data point structure
      if (response.body.data_points.length > 0) {
        const dataPoint = response.body.data_points[0];
        expect(dataPoint).toHaveProperty('timestamp');
        expect(dataPoint).toHaveProperty('value');
        expect(dataPoint).toHaveProperty('is_estimated');
        expect(dataPoint).toHaveProperty('data_quality_score');

        // Validate data types
        expect(new Date(dataPoint.timestamp)).toBeInstanceOf(Date);
        expect(typeof dataPoint.value).toBe('number');
        expect(typeof dataPoint.is_estimated).toBe('boolean');
        expect(typeof dataPoint.data_quality_score).toBe('number');

        // Validate data quality score range
        expect(dataPoint.data_quality_score).toBeGreaterThanOrEqual(0.0);
        expect(dataPoint.data_quality_score).toBeLessThanOrEqual(1.0);
      }
    });

    it('should filter by period parameter correctly', async () => {
      const periods = ['week', 'month', 'quarter', 'year'];

      for (const period of periods) {
        const response = await request(app)
          .get(`/api/metrics/${validMetricId}/history?period=${period}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toHaveProperty('data_points');

        // Validate data points are within expected time range
        if (response.body.data_points.length > 0) {
          const timestamps = response.body.data_points.map((dp: any) => new Date(dp.timestamp));
          const now = new Date();
          const earliest = new Date(Math.min(...timestamps.map(t => t.getTime())));

          let expectedMinDate: Date;
          switch (period) {
            case 'week':
              expectedMinDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              expectedMinDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'quarter':
              expectedMinDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              expectedMinDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
            default:
              expectedMinDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          }

          expect(earliest.getTime()).toBeGreaterThanOrEqual(expectedMinDate.getTime() - 24 * 60 * 60 * 1000); // 1 day tolerance
        }
      }
    });

    it('should default to month period when not specified', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect(200);

      expect(response.body).toHaveProperty('data_points');
      // Default period behavior will be validated in implementation
    });

    it('should handle empty history gracefully', async () => {
      // Mock empty time series data
      global.mockPrisma.timeSeriesData.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.data_points).toEqual([]);
      expect(response.body.metric_id).toBe(validMetricId);
    });

    it('should order data points chronologically', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect(200);

      if (response.body.data_points.length > 1) {
        const timestamps = response.body.data_points.map((dp: any) => new Date(dp.timestamp).getTime());

        // Verify chronological order (ascending)
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
        }
      }
    });
  });

  describe('error scenarios', () => {
    it('should return 404 for non-existent metric ID', async () => {
      const response = await request(app)
        .get(`/api/metrics/${invalidMetricId}/history`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Metric not found');
    });

    it('should return 400 for invalid period parameter', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history?period=invalid`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid period');
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidUuid = 'not-a-valid-uuid';

      const response = await request(app)
        .get(`/api/metrics/${invalidUuid}/history`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid metric ID format');
    });

    it('should return 500 when database connection fails', async () => {
      // Mock database error
      global.mockPrisma.timeSeriesData.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('data quality and resilience', () => {
    it('should handle estimated values from missing data per clarification', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect(200);

      // Find data points marked as estimated
      const estimatedPoints = response.body.data_points.filter((dp: any) => dp.is_estimated);

      estimatedPoints.forEach((point: any) => {
        // Estimated points should have lower data quality scores
        expect(point.data_quality_score).toBeLessThan(1.0);

        // Should still have valid values
        expect(typeof point.value).toBe('number');
        expect(point.value).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include data quality indicators for transparency', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect(200);

      response.body.data_points.forEach((point: any) => {
        expect(point.data_quality_score).toBeGreaterThanOrEqual(0.0);
        expect(point.data_quality_score).toBeLessThanOrEqual(1.0);

        // Higher quality data should not be estimated
        if (point.data_quality_score === 1.0) {
          expect(point.is_estimated).toBe(false);
        }
      });
    });
  });

  describe('flow-based measurement compliance', () => {
    it('should support trend analysis for leading indicators', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect(200);

      // Should have sufficient data points for trend analysis
      if (response.body.data_points.length >= 3) {
        const values = response.body.data_points.map((dp: any) => dp.value);

        // Trend should be calculable from historical data
        expect(values.length).toBeGreaterThanOrEqual(3);
        expect(values.every((v: number) => typeof v === 'number')).toBe(true);
      }
    });

    it('should maintain daily update frequency per clarification', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}/history?period=week`)
        .expect(200);

      if (response.body.data_points.length > 1) {
        const timestamps = response.body.data_points.map((dp: any) => new Date(dp.timestamp));

        // Check for daily intervals (approximately 24 hours between points)
        for (let i = 1; i < timestamps.length; i++) {
          const timeDiff = timestamps[i].getTime() - timestamps[i - 1].getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          // Allow some flexibility for daily updates (20-28 hours)
          expect(hoursDiff).toBeGreaterThanOrEqual(20);
          expect(hoursDiff).toBeLessThanOrEqual(28);
        }
      }
    });
  });

  describe('performance requirements', () => {
    it('should respond efficiently for trend analysis', async () => {
      const startTime = Date.now();

      await request(app)
        .get(`/api/metrics/${validMetricId}/history`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1500); // 1.5 seconds for historical data
    });

    it('should handle large datasets efficiently', async () => {
      // Test with year period (potentially large dataset)
      const startTime = Date.now();

      await request(app)
        .get(`/api/metrics/${validMetricId}/history?period=year`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(3000); // 3 seconds for large dataset
    });
  });
});