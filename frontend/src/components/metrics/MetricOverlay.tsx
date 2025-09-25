import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { TrendChart } from '../charts/TrendChart';
import { FlowBreakdownChart } from '../charts/FlowBreakdownChart';
import { CultureDimensionsChart } from '../charts/CultureDimensionsChart';
import { NPSAnalysisChart } from '../charts/NPSAnalysisChart';
import { RevenueAnalyticsChart } from '../charts/RevenueAnalyticsChart';
import { OnboardingAnalyticsChart } from '../charts/OnboardingAnalyticsChart';
import { ServiceAdoptionAnalyticsChart } from '../charts/ServiceAdoptionAnalyticsChart';
import { SuperFanAnalyticsChart } from '../charts/SuperFanAnalyticsChart';
import { ProductionDefectsAnalyticsChart } from '../charts/ProductionDefectsAnalyticsChart';
import { apiService } from '../../services/api.service';
import type { MetricOverlayProps, MetricHistory, MetricRecommendations } from '../../types';

function NPSBreakdownChart() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Mock NPS breakdown data over last 7 months
    const data = [
      { month: 'Jan', promoters: 38, detractors: 23, nps: 38 - 23 },
      { month: 'Feb', promoters: 42, detractors: 17, nps: 42 - 17 },
      { month: 'Mar', promoters: 43, detractors: 17, nps: 43 - 17 },
      { month: 'Apr', promoters: 35, detractors: 22, nps: 35 - 22 },
      { month: 'May', promoters: 46, detractors: 15, nps: 46 - 15 },
      { month: 'Jun', promoters: 42, detractors: 17, nps: 42 - 17 },
      { month: 'Jul', promoters: 41, detractors: 18, nps: 41 - 18 }
    ];

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([-25, 65])
      .range([height, 0]);

    // Create bars for promoters (positive)
    g.selectAll(".promoter-bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "promoter-bar")
      .attr("x", d => xScale(d.month)!)
      .attr("y", d => yScale(d.promoters))
      .attr("width", xScale.bandwidth())
      .attr("height", d => yScale(0) - yScale(d.promoters))
      .attr("fill", "#22c55e");

    // Create bars for detractors (negative)
    g.selectAll(".detractor-bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "detractor-bar")
      .attr("x", d => xScale(d.month)!)
      .attr("y", yScale(0))
      .attr("width", xScale.bandwidth())
      .attr("height", d => yScale(0) - yScale(-d.detractors))
      .attr("fill", "#ef4444");

    // Add NPS line
    const line = d3.line<any>()
      .x(d => xScale(d.month)! + xScale.bandwidth() / 2)
      .y(d => yScale(d.nps))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Add NPS dots
    g.selectAll(".nps-dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "nps-dot")
      .attr("cx", d => xScale(d.month)! + xScale.bandwidth() / 2)
      .attr("cy", d => yScale(d.nps))
      .attr("r", 4)
      .attr("fill", "#3b82f6");

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale));

    // Add zero line
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "#374151")
      .attr("stroke-width", 1);

    // Add labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#6b7280")
      .text("Percent of Responses");

    // Add legend
    const legend = g.append("g")
      .attr("transform", `translate(${width + 10}, 20)`);

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", "#22c55e");

    legend.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("font-size", "12px")
      .style("fill", "#374151")
      .text("Promoters (9-10)");

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", "#ef4444");

    legend.append("text")
      .attr("x", 18)
      .attr("y", 30)
      .style("font-size", "12px")
      .style("fill", "#374151")
      .text("Detractors (6 or less)");

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 12)
      .attr("y1", 46)
      .attr("y2", 46)
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 18)
      .attr("y", 50)
      .style("font-size", "12px")
      .style("fill", "#374151")
      .text("NPS");

  }, []);

  return (
    <div>
      <svg
        ref={svgRef}
        width="600"
        height="300"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}

