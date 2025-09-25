import request from 'supertest';
import { PrismaClient } from '@prisma/client';

// Mock the app - will be created during implementation
let app: any;

// Mock categories data matching OpenAPI MetricCategory schema
const mockCategories = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Business Value',
    display_order: 1,
    is_central: true,
    health_summary: {
      total_metrics: 5,
      healthy_count: 2,
      warning_count: 2,
      critical_count: 1
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Quality',
    display_order: 2,
    is_central: false,
    health_summary: {
      total_metrics: 8,
      healthy_count: 6,
      warning_count: 1,
      critical_count: 1
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'Efficiency',
    display_order: 3,
    is_central: false,
    health_summary: {
      total_metrics: 7,
      healthy_count: 5,
      warning_count: 2,
      critical_count: 0
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: 'Engagement',
    display_order: 4,
    is_central: false,
    health_summary: {
      total_metrics: 6,
      healthy_count: 3,
      warning_count: 2,
      critical_count: 1
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    name: 'Progress',
    display_order: 5,
    is_central: false,
    health_summary: {
      total_metrics: 9,
      healthy_count: 7,
      warning_count: 1,
      critical_count: 1
    }
  }
];

describe('GET /api/categories', () => {
  beforeAll(() => {
    // App will be imported during implementation
    // app = require('../../src/app').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should return all Forrester MAD framework categories', async () => {
      // This test will fail until implementation exists
      const response = await request(app)
        .get('/api/categories')
        .expect('Content-Type', /json/)
        .expect(200);

      // Should return exactly 5 Forrester categories
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(5);

      // Validate each category structure
      response.body.forEach((category: any) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('display_order');
        expect(category).toHaveProperty('is_central');
        expect(category).toHaveProperty('health_summary');

        // Validate required field types
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(typeof category.display_order).toBe('number');
        expect(typeof category.is_central).toBe('boolean');
        expect(typeof category.health_summary).toBe('object');
      });
    });

    it('should include all required Forrester MAD categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const categoryNames = response.body.map((cat: any) => cat.name);
      const requiredCategories = ['Business Value', 'Quality', 'Efficiency', 'Engagement', 'Progress'];

      requiredCategories.forEach(requiredCategory => {
        expect(categoryNames).toContain(requiredCategory);
      });
    });

    it('should order categories by display_order', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const displayOrders = response.body.map((cat: any) => cat.display_order);

      // Should be ordered 1, 2, 3, 4, 5
      expect(displayOrders).toEqual([1, 2, 3, 4, 5]);
    });

    it('should have only Business Value as central category', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const centralCategories = response.body.filter((cat: any) => cat.is_central);
      const businessValueCategory = response.body.find((cat: any) => cat.name === 'Business Value');

      expect(centralCategories).toHaveLength(1);
      expect(businessValueCategory.is_central).toBe(true);

      // All other categories should not be central
      const nonCentralCategories = response.body.filter((cat: any) => !cat.is_central);
      expect(nonCentralCategories).toHaveLength(4);
    });

    it('should include health summary statistics for each category', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      response.body.forEach((category: any) => {
        const healthSummary = category.health_summary;

        expect(healthSummary).toHaveProperty('total_metrics');
        expect(healthSummary).toHaveProperty('healthy_count');
        expect(healthSummary).toHaveProperty('warning_count');
        expect(healthSummary).toHaveProperty('critical_count');

        // Validate counts are non-negative integers
        expect(Number.isInteger(healthSummary.total_metrics)).toBe(true);
        expect(Number.isInteger(healthSummary.healthy_count)).toBe(true);
        expect(Number.isInteger(healthSummary.warning_count)).toBe(true);
        expect(Number.isInteger(healthSummary.critical_count)).toBe(true);

        expect(healthSummary.total_metrics).toBeGreaterThanOrEqual(0);
        expect(healthSummary.healthy_count).toBeGreaterThanOrEqual(0);
        expect(healthSummary.warning_count).toBeGreaterThanOrEqual(0);
        expect(healthSummary.critical_count).toBeGreaterThanOrEqual(0);

        // Health counts should sum to total
        const sumOfHealthCounts = healthSummary.healthy_count + healthSummary.warning_count + healthSummary.critical_count;
        expect(sumOfHealthCounts).toBe(healthSummary.total_metrics);
      });
    });
  });

  describe('error scenarios', () => {
    it('should return 500 when database connection fails', async () => {
      // Mock database error
      global.mockPrisma.metricCategory.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/categories')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Internal server error');
    });

    it('should handle missing categories gracefully', async () => {
      // Mock incomplete categories
      global.mockPrisma.metricCategory.findMany.mockResolvedValue([
        { id: '1', name: 'Business Value', display_order: 1, is_central: true }
      ]);

      const response = await request(app)
        .get('/api/categories')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Incomplete category configuration');
    });
  });

  describe('Forrester framework compliance', () => {
    it('should maintain Business Value centrality per framework', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const businessValueCategory = response.body.find((cat: any) => cat.name === 'Business Value');

      expect(businessValueCategory).toBeDefined();
      expect(businessValueCategory.is_central).toBe(true);
      expect(businessValueCategory.display_order).toBe(1);
    });

    it('should include all MAD framework categories in correct order', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const expectedOrder = [
        { name: 'Business Value', order: 1, central: true },
        { name: 'Quality', order: 2, central: false },
        { name: 'Efficiency', order: 3, central: false },
        { name: 'Engagement', order: 4, central: false },
        { name: 'Progress', order: 5, central: false }
      ];

      expectedOrder.forEach((expected, index) => {
        const category = response.body[index];
        expect(category.name).toBe(expected.name);
        expect(category.display_order).toBe(expected.order);
        expect(category.is_central).toBe(expected.central);
      });
    });

    it('should reflect team health focus in engagement metrics', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const engagementCategory = response.body.find((cat: any) => cat.name === 'Engagement');

      expect(engagementCategory).toBeDefined();
      expect(engagementCategory.health_summary.total_metrics).toBeGreaterThan(0);
    });
  });

  describe('constitutional compliance', () => {
    it('should support flow-based measurement across categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      // All categories should have metrics (supporting flow measurement)
      response.body.forEach((category: any) => {
        expect(category.health_summary.total_metrics).toBeGreaterThan(0);
      });

      // Business Value should have metrics from other categories feeding into it
      const businessValueCategory = response.body.find((cat: any) => cat.name === 'Business Value');
      expect(businessValueCategory.health_summary.total_metrics).toBeGreaterThanOrEqual(3);
    });

    it('should enable simple progress tracking through health summaries', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      response.body.forEach((category: any) => {
        const healthSummary = category.health_summary;

        // Health summaries enable quick assessment
        const healthPercentage = (healthSummary.healthy_count / healthSummary.total_metrics) * 100;
        expect(healthPercentage).toBeGreaterThanOrEqual(0);
        expect(healthPercentage).toBeLessThanOrEqual(100);

        // Should provide immediate visual indicators
        const hasUnhealthyMetrics = healthSummary.warning_count > 0 || healthSummary.critical_count > 0;
        expect(typeof hasUnhealthyMetrics).toBe('boolean');
      });
    });
  });

  describe('performance requirements', () => {
    it('should respond quickly for dashboard overview', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/categories')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500); // 500ms for category overview
    });

    it('should handle concurrent category requests efficiently', async () => {
      // Simulate multiple dashboard users
      const requests = Array.from({ length: 20 }, () =>
        request(app).get('/api/categories')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(5);
      });
    });
  });

  describe('data consistency', () => {
    it('should maintain referential integrity with metrics', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      // Health summary counts should reflect actual metric data
      response.body.forEach((category: any) => {
        const healthSummary = category.health_summary;

        // Total should never be negative
        expect(healthSummary.total_metrics).toBeGreaterThanOrEqual(0);

        // Individual counts should never exceed total
        expect(healthSummary.healthy_count).toBeLessThanOrEqual(healthSummary.total_metrics);
        expect(healthSummary.warning_count).toBeLessThanOrEqual(healthSummary.total_metrics);
        expect(healthSummary.critical_count).toBeLessThanOrEqual(healthSummary.total_metrics);
      });
    });
  });
});