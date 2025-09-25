import request from 'supertest';
import { PrismaClient } from '@prisma/client';

// Mock the app - will be created during implementation
let app: any;

// Mock detailed metric data matching OpenAPI MetricDetail schema
const mockMetricDetail = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Net Promoter Score',
  category: 'business_value',
  value: 42.5,
  unit: 'percentage',
  health_status: 'yellow',
  is_leading_indicator: false,
  last_updated: '2025-09-23T10:00:00.000Z',
  data_freshness: 'current',
  calculation_method: 'Survey responses: (% Promoters - % Detractors)',
  data_source: {
    id: '550e8400-e29b-41d4-a716-446655440100',
    name: 'Typeform Survey API',
    type: 'api',
    last_successful_fetch: '2025-09-23T09:45:00.000Z',
    collection_frequency: 'daily'
  },
  thresholds: {
    red: 10,
    yellow: 30,
    green: 50
  },
  correlation_metrics: [
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003'
  ]
};

describe('GET /api/metrics/:id', () => {
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
    it('should return detailed metric information with correct structure', async () => {
      // This test will fail until implementation exists
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Validate response matches MetricDetail schema from OpenAPI
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('value');
      expect(response.body).toHaveProperty('health_status');
      expect(response.body).toHaveProperty('calculation_method');
      expect(response.body).toHaveProperty('data_source');
      expect(response.body).toHaveProperty('thresholds');

      // Validate data_source structure
      expect(response.body.data_source).toHaveProperty('id');
      expect(response.body.data_source).toHaveProperty('name');
      expect(response.body.data_source).toHaveProperty('type');
      expect(['api', 'database', 'manual', 'calculated']).toContain(response.body.data_source.type);

      // Validate thresholds structure
      expect(response.body.thresholds).toHaveProperty('red');
      expect(response.body.thresholds).toHaveProperty('yellow');
      expect(response.body.thresholds).toHaveProperty('green');
      expect(typeof response.body.thresholds.red).toBe('number');
      expect(typeof response.body.thresholds.yellow).toBe('number');
      expect(typeof response.body.thresholds.green).toBe('number');

      // Validate threshold ordering (industry standards)
      expect(response.body.thresholds.red).toBeLessThan(response.body.thresholds.yellow);
      expect(response.body.thresholds.yellow).toBeLessThan(response.body.thresholds.green);
    });

    it('should include correlation metrics when available', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect(200);

      if (response.body.correlation_metrics) {
        expect(Array.isArray(response.body.correlation_metrics)).toBe(true);

        // Each correlation metric should be a valid UUID
        response.body.correlation_metrics.forEach((metricId: string) => {
          expect(metricId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });
      }
    });

    it('should show calculation methodology transparency per constitution', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect(200);

      // Constitutional requirement: calculation transparency
      expect(response.body.calculation_method).toBeDefined();
      expect(typeof response.body.calculation_method).toBe('string');
      expect(response.body.calculation_method.length).toBeGreaterThan(0);

      // Data source transparency
      expect(response.body.data_source.name).toBeDefined();
      expect(response.body.data_source.type).toBeDefined();
    });
  });

  describe('error scenarios', () => {
    it('should return 404 for non-existent metric ID', async () => {
      const response = await request(app)
        .get(`/api/metrics/${invalidMetricId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Metric not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidUuid = 'not-a-valid-uuid';

      const response = await request(app)
        .get(`/api/metrics/${invalidUuid}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid metric ID format');
    });

    it('should return 500 when database connection fails', async () => {
      // Mock database error
      global.mockPrisma.metric.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('data quality requirements', () => {
    it('should include data freshness indicators per clarification', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect(200);

      expect(response.body).toHaveProperty('data_freshness');
      expect(['current', 'stale', 'estimated']).toContain(response.body.data_freshness);

      // Last known good values requirement from clarification
      if (response.body.data_freshness === 'stale' || response.body.data_freshness === 'estimated') {
        expect(response.body).toHaveProperty('last_updated');
        expect(new Date(response.body.last_updated)).toBeInstanceOf(Date);
      }
    });

    it('should validate metric value against thresholds', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect(200);

      const { value, health_status, thresholds } = response.body;

      // Health status should align with threshold values (industry standards)
      if (health_status === 'red') {
        expect(value).toBeLessThanOrEqual(thresholds.red);
      } else if (health_status === 'yellow') {
        expect(value).toBeGreaterThan(thresholds.red);
        expect(value).toBeLessThanOrEqual(thresholds.yellow);
      } else if (health_status === 'green') {
        expect(value).toBeGreaterThan(thresholds.yellow);
      }
    });
  });

  describe('Forrester framework compliance', () => {
    it('should identify if metric is leading or lagging indicator', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect(200);

      expect(response.body).toHaveProperty('is_leading_indicator');
      expect(typeof response.body.is_leading_indicator).toBe('boolean');

      // Leading indicators should have correlation metrics (predict outcomes)
      if (response.body.is_leading_indicator) {
        expect(response.body.correlation_metrics).toBeDefined();
      }
    });

    it('should categorize metric within Forrester MAD framework', async () => {
      const response = await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect(200);

      const validCategories = ['business_value', 'quality', 'efficiency', 'engagement', 'progress'];
      expect(validCategories).toContain(response.body.category);
    });
  });

  describe('performance requirements', () => {
    it('should respond within acceptable time for metric drill-down', async () => {
      const startTime = Date.now();

      await request(app)
        .get(`/api/metrics/${validMetricId}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 1 second for detail view
    });
  });
});