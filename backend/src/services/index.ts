export { MetricService } from './metric.service';
export { HealthIndicatorService } from './health-indicator.service';
export { TimeSeriesDataService } from './time-series-data.service';

// Initialize service instances for export
export const services = {
  metric: new (await import('./metric.service')).MetricService(),
  healthIndicator: new (await import('./health-indicator.service')).HealthIndicatorService(),
  timeSeriesData: new (await import('./time-series-data.service')).TimeSeriesDataService(),
};