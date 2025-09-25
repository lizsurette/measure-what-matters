import React, { useState } from 'react';

interface SuperFanAnalyticsChartProps {
  data: {
    totalUsers: number;
    fanSegmentation: {
      superFans: { count: number; percentage: number; avgRevenue: number; retention: number };
      powerUsers: { count: number; percentage: number; avgRevenue: number; retention: number };
      engagedUsers: { count: number; percentage: number; avgRevenue: number; retention: number };
      casualUsers: { count: number; percentage: number; avgRevenue: number; retention: number };
    };
    businessImpact: {
      revenueContribution: { superFans: number; powerUsers: number; others: number };
      referralRate: { superFans: number; powerUsers: number; others: number };
      supportCost: { superFans: number; powerUsers: number; others: number };
    };
    behaviorMetrics: {
      avgSessionLength: { superFans: number; powerUsers: number; engagedUsers: number; casualUsers: number };
      featureAdoption: { superFans: number; powerUsers: number; engagedUsers: number; casualUsers: number };
      communityEngagement: { superFans: number; powerUsers: number; engagedUsers: number; casualUsers: number };
    };
    monthlyProgression: Array<{
      month: string;
      superFans: number;
      powerUsers: number;
      engaged: number;
      casual: number;
    }>;
    conversionFunnel: Array<{
      stage: string;
      count: number;
      percentage: number;
    }>;
  };
}

