import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface FlowBreakdownChartProps {
  data: {
    totalTime: { p50: number; p85: number; p95: number; current: number };
    breakdown: { leadTime: number; cycleTime: number };
    monthlyData: Array<{ month: string; leadTime: number; cycleTime: number; total: number }>;
    phaseBreakdown: Record<string, number>;
  };
}

export function FlowBreakdownChart({ data }: FlowBreakdownChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 900;
    const height = 450;
    const margin = { top: 30, right: 90, bottom: 80, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Colors - Much more pleasant and professional
    const colors = {
      leadTime: '#f59e0b',    // amber-500 - warm, represents waiting time
      cycleTime: '#10b981'    // emerald-500 - green, represents active work
    };

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.monthlyData.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data.monthlyData, d => d.total) || 30])
      .range([innerHeight, 0]);

    // Draw stacked bars
    data.monthlyData.forEach(d => {
      const barWidth = xScale.bandwidth();
      const x = xScale(d.month) || 0;

      // Lead Time (bottom part)
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(d.leadTime))
        .attr("width", barWidth)
        .attr("height", innerHeight - yScale(d.leadTime))
        .attr("fill", colors.leadTime)
        .attr("rx", 3);

      // Cycle Time (top part)
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(d.total))
        .attr("width", barWidth)
        .attr("height", yScale(d.leadTime) - yScale(d.total))
        .attr("fill", colors.cycleTime)
        .attr("rx", 3);

      // Total time label on top
      g.append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", yScale(d.total) - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "600")
        .attr("fill", "#374151")
        .text(`${d.total}d`);

      // Lead time label in middle
      if (d.leadTime > 3) {
        g.append("text")
          .attr("x", x + barWidth / 2)
          .attr("y", yScale(d.leadTime / 2) + 3)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "500")
          .attr("fill", "white")
          .text(`${d.leadTime}d`);
      }

      // Cycle time label in top
      if (d.cycleTime > 2) {
        g.append("text")
          .attr("x", x + barWidth / 2)
          .attr("y", yScale(d.total) + (yScale(d.leadTime) - yScale(d.total)) / 2 + 3)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "500")
          .attr("fill", "white")
          .text(`${d.cycleTime}d`);
      }
    });

    // Add target line (21 days)
    const targetY = yScale(21);
    g.append("line")
      .attr("x1", -10)
      .attr("x2", innerWidth + 10)
      .attr("y1", targetY)
      .attr("y2", targetY)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,3")
      .attr("opacity", 0.8);

    // Add "Target: 21 days" label
    g.append("text")
      .attr("x", innerWidth + 15)
      .attr("y", targetY + 4)
      .attr("text-anchor", "start")
      .attr("font-size", "13px")
      .attr("font-weight", "500")
      .attr("fill", "#64748b")
      .text("Target: 21d");

    // Y-axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => `${d}d`);

    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("font-size", "13px")
      .attr("fill", "#6b7280");

    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "500")
      .attr("fill", "#374151")
      .text("Days to Deliver");

    // X-axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .selectAll("text")
      .data(data.monthlyData)
      .enter()
      .append("text")
      .attr("x", d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("fill", "#6b7280")
      .text(d => d.month);

    // X-axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "500")
      .attr("fill", "#374151")
      .text("Month");

  }, [data]);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="bg-white rounded-lg p-2 border border-gray-100">
        <svg
          ref={svgRef}
          className="w-full"
          viewBox="0 0 900 450"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>

      {/* Legend and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Legend */}
        <div className="space-y-4">
          <h5 className="font-medium text-gray-900">Legend</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-sm text-gray-700">Lead Time (Pre-development)</span>
              <span className="text-sm font-medium text-gray-900">{data.breakdown.leadTime}d</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <span className="text-sm text-gray-700">Cycle Time (Development)</span>
              <span className="text-sm font-medium text-gray-900">{data.breakdown.cycleTime}d</span>
            </div>
          </div>
        </div>

        {/* Percentile Breakdown */}
        <div className="space-y-4">
          <h5 className="font-medium text-gray-900">Performance Distribution</h5>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">P50 (Median):</span>
              <span className="font-medium">{data.totalTime.p50}d</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">P85 (Most cases):</span>
              <span className="font-medium">{data.totalTime.p85}d</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">P95 (Worst case):</span>
              <span className="font-medium">{data.totalTime.p95}d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <h5 className="font-medium text-gray-900 mb-3">Detailed Phase Breakdown</h5>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(data.phaseBreakdown).map(([phase, days]) => (
            <div key={phase} className="text-center">
              <div className="text-lg font-bold text-amber-700">{days}d</div>
              <div className="text-xs text-gray-600">{phase}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-600">
          💡 <strong>Key Insight:</strong> {Math.round((data.breakdown.leadTime / (data.breakdown.leadTime + data.breakdown.cycleTime)) * 100)}% of time is spent before development starts
        </div>
      </div>
    </div>
  );
}