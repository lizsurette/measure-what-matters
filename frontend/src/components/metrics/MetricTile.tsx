import React from 'react';
import { HealthIndicator } from './HealthIndicator';
import { MiniChart } from '../charts/MiniChart';
import type { MetricTileProps } from '../../types';

export function MetricTile({ metric, timeRange, onClick }: MetricTileProps) {
  const getHealthColor = (health: 'green' | 'yellow' | 'red') => {
    switch (health) {
      case 'green':
        return 'text-green-600 bg-green-50';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50';
      case 'red':
        return 'text-red-hat-50 bg-red-50';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', isReverse: boolean = false) => {
    const getColor = () => {
      if (trend === 'stable') return 'text-gray-500';
      if (isReverse) {
        // For reverse metrics: down is good (green), up is bad (red)
        return trend === 'down' ? 'text-green-500' : 'text-red-600';
      } else {
        // For normal metrics: up is good (green), down is bad (red)
        return trend === 'up' ? 'text-green-500' : 'text-red-600';
      }
    };

    switch (trend) {
      case 'up':
        return (
          <svg className={`w-4 h-4 ${getColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 14l5-5 5 5" />
          </svg>
        );
      case 'down':
        return (
          <svg className={`w-4 h-4 ${getColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 10l-5 5-5-5" />
          </svg>
        );
      case 'stable':
        return (
          <svg className={`w-4 h-4 ${getColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" />
          </svg>
        );
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${Math.round(value)}%`;
    }

    const roundedValue = Math.round(value);
    let displayUnit = unit;

    // Handle pluralization for specific units
    if (unit === 'event') {
      displayUnit = roundedValue === 1 ? 'event' : 'events';
    }

    // Handle currency formatting
    if (unit === '$/story' || unit === '$/epic') {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      }
      return `$${roundedValue}`;
    }

    if (value >= 1000000) {
      return `${Math.round(value / 1000000)}M ${displayUnit}`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K ${displayUnit}`;
    }
    return `${roundedValue} ${displayUnit}`;
  };

  const getPerformanceIndicator = () => {
    const performance = (metric.value / metric.target) * 100;
    if (performance >= 100) return 'On target';
    if (performance >= 80) return 'Near target';
    return 'Below target';
  };

  const getNPSStatus = (score: number) => {
    if (score >= 71) return { label: 'Excellent', color: 'text-green-700' };
    if (score >= 51) return { label: 'Great', color: 'text-green-600' };
    if (score >= 31) return { label: 'Good', color: 'text-yellow-600' };
    if (score >= 0) return { label: 'Needs Work', color: 'text-orange-600' };
    return { label: 'Critical', color: 'text-red-600' };
  };

  const isNPSMetric = metric.name.includes('NPS') || metric.name.includes('Net Promoter Score');
  const npsStatus = isNPSMetric ? getNPSStatus(metric.value) : null;

  const isRevenueMetric = metric.name.includes('Revenue') || metric.id === 'revenue-growth';
  const getRevenueStatus = (performance: number) => {
    if (performance >= 110) return { label: 'Excellent', color: 'text-green-700' };
    if (performance >= 100) return { label: 'On Target', color: 'text-green-600' };
    if (performance >= 90) return { label: 'Good', color: 'text-yellow-600' };
    if (performance >= 80) return { label: 'Below Target', color: 'text-orange-600' };
    return { label: 'Critical', color: 'text-red-600' };
  };
  const revenueStatus = isRevenueMetric && (metric as any).revenueData ?
    getRevenueStatus((metric as any).revenueData.current.targetPerformance) : null;

  const isOnboardingMetric = metric.name.includes('Onboarding') || metric.id === 'onboarding-success-rate';
  const getOnboardingStatus = (completionRate: number) => {
    return {
      label: 'complete onboarding',
      color: 'text-gray-500'
    };
  };
  const onboardingStatus = isOnboardingMetric ? getOnboardingStatus(metric.value) : null;

  const getPeriodText = () => {
    switch (timeRange) {
      case 'daily':
        return 'since yesterday';
      case 'weekly':
        return 'since last week';
      case 'monthly':
        return 'since last month';
      default:
        return 'since last week';
    }
  };

  const getUnitSuffix = () => {
    // For metrics with specific units like 'defects', 'min', 'ms', show the unit
    if (metric.unit && metric.unit !== '%' && metric.unit !== '') {
      return ` ${metric.unit}`;
    }
    // For NPS (no unit), show 'pts'
    if (metric.unit === '') {
      return ' pts';
    }
    // For percentage metrics, show '%'
    return '%';
  };

  const getTrendUnitSuffix = (changeAmount: number) => {
    // For metrics with specific units, handle pluralization based on change amount
    if (metric.unit && metric.unit !== '%' && metric.unit !== '') {
      const absAmount = Math.abs(changeAmount);
      if (metric.unit === 'event') {
        return absAmount === 1 ? ' event' : ' events';
      }
      if (metric.unit === 'defects') {
        return absAmount === 1 ? ' defect' : ' defects';
      }
      if (metric.unit === '$/story' || metric.unit === '$/epic') {
        return ''; // Currency prefix is handled in the number formatting
      }
      return ` ${metric.unit}`;
    }
    // For NPS (no unit), show 'pts'
    if (metric.unit === '') {
      return ' pts';
    }
    // For percentage metrics, show '%'
    return '%';
  };

  return (
    <div
      className="p-2 border border-gray-200 rounded-lg hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer bg-white metric-tile"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-xs font-semibold text-gray-900 leading-tight flex-1" title={metric.name}>
            {metric.name}
          </h4>
          <HealthIndicator
            status={metric.healthStatus}
            size="sm"
            animated={metric.healthStatus === 'red'}
          />
        </div>

        {/* Value */}
        <div className="mb-1">
          <div className="text-lg font-bold text-gray-900 metric-value">
            {isRevenueMetric && (metric as any).revenueData ? (
              <>
                ${((metric as any).revenueData.current.arr / 1000000).toFixed(1)}M
                {revenueStatus && (
                  <span className={`ml-2 text-xs font-medium ${revenueStatus.color}`}>
                    {revenueStatus.label}
                  </span>
                )}
              </>
            ) : (
              <>
                {formatValue(metric.value, metric.unit)}
                {npsStatus && (
                  <span className={`ml-2 text-xs font-medium ${npsStatus.color}`}>
                    {npsStatus.label}
                  </span>
                )}
                {onboardingStatus && (
                  <span className={`ml-2 text-xs font-medium ${onboardingStatus.color}`}>
                    {onboardingStatus.label}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {isRevenueMetric && (metric as any).revenueData ? (
              <>
                {formatValue(metric.value, metric.unit)} growth • ${((metric as any).revenueData.current.mrr / 1000).toFixed(0)}K MRR
              </>
            ) : isOnboardingMetric && (metric as any).onboardingData ? (
              <>
                TTV: {(metric as any).onboardingData.components.timeToValue.averageDays}d • 30-day retention: {(metric as any).onboardingData.components.earlyRetention.score}%
              </>
            ) : isNPSMetric && (metric as any).npsData ? (
              <>
                Target: {formatValue(metric.target, metric.unit)}
              </>
            ) : metric.id === 'service-reuse-rate' && (metric as any).serviceAdoptionData ? (
              <>
                {(metric as any).serviceAdoptionData.adoptedServices} of {(metric as any).serviceAdoptionData.totalServices} services used • Target: {formatValue(metric.target, metric.unit)}
              </>
            ) : metric.id === 'super-fans-identification' && (metric as any).superFanData ? (
              <>
                {(metric as any).superFanData.fanSegmentation.powerUsers.percentage}% power users, {(metric as any).superFanData.fanSegmentation.engagedUsers.percentage}% engaged • Target: {formatValue(metric.target, metric.unit)}
              </>
            ) : metric.id === 'defect-severity-tracking' && (metric as any).defectsData ? (
              <>
                {(metric as any).defectsData.current.critical} critical, {(metric as any).defectsData.current.high} high severity • Target: ≤{formatValue(metric.target, metric.unit)}
              </>
            ) : (
              <>Target: {formatValue(metric.target, metric.unit)}</>
            )}
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="flex-1 mb-2">
          <MiniChart
            type={(metric as any).chartType || 'progress'}
            value={metric.value}
            target={metric.target}
            healthStatus={metric.healthStatus}
            data={(metric as any).trendData}
            unit={metric.unit}
            flowData={(metric as any).flowData}
            npsData={(metric as any).npsData}
            revenueData={(metric as any).revenueData}
            onboardingData={(metric as any).onboardingData}
            serviceAdoptionData={(metric as any).serviceAdoptionData}
            superFanData={(metric as any).superFanData}
            defectsData={(metric as any).defectsData}
          />
        </div>

        {/* Trend - Always at bottom */}
        <div className="flex items-center space-x-1 mt-auto">
          {/* Show trend arrow based on change */}
          {(typeof metric.change_percent === 'number' && metric.change_percent !== 0) && getTrendIcon(
            metric.change_percent > 0 ? 'up' : 'down',
            (metric as any).reverseIsGood || false
          )}
          <span className={`text-xs font-medium ${
            // For reverse metrics (like defects), red when going up, green when going down
            (metric as any).reverseIsGood
              ? (metric.change_percent > 0 ? 'text-red-hat-50' : metric.change_percent < 0 ? 'text-green-600' : 'text-gray-500')
              : (metric.change_percent > 0 ? 'text-green-600' : metric.change_percent < 0 ? 'text-red-hat-50' : 'text-gray-500')
          }`}>
            {(metric.unit === '$/story' || metric.unit === '$/epic') ?
              `${metric.change_percent > 0 ? '+' : ''}$${Math.abs(metric.change_percent) % 1 === 0 ? Math.abs(metric.change_percent) : Math.abs(metric.change_percent).toFixed(1)}K${getTrendUnitSuffix(metric.change_percent)} ${getPeriodText()}` :
              `${metric.change_percent > 0 ? '+' : ''}${Math.abs(metric.change_percent) % 1 === 0 ? Math.abs(metric.change_percent) : Math.abs(metric.change_percent).toFixed(1)}${getTrendUnitSuffix(metric.change_percent)} ${getPeriodText()}`
            }
          </span>
        </div>
      </div>
    </div>
  );
}