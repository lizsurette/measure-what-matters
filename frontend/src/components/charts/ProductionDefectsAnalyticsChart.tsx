import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProductionDefectsAnalyticsChartProps {
  defectsData: any;
}

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#84cc16'
};

export function ProductionDefectsAnalyticsChart({ defectsData }: ProductionDefectsAnalyticsChartProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!defectsData) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'components', label: 'Components' },
    { id: 'impact', label: 'Business Impact' }
  ];

  // Prepare data for charts
  const timelineData = defectsData.timeline?.map((month: any) => ({
    month: month.month,
    Critical: month.critical,
    High: month.high,
    Medium: month.medium,
    Low: month.low,
    Total: month.critical + month.high + month.medium + month.low
  })) || [];

  const severityDistributionData = [
    { name: 'Critical', value: defectsData.current.critical, color: SEVERITY_COLORS.critical },
    { name: 'High', value: defectsData.current.high, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: defectsData.current.medium, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: defectsData.current.low, color: SEVERITY_COLORS.low }
  ];

  const componentData = defectsData.breakdown?.components?.map((comp: any) => ({
    ...comp,
    total: comp.critical + comp.high + comp.medium + comp.low
  })) || [];

  const categoryData = defectsData.breakdown?.categories || [];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Severity Distribution Pie Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Severity Distribution</h4>
        <div className="flex items-center">
          <div className="w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {severityDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [value, 'Defects']}
                  labelFormatter={(label) => `${label} Severity`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="ml-8 space-y-3">
            {severityDistributionData.map((item) => (
              <div key={item.name} className="flex items-center">
                <div
                  className="w-4 h-4 rounded mr-3"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                <span className="text-sm font-medium">{item.value}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({Math.round((item.value / defectsData.current.total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Defects Timeline (Last 5 Months)</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Critical" stackId="a" fill={SEVERITY_COLORS.critical} />
              <Bar dataKey="High" stackId="a" fill={SEVERITY_COLORS.high} />
              <Bar dataKey="Medium" stackId="a" fill={SEVERITY_COLORS.medium} />
              <Bar dataKey="Low" stackId="a" fill={SEVERITY_COLORS.low} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );


  const renderComponents = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Defects by Component</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Critical
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  High
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Low
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {componentData.map((component: any, index: number) => (
                <tr key={component.name} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {component.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: SEVERITY_COLORS.critical }}>
                    {component.critical}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: SEVERITY_COLORS.high }}>
                    {component.high}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: SEVERITY_COLORS.medium }}>
                    {component.medium}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: SEVERITY_COLORS.low }}>
                    {component.low}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {component.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Defects by Category</h4>
        <div className="space-y-3">
          {categoryData.map((category: any) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <span className="text-sm font-medium text-gray-900 w-24">{category.name}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{category.count}</span>
                <span className="text-xs text-gray-500 ml-1">({category.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderImpact = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Impact</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer-Affecting Defects</span>
              <span className="text-2xl font-bold text-red-600">{defectsData.impact.customerAffecting}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">SLA Breaches</span>
              <span className="text-lg font-semibold text-orange-600">{defectsData.impact.slaBreaches}</span>
            </div>
            <div className="text-sm text-gray-500">
              {Math.round((defectsData.impact.customerAffecting / defectsData.current.total) * 100)}% of total defects affect customers
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Impact</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Impact</span>
              <span className="text-2xl font-bold text-red-600">
                ${(defectsData.impact.revenueImpact / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Based on downtime and customer churn estimates
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Resolution Metrics</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Mean Time to Detection (MTTD)</span>
              <span className="text-lg font-semibold text-blue-600">{defectsData.impact.mttd}h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((defectsData.impact.mttd / 24) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Target: &lt;4h</div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Mean Time to Resolution (MTTR)</span>
              <span className="text-lg font-semibold text-orange-600">{defectsData.impact.mttr}h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${Math.min((defectsData.impact.mttr / 24) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Target: &lt;8h</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero Statement */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900">
          {defectsData.current.total} Production Defects Detected
        </h3>
        <p className="text-gray-600 mt-1">
          {defectsData.current.critical + defectsData.current.high} high-priority defects requiring immediate attention
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'components' && renderComponents()}
        {activeTab === 'impact' && renderImpact()}
      </div>
    </div>
  );
}