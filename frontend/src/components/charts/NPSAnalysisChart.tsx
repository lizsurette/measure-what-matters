import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface NPSAnalysisChartProps {
  data: {
    currentBreakdown: {
      promoters: number;
      passives: number;
      detractors: number;
      responseRate: number;
      totalResponses: number;
    };
    monthlyTrends: Array<{
      month: string;
      nps: number;
      promoters: number;
      passives: number;
      detractors: number;
      responses: number;
    }>;
    segmentation: Record<string, {
      nps: number;
      promoters: number;
      detractors: number;
      responses: number;
    }>;
    benchmarks: {
      industry: number;
      competitors: number;
      internal: number;
    };
    actionItems: {
      detractorFollowUp: number;
      responseRate: number;
      avgResponseTime: number;
    };
  };
}

export function NPSAnalysisChart({ data }: NPSAnalysisChartProps) {
  const trendsRef = useRef<SVGSVGElement>(null);
  const breakdownRef = useRef<SVGSVGElement>(null);

  // Monthly Trends Chart
  useEffect(() => {
    if (!data || !trendsRef.current) return;

    const svg = d3.select(trendsRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 300;
    const margin = { top: 40, right: 120, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.monthlyTrends.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([-20, 80])
      .range([innerHeight, 0]);

    // Stacked bar data
    data.monthlyTrends.forEach(d => {
      const barWidth = xScale.bandwidth();
      const x = xScale(d.month) || 0;

      // Detractors (at bottom, red) - using negative values
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(0))
        .attr("width", barWidth)
        .attr("height", yScale(-d.detractors) - yScale(0))
        .attr("fill", "#fca5a5")
        .attr("rx", 2);

      // Passives (middle, yellow) - from 0 to passives
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(d.passives))
        .attr("width", barWidth)
        .attr("height", yScale(0) - yScale(d.passives))
        .attr("fill", "#fde68a")
        .attr("rx", 2);

      // Promoters (top, green) - from passives to total
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(d.passives + d.promoters))
        .attr("width", barWidth)
        .attr("height", yScale(d.passives) - yScale(d.passives + d.promoters))
        .attr("fill", "#a7f3d0")
        .attr("rx", 2);

      // NPS score label
      g.append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", yScale(d.passives + d.promoters) - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("fill", "#374151")
        .text(d.nps);
    });

    // Zero line
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "#374151")
      .attr("stroke-width", 1);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("fill", "#6b7280");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("fill", "#6b7280");

    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -25)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#374151")
      .text("% of Responses");

    // Legend
    const legend = g.append("g")
      .attr("transform", `translate(${innerWidth + 20}, 20)`);

    const legendData = [
      { label: 'Promoters', color: '#a7f3d0' },
      { label: 'Passives', color: '#fde68a' },
      { label: 'Detractors', color: '#fca5a5' }
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendItem.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", item.color)
        .attr("rx", 2);

      legendItem.append("text")
        .attr("x", 18)
        .attr("y", 9)
        .attr("font-size", "12px")
        .attr("fill", "#374151")
        .text(item.label);
    });

  }, [data]);

  // Current Breakdown Pie Chart
  useEffect(() => {
    if (!data || !breakdownRef.current) return;

    const svg = d3.select(breakdownRef.current);
    svg.selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const pieData = [
      { label: 'Promoters', value: data.currentBreakdown.promoters, color: '#a7f3d0' },
      { label: 'Passives', value: data.currentBreakdown.passives, color: '#fde68a' },
      { label: 'Detractors', value: data.currentBreakdown.detractors, color: '#fca5a5' }
    ];

    const arcs = g.selectAll('.arc')
      .data(pie(pieData))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color);

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', d => {
        if (d.data.label === 'Promoters') return '#166534'; // dark green
        if (d.data.label === 'Passives') return '#92400e'; // dark yellow
        return '#991b1b'; // dark red
      })
      .text(d => `${d.data.value}%`);

    // Center text with NPS score
    const currentNPS = data.currentBreakdown.promoters - data.currentBreakdown.detractors;
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .attr('y', -5)
      .text(currentNPS);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .attr('y', 15)
      .text('NPS Score');

  }, [data]);

  const getNPSStatus = (score: number) => {
    if (score >= 71) return { label: 'Excellent', color: 'text-green-700' };
    if (score >= 51) return { label: 'Great', color: 'text-green-600' };
    if (score >= 31) return { label: 'Good', color: 'text-yellow-600' };
    if (score >= 0) return { label: 'Needs Work', color: 'text-orange-600' };
    return { label: 'Critical', color: 'text-red-600' };
  };

  const currentNPS = data.currentBreakdown.promoters - data.currentBreakdown.detractors;
  const status = getNPSStatus(currentNPS);

  return (
    <div className="space-y-4">
      {/* NPS Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Score */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-3xl font-bold text-gray-900">{currentNPS}</div>
          <div className={`text-sm font-medium ${status.color}`}>{status.label}</div>
          <div className="text-xs text-gray-500 mt-1">
            {data.currentBreakdown.promoters}% Promoters, {data.currentBreakdown.detractors}% Detractors
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-3xl font-bold text-gray-900">{data.currentBreakdown.responseRate}%</div>
          <div className="text-sm font-medium text-gray-600">Response Rate</div>
          <div className="text-xs text-gray-500 mt-1">
            {data.currentBreakdown.totalResponses.toLocaleString()} responses
          </div>
        </div>

        {/* Follow-up Rate */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-3xl font-bold text-gray-900">{data.actionItems.detractorFollowUp}%</div>
          <div className="text-sm font-medium text-gray-600">Detractor Follow-up</div>
          <div className="text-xs text-gray-500 mt-1">
            Avg {data.actionItems.avgResponseTime}d response time
          </div>
        </div>
      </div>

      {/* Monthly Trends - Full Width */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h5 className="font-medium text-gray-900 mb-3">5-Month Trends</h5>
        <svg
          ref={trendsRef}
          width="600"
          height="300"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Distribution and Segmentation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current Breakdown */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-3">Current Distribution</h5>
          <div className="flex justify-center">
            <svg
              ref={breakdownRef}
              width="300"
              height="300"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>

        {/* Segmentation - Moved here */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-3">Customer Segmentation</h5>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.segmentation).map(([segment, segData]) => (
              <div key={segment} className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="text-lg font-bold text-gray-900">{segData.nps}</div>
                <div className="text-sm font-medium text-gray-700">{segment}</div>
                <div className="text-xs text-gray-500">
                  {segData.promoters}% promoters
                </div>
                <div className="text-xs text-gray-500">
                  {segData.responses} responses
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
}