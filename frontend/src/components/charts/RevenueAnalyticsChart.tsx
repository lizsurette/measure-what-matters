import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface RevenueAnalyticsChartProps {
  data: {
    current: {
      arr: number;
      mrr: number;
      growthRate: number;
      targetPerformance: number;
      quarterlyGrowth: number;
      yearlyGrowth: number;
    };
    breakdown: {
      newBusiness: number;
      expansion: number;
      renewals: number;
      churn: number;
    };
    monthly: Array<{
      month: string;
      revenue: number;
      growth: number;
      newCustomers: number;
      existing: number;
    }>;
    segments: Record<string, {
      revenue: number;
      growth: number;
      percentage: number;
    }>;
    channels: Record<string, {
      revenue: number;
      growth: number;
    }>;
    forecast: {
      q2Target: number;
      q3Target: number;
      q4Target: number;
      yearEndTarget: number;
      confidence: number;
    };
    benchmarks: {
      industryGrowth: number;
      competitorAvg: number;
      topQuartile: number;
    };
  };
}

export function RevenueAnalyticsChart({ data }: RevenueAnalyticsChartProps) {
  const trendsRef = useRef<SVGSVGElement>(null);

  // Revenue Trends Chart
  useEffect(() => {
    if (!data || !trendsRef.current) return;

    const svg = d3.select(trendsRef.current);
    svg.selectAll("*").remove();

    const width = 625;
    const height = 300;
    const margin = { top: 40, right: 125, bottom: 40, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.monthly.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data.monthly, d => d.revenue) as number * 1.1])
      .range([innerHeight, 0]);

    // Revenue bars (stacked: new vs existing customers)
    data.monthly.forEach(d => {
      const barWidth = xScale.bandwidth();
      const x = xScale(d.month) || 0;

      // Existing customers (bottom)
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(d.existing))
        .attr("width", barWidth)
        .attr("height", yScale(0) - yScale(d.existing))
        .attr("fill", "#3b82f6")
        .attr("rx", 3);

      // New customers (top)
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(d.newCustomers + d.existing))
        .attr("width", barWidth)
        .attr("height", yScale(d.existing) - yScale(d.newCustomers + d.existing))
        .attr("fill", "#10b981")
        .attr("rx", 3);

      // Total revenue label
      g.append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", yScale(d.newCustomers + d.existing) - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", "#374151")
        .text(`$${(d.revenue / 1000000).toFixed(1)}M`);
    });

    // Growth rate line
    const line = d3.line<any>()
      .x(d => xScale(d.month)! + xScale.bandwidth() / 2)
      .y(d => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data.monthly)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Growth rate dots
    data.monthly.forEach(d => {
      g.append("circle")
        .attr("cx", xScale(d.month)! + xScale.bandwidth() / 2)
        .attr("cy", yScale(d.revenue))
        .attr("r", 4)
        .attr("fill", "#ef4444");
    });

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("fill", "#6b7280");

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => `$${(d as number / 1000000).toFixed(1)}M`))
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("fill", "#6b7280");

    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#374151")
      .text("Revenue (ARR)");

    // Legend
    const legend = g.append("g")
      .attr("transform", `translate(${innerWidth + 10}, 20)`);

    const legendData = [
      { label: 'New', color: '#10b981' },
      { label: 'Existing', color: '#3b82f6' },
      { label: 'Total', color: '#ef4444' }
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      if (item.label === 'Total Revenue') {
        legendItem.append("line")
          .attr("x1", 0)
          .attr("x2", 12)
          .attr("y1", 6)
          .attr("y2", 6)
          .attr("stroke", item.color)
          .attr("stroke-width", 3);
      } else {
        legendItem.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", item.color)
          .attr("rx", 2);
      }

      legendItem.append("text")
        .attr("x", 18)
        .attr("y", 9)
        .attr("font-size", "12px")
        .attr("fill", "#374151")
        .text(item.label);
    });

  }, [data]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-4">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.current.arr)}</div>
          <div className="text-sm font-medium text-gray-600">Annual Recurring Revenue</div>
          <div className="text-xs text-green-600 mt-1">
            {data.current.targetPerformance}% of target
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(data.current.mrr)}</div>
          <div className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatPercent(data.current.growthRate)} growth
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{formatPercent(data.current.quarterlyGrowth)}</div>
          <div className="text-sm font-medium text-gray-600">Quarterly Growth</div>
          <div className="text-xs text-gray-500 mt-1">
            vs {formatPercent(data.benchmarks.industryGrowth)} industry
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{formatPercent(data.current.yearlyGrowth)}</div>
          <div className="text-sm font-medium text-gray-600">Year-over-Year</div>
          <div className="text-xs text-green-600 mt-1">
            Top {formatPercent(data.benchmarks.topQuartile)} quartile
          </div>
        </div>
      </div>

      {/* Revenue Trends - Full Width */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h5 className="font-medium text-gray-900 mb-3">Revenue Growth Trends</h5>
        <svg
          ref={trendsRef}
          width="625"
          height="300"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Segmentation and Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Segments */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-3">Revenue by Customer Segment</h5>
          <div className="space-y-3">
            {Object.entries(data.segments).map(([segment, segData]) => (
              <div key={segment} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{segment}</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(segData.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{segData.percentage}% of total</span>
                    <span className="text-green-600">{formatPercent(segData.growth)} growth</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${segData.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Channels */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-3">Revenue by Channel</h5>
          <div className="space-y-3">
            {Object.entries(data.channels).map(([channel, channelData]) => (
              <div key={channel} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <div className="font-medium text-sm text-gray-900">{channel}</div>
                  <div className="text-xs text-gray-500">
                    {formatPercent(channelData.growth)} growth
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(channelData.revenue)}</div>
                  <div className="text-xs text-gray-500">
                    {((channelData.revenue / data.current.arr) * 100).toFixed(0)}% of total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h5 className="font-medium text-gray-900 mb-3">Revenue Forecast</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{formatCurrency(data.forecast.q2Target)}</div>
            <div className="text-sm text-gray-600">Q2 Target</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{formatCurrency(data.forecast.q3Target)}</div>
            <div className="text-sm text-gray-600">Q3 Target</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{formatCurrency(data.forecast.q4Target)}</div>
            <div className="text-sm text-gray-600">Q4 Target</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{formatCurrency(data.forecast.yearEndTarget)}</div>
            <div className="text-sm text-gray-600">Year-End Target</div>
            <div className="text-xs text-green-600 mt-1">{data.forecast.confidence}% confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}