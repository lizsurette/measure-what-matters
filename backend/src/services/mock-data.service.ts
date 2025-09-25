// Mock data service for testing without database connection
export class MockDataService {
  static getMockCategories() {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Business Value',
        display_order: 1,
        is_central: true,
        health_summary: {
          total_metrics: 5,
          healthy_count: 2,
          warning_count: 2,
          critical_count: 1
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Quality',
        display_order: 2,
        is_central: false,
        health_summary: {
          total_metrics: 8,
          healthy_count: 6,
          warning_count: 1,
          critical_count: 1
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'Efficiency',
        display_order: 3,
        is_central: false,
        health_summary: {
          total_metrics: 7,
          healthy_count: 5,
          warning_count: 2,
          critical_count: 0
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'Engagement',
        display_order: 4,
        is_central: false,
        health_summary: {
          total_metrics: 6,
          healthy_count: 3,
          warning_count: 2,
          critical_count: 1
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        name: 'Progress',
        display_order: 5,
        is_central: false,
        health_summary: {
          total_metrics: 9,
          healthy_count: 7,
          warning_count: 1,
          critical_count: 1
        }
      }
    ];
  }

  static getMockMetrics() {
    return {
      metrics: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Net Promoter Score',
          category: 'business_value',
          value: 42.5,
          unit: 'score',
          health_status: 'yellow',
          is_leading_indicator: false,
          last_updated: '2025-09-23T10:00:00.000Z',
          data_freshness: 'current'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Deployment Success Rate',
          category: 'quality',
          value: 95.2,
          unit: 'percentage',
          health_status: 'green',
          is_leading_indicator: true,
          last_updated: '2025-09-23T10:00:00.000Z',
          data_freshness: 'current'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Lead Time',
          category: 'efficiency',
          value: 3.5,
          unit: 'days',
          health_status: 'green',
          is_leading_indicator: true,
          last_updated: '2025-09-23T10:00:00.000Z',
          data_freshness: 'current'
        }
      ],
      last_updated: new Date().toISOString()
    };
  }

  static getMockDashboardConfig() {
    return {
      layout: {
        grid_columns: 12,
        category_positions: {
          business_value: { x: 4, y: 2, width: 4, height: 3 },
          quality: { x: 0, y: 0, width: 4, height: 2 },
          efficiency: { x: 8, y: 0, width: 4, height: 2 },
          engagement: { x: 0, y: 5, width: 4, height: 2 },
          progress: { x: 8, y: 5, width: 4, height: 2 }
        }
      },
      filters: {
        default_time_range: 'month',
        visible_categories: ['business_value', 'quality', 'efficiency', 'engagement', 'progress']
      },
      refresh_settings: {
        auto_refresh: true,
        interval_seconds: 86400
      }
    };
  }

  static getMockIntegrationStatus() {
    return {
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
      last_check: new Date().toISOString()
    };
  }
}