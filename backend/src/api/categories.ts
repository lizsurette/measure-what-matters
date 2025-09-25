import { Router, Request, Response } from 'express';
import { models } from '../models';
import { MockDataService } from '../services/mock-data.service';

const router = Router();

// GET /api/categories - Forrester framework categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await models.metricCategory.getCategoriesWithHealthSummary();

    // Validate we have all 5 Forrester categories
    if (!await models.metricCategory.validateForresterCategories(categories)) {
      return res.status(500).json({
        error: 'Incomplete category configuration',
        message: 'Missing required Forrester framework categories'
      });
    }

    // Transform for API response
    const result = categories.map(category => ({
      id: category.id,
      name: category.name,
      display_order: category.displayOrder,
      is_central: category.isCentral,
      health_summary: category.health_summary
    }));

    res.json(result);

  } catch (error) {
    // Use mock data if database unavailable
    console.log('Using mock categories (database unavailable)');
    const mockCategories = MockDataService.getMockCategories();
    res.json(mockCategories);
  }
});

export default router;