// Fan Segmentation Donut Chart
function FanSegmentationDonut({ fanSegmentation }: { fanSegmentation: any }) {
  const segments = [
    { key: 'superFans', label: 'Super Fans', color: '#10b981', data: fanSegmentation.superFans },
    { key: 'powerUsers', label: 'Power Users', color: '#f59e0b', data: fanSegmentation.powerUsers },
    { key: 'engagedUsers', label: 'Engaged Users', color: '#3b82f6', data: fanSegmentation.engagedUsers },
    { key: 'casualUsers', label: 'Casual Users', color: '#e5e7eb', data: fanSegmentation.casualUsers }
  ];

  const total = segments.reduce((sum, seg) => sum + seg.data.count, 0);

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">User Segmentation</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="relative">
          <div className="w-48 h-48 mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {(() => {
                let cumulativePercentage = 0;
                return segments.map((segment, index) => {
                  const percentage = segment.data.percentage;
                  const circumference = 2 * Math.PI * 70; // radius = 70
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -cumulativePercentage * circumference / 100;

                  cumulativePercentage += percentage;

                  return (
                    <circle
                      key={segment.key}
                      cx="100"
                      cy="100"
                      r="70"
                      stroke={segment.color}
                      strokeWidth="20"
                      fill="none"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300"
                    />
                  );
                });
              })()}
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </div>
        </div>

        {/* Legend & Stats */}
        <div className="grid grid-cols-1 gap-4">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
              style={{
                borderColor: segment.color + '40',
                backgroundColor: segment.color + '08'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{segment.label}</div>
                    <div className="text-sm text-gray-600">
                      {segment.data.count.toLocaleString()} users
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: segment.color }}>
                    {segment.data.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">
                    ${segment.data.avgRevenue.toLocaleString()} ARR
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Business Impact Dashboard
function BusinessImpactDashboard({ businessImpact, fanSegmentation }: { businessImpact: any; fanSegmentation: any }) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-6">Business Impact Analysis</h3>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">42%</div>
          <div className="text-sm text-green-600 mt-1">Revenue from Super Fans</div>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">45%</div>
          <div className="text-sm text-blue-600 mt-1">Super Fan Referral Rate</div>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">$125</div>
          <div className="text-sm text-purple-600 mt-1">Support Cost/Month</div>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-700">95%</div>
          <div className="text-sm text-orange-600 mt-1">Retention Rate</div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Segment</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Avg Revenue</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Referral Rate</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Support Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Super Fans</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center font-semibold text-green-700">$2,400</td>
              <td className="px-4 py-3 text-center font-semibold text-green-700">45%</td>
              <td className="px-4 py-3 text-center font-semibold text-green-700">$125</td>
            </tr>
            <tr>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">Power Users</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center font-semibold">$1,650</td>
              <td className="px-4 py-3 text-center font-semibold">18%</td>
              <td className="px-4 py-3 text-center font-semibold">$180</td>
            </tr>
            <tr>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="font-medium">Others</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-600">$1,045</td>
              <td className="px-4 py-3 text-center font-semibold text-gray-600">5%</td>
              <td className="px-4 py-3 text-center font-semibold text-gray-600">$310</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Key Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700">170%</div>
            <div className="text-sm text-blue-600">Higher revenue than casual users</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700">60%</div>
            <div className="text-sm text-blue-600">Lower support costs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Behavior Matrix Heatmap
function BehaviorMatrix({ behaviorMetrics }: { behaviorMetrics: any }) {
  const metrics = [
    { key: 'avgSessionLength', label: 'Avg Session (min)', format: (val: number) => `${val}m` },
    { key: 'featureAdoption', label: 'Feature Usage (%)', format: (val: number) => `${val}%` },
    { key: 'communityEngagement', label: 'Community (%)', format: (val: number) => `${val}%` }
  ];

  const segments = ['superFans', 'powerUsers', 'engagedUsers', 'casualUsers'];
  const segmentLabels = ['Super Fans', 'Power Users', 'Engaged', 'Casual'];

  const getIntensityColor = (value: number, maxValue: number) => {
    const intensity = value / maxValue;
    if (intensity > 0.8) return 'bg-green-600 text-white';
    if (intensity > 0.6) return 'bg-green-400 text-white';
    if (intensity > 0.4) return 'bg-yellow-400 text-black';
    if (intensity > 0.2) return 'bg-orange-400 text-black';
    return 'bg-red-400 text-white';
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Behavior Pattern Matrix</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-3 border-b border-gray-200">Behavior Metric</th>
              {segmentLabels.map((label) => (
                <th key={label} className="text-center p-3 border-b border-gray-200 min-w-24">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const values = segments.map(seg => behaviorMetrics[metric.key][seg]);
              const maxValue = Math.max(...values);

              return (
                <tr key={metric.key}>
                  <td className="p-3 border-b border-gray-100 font-medium">
                    {metric.label}
                  </td>
                  {segments.map((segment, index) => {
                    const value = behaviorMetrics[metric.key][segment];
                    return (
                      <td key={segment} className="p-3 border-b border-gray-100 text-center">
                        <div className={`inline-block px-3 py-2 rounded-lg font-medium ${getIntensityColor(value, maxValue)}`}>
                          {metric.format(value)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Fan Conversion Funnel
function FanConversionFunnel({ conversionFunnel }: { conversionFunnel: any[] }) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Fan Development Funnel</h3>

      <div className="space-y-4">
        {conversionFunnel.map((stage, index) => {
          const isLast = index === conversionFunnel.length - 1;
          const dropOff = !isLast ?
            ((conversionFunnel[index].count - conversionFunnel[index + 1].count) / conversionFunnel[index].count * 100) : 0;

          return (
            <div key={stage.stage} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{stage.stage}</span>
                  {index === conversionFunnel.length - 1 && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      Target Segment
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{stage.count.toLocaleString()}</span>
                  <span className="text-sm text-gray-600 ml-2">({stage.percentage}%)</span>
                </div>
              </div>

              <div className="relative">
                <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>

                {!isLast && (
                  <div className="absolute right-0 top-8 text-sm text-red-600">
                    -{dropOff.toFixed(1)}% drop-off
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-orange-50 rounded-lg">
        <h4 className="font-medium text-orange-900 mb-2">Optimization Opportunities</h4>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>• Focus on converting Engaged Users to Power Users (largest drop-off)</li>
          <li>• Improve onboarding to increase 7+ day activation rate</li>
          <li>• Create targeted campaigns for Power User → Super Fan conversion</li>
        </ul>
      </div>
    </div>
  );
}

// Monthly Progression Timeline
function MonthlyProgression({ monthlyProgression }: { monthlyProgression: any[] }) {
  const maxValue = Math.max(...monthlyProgression.flatMap(month =>
    [month.superFans, month.powerUsers, month.engaged, month.casual]
  ));

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Segment Evolution Timeline</h3>

      <div className="space-y-4">
        {monthlyProgression.map((month) => (
          <div key={month.month} className="flex items-center space-x-4">
            <div className="w-12 text-sm font-medium">{month.month}</div>

            <div className="flex-1 grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <div className="text-xs text-green-700 font-medium">Super Fans</div>
                <div className="h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(month.superFans / maxValue) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium">{month.superFans}%</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-yellow-700 font-medium">Power Users</div>
                <div className="h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${(month.powerUsers / maxValue) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium">{month.powerUsers}%</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-blue-700 font-medium">Engaged</div>
                <div className="h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(month.engaged / maxValue) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium">{month.engaged}%</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-700 font-medium">Casual</div>
                <div className="h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-gray-400 transition-all"
                    style={{ width: `${(month.casual / maxValue) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium">{month.casual}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuperFanAnalyticsChart({ data }: SuperFanAnalyticsChartProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'segments', label: 'Segmentation' },
    { id: 'behavior', label: 'Behavior Patterns' },
    { id: 'funnel', label: 'Conversion Funnel' },
    { id: 'trends', label: 'Timeline' }
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
          <div className="space-y-8">
            {/* Hero Impact Statement */}
            <div className="text-center p-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                16% of users generate 42% of revenue
              </div>
              <div className="text-lg text-gray-600 mb-6">
                Super Fans deliver 2.7x higher value than average users
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">$2,400</div>
                  <div className="text-sm text-gray-600">Avg Revenue</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">45%</div>
                  <div className="text-sm text-gray-600">Refer Others</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">95%</div>
                  <div className="text-sm text-gray-600">Retention</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">$125</div>
                  <div className="text-sm text-gray-600">Support Cost</div>
                </div>
              </div>
            </div>

            {/* User Segments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
                    HIGHEST VALUE
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-800 mb-1">16%</div>
                <div className="text-sm font-semibold text-green-700 mb-2">Super Fans</div>
                <div className="text-xs text-green-600">2,000 users</div>
                <div className="text-xs text-green-600">$2,400 avg revenue</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="text-xs font-medium text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
                    HIGH VALUE
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-800 mb-1">23%</div>
                <div className="text-sm font-semibold text-yellow-700 mb-2">Power Users</div>
                <div className="text-xs text-yellow-600">2,875 users</div>
                <div className="text-xs text-yellow-600">$1,650 avg revenue</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                    GROWING
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-800 mb-1">31%</div>
                <div className="text-sm font-semibold text-blue-700 mb-2">Engaged Users</div>
                <div className="text-xs text-blue-600">3,875 users</div>
                <div className="text-xs text-blue-600">$1,200 avg revenue</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                    OPPORTUNITY
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-700 mb-1">30%</div>
                <div className="text-sm font-semibold text-gray-600 mb-2">Casual Users</div>
                <div className="text-xs text-gray-500">3,750 users</div>
                <div className="text-xs text-gray-500">$890 avg revenue</div>
              </div>
            </div>

            {/* Key Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-3">Maximize Super Fan Value</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Expand super fan program benefits</li>
                  <li>• Increase referral incentives (45% already refer)</li>
                  <li>• Create exclusive features for top tier</li>
                </ul>
              </div>
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3">Convert Engaged → Power Users</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Target 31% engaged users for upgrade</li>
                  <li>• Focus on feature adoption campaigns</li>
                  <li>• Implement usage-based nudges</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'segments' && (
          <FanSegmentationDonut fanSegmentation={data.fanSegmentation} />
        )}

        {activeTab === 'behavior' && (
          <BehaviorMatrix behaviorMetrics={data.behaviorMetrics} />
        )}

        {activeTab === 'funnel' && (
          <FanConversionFunnel conversionFunnel={data.conversionFunnel} />
        )}

        {activeTab === 'trends' && (
          <MonthlyProgression monthlyProgression={data.monthlyProgression} />
        )}
      </div>
    </div>
  );
}