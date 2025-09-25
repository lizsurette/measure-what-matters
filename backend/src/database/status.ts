import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus(): Promise<void> {
  try {
    console.log('🔍 Checking database connection and status...');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `;

    console.log(`📊 Found ${tables.length} tables in database:`);
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });

    // Check metric categories
    try {
      const categoryCount = await prisma.metricCategory.count();
      console.log(`📈 Metric categories: ${categoryCount}`);
    } catch {
      console.log('⚠️  Metric categories table not found - run migrations');
    }

    // Check metrics
    try {
      const metricCount = await prisma.metric.count();
      console.log(`📊 Metrics: ${metricCount}`);
    } catch {
      console.log('⚠️  Metrics table not found - run migrations');
    }

    // Check data sources
    try {
      const dataSourceCount = await prisma.dataSource.count();
      console.log(`🔌 Data sources: ${dataSourceCount}`);
    } catch {
      console.log('⚠️  Data sources table not found - run migrations');
    }

  } catch (error) {
    console.error('❌ Database status check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void checkStatus();