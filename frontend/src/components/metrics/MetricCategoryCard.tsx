import React, { useState } from 'react';
import { MetricTile } from './MetricTile';
import { MetricOverlay } from './MetricOverlay';
import type { MetricCategory, Metric } from '../../types';

interface MetricCategoryCardProps {
  category: MetricCategory;
  timeRange: string;
}

export function MetricCategoryCard({ category, timeRange }: MetricCategoryCardProps) {
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const handleMetricClick = (metric: Metric) => {
    setSelectedMetric(metric);
    setIsOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
    setSelectedMetric(null);
  };

  const getHealthColor = (health: 'green' | 'yellow' | 'red') => {
    switch (health) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getHealthIcon = (health: 'green' | 'yellow' | 'red') => {
    switch (health) {
      case 'green':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'yellow':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'red':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm category-card">
        {/* Category Header */}
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
            <p className="text-sm text-gray-500">{category.description}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="px-4 py-4 metric-grid">
          {category.metrics && category.metrics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {category.metrics.map((metric) => (
                <MetricTile
                  key={metric.id}
                  metric={metric}
                  timeRange={timeRange}
                  onClick={() => handleMetricClick(metric)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No metrics configured for this category</p>
              <button className="text-red-hat-50 hover:text-red-hat-100 text-sm mt-2">
                Configure metrics
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Metric Detail Overlay */}
      {selectedMetric && (
        <MetricOverlay
          metric={selectedMetric}
          isOpen={isOverlayOpen}
          onClose={handleCloseOverlay}
        />
      )}
    </>
  );
}