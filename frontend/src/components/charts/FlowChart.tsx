import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface FlowChartProps {
  data: {
    leadTime: { p50: number; p85: number; p95: number; current: number };
    cycleTime: { p50: number; p85: number; p95: number; current: number };
    breakdown: Record<string, number>;
    weeklyTrend: Array<{ week: string; leadTime: number; cycleTime: number }>;
  };
  healthStatus: 'green' | 'yellow' | 'red';
}

export function FlowChart({ data, healthStatus }: FlowChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const getColor = () => {
    switch (healthStatus) {
      case 'green': return '#10b981';
      case 'yellow': return '#f59e0b';
      case 'red': return '#ee0000';
    }
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 280;
    const height = 100;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales for the dual-line chart
    const xScale = d3.scalePoint()
      .domain(data.weeklyTrend.map(d => d.week))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data.weeklyTrend, d => Math.max(d.leadTime, d.cycleTime)) || 20])
      .range([innerHeight, 0]);

    // Create line generators
    const leadTimeLine = d3.line<typeof data.weeklyTrend[0]>()
      .x(d => xScale(d.week) || 0)
      .y(d => yScale(d.leadTime))
      .curve(d3.curveCardinal.tension(0.3));

    const cycleTimeLine = d3.line<typeof data.weeklyTrend[0]>()
      .x(d => xScale(d.week) || 0)
      .y(d => yScale(d.cycleTime))
      .curve(d3.curveCardinal.tension(0.3));

    // Draw Lead Time line (primary)
    g.append("path")
      .datum(data.weeklyTrend)
      .attr("fill", "none")
      .attr("stroke", getColor())
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("d", leadTimeLine);

    // Draw Cycle Time line (secondary)
    g.append("path")
      .datum(data.weeklyTrend)
      .attr("fill", "none")
      .attr("stroke", getColor())
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-dasharray", "4,2")
      .attr("d", cycleTimeLine);

    // Add target line
    const targetY = yScale(7); // 7 days target
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", targetY)
      .attr("y2", targetY)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.7);

    // Add data points for latest values
    const latestPoint = data.weeklyTrend[data.weeklyTrend.length - 1];

    // Lead time point
    g.append("circle")
      .attr("cx", xScale(latestPoint.week) || 0)
      .attr("cy", yScale(latestPoint.leadTime))
      .attr("r", 3)
      .attr("fill", getColor())
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Cycle time point
    g.append("circle")
      .attr("cx", xScale(latestPoint.week) || 0)
      .attr("cy", yScale(latestPoint.cycleTime))
      .attr("r", 2.5)
      .attr("fill", getColor())
      .attr("opacity", 0.8)
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Add week labels
    g.selectAll(".week-label")
      .data(data.weeklyTrend)
      .enter()
      .append("text")
      .attr("class", "week-label")
      .attr("x", d => xScale(d.week) || 0)
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

      {/* Legend and Key Metrics */}
      <div className="text-xs space-y-2">
        {/* Legend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className={`w-3 h-0.5 rounded`} style={{ backgroundColor: getColor() }}></div>
              <span className="text-gray-600">Lead Time</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-0.5 rounded opacity-60`} style={{
                backgroundColor: getColor(),
                borderStyle: 'dashed',
                borderWidth: '1px 0'
              }}></div>
              <span className="text-gray-600">Cycle Time</span>
            </div>
          </div>
          <div className="text-gray-500">Target: 7d</div>
        </div>

        {/* Current Metrics */}
        <div className="flex justify-between text-xs">
          <div>
            <span className="text-gray-500">Current: </span>
            <span className="font-medium">{data.leadTime.current}d lead</span>
            <span className="text-gray-400"> / </span>
            <span className="font-medium">{data.cycleTime.current}d cycle</span>
          </div>
          <div>
            <span className="text-gray-500">P85: </span>
            <span>{data.leadTime.p85}d</span>
          </div>
        </div>

        {/* Bottleneck Insight */}
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
          💡 Longest: {Object.entries(data.breakdown)
            .sort(([,a], [,b]) => b - a)[0]
            ?.join(': ')
            ?.replace(':', ` (${Object.entries(data.breakdown).sort(([,a], [,b]) => b - a)[0][1]}d)`)
          }
        </div>
      </div>
    </div>
  );
}