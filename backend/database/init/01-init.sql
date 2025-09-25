-- Initialize database with proper permissions and extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant permissions to dashboard_user
GRANT ALL PRIVILEGES ON DATABASE dashboard_dev TO dashboard_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO dashboard_user;

-- Set timezone
SET timezone = 'UTC';