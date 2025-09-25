import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface CultureDimensionsChartProps {
  data: {
    dimensions: Record<string, { score: number; trend: 'up' | 'down' | 'stable'; target: number }>;
    monthlyTrends: Array<{ month: string; engagement: number; satisfaction: number; retention: number }>;
  };
}

export function CultureDimensionsChart({ data }: CultureDimensionsChartProps) {
  const radarRef = useRef<SVGSVGElement>(null);
  const trendsRef = useRef<SVGSVGElement>(null);

  // Radar Chart for Culture Dimensions
  useEffect(() => {
    if (!data || !radarRef.current) return;

    const svg = d3.select(radarRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 400;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const g = svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    const dimensions = Object.entries(data.dimensions);
    const angleSlice = (2 * Math.PI) / dimensions.length;

    // Create scales
    const rScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Draw grid circles
    [20, 40, 60, 80, 100].forEach(value => {
      g.append("circle")
        .attr("r", rScale(value))
        .attr("fill", "none")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1);
    });

    // Draw grid lines
    dimensions.forEach((_, i) => {
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1);
    });

    // Draw target area
    const targetPath = d3.line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveLinearClosed);

    const targetPoints: [number, number][] = dimensions.map(([_, dim], i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [
        rScale(dim.target) * Math.cos(angle),
        rScale(dim.target) * Math.sin(angle)
      ];
    });

    g.append("path")
      .datum(targetPoints)
      .attr("d", targetPath)
      .attr("fill", "#f3f4f6")
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 2)
      .attr("opacity", 0.3);

    // Draw actual scores
    const scorePoints: [number, number][] = dimensions.map(([_, dim], i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [
        rScale(dim.score) * Math.cos(angle),
        rScale(dim.score) * Math.sin(angle)
      ];
    });

    g.append("path")
      .datum(scorePoints)
      .attr("d", targetPath)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#1d4ed8")
      .attr("stroke-width", 3)
      .attr("opacity", 0.6);

    // Add score points
    dimensions.forEach(([name, dim], i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = rScale(dim.score) * Math.cos(angle);
      const y = rScale(dim.score) * Math.sin(angle);

      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .attr("fill", "#1d4ed8");

      // Add labels
      const labelX = rScale(110) * Math.cos(angle);
      const labelY = rScale(110) * Math.sin(angle);

      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("fill", "#374151")
        .text(name);

      // Add score text
      g.append("text")
        .attr("x", x)
        .attr("y", y - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("fill", "#1d4ed8")
        .text(`${dim.score}%`);
    });

  }, [data]);

  // Trends Chart
  useEffect(() => {
    if (!data || !trendsRef.current) return;

    const svg = d3.select(trendsRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 120, bottom: 40, left: 40 };
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
      .domain([60, 100])
      .range([innerHeight, 0]);

    // Line generator
    const line = d3.line<any>()
      .x(d => xScale(d.month)! + xScale.bandwidth() / 2)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Colors
    const colors = {
      engagement: '#3b82f6',
      satisfaction: '#10b981',
      retention: '#f59e0b'
    };

    // Draw lines
    ['engagement', 'satisfaction', 'retention'].forEach(metric => {
      const lineData = data.monthlyTrends.map(d => ({
        month: d.month,
        value: d[metric as keyof typeof d] as number
      }));

      g.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", colors[metric as keyof typeof colors])
        .attr("stroke-width", 3)
        .attr("d", line);

      // Add dots
      g.selectAll(`.dot-${metric}`)
        .data(lineData)
        .enter().append("circle")
        .attr("class", `dot-${metric}`)
        .attr("cx", d => xScale(d.month)! + xScale.bandwidth() / 2)
        .attr("cy", d => yScale(d.value))
        .attr("r", 4)
        .attr("fill", colors[metric as keyof typeof colors]);
    });

    // X-axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("fill", "#6b7280");

    // Y-axis
    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("fill", "#6b7280");

    // Legend
    const legend = g.append("g")
      .attr("transform", `translate(${innerWidth + 10}, 20)`);

    ['engagement', 'satisfaction', 'retention'].forEach((metric, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendItem.append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", colors[metric as keyof typeof colors])
        .attr("stroke-width", 3);

      legendItem.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("alignment-baseline", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#374151")
        .text(metric.charAt(0).toUpperCase() + metric.slice(1));
    });

  }, [data]);

  return (
    <div className="space-y-4">
      {/* Culture Dimensions Radar Chart */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <h5 className="font-medium text-gray-900 mb-3">Culture Dimensions</h5>
        <div className="flex justify-center">
          <svg
            ref={radarRef}
            width="400"
            height="400"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <h5 className="font-medium text-gray-900 mb-3">5-Month Trends</h5>
        <svg
          ref={trendsRef}
          width="600"
          height="300"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Dimension Details */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <h5 className="font-medium text-gray-900 mb-3">Dimension Breakdown</h5>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(data.dimensions).map(([name, dim]) => (
            <div key={name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium text-sm text-gray-900">{name}</div>
                <div className="text-xs text-gray-600">Target: {dim.target}%</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  dim.score >= dim.target ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {dim.score}%
                </div>
                <div className={`text-xs ${
                  dim.trend === 'up' ? 'text-green-600' :
                  dim.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {dim.trend === 'up' ? '↗' : dim.trend === 'down' ? '↘' : '→'} {dim.trend}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}