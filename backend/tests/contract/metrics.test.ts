import request from 'supertest';
import { PrismaClient } from '@prisma/client';

// Mock the app - will be created during implementation
let app: any;

// Mock data matching our OpenAPI specification
const mockMetrics = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Net Promoter Score',
    category: 'business_value',
    value: 42.5,
    unit: 'percentage',
    health_status: 'yellow',
    is_leading_indicator: false,
    last_updated: '2025-09-23T10:00:00.000Z',
    data_freshness: 'current'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Deployment Failures',
    category: 'quality',
    value: 0.03,
    unit: 'percentage',
    health_status: 'green',
    is_leading_indicator: true,
    last_updated: '2025-09-23T10:00:00.000Z',
    data_freshness: 'current'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Code Review Coverage',
    category: 'efficiency',
    value: 87.2,
    unit: 'percentage',
    health_status: 'green',
    is_leading_indicator: true,
    last_updated: '2025-09-23T09:30:00.000Z',
    data_freshness: 'current'
  }
];

describe('GET /api/metrics', () => {
  beforeAll(() => {
    // App will be imported during implementation
    // app = require('../../src/app').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should return all metrics with correct structure', async () => {
      // This test will fail until implementation exists
      const response = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /json/)
        .expect(200);

      // Validate response structure matches OpenAPI spec
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('last_updated');
      expect(Array.isArray(response.body.metrics)).toBe(true);

      // Validate each metric has required fields per OpenAPI schema
      if (response.body.metrics.length > 0) {
        const metric = response.body.metrics[0];
        expect(metric).toHaveProperty('id');
        expect(metric).toHaveProperty('name');
        expect(metric).toHaveProperty('category');
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('health_status');

        // Validate enum values
        expect(['business_value', 'quality', 'efficiency', 'engagement', 'progress'])
          .toContain(metric.category);
        expect(['red', 'yellow', 'green']).toContain(metric.health_status);
        expect(['current', 'stale', 'estimated']).toContain(metric.data_freshness);
      }
    });

    it('should filter metrics by category when category parameter provided', async () => {
      const response = await request(app)
        .get('/api/metrics?category=business_value')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');

      // All returned metrics should be business_value category
      response.body.metrics.forEach((metric: any) => {
        expect(metric.category).toBe('business_value');
      });
    });

    it('should include trend data when include_trends=true', async () => {
      const response = await request(app)
        .get('/api/metrics?include_trends=true')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');

      // Each metric should have trend information when requested
      if (response.body.metrics.length > 0) {
        const metric = response.body.metrics[0];
        expect(metric).toHaveProperty('trend_data');
      }
    });

    it('should handle empty results gracefully', async () => {
      // Mock empty database
      global.mockPrisma.metric.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.metrics).toEqual([]);
      expect(response.body).toHaveProperty('last_updated');
    });
  });

  describe('error scenarios', () => {
    it('should return 400 for invalid category parameter', async () => {
      const response = await request(app)
        .get('/api/metrics?category=invalid_category')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid category');
    });

    it('should return 500 when database connection fails', async () => {
      // Mock database error
      global.mockPrisma.metric.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('performance requirements', () => {
    it('should respond within 2 seconds for dashboard load requirement', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/metrics')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // 2 second requirement
    });

    it('should handle concurrent requests efficiently', async () => {
      // Simulate 10 concurrent requests
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/metrics')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('metrics');
      });
    });
  });

  describe('constitutional compliance', () => {
    it('should not expose any personal user data', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      // Verify no personal data fields are exposed
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toMatch(/email|phone|address|ssn|personal/i);
    });

    it('should include measurement methodology in response', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      // Each metric should be measurable with clear data source
      if (response.body.metrics.length > 0) {
        const metric = response.body.metrics[0];
        expect(metric).toHaveProperty('unit');
        expect(typeof metric.value).toBe('number');
      }
    });
  });
});