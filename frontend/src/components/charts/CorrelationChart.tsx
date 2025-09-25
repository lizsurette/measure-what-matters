import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface CorrelationData {
  x: number;
  y: number;
  label: string;
  category: string;
}

interface CorrelationChartProps {
  data: CorrelationData[];
  width?: number;
  height?: number;
  xLabel: string;
  yLabel: string;
  title?: string;
}

export function CorrelationChart({
  data,
  width = 400,
  height = 300,
  xLabel,
  yLabel,
  title
}: CorrelationChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .range([0, innerWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .range([innerHeight, 0])
      .nice();

    // Color scale for categories
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain([...new Set(data.map(d => d.category))]);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    if (title) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#374151')
        .text(title);
    }

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .style('color', '#6b7280');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('color', '#6b7280');

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text(yLabel);

    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text(xLabel);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Add regression line
    const regression = calculateLinearRegression(data);
    if (regression) {
      const x1 = xScale.domain()[0];
      const x2 = xScale.domain()[1];
      const y1 = regression.slope * x1 + regression.intercept;
      const y2 = regression.slope * x2 + regression.intercept;

      g.append('line')
        .attr('x1', xScale(x1))
        .attr('y1', yScale(y1))
        .attr('x2', xScale(x2))
        .attr('y2', yScale(y2))
        .style('stroke', '#ef4444')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');

      // Add R² value
      g.append('text')
        .attr('x', innerWidth - 10)
        .attr('y', 20)
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', '#ef4444')
        .text(`R² = ${regression.rSquared.toFixed(3)}`);
    }

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px');

    // Add data points
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 6)
      .style('fill', d => colorScale(d.category))
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        tooltip.html(`
          <strong>${d.label}</strong><br/>
          ${xLabel}: ${d.x}<br/>
          ${yLabel}: ${d.y}<br/>
          Category: ${d.category}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add legend
    const legend = g.selectAll('.legend')
      .data(colorScale.domain())
      .enter().append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(0,${i * 20})`);

    legend.append('rect')
      .attr('x', innerWidth - 18)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', colorScale);

    legend.append('text')
      .attr('x', innerWidth - 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#374151')
      .text(d => d);

    // Cleanup function
    return () => {
      tooltip.remove();
    };

  }, [data, width, height, xLabel, yLabel, title]);

  return (
    <div className="correlation-chart">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded"
      />
    </div>
  );
}

// Helper function to calculate linear regression
function calculateLinearRegression(data: CorrelationData[]) {
  const n = data.length;
  if (n < 2) return null;

  const sumX = data.reduce((sum, d) => sum + d.x, 0);
  const sumY = data.reduce((sum, d) => sum + d.y, 0);
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumXX = data.reduce((sum, d) => sum + d.x * d.x, 0);
  const sumYY = data.reduce((sum, d) => sum + d.y * d.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  const ssRes = data.reduce((sum, d) => {
    const predicted = slope * d.x + intercept;
    return sum + Math.pow(d.y - predicted, 2);
  }, 0);
  const ssTot = data.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  return { slope, intercept, rSquared };
}