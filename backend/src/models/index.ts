import { PrismaClient } from '@prisma/client';
import { MetricModel } from './metric';
import { MetricCategoryModel } from './metric-category';
import { DataSourceModel } from './data-source';
import { TimeSeriesDataModel } from './time-series-data';
import { HealthIndicatorModel } from './health-indicator';
import { DashboardModel } from './dashboard';

// Global Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Initialize all models with shared Prisma instance
export const models = {
  metric: new MetricModel(prisma),
  metricCategory: new MetricCategoryModel(prisma),
  dataSource: new DataSourceModel(prisma),
  timeSeriesData: new TimeSeriesDataModel(prisma),
  healthIndicator: new HealthIndicatorModel(prisma),
  dashboard: new DashboardModel(prisma),
  prisma // Export prisma instance for direct queries if needed
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default models;
export { prisma };