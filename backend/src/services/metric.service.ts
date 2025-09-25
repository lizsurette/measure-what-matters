import { models } from '../models';
import { HealthIndicatorService } from './health-indicator.service';
import { TimeSeriesDataService } from './time-series-data.service';

export class MetricService {
  private healthIndicatorService = new HealthIndicatorService();
  private timeSeriesService = new TimeSeriesDataService();

  async getAllMetrics(options?: {
    category?: string;
    includeTrends?: boolean;
  }) {
    const metrics = await models.metric.findAll(options);

    // Transform for API response
    return {
      metrics: metrics.map(metric => ({
        id: metric.id,
        name: metric.name,
        category: this.getCategoryApiName(metric.category.name),
        value: Number(metric.value),
        unit: metric.unit,
        health_status: metric.healthStatus,
        is_leading_indicator: metric.isLeadingIndicator,
        last_updated: metric.lastCalculatedAt || metric.updatedAt,
        data_freshness: this.getDataFreshness(metric.lastCalculatedAt)
      })),
      last_updated: new Date().toISOString()
    };
  }

  async getMetricById(id: string) {
    const metric = await models.metric.findById(id);
    if (!metric) {
      throw new Error('Metric not found');
    }

    // Get correlation metrics (other metrics in same category or related)
    const correlationMetrics = await models.metric.findByCategory(metric.categoryId);
    const correlationIds = correlationMetrics
      .filter(m => m.id !== id)
      .slice(0, 3) // Limit to 3 related metrics
      .map(m => m.id);

    return {
      id: metric.id,
      name: metric.name,
      category: this.getCategoryApiName(metric.category.name),
      value: Number(metric.value),
      unit: metric.unit,
      health_status: metric.healthStatus,
      is_leading_indicator: metric.isLeadingIndicator,
      last_updated: metric.lastCalculatedAt || metric.updatedAt,
      data_freshness: this.getDataFreshness(metric.lastCalculatedAt),
      calculation_method: metric.calculationMethod,
      data_source: {
        id: metric.dataSource.id,
        name: metric.dataSource.name,
        type: metric.dataSource.type,
        last_successful_fetch: metric.dataSource.lastSuccessfulFetch,
        collection_frequency: metric.dataSource.collectionFrequency
      },
      thresholds: {
        red: Number(metric.industryThresholdLow),
        yellow: Number(metric.industryThresholdMedium),
        green: Number(metric.industryThresholdHigh)
      },
      correlation_metrics: correlationIds
    };
  }

  async getMetricHistory(id: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const metric = await models.metric.findById(id);
    if (!metric) {
      throw new Error('Metric not found');
    }

    const history = await this.timeSeriesService.getHistoryByPeriod(id, period);

    return {
      metric_id: id,
      data_points: history.map(point => ({
        timestamp: point.timestamp.toISOString(),
        value: Number(point.value),
        is_estimated: point.isEstimated,
        data_quality_score: Number(point.dataQualityScore)
      }))
    };
  }

  async updateMetricValue(id: string, value: number) {
    const updatedMetric = await models.metric.updateValue(id, value);

    // Update health indicator
    await this.healthIndicatorService.updateHealthStatus(id, {
      name: updatedMetric.name,
      value: Number(updatedMetric.value),
      unit: updatedMetric.unit,
      industryThresholdLow: Number(updatedMetric.industryThresholdLow),
      industryThresholdMedium: Number(updatedMetric.industryThresholdMedium),
      industryThresholdHigh: Number(updatedMetric.industryThresholdHigh)
    });

    // Add time series data point
    await this.timeSeriesService.addDataPoint(id, value, new Date());

    return updatedMetric;
  }

  private getCategoryApiName(categoryName: string): string {
    const mapping: Record<string, string> = {
      'Business Value': 'business_value',
      'Quality': 'quality',
      'Efficiency': 'efficiency',
      'Engagement': 'engagement',
      'Progress': 'progress'
    };

    return mapping[categoryName] || categoryName.toLowerCase().replace(' ', '_');
  }

  private getDataFreshness(lastCalculated: Date | null): 'current' | 'stale' | 'estimated' {
    if (!lastCalculated) return 'estimated';

    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate < 25) return 'current'; // Within daily update + buffer
    if (hoursSinceUpdate < 49) return 'stale';   // Within 2 days
    return 'estimated'; // Older than 2 days
  }

  async validateMetricData(metricData: {
    value: number;
    industryThresholdLow: number;
    industryThresholdMedium: number;
    industryThresholdHigh: number;
    unit: string;
    calculationMethod: string;
  }) {
    const errors: string[] = [];

    // Validate threshold ordering
    if (!models.metric.validateThresholds(
      metricData.industryThresholdLow,
      metricData.industryThresholdMedium,
      metricData.industryThresholdHigh
    )) {
      errors.push('Thresholds must be ordered: low < medium < high');
    }

    // Validate non-negative values for count metrics
    if (metricData.unit === 'count' && metricData.value < 0) {
      errors.push('Count-based metrics must have non-negative values');
    }

    // Validate calculation method
    if (!metricData.calculationMethod || metricData.calculationMethod.trim().length === 0) {
      errors.push('Calculation method is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}