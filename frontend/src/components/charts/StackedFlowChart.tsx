import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface StackedFlowChartProps {
  data: {
    totalTime: { p50: number; p85: number; p95: number; current: number };
    breakdown: { leadTime: number; cycleTime: number };
    weeklyData: Array<{ week: string; leadTime: number; cycleTime: number; total: number }>;
    phaseBreakdown: Record<string, number>;
  };
  healthStatus: 'green' | 'yellow' | 'red';
}

export function StackedFlowChart({ data, healthStatus }: StackedFlowChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const getColors = () => {
    switch (healthStatus) {
      case 'green':
        return {
          leadTime: '#059669',    // green-600
          cycleTime: '#10b981'    // green-500
        };
      case 'yellow':
        return {
          leadTime: '#d97706',    // amber-600
          cycleTime: '#f59e0b'    // amber-500
        };
      case 'red':
        return {
          leadTime: '#dc2626',    // red-600
          cycleTime: '#ef4444'    // red-500
        };
    }
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 280;
    const height = 100;
    const margin = { top: 10, right: 10, bottom: 25, left: 25 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const colors = getColors();
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.weeklyData.map(d => d.week))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data.weeklyData, d => d.total) || 30])
      .range([innerHeight, 0]);

    // Stack the data
    const stackedData = data.weeklyData.map(d => ({
      week: d.week,
      leadTime: d.leadTime,
      cycleTime: d.cycleTime,
      total: d.total
    }));

    // Draw stacked bars
    stackedData.forEach(d => {
      const barWidth = xScale.bandwidth();
      const x = xScale(d.week) || 0;

      // Lead Time (bottom part)
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(d.leadTime))
        .attr("width", barWidth)
        .attr("height", innerHeight - yScale(d.leadTime))
        .attr("fill", colors.leadTime)
        .attr("rx", 2);

      // Cycle Time (top part)
      g.append("rect")
        .attr("x", x)
        .attr("y", yScale(d.total))
        .attr("width", barWidth)
        .attr("height", yScale(d.leadTime) - yScale(d.total))
        .attr("fill", colors.cycleTime)
        .attr("rx", 2);

      // Total time label on top
      g.append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", yScale(d.total) - 3)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "600")
        .attr("fill", "#374151")
        .text(`${d.total}d`);
    });

    // Add target line (21 days)
    const targetY = yScale(21);
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", targetY)
      .attr("y2", targetY)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,2")
      .attr("opacity", 0.8);

    // Add "Target" label
    g.append("text")
      .attr("x", innerWidth - 2)
      .attr("y", targetY - 2)
      .attr("text-anchor", "end")
      .attr("font-size", "8px")
      .attr("fill", "#64748b")
      .text("Target");

    // Add week labels
    g.selectAll(".week-label")
      .data(stackedData)
      .enter()
      .append("text")
      .attr("class", "week-label")
      .attr("x", d => (xScale(d.week) || 0) + xScale.bandwidth() / 2)
      .attr("y", innerHeight + 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#6b7280")
      .text(d => d.week);

  }, [data, healthStatus]);

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="mb-3">
        <svg
          ref={svgRef}
          className="w-full"
          viewBox="0 0 280 100"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>

      {/* Legend and Metrics */}
      <div className="text-xs space-y-2">
        {/* Legend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded`} style={{ backgroundColor: getColors().leadTime }}></div>
              <span className="text-gray-600">Lead Time</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded`} style={{ backgroundColor: getColors().cycleTime }}></div>
              <span className="text-gray-600">Cycle Time</span>
            </div>
          </div>
          <div className="text-gray-500">Target: 21d</div>
        </div>

        {/* Current Breakdown */}
        <div className="flex justify-between text-xs">
          <div>
            <span className="text-gray-500">Current: </span>
            <span className="font-medium">{data.breakdown.leadTime}d lead</span>
            <span className="text-gray-400"> + </span>
            <span className="font-medium">{data.breakdown.cycleTime}d cycle</span>
          </div>
          <div>
            <span className="text-gray-500">P85: </span>
            <span>{data.totalTime.p85}d</span>
          </div>
        </div>

        {/* Key Insight */}
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
          📊 {Math.round((data.breakdown.leadTime / (data.breakdown.leadTime + data.breakdown.cycleTime)) * 100)}% pre-development time
        </div>
      </div>
    </div>
  );
}