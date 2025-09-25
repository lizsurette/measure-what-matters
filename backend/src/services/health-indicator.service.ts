import { models } from '../models';
import { HealthStatus } from '@prisma/client';

export class HealthIndicatorService {
  async updateHealthStatus(metricId: string, metric: {
    name: string;
    value: number;
    unit: string;
    industryThresholdLow: number;
    industryThresholdMedium: number;
    industryThresholdHigh: number;
  }) {
    return models.healthIndicator.updateHealthStatus(metricId, metric);
  }

  async getCriticalMetrics() {
    const criticalIndicators = await models.healthIndicator.getCriticalMetrics();

    return criticalIndicators.map(indicator => ({
      metric_id: indicator.metricId,
      metric_name: indicator.metric.name,
      category: indicator.metric.category.name,
      current_value: Number(indicator.metric.value),
      threshold_applied: Number(indicator.thresholdApplied),
      status_reason: indicator.statusReason,
      calculated_at: indicator.calculatedAt
    }));
  }

  async getOverallHealthSummary() {
    return models.healthIndicator.getOverallHealthSummary();
  }

  async getHealthByCategory(categoryId: string) {
    const indicators = await models.healthIndicator.getHealthIndicatorsByCategory(categoryId);

    return {
      category_id: categoryId,
      total_metrics: indicators.length,
      healthy_count: indicators.filter(i => i.status === 'green').length,
      warning_count: indicators.filter(i => i.status === 'yellow').length,
      critical_count: indicators.filter(i => i.status === 'red').length,
      metrics: indicators.map(indicator => ({
        metric_id: indicator.metricId,
        metric_name: indicator.metric.name,
        status: indicator.status,
        status_reason: indicator.statusReason,
        calculated_at: indicator.calculatedAt
      }))
    };
  }

  calculateHealthStatus(metric: {
    value: number;
    industryThresholdLow: number;
    industryThresholdMedium: number;
  }): HealthStatus {
    return models.healthIndicator.calculateStatus(metric);
  }

  async validateHealthAlignment() {
    // Get all metrics and their health indicators
    const metrics = await models.metric.findAll();
    const misalignedMetrics = [];

    for (const metric of metrics) {
      const isAligned = await models.healthIndicator.validateStatusAlignment(
        {
          value: Number(metric.value),
          industryThresholdLow: Number(metric.industryThresholdLow),
          industryThresholdMedium: Number(metric.industryThresholdMedium),
          industryThresholdHigh: Number(metric.industryThresholdHigh)
        },
        metric.healthStatus
      );

      if (!isAligned) {
        misalignedMetrics.push({
          id: metric.id,
          name: metric.name,
          current_status: metric.healthStatus,
          calculated_status: this.calculateHealthStatus({
            value: Number(metric.value),
            industryThresholdLow: Number(metric.industryThresholdLow),
            industryThresholdMedium: Number(metric.industryThresholdMedium)
          })
        });
      }
    }

    return {
      total_metrics: metrics.length,
      aligned_metrics: metrics.length - misalignedMetrics.length,
      misaligned_metrics: misalignedMetrics
    };
  }
}