export function MetricOverlay({ metric, isOpen, onClose }: MetricOverlayProps) {
  const [history, setHistory] = useState<MetricHistory | null>(null);
  const [recommendations, setRecommendations] = useState<MetricRecommendations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && metric) {
      loadMetricDetails();
    }
  }, [isOpen, metric]);

  const loadMetricDetails = async () => {
    try {
      setLoading(true);

      // Load history and recommendations in parallel
      const [historyData, recommendationsData] = await Promise.all([
        apiService.getMetricHistory(metric.id, '30d'),
        apiService.getMetricRecommendations(metric.id)
      ]);

      setHistory(historyData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to load metric details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthDisplay = (health: 'green' | 'yellow' | 'red') => {
    switch (health) {
      case 'green':
        return null; // Don't show anything for green status
      case 'yellow':
        return {
          label: 'WARNING',
          classes: 'text-yellow-800 bg-yellow-100'
        };
      case 'red':
        return {
          label: 'CRITICAL',
          classes: 'text-red-800 bg-red-100'
        };
    }
  };

  const getHealthExplanation = (metric: any) => {
    const { name, healthStatus, value, target, unit } = metric;

    if (name.includes('NPS') || name.includes('Net Promoter Score')) {
      switch (healthStatus) {
        case 'green':
          return "Excellent NPS score! Customers are highly satisfied and likely to recommend your product.";
        case 'yellow':
          return "NPS is in the acceptable range but below target. Customer satisfaction is mediocre - not bad, but not great. This indicates opportunity for improvement in customer experience.";
        case 'red':
          return "Critical NPS score. More customers are dissatisfied than satisfied, indicating urgent need for customer experience improvements.";
      }
    }

    // Generic explanations for other metrics
    switch (healthStatus) {
      case 'green':
        return `Performance is meeting or exceeding the target of ${target} ${unit}. Keep up the good work!`;
      case 'yellow':
        return `Performance is below target but not critical. Current value of ${value} ${unit} vs target of ${target} ${unit} suggests room for improvement.`;
      case 'red':
        return `Performance is significantly below target and requires immediate attention. Current value of ${value} ${unit} vs target of ${target} ${unit}.`;
      default:
        return '';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${Math.round(value)}%`;
    }
    if (value >= 1000000) {
      return `${Math.round(value / 1000000)}M ${unit}`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K ${unit}`;
    }
    return `${Math.round(value)} ${unit}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">{metric.name}</h3>
                {getHealthDisplay(metric.healthStatus) && (
                  <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthDisplay(metric.healthStatus)?.classes}`}>
                    {getHealthDisplay(metric.healthStatus)?.label}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-hat-50"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Current Value */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        {/* Enhanced display for revenue metrics */}
                        {(metric.name.includes('Revenue') || metric.id === 'revenue-growth') && (metric as any).revenueData ? (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              ${((metric as any).revenueData.current.arr / 1000000).toFixed(1)}M ARR
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {formatValue(metric.value, metric.unit)} growth • ${((metric as any).revenueData.current.mrr / 1000).toFixed(0)}K MRR
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {(metric as any).revenueData.current.targetPerformance}% of target • Last updated: {new Date(metric.last_updated).toLocaleString()}
                            </div>
                          </>
                        ) : (metric.name.includes('Onboarding') || metric.id === 'onboarding-success-rate') && (metric as any).onboardingData ? (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatValue(metric.value, metric.unit)} <span className="text-sm font-normal text-gray-500">complete onboarding</span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              TTV: {(metric as any).onboardingData.components.timeToValue.averageDays}d • 30-day retention: {(metric as any).onboardingData.components.earlyRetention.score}%
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Target: {formatValue(metric.target, metric.unit)} • Last updated: {new Date(metric.last_updated).toLocaleString()}
                            </div>
                          </>
                        ) : (metric.name.includes('Super Fans') || metric.id === 'super-fans-identification') && (metric as any).superFanData ? (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatValue(metric.value, metric.unit)} <span className="text-sm font-normal text-gray-500">highly engaged users</span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {(metric as any).superFanData.fanSegmentation.powerUsers.percentage}% power users • {(metric as any).superFanData.fanSegmentation.engagedUsers.percentage}% engaged • Generate {((metric as any).superFanData.fanSegmentation.superFans.avgRevenue / (metric as any).superFanData.fanSegmentation.casualUsers.avgRevenue * 100 - 100).toFixed(0)}% more revenue
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Target: {formatValue(metric.target, metric.unit)} • Last updated: {new Date(metric.last_updated).toLocaleString()}
                            </div>
                          </>
                        ) : (metric.name.includes('Production Defects') || metric.id === 'defect-severity-tracking') && (metric as any).defectsData ? (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatValue(metric.value, metric.unit)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {(metric as any).defectsData.current.critical} critical, {(metric as any).defectsData.current.high} high severity • {(metric as any).defectsData.impact.customerAffecting} customer-affecting
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Target: ≤{formatValue(metric.target, metric.unit)} • Last updated: {new Date(metric.last_updated).toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatValue(metric.value, metric.unit)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Target: {formatValue(metric.target, metric.unit)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Last updated: {new Date(metric.last_updated).toLocaleString()}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${
                          (metric as any).reverseIsGood
                            ? (metric.change_percent > 0 ? 'text-red-hat-50' : metric.change_percent < 0 ? 'text-green-600' : 'text-gray-500')
                            : (metric.change_percent > 0 ? 'text-green-600' : metric.change_percent < 0 ? 'text-red-hat-50' : 'text-gray-500')
                        }`}>
                          {metric.change_percent > 0 ? '+' : ''}{Math.abs(metric.change_percent) % 1 === 0 ? Math.abs(metric.change_percent) : Math.abs(metric.change_percent).toFixed(1)}{metric.unit === 'days' ? ' days' : metric.unit === 'defects' ? (Math.abs(metric.change_percent) === 1 ? ' defect' : ' defects') : metric.unit === 'event' ? (Math.abs(metric.change_percent) === 1 ? ' event' : ' events') : metric.unit === '' ? ' pts' : metric.unit && metric.unit !== '%' ? ` ${metric.unit}` : '%'}
                        </div>
                        <div className="text-sm text-gray-500">since last month</div>
                      </div>
                    </div>
                  </div>

                  {/* Health Status Explanation */}
                  {metric.healthStatus !== 'green' && (
                    <div className={`border rounded-lg p-3 ${
                      metric.healthStatus === 'yellow'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {metric.healthStatus === 'yellow' ? (
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3">
                          <h4 className={`text-sm font-medium ${
                            metric.healthStatus === 'yellow' ? 'text-yellow-800' : 'text-red-800'
                          }`}>
                            Why is this {metric.healthStatus === 'yellow' ? 'WARNING' : 'CRITICAL'}?
                          </h4>
                          <p className={`text-sm mt-1 ${
                            metric.healthStatus === 'yellow' ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {getHealthExplanation(metric)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NPS Analysis Chart - Only for NPS metrics */}
                  {(metric.name.includes('NPS') || metric.name.includes('Net Promoter Score')) && (metric as any).npsData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">NPS Analysis</h4>
                      <NPSAnalysisChart data={(metric as any).npsData} />
                    </div>
                  )}

                  {/* Revenue Analytics Chart - Only for revenue metrics */}
                  {(metric.name.includes('Revenue') || metric.id === 'revenue-growth') && (metric as any).revenueData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Revenue Analytics</h4>
                      <RevenueAnalyticsChart data={(metric as any).revenueData} />
                    </div>
                  )}

                  {/* Onboarding Analytics Chart - Only for onboarding metrics */}
                  {(metric.name.includes('Onboarding') || metric.id === 'onboarding-success-rate') && (metric as any).onboardingData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <OnboardingAnalyticsChart data={(metric as any).onboardingData} />
                    </div>
                  )}
                  {/* Service Adoption Analytics Chart - Only for service adoption metrics */}
                  {(metric.name.includes('Service Adoption') || metric.id === 'service-reuse-rate') && (metric as any).serviceAdoptionData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ServiceAdoptionAnalyticsChart data={(metric as any).serviceAdoptionData} />
                    </div>
                  )}
                  {/* Super Fan Analytics Chart - Only for super fan metrics */}
                  {(metric.name.includes('Super Fans') || metric.id === 'super-fans-identification') && (metric as any).superFanData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <SuperFanAnalyticsChart data={(metric as any).superFanData} />
                    </div>
                  )}
                  {/* Production Defects Analytics Chart - Only for defects metrics */}
                  {(metric.name.includes('Production Defects') || metric.id === 'defect-severity-tracking') && (metric as any).defectsData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ProductionDefectsAnalyticsChart defectsData={(metric as any).defectsData} />
                    </div>
                  )}

                  {/* Culture Dimensions Chart - Only for engagement/culture metrics */}
                  {(metric.name.includes('Engagement') || metric.id === 'culture-change-indicators') && (metric as any).cultureData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Culture & Engagement Analysis</h4>
                      <CultureDimensionsChart data={(metric as any).cultureData} />
                    </div>
                  )}

                  {/* Flow Breakdown Chart - Only for flow metrics */}
                  {(metric.name.includes('Time to Deliver') || metric.id === 'flow-metrics') && (metric as any).flowData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Lead Time vs Cycle Time Breakdown</h4>
                      <FlowBreakdownChart data={(metric as any).flowData} />
                    </div>
                  )}

                  {/* Trend Chart - Skip for flow metrics, culture metrics, NPS, revenue, onboarding, service adoption, super fans, and production defects since they have their own charts */}
                  {history && !(metric.name.includes('Time to Deliver') || metric.id === 'flow-metrics') && !(metric.name.includes('Engagement') || metric.id === 'culture-change-indicators') && !(metric.name.includes('NPS') || metric.name.includes('Net Promoter Score')) && !(metric.name.includes('Revenue') || metric.id === 'revenue-growth') && !(metric.name.includes('Onboarding') || metric.id === 'onboarding-success-rate') && !(metric.name.includes('Service Adoption') || metric.id === 'service-reuse-rate') && !(metric.name.includes('Super Fans') || metric.id === 'super-fans-identification') && !(metric.name.includes('Production Defects') || metric.id === 'defect-severity-tracking') && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">30-Day Trend</h4>
                      <TrendChart
                        data={history.data_points.map(point => ({
                          date: point.timestamp,
                          value: point.value,
                          target: point.target || metric.target
                        }))}
                        height={300}
                      />
                    </div>
                  )}

                </div>

                {/* Sidebar */}
                <div className="space-y-4">

                  {/* Recommendations */}
                  {recommendations && recommendations.recommendations.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Recommendations</h4>
                      <div className="space-y-4">
                        {recommendations.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                rec.priority === 'high'
                                  ? 'bg-red-100 text-red-hat-50'
                                  : rec.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {rec.priority.toUpperCase()}
                              </span>
                            </div>
                            <h5 className="font-medium text-gray-900 mb-1">{rec.action}</h5>
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

                  {/* Calculation Method */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Calculation Method</h4>
                    <div className="bg-gray-100 rounded-lg p-4 overflow-hidden">
                      <code className="text-sm text-gray-700 whitespace-pre-wrap break-words block leading-relaxed">{metric.calculation_method}</code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}