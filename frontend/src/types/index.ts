// Core metric types
export interface Metric {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  target: number;
  healthStatus: 'green' | 'yellow' | 'red';
  category: string;
  calculation_method: string;
  last_updated: string;
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
}

export interface MetricCategory {
  id: string;
  name: string;
  description: string;
  metrics: Metric[];
  overall_health: 'green' | 'yellow' | 'red';
  weight: number;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  target?: number;
}

export interface MetricHistory {
  metric_id: string;
  data_points: TimeSeriesDataPoint[];
  period_start: string;
  period_end: string;
}

// Dashboard configuration
export interface DashboardConfig {
  id: string;
  title: string;
  description: string;
  refresh_interval: number;
  lastUpdated: string;
  thresholds: {
    green_min: number;
    yellow_min: number;
  };
}

// Recommendations
export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  description: string;
  estimated_impact: 'high' | 'medium' | 'low';
  implementation_effort: 'high' | 'medium' | 'low';
  related_metrics: string[];
}

export interface MetricRecommendations {
  metric_id: string;
  current_status: 'green' | 'yellow' | 'red';
  recommendations: Recommendation[];
}

// Integration status
export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync: string;
  error_message?: string;
}

export interface IntegrationStatus {
  sources: DataSource[];
  last_check: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  target?: number;
  label?: string;
}

// Filter types
export type TimeRange = '1d' | '7d' | '30d' | '90d' | '1y';

// Component prop types
export interface MetricTileProps {
  metric: Metric;
  timeRange: string;
  onClick?: () => void;
}

export interface MetricOverlayProps {
  metric: Metric;
  isOpen: boolean;
  onClose: () => void;
}

export interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}