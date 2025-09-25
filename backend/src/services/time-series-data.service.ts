import { models } from '../models';
import { TimeSeriesData } from '@prisma/client';

export class TimeSeriesDataService {
  async addDataPoint(
    metricId: string,
    value: number,
    timestamp: Date,
    isEstimated = false
  ): Promise<TimeSeriesData> {
    return models.timeSeriesData.addDataPoint(metricId, value, timestamp, isEstimated);
  }

  async getHistoryByPeriod(
    metricId: string,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<TimeSeriesData[]> {
    return models.timeSeriesData.getHistoryByPeriod(metricId, period);
  }

  async createEstimatedValueForMissingData(metricId: string): Promise<TimeSeriesData | null> {
    // Check if we have recent data
    const latestValue = await models.timeSeriesData.getLatestValue(metricId);

    if (!latestValue) {
      return null; // No historical data to base estimation on
    }

    const now = new Date();
    const hoursSinceLastUpdate = (now.getTime() - latestValue.timestamp.getTime()) / (1000 * 60 * 60);

    // Only create estimated values if data is stale (>25 hours per clarification)
    if (hoursSinceLastUpdate < 25) {
      return null; // Data is still fresh
    }

    return models.timeSeriesData.createEstimatedValue(metricId);
  }

  async bulkCreateDataPoints(dataPoints: Array<{
    metricId: string;
    value: number;
    timestamp: Date;
    isEstimated?: boolean;
  }>): Promise<void> {
    return models.timeSeriesData.bulkCreateDataPoints(dataPoints);
  }

  async generateTrendIndicators(metricId: string, period: 'week' | 'month' = 'month'): Promise<{
    trend: 'up' | 'down' | 'stable';
    percentage_change: number;
    data_points_count: number;
    confidence: 'high' | 'medium' | 'low';
  }> {
    const history = await this.getHistoryByPeriod(metricId, period);

    if (history.length < 2) {
      return {
        trend: 'stable',
        percentage_change: 0,
        data_points_count: history.length,
        confidence: 'low'
      };
    }

    // Calculate trend using first and last values
    const firstValue = Number(history[0].value);
    const lastValue = Number(history[history.length - 1].value);
    const percentageChange = ((lastValue - firstValue) / firstValue) * 100;

    // Determine trend direction
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentageChange) > 5) { // 5% threshold for significance
      trend = percentageChange > 0 ? 'up' : 'down';
    }

    // Calculate confidence based on data quality and quantity
    const confidence = this.calculateTrendConfidence(history);

    return {
      trend,
      percentage_change: Math.round(percentageChange * 100) / 100, // Round to 2 decimals
      data_points_count: history.length,
      confidence
    };
  }

  private calculateTrendConfidence(history: TimeSeriesData[]): 'high' | 'medium' | 'low' {
    if (history.length < 5) return 'low';

    // Check data quality scores
    const avgQuality = history.reduce((sum, point) => sum + Number(point.dataQualityScore), 0) / history.length;
    const estimatedCount = history.filter(point => point.isEstimated).length;
    const estimatedPercentage = (estimatedCount / history.length) * 100;

    if (avgQuality > 0.9 && estimatedPercentage < 20 && history.length > 15) {
      return 'high';
    } else if (avgQuality > 0.7 && estimatedPercentage < 40 && history.length > 10) {
      return 'medium';
    }

    return 'low';
  }

  async cleanupOldData(retentionDays = 730): Promise<{ deleted_count: number }> {
    const deletedCount = await models.timeSeriesData.cleanupOldData(retentionDays);
    return { deleted_count: deletedCount };
  }

  async getDataQualityReport(metricId: string): Promise<{
    total_points: number;
    estimated_points: number;
    estimated_percentage: number;
    average_quality_score: number;
    recent_quality_trend: 'improving' | 'declining' | 'stable';
  }> {
    const history = await models.timeSeriesData.getHistoryForPeriod(metricId, 30); // Last 30 days

    if (history.length === 0) {
      return {
        total_points: 0,
        estimated_points: 0,
        estimated_percentage: 0,
        average_quality_score: 0,
        recent_quality_trend: 'stable'
      };
    }

    const estimatedPoints = history.filter(point => point.isEstimated).length;
    const avgQuality = history.reduce((sum, point) => sum + Number(point.dataQualityScore), 0) / history.length;

    // Calculate quality trend (recent vs older data)
    const recentData = history.slice(-7); // Last 7 days
    const olderData = history.slice(0, -7); // Older data

    let qualityTrend: 'improving' | 'declining' | 'stable' = 'stable';

    if (recentData.length > 0 && olderData.length > 0) {
      const recentAvgQuality = recentData.reduce((sum, point) => sum + Number(point.dataQualityScore), 0) / recentData.length;
      const olderAvgQuality = olderData.reduce((sum, point) => sum + Number(point.dataQualityScore), 0) / olderData.length;

      const qualityDifference = recentAvgQuality - olderAvgQuality;

      if (Math.abs(qualityDifference) > 0.1) { // 10% threshold
        qualityTrend = qualityDifference > 0 ? 'improving' : 'declining';
      }
    }

    return {
      total_points: history.length,
      estimated_points: estimatedPoints,
      estimated_percentage: Math.round((estimatedPoints / history.length) * 100),
      average_quality_score: Math.round(avgQuality * 100) / 100,
      recent_quality_trend: qualityTrend
    };
  }
}