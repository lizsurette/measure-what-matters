import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function migrate(): Promise<void> {
  try {
    console.log('🔄 Running database migrations...');

    // Run Prisma migrations
    execSync('npx prisma migrate dev --name init', {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function reset(): Promise<void> {
  try {
    console.log('🔄 Resetting database...');

    execSync('npx prisma migrate reset --force', {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function status(): Promise<void> {
  try {
    console.log('🔍 Checking migration status...');

    execSync('npx prisma migrate status', {
      stdio: 'inherit',
      cwd: process.cwd()
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'reset':
    void reset();
    break;
  case 'status':
    void status();
    break;
  default:
    void migrate();
}