import { PrismaClient, MetricCategory } from '@prisma/client';

export class MetricCategoryModel {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<MetricCategory[]> {
    return this.prisma.metricCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        metrics: {
          select: {
            id: true,
            healthStatus: true
          }
        }
      }
    });
  }

  async findById(id: string): Promise<MetricCategory | null> {
    return this.prisma.metricCategory.findUnique({
      where: { id },
      include: {
        metrics: true
      }
    });
  }

  async validateForresterCategories(categories: MetricCategory[]): Promise<boolean> {
    const requiredCategories = ['Business Value', 'Quality', 'Efficiency', 'Engagement', 'Progress'];
    const categoryNames = categories.map(c => c.name);

    return requiredCategories.every(required => categoryNames.includes(required)) &&
           categories.length === 5;
  }

  async validateCentralCategory(categories: MetricCategory[]): Promise<boolean> {
    const centralCategories = categories.filter(c => c.isCentral);
    return centralCategories.length === 1 && centralCategories[0].name === 'Business Value';
  }

  async getCategoriesWithHealthSummary(): Promise<Array<MetricCategory & {
    health_summary: {
      total_metrics: number;
      healthy_count: number;
      warning_count: number;
      critical_count: number;
    };
  }>> {
    const categories = await this.findAll();

    return categories.map(category => {
      const healthSummary = {
        total_metrics: category.metrics.length,
        healthy_count: category.metrics.filter(m => m.healthStatus === 'green').length,
        warning_count: category.metrics.filter(m => m.healthStatus === 'yellow').length,
        critical_count: category.metrics.filter(m => m.healthStatus === 'red').length
      };

      return {
        ...category,
        health_summary: healthSummary
      };
    });
  }
}