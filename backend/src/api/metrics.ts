import { Router, Request, Response } from 'express';
import { MetricService } from '../services/metric.service';
import { MockDataService } from '../services/mock-data.service';
import { z } from 'zod';

const router = Router();
const metricService = new MetricService();

// Validation schemas
const metricsQuerySchema = z.object({
  category: z.enum(['business_value', 'quality', 'efficiency', 'engagement', 'progress']).optional(),
  include_trends: z.string().transform(val => val === 'true').optional()
});

const metricIdSchema = z.object({
  id: z.string().uuid('Invalid metric ID format')
});

const historyQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month')
});

// GET /api/metrics - Main dashboard endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Validate query parameters
    const validation = metricsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { category, include_trends } = validation.data;

    // Convert category for internal use
    const categoryMapping: Record<string, string> = {
      'business_value': 'Business Value',
      'quality': 'Quality',
      'efficiency': 'Efficiency',
      'engagement': 'Engagement',
      'progress': 'Progress'
    };

    const options = {
      category: category ? categoryMapping[category] : undefined,
      includeTrends: include_trends || false
    };

    const result = await metricService.getAllMetrics(options);

    // Performance requirement: <2s for dashboard load
    const responseTime = Date.now() - startTime;
    if (responseTime > 2000) {
      console.warn(`Slow metrics response: ${responseTime}ms`);
    }

    res.json(result);

  } catch (error) {
    console.log('Using mock metrics (database unavailable)');
    const mockMetrics = MockDataService.getMockMetrics();

    // Apply category filter if specified
    if (category) {
      const categoryFilter = categoryMapping[category];
      if (mockMetrics.metrics) {
        mockMetrics.metrics = mockMetrics.metrics.filter(m => m.category === categoryFilter);
      }
    }

    res.json(mockMetrics);
  }
});

// GET /api/metrics/:id - Metric detail endpoint
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const validation = metricIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid metric ID format',
        details: validation.error.issues[0].message
      });
    }

    const { id } = validation.data;
    const metric = await metricService.getMetricById(id);

    res.json(metric);

  } catch (error) {
    if ((error as Error).message === 'Metric not found') {
      return res.status(404).json({
        error: 'Metric not found'
      });
    }

    console.error('Error fetching metric detail:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Failed to fetch metric'
    });
  }
});

// GET /api/metrics/:id/history - Metric history endpoint
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const paramValidation = metricIdSchema.safeParse(req.params);
    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid metric ID format'
      });
    }

    const queryValidation = historyQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'Invalid period parameter',
        details: 'Period must be one of: week, month, quarter, year'
      });
    }

    const { id } = paramValidation.data;
    const { period } = queryValidation.data;

    const history = await metricService.getMetricHistory(id, period);
    res.json(history);

  } catch (error) {
    if ((error as Error).message === 'Metric not found') {
      return res.status(404).json({
        error: 'Metric not found'
      });
    }

    console.error('Error fetching metric history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Failed to fetch metric history'
    });
  }
});

export default router;