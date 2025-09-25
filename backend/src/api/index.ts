import { Router } from 'express';
import metricsRouter from './metrics';
import categoriesRouter from './categories';
import { models } from '../models';
import { MockDataService } from '../services/mock-data.service';

const router = Router();

// Mount API routes
router.use('/metrics', metricsRouter);
router.use('/categories', categoriesRouter);

// Quick remaining endpoints
router.get('/dashboard/config', async (req, res) => {
  try {
    const config = await models.dashboard.getDefaultConfig();
    res.json(config);
  } catch (error) {
    // Use mock data if database unavailable
    console.log('Using mock dashboard config (database unavailable)');
    res.json(MockDataService.getMockDashboardConfig());
  }
});

router.get('/integrations/status', async (req, res) => {
  try {
    const sources = await models.dataSource.getIntegrationStatus();
    res.json({
      sources,
      last_check: new Date().toISOString()
    });
  } catch (error) {
    // Use mock data if database unavailable
    console.log('Using mock integration status (database unavailable)');
    res.json(MockDataService.getMockIntegrationStatus());
  }
});

// AI recommendations endpoint - placeholder for now
router.get('/metrics/:id/recommendations', async (req, res) => {
  try {
    const metric = await models.metric.findById(req.params.id);
    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }

    // For now, return static recommendations based on health status
    if (metric.healthStatus === 'green') {
      return res.status(204).send();
    }

    const mockRecommendations = {
      metric_id: metric.id,
      current_status: metric.healthStatus,
      recommendations: [
        {
          priority: 'high',
          action: `Improve ${metric.name.toLowerCase()}`,
          description: `Current ${metric.name} is ${metric.value}${metric.unit}, below target threshold.`,
          estimated_impact: 'high',
          implementation_effort: 'medium',
          related_metrics: []
        }
      ]
    };

    res.json(mockRecommendations);
  } catch (error) {
    res.status(500).json({ error: 'AI recommendation service temporarily unavailable' });
  }
});

export default router;