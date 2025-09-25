# Quick Start: Product Health Dashboard

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Docker and docker-compose (recommended)

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd measure-what-matters
   npm install
   ```

2. **Start Services** (using Docker)
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Dashboard**
   - Open http://localhost:3000
   - Default view shows all five metric categories
   - Sample data is pre-loaded for demonstration

## Feature Validation

### Core User Scenarios

#### Scenario 1: View Dashboard Overview
**Test Steps:**
1. Navigate to http://localhost:3000
2. Verify five metric category sections are visible:
   - Business Value (center position)
   - Quality, Efficiency, Engagement, Progress (surrounding)
3. Check that each category shows health indicators (red/yellow/green)
4. Confirm current metric values are displayed

**Expected Result:** Dashboard loads in <2 seconds with all categories visible

#### Scenario 2: Explore Metric Calculation
**Test Steps:**
1. Hover over any metric (e.g., "Net Promoter Score")
2. Click to open detailed overlay
3. Verify calculation methodology is shown
4. Check data source information is displayed
5. Review collection method details

**Expected Result:** Overlay shows complete transparency about metric derivation

#### Scenario 3: Time Period Filtering
**Test Steps:**
1. Locate time period selector (daily/weekly/monthly/quarterly)
2. Select different time period (e.g., "Quarter")
3. Verify all metrics update to reflect selected timeframe
4. Check trend indicators show directional changes
5. Confirm data freshness timestamps update

**Expected Result:** All metrics refresh within 1 second of filter change

#### Scenario 4: Handle Missing Data
**Test Steps:**
1. Simulate external service unavailability (disconnect GitHub API)
2. Wait for next metric update cycle
3. Verify "last known good values" are shown with timestamps
4. Check clear indication of data staleness
5. Confirm dashboard remains functional

**Expected Result:** Dashboard degrades gracefully with clear data freshness indicators

#### Scenario 5: AI Recommendations
**Test Steps:**
1. Navigate to a metric with poor health (red status)
2. Click on alerts/recommendations section
3. Verify AI-generated suggestions are displayed
4. Check recommendations are contextual to specific metric
5. Confirm actionable next steps are provided

**Expected Result:** Dynamic contextual suggestions help improve metric health

### Integration Verification

#### External System Health Check
```bash
# Test all data source connections
curl http://localhost:3000/api/integrations/status

# Expected response includes:
# - GitHub API: active/error
# - Jira Integration: active/error
# - CI/CD Pipeline: active/error
# - Survey Tools: active/error
```

#### Metric Collection Test
```bash
# Trigger manual metric collection
curl -X POST http://localhost:3000/api/metrics/collect

# Verify daily update frequency
curl http://localhost:3000/api/metrics?include_trends=true
```

### Performance Validation

#### Load Time Testing
```bash
# Install performance testing tools
npm install -g lighthouse

# Test dashboard performance
lighthouse http://localhost:3000 --only-categories=performance

# Target: >90 performance score
```

#### Concurrent User Testing
```bash
# Install load testing tool
npm install -g artillery

# Run concurrent user simulation
artillery run tests/load-test.yml

# Target: 50+ concurrent users with <2s response time
```

## Troubleshooting

### Common Issues

#### Dashboard Not Loading
- Check PostgreSQL is running: `docker ps | grep postgres`
- Verify database migrations: `npm run db:status`
- Review application logs: `npm run dev --verbose`

#### Metrics Showing Stale Data
- Check Redis cache: `redis-cli info memory`
- Verify external API credentials in `.env`
- Review data source status: `curl http://localhost:3000/api/integrations/status`

#### Slow Dashboard Performance
- Clear Redis cache: `redis-cli flushall`
- Check database query performance: `npm run db:explain`
- Verify network connectivity to external services

#### Missing AI Recommendations
- Verify OpenAI API key in environment variables
- Check API quota and rate limits
- Review logs for AI service errors

### Debugging Tools

#### Database Inspection
```bash
# Connect to local database
psql postgresql://localhost:5432/dashboard_dev

# Common queries
SELECT name, value, health_status FROM metrics;
SELECT * FROM data_sources WHERE is_active = true;
```

#### Redis Cache Inspection
```bash
# Connect to Redis
redis-cli

# Check cached values
KEYS metric:*
GET metric:last_known_good:*
```

#### API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Metrics endpoint
curl http://localhost:3000/api/metrics

# Specific metric details
curl http://localhost:3000/api/metrics/{metric-id}
```

## Next Steps

After successful validation:

1. **Configure Production Environment**
   - Set up production database
   - Configure external service integrations
   - Set up monitoring and alerting

2. **Customize Metrics**
   - Add organization-specific metrics
   - Configure industry threshold values
   - Set up custom data sources

3. **Team Onboarding**
   - Train users on dashboard navigation
   - Set up access controls and permissions
   - Create team-specific views and filters

4. **Optimization**
   - Fine-tune AI recommendation prompts
   - Optimize query performance for production data volume
   - Configure automated backup and recovery

## Support

- **Documentation**: `/docs` directory contains detailed guides
- **API Reference**: Available at http://localhost:3000/api/docs when running
- **Issues**: Report bugs and feature requests via GitHub issues
- **Contributing**: See CONTRIBUTING.md for development guidelines