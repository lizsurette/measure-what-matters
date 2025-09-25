import type {
  MetricCategory,
  Metric,
  MetricHistory,
  MetricRecommendations,
  DashboardConfig,
  IntegrationStatus
} from '../types';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout for faster fallback

      const response = await fetch(`${this.baseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${url}:`, error);
      throw error;
    }
  }

  // Metrics API
  async getMetrics(timeRange?: string): Promise<Metric[]> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return this.fetchWithErrorHandling<Metric[]>(`/metrics${params}`);
  }

  async getMetric(id: string): Promise<Metric> {
    return this.fetchWithErrorHandling<Metric>(`/metrics/${id}`);
  }

  async getMetricHistory(id: string, timeRange: string = '30d'): Promise<MetricHistory> {
    try {
      return await this.fetchWithErrorHandling<MetricHistory>(
        `/metrics/${id}/history?timeRange=${timeRange}`
      );
    } catch (error) {
      // Return mock historical data
      return this.generateMockHistory(id, timeRange);
    }
  }

  private generateMockHistory(metricId: string, timeRange: string): MetricHistory {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dataPoints: { timestamp: string; value: number; target?: number }[] = [];

    // Find the metric to get its current value and target
    const metric = mockCategories
      .flatMap(cat => cat.metrics)
      .find(m => m.id === metricId);

    const baseValue = metric?.value || 50;
    const target = metric?.target || baseValue * 1.2;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate realistic trend data based on metric type
      let value = baseValue;
      if (metric?.trend === 'up') {
        value = baseValue * (0.85 + (days - i) * 0.015 / days) + Math.random() * baseValue * 0.1;
      } else if (metric?.trend === 'down') {
        value = baseValue * (1.15 - (days - i) * 0.015 / days) + Math.random() * baseValue * 0.1;
      } else {
        value = baseValue * (0.95 + Math.random() * 0.1);
      }

      dataPoints.push({
        timestamp: date.toISOString(),
        value: Math.round(value * 100) / 100,
        target
      });
    }

    return {
      metric_id: metricId,
      data_points: dataPoints,
      period_start: dataPoints[0].timestamp,
      period_end: dataPoints[dataPoints.length - 1].timestamp
    };
  }

  async getMetricRecommendations(id: string): Promise<MetricRecommendations> {
    try {
      return await this.fetchWithErrorHandling<MetricRecommendations>(`/metrics/${id}/recommendations`);
    } catch (error) {
      console.warn('Failed to fetch recommendations, using mock data:', error);
      return this.generateMockRecommendations(id);
    }
  }

  private generateMockRecommendations(metricId: string): MetricRecommendations {
    const recommendations = mockRecommendations[metricId] || mockRecommendations['default'];

    // Get the metric to determine current status
    const metric = mockCategories.flatMap(cat => cat.metrics).find(m => m.id === metricId);
    const current_status = metric?.healthStatus || 'yellow';

    return {
      metric_id: metricId,
      current_status: current_status,
      recommendations: recommendations,
      generated_at: new Date().toISOString(),
      model_version: "mock-v1.0"
    };
  }

  // Categories API
  async getCategories(): Promise<MetricCategory[]> {
    try {
      const response = await this.fetchWithErrorHandling<any[]>('/categories');
      // Transform backend response to match frontend types, but use mock metrics
      return response.map((category, index) => {
        // Map backend categories to our mock categories by name
        const mockCategory = mockCategories.find(mock =>
          mock.name.toLowerCase() === category.name.toLowerCase()
        ) || mockCategories[index] || mockCategories[0];

        return {
          id: category.id,
          name: category.name,
          description: category.description || mockCategory.description,
          metrics: mockCategory.metrics, // Use mock metrics for now
          overall_health: mockCategory.overall_health,
          weight: mockCategory.weight
        };
      });
    } catch (error) {
      console.warn('Failed to fetch categories, using fallback data:', error);
      return mockCategories;
    }
  }

  private deriveHealthFromSummary(summary: any): 'green' | 'yellow' | 'red' {
    if (!summary) return 'green';
    const { healthy_count = 0, warning_count = 0, critical_count = 0 } = summary;

    if (critical_count > 0) return 'red';
    if (warning_count > 0) return 'yellow';
    return 'green';
  }

  async getCategory(id: string): Promise<MetricCategory> {
    return this.fetchWithErrorHandling<MetricCategory>(`/categories/${id}`);
  }

  // Dashboard API
  async getDashboardConfig(): Promise<DashboardConfig> {
    try {
      return await this.fetchWithErrorHandling<DashboardConfig>('/dashboard/config');
    } catch (error) {
      console.warn('Failed to fetch dashboard config, using fallback data:', error);
      return mockDashboardConfig;
    }
  }

  async updateDashboardConfig(config: Partial<DashboardConfig>): Promise<DashboardConfig> {
    return this.fetchWithErrorHandling<DashboardConfig>('/dashboard/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Integrations API
  async getIntegrationStatus(): Promise<IntegrationStatus> {
    return this.fetchWithErrorHandling<IntegrationStatus>('/integrations/status');
  }

  async refreshIntegrations(): Promise<void> {
    await this.fetchWithErrorHandling<void>('/integrations/refresh', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetchWithErrorHandling<{ status: string; timestamp: string }>('/health');
  }

  // Utility methods for mock data during development
  async getWithFallback<T>(
    apiCall: () => Promise<T>,
    fallbackData: T,
    fallbackMessage?: string
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      if (fallbackMessage) {
        console.warn(fallbackMessage, error);
      }
      return fallbackData;
    }
  }
}

// Mock data for development/testing
const mockCategories: MetricCategory[] = [
  {
    id: 'business-value',
    name: 'Business Value',
    description: 'Metrics that measure the business impact and value delivered',
    overall_health: 'yellow',
    weight: 0.25,
    metrics: [
      {
        id: 'nps-score',
        name: 'Net Promoter Score (NPS)',
        description: 'Customer satisfaction and loyalty metric based on survey responses',
        value: 52,
        unit: '',
        target: 50,
        healthStatus: 'green',
        category: 'Business Value',
        calculation_method: '% Promoters (9-10) - % Detractors (0-6) from survey responses',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 0.8,
        chartType: 'nps-breakdown',
        trendData: [35, 38, 40, 39, 42],
        npsStatus: 'Great',
        npsData: {
          currentBreakdown: {
            promoters: 65,
            passives: 22,
            detractors: 13,
            responseRate: 78,
            totalResponses: 1247
          },
          monthlyTrends: [
            { month: 'Jan', nps: 38, promoters: 52, passives: 34, detractors: 14, responses: 1045 },
            { month: 'Feb', nps: 42, promoters: 58, passives: 26, detractors: 16, responses: 1128 },
            { month: 'Mar', nps: 39, promoters: 55, passives: 29, detractors: 16, responses: 985 },
            { month: 'Apr', nps: 45, promoters: 62, passives: 21, detractors: 17, responses: 1203 },
            { month: 'May', nps: 52, promoters: 65, passives: 22, detractors: 13, responses: 1247 }
          ],
          segmentation: {
            'New Customers': { nps: 58, promoters: 68, detractors: 10, responses: 312 },
            'Existing Customers': { nps: 49, promoters: 63, detractors: 14, responses: 785 },
            'Enterprise': { nps: 61, promoters: 71, detractors: 10, responses: 150 },
            'SMB': { nps: 46, promoters: 61, detractors: 15, responses: 935 }
          },
          benchmarks: {
            industry: 31,
            competitors: 28,
            internal: 50
          },
          actionItems: {
            detractorFollowUp: 89,
            responseRate: 78,
            avgResponseTime: 2.1
          }
        }
      },
      {
        id: 'revenue-growth',
        name: 'Revenue Growth',
        description: 'Annual recurring revenue and growth performance tracking',
        value: 16.2,
        unit: '%',
        target: 15.0,
        healthStatus: 'green',
        category: 'Business Value',
        calculation_method: '(Current Period Revenue - Previous Period Revenue) / Previous Period Revenue * 100',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 0.4,
        chartType: 'clean-status',
        trendData: [10, 11, 12, 12.8, 12.5],
        revenueData: {
          current: {
            arr: 2400000,
            mrr: 200000,
            growthRate: 16.2,
            targetPerformance: 108,
            quarterlyGrowth: 24,
            yearlyGrowth: 45
          },
          breakdown: {
            newBusiness: 120000,
            expansion: 65000,
            renewals: 15000,
            churn: -25000
          },
          monthly: [
            { month: 'Jan', revenue: 1800000, growth: 10, newCustomers: 850000, existing: 950000 },
            { month: 'Feb', revenue: 1950000, growth: 11, newCustomers: 950000, existing: 1000000 },
            { month: 'Mar', revenue: 2100000, growth: 12, newCustomers: 1050000, existing: 1050000 },
            { month: 'Apr', revenue: 2250000, growth: 12.8, newCustomers: 1100000, existing: 1150000 },
            { month: 'May', revenue: 2400000, growth: 16.2, newCustomers: 1200000, existing: 1200000 }
          ],
          benchmarks: {
            industryGrowth: 12,
            competitorAvg: 14,
            topQuartile: 22
          },
          segments: {
            'Enterprise': { revenue: 1440000, growth: 18, percentage: 60 },
            'Mid-Market': { revenue: 720000, growth: 15, percentage: 30 },
            'SMB': { revenue: 240000, growth: 10, percentage: 10 }
          },
          channels: {
            'Direct Sales': { revenue: 1680000, growth: 20 },
            'Partner Channel': { revenue: 480000, growth: 12 },
            'Self-Service': { revenue: 240000, growth: 8 }
          },
          forecast: {
            q2Target: 2500000,
            q3Target: 2750000,
            q4Target: 3000000,
            yearEndTarget: 3200000,
            confidence: 85
          }
        }
      },
      {
        id: 'onboarding-success-rate',
        name: 'Customer Onboarding Success',
        description: 'Percentage of new users who complete core onboarding steps within first week',
        value: 67,
        unit: '%',
        target: 80,
        healthStatus: 'red',
        category: 'Business Value',
        calculation_method: 'COUNT(users_completing_core_steps) / COUNT(new_signups) * 100',
        last_updated: new Date().toISOString(),
        trend: 'down',
        change_percent: -2.1,
        chartType: 'onboarding-funnel',
        trendData: [72, 70, 69, 68, 67],
        onboardingData: {
          compositeScore: 78,
          components: {
            timeToValue: {
              score: 82,
              averageDays: 2.3,
              target: 2.0,
              description: 'Average days to first meaningful action'
            },
            featureAdoption: {
              score: 74,
              coreFeatureUsage: 74,
              target: 80,
              description: '% using 2+ core features in first 30 days'
            },
            earlyRetention: {
              score: 78,
              day30Retention: 78,
              target: 85,
              description: '% of users active 30 days after signup'
            }
          },
          funnel: {
            accountSetup: 95,
            profileCompletion: 87,
            firstDataImport: 82,
            firstDashboard: 67,
            shareCollaborate: 45
          },
          supportMetrics: {
            ticketsInFirst14Days: 23,
            timeToFirstSupport: 5.2,
            selfServiceUsage: 68
          }
        }
      },
      {
        id: 'service-reuse-rate',
        name: 'Service Adoption Rate',
        description: 'Percentage of customers actively using available service components',
        value: 78,
        unit: '%',
        target: 75,
        healthStatus: 'green',
        category: 'Business Value',
        calculation_method: 'COUNT(customers_using_services) / COUNT(total_active_customers) * 100',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 1.1,
        chartType: 'service-adoption',
        trendData: [74, 75, 76, 77, 78],
        serviceAdoptionData: {
          overallAdoption: 78,
          totalServices: 15,
          adoptedServices: 12,
          revenueImpact: {
            highAdopters: { revenue: 145, percentage: 65 },
            lowAdopters: { revenue: 89, percentage: 35 }
          },
          serviceBreakdown: [
            { name: 'User Management', adoption: 95, category: 'Core', trend: 'stable' },
            { name: 'Analytics Dashboard', adoption: 89, category: 'Core', trend: 'up' },
            { name: 'API Gateway', adoption: 87, category: 'Core', trend: 'up' },
            { name: 'Notification Service', adoption: 82, category: 'Enhanced', trend: 'up' },
            { name: 'File Storage', adoption: 78, category: 'Enhanced', trend: 'stable' },
            { name: 'Reporting Engine', adoption: 76, category: 'Enhanced', trend: 'up' },
            { name: 'Workflow Automation', adoption: 71, category: 'Advanced', trend: 'up' },
            { name: 'Data Export', adoption: 68, category: 'Enhanced', trend: 'stable' },
            { name: 'Integration Hub', adoption: 65, category: 'Advanced', trend: 'up' },
            { name: 'Custom Branding', adoption: 58, category: 'Premium', trend: 'up' },
            { name: 'AI Insights', adoption: 45, category: 'Premium', trend: 'up' },
            { name: 'Advanced Security', adoption: 42, category: 'Premium', trend: 'stable' },
            { name: 'Multi-tenant Support', adoption: 38, category: 'Enterprise', trend: 'up' },
            { name: 'Compliance Tools', adoption: 35, category: 'Enterprise', trend: 'stable' },
            { name: 'Custom Integrations', adoption: 28, category: 'Enterprise', trend: 'up' }
          ],
          monthlyTrends: [
            { month: 'Jan', adoption: 74, newAdopters: 156, churnedServices: 23 },
            { month: 'Feb', adoption: 75, newAdopters: 189, churnedServices: 18 },
            { month: 'Mar', adoption: 76, newAdopters: 203, churnedServices: 15 },
            { month: 'Apr', adoption: 77, newAdopters: 234, churnedServices: 12 },
            { month: 'May', adoption: 78, newAdopters: 267, churnedServices: 9 }
          ],
          segmentAnalysis: {
            'Enterprise': { adoption: 85, services: 12.3, revenue: 189 },
            'Mid-Market': { adoption: 76, services: 8.7, revenue: 134 },
            'SMB': { adoption: 71, services: 6.2, revenue: 98 }
          }
        }
      },
      {
        id: 'super-fans-identification',
        name: 'Super Fans Rate',
        description: 'Percentage of highly engaged power users identified through usage patterns',
        value: 16,
        unit: '%',
        target: 15,
        healthStatus: 'green',
        category: 'Business Value',
        calculation_method: 'COUNT(users WHERE engagement_score > 90 AND usage_frequency = daily) / COUNT(total_active_users) * 100',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 0.9,
        chartType: 'fan-segmentation',
        trendData: [14, 14.5, 15, 15.5, 16],
        superFanData: {
          totalUsers: 12500,
          fanSegmentation: {
            superFans: { count: 2000, percentage: 16, avgRevenue: 2400, retention: 95 },
            powerUsers: { count: 2875, percentage: 23, avgRevenue: 1650, retention: 87 },
            engagedUsers: { count: 3875, percentage: 31, avgRevenue: 1200, retention: 78 },
            casualUsers: { count: 3750, percentage: 30, avgRevenue: 890, retention: 65 }
          },
          businessImpact: {
            revenueContribution: {
              superFans: 42,
              powerUsers: 31,
              others: 27
            },
            referralRate: {
              superFans: 45,
              powerUsers: 18,
              others: 5
            },
            supportCost: {
              superFans: 125, // $ per user per month
              powerUsers: 180,
              others: 310
            }
          },
          behaviorMetrics: {
            avgSessionLength: {
              superFans: 45, // minutes
              powerUsers: 28,
              engagedUsers: 18,
              casualUsers: 8
            },
            featureAdoption: {
              superFans: 85, // % of features used
              powerUsers: 62,
              engagedUsers: 34,
              casualUsers: 18
            },
            communityEngagement: {
              superFans: 78, // % who participate in community
              powerUsers: 42,
              engagedUsers: 15,
              casualUsers: 3
            }
          },
          monthlyProgression: [
            { month: 'Jan', superFans: 14, powerUsers: 21, engaged: 32, casual: 33 },
            { month: 'Feb', superFans: 14.5, powerUsers: 22, engaged: 31, casual: 32.5 },
            { month: 'Mar', superFans: 15, powerUsers: 22.5, engaged: 31, casual: 31.5 },
            { month: 'Apr', superFans: 15.5, powerUsers: 23, engaged: 30.5, casual: 31 },
            { month: 'May', superFans: 16, powerUsers: 23, engaged: 31, casual: 30 }
          ],
          conversionFunnel: [
            { stage: 'New Users', count: 12500, percentage: 100 },
            { stage: 'Active (7+ days)', count: 10000, percentage: 80 },
            { stage: 'Engaged (3+ features)', count: 6750, percentage: 54 },
            { stage: 'Power Users', count: 2875, percentage: 23 },
            { stage: 'Super Fans', count: 2000, percentage: 16 }
          ]
        }
      }
    ]
  },
  {
    id: 'quality',
    name: 'Quality',
    description: 'Product and service quality metrics',
    overall_health: 'red',
    weight: 0.2,
    metrics: [
      {
        id: 'defect-severity-tracking',
        name: 'Production Defects by Severity',
        description: 'Pre-production and post-production defects classified by severity level',
        value: 23,
        unit: 'defects',
        target: 15,
        healthStatus: 'red',
        category: 'Quality',
        calculation_method: 'COUNT(defects WHERE severity IN [critical, high, medium, low]) GROUP BY pre_prod, post_prod',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 2,
        chartType: 'defect-severity',
        trendData: [18, 20, 21, 23, 25],
        reverseIsGood: true,
        defectsData: {
          current: {
            total: 23,
            critical: 3,
            high: 5,
            medium: 8,
            low: 7
          },
          target: {
            total: 15,
            critical: 2,
            high: 4,
            medium: 6,
            low: 3
          },
          breakdown: {
            components: [
              { name: 'Authentication Service', critical: 1, high: 2, medium: 1, low: 0 },
              { name: 'Payment Gateway', critical: 2, high: 1, medium: 0, low: 1 },
              { name: 'User Dashboard', critical: 0, high: 1, medium: 3, low: 2 },
              { name: 'API Gateway', critical: 0, high: 1, medium: 2, low: 1 },
              { name: 'Data Processing', critical: 0, high: 0, medium: 2, low: 3 }
            ],
            categories: [
              { name: 'UI/Frontend', count: 8, percentage: 35 },
              { name: 'API/Backend', count: 6, percentage: 26 },
              { name: 'Database', count: 4, percentage: 17 },
              { name: 'Infrastructure', count: 3, percentage: 13 },
              { name: 'Integration', count: 2, percentage: 9 }
            ]
          },
          timeline: [
            { month: 'Sep', critical: 2, high: 4, medium: 6, low: 6 },
            { month: 'Oct', critical: 3, high: 4, medium: 7, low: 6 },
            { month: 'Nov', critical: 2, high: 5, medium: 8, low: 6 },
            { month: 'Dec', critical: 3, high: 4, medium: 7, low: 9 },
            { month: 'Jan', critical: 3, high: 5, medium: 8, low: 7 }
          ],
          impact: {
            customerAffecting: 8,
            revenueImpact: 12000,
            slaBreaches: 2,
            mttr: 4.1,
            mttd: 2.3
          }
        }
      },
      {
        id: 'incident-response-time',
        name: 'Incident Response Time',
        description: 'Average time to respond to public-impacting events and incidents',
        value: 11.8,
        unit: 'min',
        target: 15.0,
        healthStatus: 'green',
        category: 'Quality',
        calculation_method: 'AVG(response_time WHERE incident_type = public_impact)',
        last_updated: new Date().toISOString(),
        trend: 'stable',
        change_percent: -0.4,
        chartType: 'sparkline',
        trendData: [15, 14, 13, 12.5, 11.8],
        reverseIsGood: true
      },
      {
        id: 'impact-events',
        name: 'Impact Events',
        description: 'Number of customer-impacting incidents and outages',
        value: 1,
        unit: 'event',
        target: 2,
        healthStatus: 'green',
        category: 'Quality',
        calculation_method: 'COUNT(incidents WHERE customer_impact = true AND severity >= medium)',
        last_updated: new Date().toISOString(),
        trend: 'stable',
        change_percent: -2,
        chartType: 'sparkline',
        trendData: [4, 3, 2, 2, 1],
        reverseIsGood: true
      },
      {
        id: 'security-vulnerabilities',
        name: 'Open CVEs',
        description: 'Security metrics including vulnerability counts and resolution times',
        value: 3,
        unit: 'CVEs',
        target: 2,
        healthStatus: 'yellow',
        category: 'Quality',
        calculation_method: 'COUNT(vulnerabilities WHERE status = open) + AVG(resolution_time)',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 1,
        chartType: 'sparkline',
        trendData: [5, 6, 8, 10, 8],
        reverseIsGood: true
      },
      {
        id: 'deployment-failure-rate',
        name: 'Deployment Failure & Rollback Rate',
        description: 'Frequency of deployment failures and rollback operations',
        value: 4,
        unit: '%',
        target: 5,
        healthStatus: 'green',
        category: 'Quality',
        calculation_method: '(COUNT(failed_deployments) + COUNT(rollbacks)) / COUNT(total_deployments) * 100',
        last_updated: new Date().toISOString(),
        trend: 'down',
        change_percent: -0.7,
        chartType: 'progress',
        trendData: [8, 10, 11, 13, 12],
        reverseIsGood: true
      }
    ]
  },
  {
    id: 'efficiency',
    name: 'Efficiency',
    description: 'Team and process efficiency metrics',
    overall_health: 'green',
    weight: 0.2,
    metrics: [
      {
        id: 'delivery-throughput',
        name: 'Delivery Throughput',
        description: 'Epics shipped per sprint/month including deployment frequency',
        value: 5,
        unit: 'epics',
        target: 4,
        healthStatus: 'green',
        category: 'Efficiency',
        calculation_method: 'COUNT(features_shipped) / month + COUNT(deployments) / week',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 1
      },
      {
        id: 'story-points-productivity',
        name: 'Story Points Completed',
        description: 'Team productivity measured by story points completed per sprint',
        value: 52,
        unit: 'story points',
        target: 50,
        healthStatus: 'green',
        category: 'Efficiency',
        calculation_method: 'SUM(story_points WHERE status = completed) / sprint_duration',
        last_updated: new Date().toISOString(),
        trend: 'stable',
        change_percent: 2,
        chartType: 'progress',
        trendData: [40, 41, 43, 42, 42]
      },
      {
        id: 'flow-metrics',
        name: 'Average Time to Deliver',
        description: 'Total time from epic request to production delivery (target: <21 days)',
        value: 19,
        unit: 'days',
        target: 21,
        healthStatus: 'green',
        category: 'Efficiency',
        calculation_method: 'AVG(epic_request_to_production) - Lead Time + Cycle Time breakdown',
        last_updated: new Date().toISOString(),
        trend: 'down',
        change_percent: -2,
        chartType: 'progress',
        trendData: [28, 26, 23, 21, 19],
        reverseIsGood: true,
        flowData: {
          totalTime: { p50: 16, p85: 28, p95: 42, current: 19 },
          breakdown: {
            leadTime: 12,      // Pre-development time
            cycleTime: 7       // Development to production
          },
          monthlyData: [
            { month: 'Jan', leadTime: 17, cycleTime: 11, total: 28 },
            { month: 'Feb', leadTime: 16, cycleTime: 10, total: 26 },
            { month: 'Mar', leadTime: 14, cycleTime: 9, total: 23 },
            { month: 'Apr', leadTime: 13, cycleTime: 8, total: 21 },
            { month: 'May', leadTime: 12, cycleTime: 7, total: 19 }
          ],
          phaseBreakdown: {
            'Epic Planning': 4,
            'Backlog Priority': 8,
            'Development': 5,
            'Code Review': 1,
            'Testing': 1
          }
        }
      },
      {
        id: 'cost-per-story',
        name: 'Cost per Epic',
        description: 'Resource allocation costs calculated per epic completion',
        value: 1500,
        unit: '$/epic',
        target: 1000,
        healthStatus: 'yellow',
        category: 'Efficiency',
        calculation_method: 'SUM(resource_costs) / COUNT(completed_stories) with time allocation',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 0.5,
        chartType: 'trend',
        trendData: [1100, 1150, 1200, 1250, 1250],
        reverseIsGood: true
      },
      {
        id: 'energy-consumption',
        name: 'Energy Consumption (Sustainability)',
        description: 'Energy consumption tracking for sustainability metrics',
        value: 1.7,
        unit: 'kWh/deployment',
        target: 2.0,
        healthStatus: 'green',
        category: 'Efficiency',
        calculation_method: 'SUM(server_energy + CI_energy + development_energy) / COUNT(deployments)',
        last_updated: new Date().toISOString(),
        trend: 'down',
        change_percent: -0.4,
        chartType: 'trend',
        trendData: [2.8, 2.6, 2.5, 2.4, 2.4],
        reverseIsGood: true
      }
    ]
  },
  {
    id: 'engagement',
    name: 'Engagement',
    description: 'User and team engagement metrics',
    overall_health: 'green',
    weight: 0.15,
    metrics: [
      {
        id: 'culture-change-indicators',
        name: 'Engagement Score',
        description: 'Employee engagement and satisfaction based on surveys and feedback',
        value: 84,
        unit: '%',
        target: 80,
        healthStatus: 'green',
        category: 'Engagement',
        calculation_method: 'AVG(engagement_survey_responses) weighted by team size and tenure',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 3,
        chartType: 'clean',
        trendData: [68, 69, 70, 71, 72],
        cultureData: {
          dimensions: {
            'Psychological Safety': { score: 87, trend: 'up', target: 85 },
            'Learning & Growth': { score: 82, trend: 'up', target: 80 },
            'Collaboration': { score: 89, trend: 'stable', target: 85 },
            'Innovation': { score: 76, trend: 'up', target: 75 },
            'Work-Life Balance': { score: 81, trend: 'down', target: 85 },
            'Recognition': { score: 78, trend: 'up', target: 80 }
          },
          monthlyTrends: [
            { month: 'Jan', engagement: 68, satisfaction: 72, retention: 94 },
            { month: 'Feb', engagement: 71, satisfaction: 74, retention: 95 },
            { month: 'Mar', engagement: 74, satisfaction: 76, retention: 93 },
            { month: 'Apr', engagement: 78, satisfaction: 79, retention: 96 },
            { month: 'May', engagement: 84, satisfaction: 82, retention: 97 }
          ]
        }
      },
      {
        id: 'developer-experience',
        name: 'Developer Experience & Satisfaction',
        description: 'Developer satisfaction scores and retention metrics',
        value: 87,
        unit: '%',
        target: 85,
        healthStatus: 'green',
        category: 'Engagement',
        calculation_method: 'AVG(dev_satisfaction_survey) + (1 - turnover_rate) * 100',
        last_updated: new Date().toISOString(),
        trend: 'stable',
        change_percent: 1.2,
        chartType: 'progress',
        trendData: [76, 77, 78, 78, 78]
      },
      {
        id: 'customer-experience',
        name: 'Customer Experience & Satisfaction',
        description: 'Customer satisfaction measured through thumbs up/down feedback and ratings',
        value: 87,
        unit: '%',
        target: 85,
        healthStatus: 'green',
        category: 'Engagement',
        calculation_method: 'COUNT(thumbs_up) / COUNT(total_feedback) * 100 + AVG(satisfaction_ratings)',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 2,
        chartType: 'sparkline',
        trendData: [80, 82, 85, 86, 87]
      },
      {
        id: 'team-sentiment-tracking',
        name: 'Team Sentiment (Mood Marbles)',
        description: 'Team sentiment tracking using mood marbles or similar engagement tools',
        value: 7.8,
        unit: '/10',
        target: 7.5,
        healthStatus: 'green',
        category: 'Engagement',
        calculation_method: 'AVG(daily_mood_scores) from team sentiment tracking tools',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 0.6,
        chartType: 'clean',
        trendData: [6.2, 6.4, 6.6, 6.7, 6.8]
      },
      {
        id: 'commit-pattern-engagement',
        name: 'Commit Pattern Engagement',
        description: 'Team engagement assessment through first/last commit patterns',
        value: 72,
        unit: '%',
        target: 80,
        healthStatus: 'yellow',
        category: 'Engagement',
        calculation_method: 'ANALYZE(first_commit_time, last_commit_time) FOR engagement_patterns',
        last_updated: new Date().toISOString(),
        trend: 'stable',
        change_percent: -1.5,
        chartType: 'progress',
        trendData: [70, 71, 73, 72, 72]
      }
    ]
  },
  {
    id: 'progress',
    name: 'Progress',
    description: 'Development and delivery progress metrics',
    overall_health: 'yellow',
    weight: 0.2,
    metrics: [
      {
        id: 'rework-technical-debt',
        name: 'Rework & Technical Debt Trends',
        description: 'Tracking rework trends and technical debt accumulation over time',
        value: 12,
        unit: '% rework',
        target: 15,
        healthStatus: 'green',
        category: 'Progress',
        calculation_method: 'COUNT(rework_stories) / COUNT(total_stories) * 100 + technical_debt_score',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 0.5,
        chartType: 'progress',
        trendData: [20, 21, 22, 24, 23]
      },
      {
        id: 'test-automation-coverage',
        name: 'Test Automation Trends',
        description: 'Test automation trends and coverage improvements over time',
        value: 88,
        unit: '% coverage',
        target: 85,
        healthStatus: 'green',
        category: 'Progress',
        calculation_method: 'test_coverage_percentage + automation_trend_analysis',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 0.6,
        chartType: 'progress',
        trendData: [74, 75, 76, 77, 78]
      },
      {
        id: 'velocity-trends',
        name: 'Velocity Trends Across Sprints',
        description: 'Team velocity trends measured across sprints and releases',
        value: 52,
        unit: 'SP/sprint',
        target: 50,
        healthStatus: 'green',
        category: 'Progress',
        calculation_method: 'TREND_ANALYSIS(story_points_completed) OVER sprint_releases',
        last_updated: new Date().toISOString(),
        trend: 'stable',
        change_percent: 1.2,
        chartType: 'trend',
        trendData: [40, 41, 43, 42, 42]
      },
      {
        id: 'activity-trends',
        name: 'Code Activity Trends',
        description: 'Activity trends including code commits and pull requests over time',
        value: 156,
        unit: 'commits/week',
        target: 150,
        healthStatus: 'green',
        category: 'Progress',
        calculation_method: 'COUNT(commits) + COUNT(pull_requests) PER week WITH trend_analysis',
        last_updated: new Date().toISOString(),
        trend: 'up',
        change_percent: 1.1,
        chartType: 'sparkline',
        trendData: [140, 145, 150, 155, 156]
      },
      {
        id: 'pull-request-metrics',
        name: 'Pull Request Size & Review Time',
        description: 'Pull request metrics including size and review time trends',
        value: 1.8,
        unit: 'days avg review',
        target: 2.0,
        healthStatus: 'green',
        category: 'Progress',
        calculation_method: 'AVG(review_time) + AVG(pr_size) + COUNT(pr_metrics) trends',
        last_updated: new Date().toISOString(),
        trend: 'down',
        change_percent: -0.5,
        chartType: 'trend',
        trendData: [2.8, 2.6, 2.5, 2.4, 2.4]
      }
    ]
  }
];

const mockDashboardConfig: DashboardConfig = {
  id: 'default',
  title: 'Product Health Dashboard',
  description: 'Monitor your product metrics using the Forrester MAD framework',
  refresh_interval: 300000, // 5 minutes
  lastUpdated: new Date().toISOString(),
  thresholds: {
    green_min: 80,
    yellow_min: 60
  }
};

// Mock AI-generated recommendations for each metric
const mockRecommendations: Record<string, any[]> = {
  // Business Value Metrics
  'nps-score': [
    {
      priority: 'high',
      action: 'Implement customer success program',
      description: 'Launch a dedicated customer success team to proactively engage with users and address concerns before they impact NPS scores.',
      estimated_impact: 'NPS +8-12 points',
      implementation_effort: 'High (6-8 weeks)'
    },
    {
      priority: 'medium',
      action: 'Enhance product onboarding',
      description: 'Redesign the user onboarding flow with interactive tutorials and progressive feature discovery to improve initial user experience.',
      estimated_impact: 'NPS +4-6 points',
      implementation_effort: 'Medium (3-4 weeks)'
    }
  ],
  'revenue-growth': [
    {
      priority: 'high',
      action: 'Optimize pricing strategy',
      description: 'Conduct pricing analysis and implement value-based pricing tiers to better align with customer willingness to pay.',
      estimated_impact: '+15-25% revenue growth',
      implementation_effort: 'Medium (4-6 weeks)'
    },
    {
      priority: 'medium',
      action: 'Expand customer acquisition channels',
      description: 'Diversify marketing channels beyond current strategies, focusing on content marketing and strategic partnerships.',
      estimated_impact: '+10-15% new customer acquisition',
      implementation_effort: 'High (8-10 weeks)'
    }
  ],
  'onboarding-success-rate': [
    {
      priority: 'high',
      action: 'Implement guided product tours',
      description: 'Add interactive product tours and contextual help to guide new users through key features during their first week.',
      estimated_impact: '+15-20% completion rate',
      implementation_effort: 'Medium (3-4 weeks)'
    },
    {
      priority: 'medium',
      action: 'Create onboarding checkpoints',
      description: 'Design milestone-based onboarding with progress tracking and personalized encouragement messages.',
      estimated_impact: '+8-12% completion rate',
      implementation_effort: 'Low (2-3 weeks)'
    }
  ],

  // Quality Metrics
  'defect-severity-tracking': [
    {
      priority: 'high',
      action: 'Strengthen code review process',
      description: 'Implement mandatory code reviews with checklist-based quality gates and automated static analysis integration.',
      estimated_impact: '40-60% reduction in defects',
      implementation_effort: 'Medium (4-5 weeks)'
    },
    {
      priority: 'high',
      action: 'Expand automated testing coverage',
      description: 'Increase unit test coverage to 90%+ and implement comprehensive integration testing for critical user paths.',
      estimated_impact: '50-70% reduction in production defects',
      implementation_effort: 'High (6-8 weeks)'
    }
  ],
  'security-vulnerabilities': [
    {
      priority: 'high',
      action: 'Implement automated security scanning',
      description: 'Integrate SAST/DAST tools into CI/CD pipeline with automatic vulnerability detection and blocking of high-risk deployments.',
      estimated_impact: '60-80% faster vulnerability detection',
      implementation_effort: 'Medium (3-4 weeks)'
    },
    {
      priority: 'medium',
      action: 'Establish security training program',
      description: 'Provide regular security awareness training for development team focusing on common vulnerability patterns.',
      estimated_impact: '30-50% reduction in new vulnerabilities',
      implementation_effort: 'Low (2-3 weeks)'
    }
  ],

  // Efficiency Metrics
  'delivery-throughput': [
    {
      priority: 'high',
      action: 'Optimize CI/CD pipeline',
      description: 'Streamline build and deployment processes by parallelizing stages and implementing smart caching strategies.',
      estimated_impact: '25-40% faster delivery',
      implementation_effort: 'Medium (4-5 weeks)'
    },
    {
      priority: 'medium',
      action: 'Implement feature flagging',
      description: 'Deploy feature flags to enable continuous delivery while controlling feature rollouts and reducing deployment risk.',
      estimated_impact: '+30-50% deployment frequency',
      implementation_effort: 'Medium (3-4 weeks)'
    }
  ],
  'story-points-productivity': [
    {
      priority: 'medium',
      action: 'Refine estimation process',
      description: 'Implement planning poker sessions and historical velocity data to improve story point estimation accuracy.',
      estimated_impact: '+15-25% estimation accuracy',
      implementation_effort: 'Low (1-2 weeks)'
    },
    {
      priority: 'low',
      action: 'Focus on team collaboration',
      description: 'Introduce pair programming sessions and cross-functional collaboration to improve knowledge sharing and reduce blockers.',
      estimated_impact: '+10-15% team velocity',
      implementation_effort: 'Low (2-3 weeks)'
    }
  ],

  // Engagement Metrics
  'team-sentiment-tracking': [
    {
      priority: 'high',
      action: 'Address team burnout indicators',
      description: 'Implement workload balancing and provide additional support for team members showing signs of stress or overwhelm.',
      estimated_impact: '+20-30% team satisfaction',
      implementation_effort: 'Medium (ongoing)'
    },
    {
      priority: 'medium',
      action: 'Enhance team communication',
      description: 'Establish regular one-on-ones, team retrospectives, and open feedback channels to improve team dynamics.',
      estimated_impact: '+15-20% engagement scores',
      implementation_effort: 'Low (2-3 weeks)'
    }
  ],
  'developer-experience': [
    {
      priority: 'high',
      action: 'Improve development tooling',
      description: 'Upgrade development environment with faster build tools, better debugging capabilities, and streamlined workflows.',
      estimated_impact: '+25-35% developer satisfaction',
      implementation_effort: 'Medium (4-6 weeks)'
    },
    {
      priority: 'medium',
      action: 'Provide learning opportunities',
      description: 'Offer conference attendance, training courses, and dedicated learning time to support professional development.',
      estimated_impact: '+20-25% retention rate',
      implementation_effort: 'Low (ongoing)'
    }
  ],

  // Progress Metrics
  'rework-technical-debt': [
    {
      priority: 'high',
      action: 'Dedicate technical debt sprints',
      description: 'Allocate 20% of sprint capacity specifically for technical debt reduction and code refactoring initiatives.',
      estimated_impact: '30-50% reduction in technical debt',
      implementation_effort: 'Low (ongoing)'
    },
    {
      priority: 'medium',
      action: 'Implement code quality gates',
      description: 'Establish automated quality metrics that prevent code with high complexity or low test coverage from being merged.',
      estimated_impact: '40-60% reduction in future rework',
      implementation_effort: 'Medium (3-4 weeks)'
    }
  ],
  'pull-request-metrics': [
    {
      priority: 'medium',
      action: 'Optimize code review process',
      description: 'Implement automated review assignment, establish review time SLAs, and provide review quality guidelines.',
      estimated_impact: '50-70% faster review times',
      implementation_effort: 'Low (2-3 weeks)'
    },
    {
      priority: 'low',
      action: 'Encourage smaller pull requests',
      description: 'Provide guidelines and tooling to encourage smaller, more focused pull requests that are easier to review.',
      estimated_impact: '30-40% faster review cycle',
      implementation_effort: 'Low (1-2 weeks)'
    }
  ],

  // Default recommendations for unknown metrics
  'default': [
    {
      priority: 'medium',
      action: 'Analyze metric trends',
      description: 'Review historical data and identify patterns to understand the root causes of current performance levels.',
      estimated_impact: 'Baseline improvement 10-20%',
      implementation_effort: 'Low (1-2 weeks)'
    },
    {
      priority: 'low',
      action: 'Benchmark against industry standards',
      description: 'Compare current performance with industry benchmarks to identify areas for improvement.',
      estimated_impact: 'Strategic insights',
      implementation_effort: 'Low (1 week)'
    }
  ]
};

// Create and export the service instance
export const apiService = new ApiService();

// Export mock data for testing
export const mockData = {
  categories: mockCategories,
  dashboardConfig: mockDashboardConfig
};