import request from 'supertest';
import { PrismaClient } from '@prisma/client';

// Mock the app - will be created during implementation
let app: any;

// Mock AI recommendations matching OpenAPI Recommendation schema
const mockRecommendations = {
  metric_id: '550e8400-e29b-41d4-a716-446655440001',
  current_status: 'red',
  recommendations: [
    {
      priority: 'high',
      action: 'Improve customer onboarding flow',
      description: 'Current NPS is 15, well below industry standard of 50+. Focus on reducing time-to-value in onboarding process.',
      estimated_impact: 'high',
      implementation_effort: 'medium',
      related_metrics: ['550e8400-e29b-41d4-a716-446655440002']
    },
    {
      priority: 'medium',
      action: 'Conduct customer satisfaction survey',
      description: 'Gather qualitative feedback to understand specific pain points driving low NPS scores.',
      estimated_impact: 'medium',
      implementation_effort: 'low',
      related_metrics: []
    }
  ]
};

describe('GET /api/metrics/:id/recommendations', () => {
  const poorHealthMetricId = '550e8400-e29b-41d4-a716-446655440001'; // Red status
  const healthyMetricId = '550e8400-e29b-41d4-a716-446655440002'; // Green status
  const invalidMetricId = '550e8400-e29b-41d4-a716-446655440999';

  beforeAll(() => {
    // App will be imported during implementation
    // app = require('../../src/app').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should return AI recommendations for poor health metrics', async () => {
      // This test will fail until implementation exists
      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Validate response structure matches OpenAPI spec
      expect(response.body).toHaveProperty('metric_id');
      expect(response.body).toHaveProperty('current_status');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body.metric_id).toBe(poorHealthMetricId);
      expect(['red', 'yellow', 'green']).toContain(response.body.current_status);
      expect(Array.isArray(response.body.recommendations)).toBe(true);

      // Validate each recommendation structure
      if (response.body.recommendations.length > 0) {
        const recommendation = response.body.recommendations[0];
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('action');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('estimated_impact');
        expect(recommendation).toHaveProperty('implementation_effort');

        // Validate enum values
        expect(['high', 'medium', 'low']).toContain(recommendation.priority);
        expect(['high', 'medium', 'low']).toContain(recommendation.estimated_impact);
        expect(['high', 'medium', 'low']).toContain(recommendation.implementation_effort);

        // Validate content quality
        expect(recommendation.action.length).toBeGreaterThan(10);
        expect(recommendation.description.length).toBeGreaterThan(20);
      }
    });

    it('should return 204 for healthy metrics with no recommendations needed', async () => {
      const response = await request(app)
        .get(`/api/metrics/${healthyMetricId}/recommendations`)
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should prioritize recommendations by impact and effort', async () => {
      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      if (response.body.recommendations.length > 1) {
        const recommendations = response.body.recommendations;

        // High priority recommendations should come first
        let lastPriorityScore = 3; // high=3, medium=2, low=1
        recommendations.forEach((rec: any) => {
          const priorityScore = rec.priority === 'high' ? 3 : rec.priority === 'medium' ? 2 : 1;
          expect(priorityScore).toBeLessThanOrEqual(lastPriorityScore);
          lastPriorityScore = priorityScore;
        });
      }
    });

    it('should include related metrics for cross-category insights', async () => {
      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      response.body.recommendations.forEach((rec: any) => {
        if (rec.related_metrics && rec.related_metrics.length > 0) {
          // Each related metric should be a valid UUID
          rec.related_metrics.forEach((metricId: string) => {
            expect(metricId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          });
        }
      });
    });
  });

  describe('error scenarios', () => {
    it('should return 404 for non-existent metric ID', async () => {
      const response = await request(app)
        .get(`/api/metrics/${invalidMetricId}/recommendations`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Metric not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidUuid = 'not-a-valid-uuid';

      const response = await request(app)
        .get(`/api/metrics/${invalidUuid}/recommendations`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid metric ID format');
    });

    it('should handle AI service failures gracefully', async () => {
      // Mock AI service error
      const mockAIService = require('../../src/services/ai-recommendation.service');
      mockAIService.generateRecommendations = jest.fn().mockRejectedValue(new Error('OpenAI API unavailable'));

      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect('Content-Type', /json/)
        .expect(503);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('AI recommendation service temporarily unavailable');
    });

    it('should return 500 when database connection fails', async () => {
      // Mock database error
      global.mockPrisma.metric.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('AI quality and constitutional compliance', () => {
    it('should generate contextual recommendations per clarification', async () => {
      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      response.body.recommendations.forEach((rec: any) => {
        // Contextual: should reference specific metric values or thresholds
        expect(rec.description.toLowerCase()).toMatch(/\b\d+(\.\d+)?(%|point|score)?\b/);

        // Actionable: should contain specific verbs
        expect(rec.action.toLowerCase()).toMatch(/\b(improve|increase|reduce|implement|optimize|enhance|focus)\b/);

        // Business-focused: avoid technical jargon
        expect(rec.description.toLowerCase()).not.toMatch(/\b(api|database|code|server|deployment)\b/);
      });
    });

    it('should respect privacy by design - no personal data in recommendations', async () => {
      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toMatch(/email|phone|address|name|personal|user.*id/i);
    });

    it('should align with Forrester framework categories', async () => {
      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      response.body.recommendations.forEach((rec: any) => {
        // Should reference relevant Forrester categories
        const description = rec.description.toLowerCase();
        const hasFrameworkReference =
          description.includes('quality') ||
          description.includes('efficiency') ||
          description.includes('engagement') ||
          description.includes('business value') ||
          description.includes('progress');

        expect(hasFrameworkReference || rec.related_metrics.length > 0).toBe(true);
      });
    });
  });

  describe('performance and caching', () => {
    it('should respond within acceptable time for AI generation', async () => {
      const startTime = Date.now();

      await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds for AI generation
    });

    it('should cache recommendations to avoid redundant AI calls', async () => {
      // First call
      await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      const startTime = Date.now();

      // Second call should be faster (cached)
      await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500); // Should be much faster when cached
    });
  });

  describe('integration with other systems', () => {
    it('should consider external data sources in recommendations', async () => {
      const response = await request(app)
        .get(`/api/metrics/${poorHealthMetricId}/recommendations`)
        .expect(200);

      // Recommendations should reference data collection improvements
      const hasDataSourceRecommendation = response.body.recommendations.some((rec: any) =>
        rec.description.toLowerCase().includes('data') ||
        rec.description.toLowerCase().includes('metric') ||
        rec.description.toLowerCase().includes('measurement')
      );

      expect(hasDataSourceRecommendation).toBe(true);
    });
  });
});