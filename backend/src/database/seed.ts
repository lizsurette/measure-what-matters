import { PrismaClient, HealthStatus, DataSourceType, CollectionFrequency } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');

    // Clean existing data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cleaning existing data...');
      await prisma.timeSeriesData.deleteMany();
      await prisma.healthIndicator.deleteMany();
      await prisma.metricOverlay.deleteMany();
      await prisma.calculationMethod.deleteMany();
      await prisma.metric.deleteMany();
      await prisma.dataSource.deleteMany();
      await prisma.metricCategory.deleteMany();
      await prisma.dashboard.deleteMany();
    }

    // Seed MAD Framework Categories
    console.log('📊 Creating metric categories...');
    const categories = await Promise.all([
      prisma.metricCategory.create({
        data: {
          name: 'Business Value',
          displayOrder: 1,
          description: 'Metrics that measure business outcomes and customer value delivery',
          colorScheme: { primary: '#059669', secondary: '#10b981', accent: '#6ee7b7' },
          isCentral: true
        }
      }),
      prisma.metricCategory.create({
        data: {
          name: 'Quality',
          displayOrder: 2,
          description: 'Metrics that measure software quality and reliability',
          colorScheme: { primary: '#dc2626', secondary: '#ef4444', accent: '#fca5a5' },
          isCentral: false
        }
      }),
      prisma.metricCategory.create({
        data: {
          name: 'Efficiency',
          displayOrder: 3,
          description: 'Metrics that measure development and delivery efficiency',
          colorScheme: { primary: '#2563eb', secondary: '#3b82f6', accent: '#93c5fd' },
          isCentral: false
        }
      }),
      prisma.metricCategory.create({
        data: {
          name: 'Engagement',
          displayOrder: 4,
          description: 'Metrics that measure team and customer engagement',
          colorScheme: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#c4b5fd' },
          isCentral: false
        }
      }),
      prisma.metricCategory.create({
        data: {
          name: 'Progress',
          displayOrder: 5,
          description: 'Metrics that measure continuous improvement and trends',
          colorScheme: { primary: '#ea580c', secondary: '#f97316', accent: '#fdba74' },
          isCentral: false
        }
      })
    ]);

    console.log(`✅ Created ${categories.length} metric categories`);

    // Seed Data Sources
    console.log('🔌 Creating data sources...');
    const dataSources = await Promise.all([
      prisma.dataSource.create({
        data: {
          name: 'GitHub API',
          type: 'api' as DataSourceType,
          connectionConfig: {
            endpoint: 'https://api.github.com',
            authType: 'token',
            rateLimit: 5000
          },
          collectionFrequency: 'daily' as CollectionFrequency,
          isActive: true,
          retryCount: 0
        }
      }),
      prisma.dataSource.create({
        data: {
          name: 'Jira Integration',
          type: 'api' as DataSourceType,
          connectionConfig: {
            endpoint: 'https://example.atlassian.net/rest/api/3',
            authType: 'basic',
            rateLimit: 1000
          },
          collectionFrequency: 'daily' as CollectionFrequency,
          isActive: true,
          retryCount: 0
        }
      }),
      prisma.dataSource.create({
        data: {
          name: 'Typeform Survey API',
          type: 'api' as DataSourceType,
          connectionConfig: {
            endpoint: 'https://api.typeform.com/forms',
            authType: 'bearer',
            rateLimit: 500
          },
          collectionFrequency: 'daily' as CollectionFrequency,
          isActive: true,
          retryCount: 0
        }
      }),
      prisma.dataSource.create({
        data: {
          name: 'Manual Entry',
          type: 'manual' as DataSourceType,
          connectionConfig: {},
          collectionFrequency: 'manual' as CollectionFrequency,
          isActive: true,
          retryCount: 0
        }
      })
    ]);

    console.log(`✅ Created ${dataSources.length} data sources`);

    // Seed Sample Metrics
    console.log('📈 Creating sample metrics...');

    // Business Value Metrics
    const businessValueMetrics = await Promise.all([
      prisma.metric.create({
        data: {
          name: 'Net Promoter Score',
          categoryId: categories[0].id, // Business Value
          value: 42.5,
          unit: 'score',
          calculationMethod: 'Survey responses: (% Promoters - % Detractors)',
          dataSourceId: dataSources[2].id, // Typeform
          healthStatus: 'yellow' as HealthStatus,
          isLeadingIndicator: false,
          industryThresholdLow: parseFloat(process.env.DEFAULT_NPS_RED || '10'),
          industryThresholdMedium: parseFloat(process.env.DEFAULT_NPS_YELLOW || '30'),
          industryThresholdHigh: parseFloat(process.env.DEFAULT_NPS_GREEN || '50'),
          lastCalculatedAt: new Date()
        }
      }),
      prisma.metric.create({
        data: {
          name: 'Customer Satisfaction Score',
          categoryId: categories[0].id,
          value: 4.2,
          unit: 'rating',
          calculationMethod: 'Average of customer satisfaction ratings (1-5 scale)',
          dataSourceId: dataSources[2].id,
          healthStatus: 'green' as HealthStatus,
          isLeadingIndicator: false,
          industryThresholdLow: 3.0,
          industryThresholdMedium: 3.5,
          industryThresholdHigh: 4.0,
          lastCalculatedAt: new Date()
        }
      })
    ]);

    // Quality Metrics
    const qualityMetrics = await Promise.all([
      prisma.metric.create({
        data: {
          name: 'Deployment Success Rate',
          categoryId: categories[1].id, // Quality
          value: 94.2,
          unit: 'percentage',
          calculationMethod: 'Successful deployments / Total deployments * 100',
          dataSourceId: dataSources[0].id, // GitHub
          healthStatus: 'yellow' as HealthStatus,
          isLeadingIndicator: true,
          industryThresholdLow: parseFloat(process.env.DEFAULT_DEPLOYMENT_SUCCESS_RED || '85'),
          industryThresholdMedium: parseFloat(process.env.DEFAULT_DEPLOYMENT_SUCCESS_YELLOW || '90'),
          industryThresholdHigh: parseFloat(process.env.DEFAULT_DEPLOYMENT_SUCCESS_GREEN || '95'),
          lastCalculatedAt: new Date()
        }
      }),
      prisma.metric.create({
        data: {
          name: 'Mean Time to Recovery',
          categoryId: categories[1].id,
          value: 2.3,
          unit: 'hours',
          calculationMethod: 'Average time from incident detection to resolution',
          dataSourceId: dataSources[1].id, // Jira
          healthStatus: 'green' as HealthStatus,
          isLeadingIndicator: false,
          industryThresholdLow: 8.0,
          industryThresholdMedium: 4.0,
          industryThresholdHigh: 2.0,
          lastCalculatedAt: new Date()
        }
      })
    ]);

    // Add metrics for other categories...
    const efficiencyMetrics = await Promise.all([
      prisma.metric.create({
        data: {
          name: 'Lead Time',
          categoryId: categories[2].id, // Efficiency
          value: 3.5,
          unit: 'days',
          calculationMethod: 'Average time from commit to production deployment',
          dataSourceId: dataSources[0].id,
          healthStatus: 'green' as HealthStatus,
          isLeadingIndicator: true,
          industryThresholdLow: 7.0,
          industryThresholdMedium: 5.0,
          industryThresholdHigh: 3.0,
          lastCalculatedAt: new Date()
        }
      })
    ]);

    const engagementMetrics = await Promise.all([
      prisma.metric.create({
        data: {
          name: 'Team Velocity',
          categoryId: categories[3].id, // Engagement
          value: 28.0,
          unit: 'story points',
          calculationMethod: 'Average story points completed per sprint',
          dataSourceId: dataSources[1].id,
          healthStatus: 'green' as HealthStatus,
          isLeadingIndicator: true,
          industryThresholdLow: 15.0,
          industryThresholdMedium: 20.0,
          industryThresholdHigh: 25.0,
          lastCalculatedAt: new Date()
        }
      })
    ]);

    const progressMetrics = await Promise.all([
      prisma.metric.create({
        data: {
          name: 'Code Coverage',
          categoryId: categories[4].id, // Progress
          value: 87.5,
          unit: 'percentage',
          calculationMethod: 'Lines of code covered by tests / Total lines of code * 100',
          dataSourceId: dataSources[0].id,
          healthStatus: 'green' as HealthStatus,
          isLeadingIndicator: true,
          industryThresholdLow: 60.0,
          industryThresholdMedium: 75.0,
          industryThresholdHigh: 85.0,
          lastCalculatedAt: new Date()
        }
      })
    ]);

    const allMetrics = [
      ...businessValueMetrics,
      ...qualityMetrics,
      ...efficiencyMetrics,
      ...engagementMetrics,
      ...progressMetrics
    ];

    console.log(`✅ Created ${allMetrics.length} sample metrics`);

    // Create sample time series data for trends
    console.log('📊 Creating time series data...');
    const timeSeriesPromises = [];

    for (const metric of allMetrics) {
      // Create 30 days of sample data
      for (let i = 29; i >= 0; i--) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - i);

        // Generate realistic trending data
        const baseValue = Number(metric.value);
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const trendValue = baseValue + (baseValue * variation);

        timeSeriesPromises.push(
          prisma.timeSeriesData.create({
            data: {
              metricId: metric.id,
              value: Math.max(0, trendValue), // Ensure non-negative
              timestamp,
              isEstimated: i > 25 ? Math.random() > 0.8 : false, // Some estimated values
              dataQualityScore: i > 25 ? 0.8 : 1.0
            }
          })
        );
      }
    }

    await Promise.all(timeSeriesPromises);
    console.log(`✅ Created ${timeSeriesPromises.length} time series data points`);

    // Create health indicators
    console.log('🎯 Creating health indicators...');
    const healthIndicators = allMetrics.map(metric =>
      prisma.healthIndicator.create({
        data: {
          metricId: metric.id,
          status: metric.healthStatus,
          thresholdApplied: metric.healthStatus === 'red' ? metric.industryThresholdLow :
                           metric.healthStatus === 'yellow' ? metric.industryThresholdMedium :
                           metric.industryThresholdHigh,
          statusReason: `${metric.name} is ${metric.value}${metric.unit}, ${
            metric.healthStatus === 'green' ? 'meeting targets' :
            metric.healthStatus === 'yellow' ? 'needs improvement' : 'below critical threshold'
          }`,
          calculatedAt: new Date()
        }
      })
    );

    await Promise.all(healthIndicators);
    console.log(`✅ Created ${healthIndicators.length} health indicators`);

    // Create default dashboard configuration
    console.log('🖥️ Creating default dashboard...');
    await prisma.dashboard.create({
      data: {
        name: 'Default Dashboard',
        layoutConfig: {
          gridColumns: 12,
          categoryPositions: {
            businessValue: { x: 4, y: 2, width: 4, height: 3 },
            quality: { x: 0, y: 0, width: 4, height: 2 },
            efficiency: { x: 8, y: 0, width: 4, height: 2 },
            engagement: { x: 0, y: 5, width: 4, height: 2 },
            progress: { x: 8, y: 5, width: 4, height: 2 }
          }
        },
        filterSettings: {
          defaultTimeRange: 'month',
          visibleCategories: ['business_value', 'quality', 'efficiency', 'engagement', 'progress']
        },
        refreshInterval: 86400, // Daily refresh per clarification
        isDefault: true,
        createdBy: 'system'
      }
    });

    console.log('✅ Created default dashboard configuration');
    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  void seed();
}

export default seed;