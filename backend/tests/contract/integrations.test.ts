import request from 'supertest';

let app: any;

const mockIntegrationStatus = {
  sources: [
    {
      id: '550e8400-e29b-41d4-a716-446655440100',
      name: 'GitHub API',
      type: 'api',
      status: 'active',
      last_successful_fetch: '2025-09-23T09:45:00.000Z',
      collection_frequency: 'daily',
      error_message: null,
      retry_count: 0,
      next_retry: null
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      name: 'Jira Integration',
      type: 'api',
      status: 'error',
      last_successful_fetch: '2025-09-22T10:00:00.000Z',
      collection_frequency: 'daily',
      error_message: 'Authentication failed',
      retry_count: 3,
      next_retry: '2025-09-23T11:00:00.000Z'
    }
  ],
  last_check: '2025-09-23T10:00:00.000Z'
};

describe('GET /api/integrations/status', () => {
  beforeAll(() => {
    // App will be imported during implementation
  });

  it('should return integration status with correct structure', async () => {
    const response = await request(app)
      .get('/api/integrations/status')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('sources');
    expect(response.body).toHaveProperty('last_check');
    expect(Array.isArray(response.body.sources)).toBe(true);

    response.body.sources.forEach((source: any) => {
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('type');
      expect(source).toHaveProperty('status');
      expect(['active', 'error', 'inactive']).toContain(source.status);
      expect(['api', 'database', 'manual', 'calculated']).toContain(source.type);
    });
  });

  it('should handle failed integrations with last known good values per clarification', async () => {
    const response = await request(app)
      .get('/api/integrations/status')
      .expect(200);

    const failedSources = response.body.sources.filter((s: any) => s.status === 'error');

    failedSources.forEach((source: any) => {
      expect(source.last_successful_fetch).toBeDefined();
      expect(source.error_message).toBeDefined();
      expect(source.retry_count).toBeGreaterThan(0);
    });
  });

  it('should show retry information for failed integrations', async () => {
    const response = await request(app)
      .get('/api/integrations/status')
      .expect(200);

    const errorSources = response.body.sources.filter((s: any) => s.status === 'error');

    errorSources.forEach((source: any) => {
      expect(typeof source.retry_count).toBe('number');
      expect(source.retry_count).toBeGreaterThanOrEqual(0);

      if (source.retry_count > 0 && source.retry_count < 5) {
        expect(source.next_retry).toBeDefined();
      }
    });
  });
});