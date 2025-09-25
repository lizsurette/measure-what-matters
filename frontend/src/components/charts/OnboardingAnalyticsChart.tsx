import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface OnboardingAnalyticsChartProps {
  data: any;
}

export function OnboardingAnalyticsChart({ data }: OnboardingAnalyticsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const formatPercent = (value: number) => `${value}%`;
  const formatDays = (value: number) => `${value} days`;

  useEffect(() => {
    if (!data || !chartRef.current) return;

    const container = d3.select(chartRef.current);
    container.selectAll("*").remove();

    // Create funnel chart for onboarding steps
    const funnelData = Object.entries(data.funnel).map(([step, value]) => ({
      step: step.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: value as number
    }));

    const funnelSvg = container
      .append('div')
      .style('margin-bottom', '20px')
      .append('svg')
      .attr('width', 450)
      .attr('height', 200);

    const maxValue = Math.max(...funnelData.map(d => d.value));
    const barHeight = 25;
    const spacing = 35;

    funnelData.forEach((d, i) => {
      const y = i * spacing + 10;
      const barWidth = (d.value / maxValue) * 280; // Reduced bar width

      // Background bar
      funnelSvg.append('rect')
        .attr('x', 120) // Moved bars right to make room for labels
        .attr('y', y)
        .attr('width', 280)
        .attr('height', barHeight)
        .attr('fill', '#f3f4f6')
        .attr('rx', 3);

      // Progress bar
      funnelSvg.append('rect')
        .attr('x', 120)
        .attr('y', y)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('fill', d.value >= 80 ? '#10b981' : d.value >= 60 ? '#f59e0b' : '#ef4444')
        .attr('rx', 3);

      // Step label
      funnelSvg.append('text')
        .attr('x', 115) // Positioned left of bars
        .attr('y', y + barHeight/2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '500')
        .style('fill', '#374151')
        .text(d.step);

      // Percentage label
      funnelSvg.append('text')
        .attr('x', 410) // Adjusted for new bar position
        .attr('y', y + barHeight/2)
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', '#1f2937')
        .text(`${d.value}%`);
    });

  }, [data]);

  if (!data) return null;

  const { components, funnel, supportMetrics } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Customer Onboarding Analytics</h4>
        <div className="text-3xl font-bold text-blue-600">{data.compositeScore}%</div>
        <div className="text-sm text-gray-500">Overall Success Score</div>
      </div>

      {/* Component Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{formatDays(components.timeToValue.averageDays)}</div>
          <div className="text-sm font-medium text-gray-600">Time to Value</div>
          <div className="text-xs text-gray-500 mt-1">
            Target: {formatDays(components.timeToValue.target)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Score: {components.timeToValue.score}%
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{formatPercent(components.featureAdoption.coreFeatureUsage)}</div>
          <div className="text-sm font-medium text-gray-600">Feature Adoption</div>
          <div className="text-xs text-gray-500 mt-1">
            Target: {formatPercent(components.featureAdoption.target)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            2+ core features used
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{formatPercent(components.earlyRetention.day30Retention)}</div>
          <div className="text-sm font-medium text-gray-600">30-Day Retention</div>
          <div className="text-xs text-gray-500 mt-1">
            Target: {formatPercent(components.earlyRetention.target)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Still active after 30 days
          </div>
        </div>
      </div>

      {/* Onboarding Funnel */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h5 className="font-medium text-gray-900 mb-3">Onboarding Completion Funnel</h5>
        <div ref={chartRef}></div>
      </div>

      {/* Support Metrics */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h5 className="font-medium text-gray-900 mb-3">Support & Engagement</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">{supportMetrics.ticketsInFirst14Days}%</div>
            <div className="text-sm text-gray-600">Need help in first 14 days</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-indigo-600">{formatDays(supportMetrics.timeToFirstSupport)}</div>
            <div className="text-sm text-gray-600">Avg. time to first support</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{supportMetrics.selfServiceUsage}%</div>
            <div className="text-sm text-gray-600">Use self-service resources</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h5 className="font-medium text-blue-900 mb-2">💡 Key Insights</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Drop-off occurs at "First Dashboard" step (67% → 45%)</li>
          <li>• Time-to-value is 0.3 days above target</li>
          <li>• 23% of users need support in first 2 weeks</li>
          <li>• Feature adoption below target - focus on core feature discovery</li>
        </ul>
      </div>
    </div>
  );
}