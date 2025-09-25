import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { TrendChart } from '../../components/charts/TrendChart';
import { CorrelationChart } from '../../components/charts/CorrelationChart';
import { HealthIndicator } from '../../components/metrics/HealthIndicator';
import { TimeRangeFilter } from '../../components/filters/TimeRangeFilter';
import { apiService } from '../../services/api.service';
import type { Metric, MetricHistory, MetricRecommendations, MetricCategory } from '../../types';

export default function MetricDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [metric, setMetric] = useState<Metric | null>(null);
  const [history, setHistory] = useState<MetricHistory | null>(null);
  const [recommendations, setRecommendations] = useState<MetricRecommendations | null>(null);
  const [relatedMetrics, setRelatedMetrics] = useState<Metric[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadMetricData(id);
    }
  }, [id, timeRange]);

  const loadMetricData = async (metricId: string) => {
    try {
      setLoading(true);
      setError(null);

      // For demo purposes, find metric from mock data
      const categories = await apiService.getCategories();
      const foundMetric = categories
        .flatMap(cat => cat.metrics || [])
        .find(m => m.id === metricId);

      if (!foundMetric) {
        setError('Metric not found');
        return;
      }

      setMetric(foundMetric);

      // Load related data
      const [historyData, recommendationsData] = await Promise.all([
        apiService.getMetricHistory(metricId, timeRange),
        apiService.getMetricRecommendations(metricId).catch(() => null)
      ]);

      setHistory(historyData);
      setRecommendations(recommendationsData);

      // Find related metrics in the same category
      const category = categories.find(cat =>
        cat.metrics?.some(m => m.id === metricId)
      );
      if (category) {
        setRelatedMetrics(
          (category.metrics || []).filter(m => m.id !== metricId)
        );
      }

    } catch (err) {
      console.error('Error loading metric data:', err);
      setError('Failed to load metric data');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit}`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit}`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const generateCorrelationData = () => {
    if (!metric || !relatedMetrics.length) return [];

    return relatedMetrics.map(related => ({
      x: metric.value,
      y: related.value,
      label: related.name,
      category: related.category
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !metric) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Metric not found'}
          </h1>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{metric.name} - Measure What Matters</title>
        <meta name="description" content={metric.description} />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{metric.name}</span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <HealthIndicator
                status={metric.healthStatus}
                size="lg"
                showLabel
                animated={metric.healthStatus === 'red'}
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{metric.name}</h1>
                <p className="text-gray-600 mt-1">{metric.description}</p>
              </div>
            </div>

            <TimeRangeFilter
              value={timeRange as any}
              onChange={setTimeRange}
            />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500">Current Value</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatValue(metric.value, metric.unit)}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500">Target</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatValue(metric.target, metric.unit)}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500">Performance</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round((metric.value / metric.target) * 100)}%
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500">Change</div>
              <div className={`text-2xl font-bold mt-1 ${
                metric.change_percent > 0
                  ? 'text-green-600'
                  : metric.change_percent < 0
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}>
                {metric.change_percent > 0 ? '+' : ''}{metric.change_percent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Historical Trend</h3>
              {history ? (
                <TrendChart
                  data={history.data_points.map(point => ({
                    date: point.timestamp,
                    value: point.value,
                    target: point.target || metric.target
                  }))}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No historical data available
                </div>
              )}
            </div>

            {/* Correlation Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Related Metrics</h3>
              {relatedMetrics.length > 0 ? (
                <CorrelationChart
                  data={generateCorrelationData()}
                  width={400}
                  height={300}
                  xLabel={metric.name}
                  yLabel="Related Metrics"
                  title="Metric Correlations"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No related metrics available
                </div>
              )}
            </div>
          </div>

          {/* Calculation Method */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Method</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <code className="text-sm text-gray-700">{metric.calculation_method}</code>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations && recommendations.recommendations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                {recommendations.recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{rec.action}</h4>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Impact: {rec.estimated_impact}</span>
                      <span>Effort: {rec.implementation_effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Metrics */}
          {relatedMetrics.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Related Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedMetrics.map((related) => (
                  <Link
                    key={related.id}
                    href={`/metrics/${related.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{related.name}</h4>
                      <HealthIndicator status={related.healthStatus} size="sm" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatValue(related.value, related.unit)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Target: {formatValue(related.target, related.unit)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}