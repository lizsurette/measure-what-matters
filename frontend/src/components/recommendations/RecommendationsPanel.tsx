import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api.service';
import type { MetricCategory, MetricRecommendations } from '../../types';

interface RecommendationsPanelProps {
  categories: MetricCategory[];
}

export function RecommendationsPanel({ categories }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<MetricRecommendations[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [categories]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      // Get all metrics that need attention (yellow or red health status)
      const problematicMetrics = categories.flatMap(category =>
        (category.metrics || []).filter(metric => metric.healthStatus !== 'green')
      );

      if (problematicMetrics.length === 0) {
        setRecommendations([]);
        return;
      }

      // Load recommendations for problematic metrics
      const recommendationPromises = problematicMetrics.map(metric =>
        apiService.getMetricRecommendations(metric.id).catch(() => null)
      );

      const recommendationResults = await Promise.all(recommendationPromises);
      const validRecommendations = recommendationResults.filter(Boolean) as MetricRecommendations[];

      setRecommendations(validRecommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getImpactIcon = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '💡';
    }
  };

  const totalRecommendations = recommendations.reduce((sum, rec) => sum + rec.recommendations.length, 0);
  const highPriorityCount = recommendations.reduce(
    (sum, rec) => sum + rec.recommendations.filter(r => r.priority === 'high').length,
    0
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (totalRecommendations === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">All metrics are healthy!</h3>
            <div className="mt-2 text-sm text-green-700">
              No immediate action items. Keep up the great work.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div
        className="p-6 border-b border-gray-200 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
            {highPriorityCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {highPriorityCount} urgent
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-3">
              {totalRecommendations} action{totalRecommendations !== 1 ? 's' : ''}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      {isExpanded && (
        <div className="p-6">
          <div className="space-y-4">
            {recommendations.map((metricRec) => {
              const metric = categories
                .flatMap(cat => cat.metrics || [])
                .find(m => m.id === metricRec.metric_id);

              return (
                <div key={metricRec.metric_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{metric?.name || 'Unknown Metric'}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      metricRec.current_status === 'red'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {metricRec.current_status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {metricRec.recommendations.map((rec, index) => (
                      <div key={index} className="bg-white border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{getImpactIcon(rec.estimated_impact)}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                              {rec.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <h5 className="font-medium text-gray-900 mb-1">{rec.action}</h5>
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Expected Impact: {rec.estimated_impact}</span>
                          <span>Effort: {rec.implementation_effort}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}