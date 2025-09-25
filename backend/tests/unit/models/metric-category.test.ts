import { PrismaClient } from '@prisma/client';

const mockPrisma = global.mockPrisma;

class MetricCategoryModel {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.metricCategory.findMany({
      orderBy: { displayOrder: 'asc' }
    });
  }

  async validateForresterCategories(categories: any[]): Promise<boolean> {
    const requiredCategories = ['Business Value', 'Quality', 'Efficiency', 'Engagement', 'Progress'];
    const categoryNames = categories.map(c => c.name);

    return requiredCategories.every(required => categoryNames.includes(required)) &&
           categories.length === 5;
  }

  async validateCentralCategory(categories: any[]): Promise<boolean> {
    const centralCategories = categories.filter(c => c.isCentral);
    return centralCategories.length === 1 && centralCategories[0].name === 'Business Value';
  }
}

describe('MetricCategory Model', () => {
  let categoryModel: MetricCategoryModel;

  const forresterCategories = [
    { id: '1', name: 'Business Value', displayOrder: 1, isCentral: true },
    { id: '2', name: 'Quality', displayOrder: 2, isCentral: false },
    { id: '3', name: 'Efficiency', displayOrder: 3, isCentral: false },
    { id: '4', name: 'Engagement', displayOrder: 4, isCentral: false },
    { id: '5', name: 'Progress', displayOrder: 5, isCentral: false }
  ];

  beforeEach(() => {
    categoryModel = new MetricCategoryModel(mockPrisma as any);
  });

  it('should return all categories in display order', async () => {
    mockPrisma.metricCategory.findMany.mockResolvedValue(forresterCategories);

    const result = await categoryModel.findAll();

    expect(mockPrisma.metricCategory.findMany).toHaveBeenCalledWith({
      orderBy: { displayOrder: 'asc' }
    });
    expect(result).toEqual(forresterCategories);
  });

  it('should validate complete Forrester framework categories', async () => {
    const isValid = await categoryModel.validateForresterCategories(forresterCategories);
    expect(isValid).toBe(true);

    const incomplete = forresterCategories.slice(0, 3);
    const isIncomplete = await categoryModel.validateForresterCategories(incomplete);
    expect(isIncomplete).toBe(false);
  });

  it('should ensure only Business Value is central', async () => {
    const isValid = await categoryModel.validateCentralCategory(forresterCategories);
    expect(isValid).toBe(true);
  });
});