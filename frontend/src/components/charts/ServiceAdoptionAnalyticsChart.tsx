import React, { useState } from 'react';
import * as d3 from 'd3';

interface ServiceAdoptionAnalyticsChartProps {
  data: {
    overallAdoption: number;
    totalServices: number;
    adoptedServices: number;
    revenueImpact: {
      highAdopters: { revenue: number; percentage: number };
      lowAdopters: { revenue: number; percentage: number };
    };
    serviceBreakdown: Array<{
      name: string;
      adoption: number;
      category: string;
      trend: 'up' | 'down' | 'stable';
    }>;
    monthlyTrends: Array<{
      month: string;
      adoption: number;
      newAdopters: number;
      churnedServices: number;
    }>;
    segmentAnalysis: {
      [key: string]: {
        adoption: number;
        services: number;
        revenue: number;
      };
    };
  };
}

// Service Adoption Matrix Component
function AdoptionMatrix({ services }: { services: any[] }) {
  // Simulate engagement data (in real app, this would come from usage analytics)
  const servicesWithEngagement = services.map(service => ({
    ...service,
    engagement: service.adoption * (0.7 + Math.random() * 0.6), // Mock engagement score
  }));

  const maxAdoption = Math.max(...servicesWithEngagement.map(s => s.adoption));
  const maxEngagement = Math.max(...servicesWithEngagement.map(s => s.engagement));

  const getQuadrant = (adoption: number, engagement: number) => {
    const adoptionThreshold = maxAdoption * 0.6;
    const engagementThreshold = maxEngagement * 0.6;

    if (adoption >= adoptionThreshold && engagement >= engagementThreshold) return 'high-value';
    if (adoption < adoptionThreshold && engagement >= engagementThreshold) return 'growth-opportunity';
    if (adoption >= adoptionThreshold && engagement < engagementThreshold) return 'at-risk';
    return 'low-priority';
  };

  const quadrantColors = {
    'high-value': '#10b981',
    'growth-opportunity': '#f59e0b',
    'at-risk': '#f97316',
    'low-priority': '#ef4444'
  };

  const quadrantLabels = {
    'high-value': 'High Value',
    'growth-opportunity': 'Growth Opportunity',
    'at-risk': 'At Risk',
    'low-priority': 'Low Priority'
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Service Portfolio Matrix</h3>
      <div className="relative">
        {/* Quadrant Labels */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="text-right">
            <span className="inline-block w-3 h-3 bg-yellow-500 rounded mr-2"></span>
            Growth Opportunity
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
            High Value
          </div>
          <div className="text-right">
            <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
            Low Priority
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-orange-500 rounded mr-2"></span>
            At Risk
          </div>
        </div>

        {/* Matrix Chart */}
        <div className="relative h-80 bg-gray-50 border-2 border-gray-300">
          {/* Axis Lines */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400"></div>

          {/* Axis Labels */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-medium">
            Adoption Rate →
          </div>
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium">
            ← Engagement Score
          </div>

          {/* Service Points */}
          {servicesWithEngagement.map((service, index) => {
            const x = (service.adoption / maxAdoption) * 90 + 5; // 5% margin
            const y = 95 - (service.engagement / maxEngagement) * 90; // Inverted Y
            const quadrant = getQuadrant(service.adoption, service.engagement);

            return (
              <div
                key={service.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 border-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: quadrantColors[quadrant] }}
                  title={`${service.name}: ${service.adoption}% adoption, ${service.engagement.toFixed(1)}% engagement`}
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {service.name}
                  <br />
                  {service.adoption}% adoption
                  <br />
                  {service.engagement.toFixed(1)}% engagement
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Customer Segment Heatmap
function SegmentHeatmap({ segmentData }: { segmentData: any }) {
  const segments = Object.entries(segmentData);
  const maxRevenue = Math.max(...segments.map(([_, data]: [string, any]) => data.revenue));

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Customer Segment Analysis</h3>
      <div className="space-y-3">
        {segments.map(([segment, data]: [string, any]) => {
          const revenueIntensity = data.revenue / maxRevenue;
          const adoptionWidth = data.adoption;

          return (
            <div key={segment} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{segment}</span>
                <span className="text-sm text-gray-600">
                  {data.adoption}% adoption • ${data.revenue}K ARR
                </span>
              </div>

              {/* Adoption Bar with Revenue Intensity */}
              <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="h-full flex items-center px-3 text-white text-sm font-medium transition-all"
                  style={{
                    width: `${adoptionWidth}%`,
                    backgroundColor: `rgba(16, 185, 129, ${0.4 + revenueIntensity * 0.6})`
                  }}
                >
                  {adoptionWidth > 25 && `${data.services.toFixed(1)} avg services`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Bar width = adoption rate, Color intensity = revenue per customer
      </div>
    </div>
  );
}

// Service Journey Funnel
function ServiceJourney({ services }: { services: any[] }) {
  // Simulate journey stages for services
  const journeyData = [
    { stage: 'Discovery', percentage: 95, description: 'Services discovered by customers' },
    { stage: 'Trial', percentage: 78, description: 'Services actively trialed' },
    { stage: 'Adoption', percentage: 65, description: 'Services regularly used' },
    { stage: 'Mastery', percentage: 42, description: 'Services with deep engagement' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Service Adoption Journey</h3>

      <div className="space-y-4">
        {journeyData.map((stage, index) => (
          <div key={stage.stage} className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{stage.stage}</span>
                <span className="text-sm text-gray-600 ml-2">({stage.description})</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stage.percentage}%</span>
            </div>

            <div className="relative">
              <div className="h-6 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>

              {/* Drop-off indicator */}
              {index < journeyData.length - 1 && (
                <div className="absolute right-0 top-6 text-sm text-red-600">
                  -{journeyData[index].percentage - journeyData[index + 1].percentage}% drop-off
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Revenue Correlation Chart
function RevenueCorrelation({ revenueImpact }: { revenueImpact: any }) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Revenue Impact Analysis</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">${revenueImpact.highAdopters.revenue}K</div>
          <div className="text-sm text-green-600">High Adopters ARR</div>
          <div className="text-xs text-gray-600 mt-1">{revenueImpact.highAdopters.percentage}% of customers</div>
        </div>

        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-700">${revenueImpact.lowAdopters.revenue}K</div>
          <div className="text-sm text-red-600">Low Adopters ARR</div>
          <div className="text-xs text-gray-600 mt-1">{revenueImpact.lowAdopters.percentage}% of customers</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-lg font-semibold text-blue-900">
          {((revenueImpact.highAdopters.revenue / revenueImpact.lowAdopters.revenue) * 100 - 100).toFixed(0)}%
          <span className="text-sm font-normal"> higher revenue from high adopters</span>
        </div>
        <div className="text-sm text-blue-700 mt-1">
          Opportunity: Move low adopters to high adoption = +${((revenueImpact.highAdopters.revenue - revenueImpact.lowAdopters.revenue) * revenueImpact.lowAdopters.percentage / 100).toFixed(0)}K ARR
        </div>
      </div>
    </div>
  );
}

// Adoption Timeline
function AdoptionTimeline({ monthlyTrends }: { monthlyTrends: any[] }) {
  const maxAdoption = Math.max(...monthlyTrends.map(t => t.adoption));
  const maxAdopters = Math.max(...monthlyTrends.map(t => t.newAdopters));

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Adoption Trends</h3>

      <div className="space-y-3">
        {monthlyTrends.map((trend, index) => (
          <div key={trend.month} className="flex items-center space-x-4">
            <div className="w-12 text-sm font-medium">{trend.month}</div>

            {/* Adoption Rate Bar */}
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Adoption: {trend.adoption}%</span>
                <span>+{trend.newAdopters} new</span>
              </div>
              <div className="h-4 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(trend.adoption / maxAdoption) * 100}%` }}
                />
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="w-8 text-center">
              {index > 0 && (
                <span className={`text-xs ${
                  trend.adoption > monthlyTrends[index - 1].adoption
                    ? 'text-green-600'
                    : trend.adoption < monthlyTrends[index - 1].adoption
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {trend.adoption > monthlyTrends[index - 1].adoption ? '↗' :
                   trend.adoption < monthlyTrends[index - 1].adoption ? '↘' : '→'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServiceAdoptionAnalyticsChart({ data }: ServiceAdoptionAnalyticsChartProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'matrix', label: 'Portfolio Matrix' },
    { id: 'segments', label: 'Customer Segments' },
    { id: 'journey', label: 'Adoption Journey' },
    { id: 'trends', label: 'Timeline' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueCorrelation revenueImpact={data.revenueImpact} />
            <AdoptionTimeline monthlyTrends={data.monthlyTrends} />
          </div>
        )}

        {activeTab === 'matrix' && (
          <AdoptionMatrix services={data.serviceBreakdown} />
        )}

        {activeTab === 'segments' && (
          <SegmentHeatmap segmentData={data.segmentAnalysis} />
        )}

        {activeTab === 'journey' && (
          <ServiceJourney services={data.serviceBreakdown} />
        )}

        {activeTab === 'trends' && (
          <div className="grid grid-cols-1 gap-6">
            <AdoptionTimeline monthlyTrends={data.monthlyTrends} />
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Service Performance Breakdown</h3>
              <div className="space-y-3">
                {data.serviceBreakdown.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{service.category}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold">{service.adoption}%</span>
                      <span className={`text-sm ${
                        service.trend === 'up' ? 'text-green-600' :
                        service.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {service.trend === 'up' ? '↗' : service.trend === 'down' ? '↘' : '→'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}