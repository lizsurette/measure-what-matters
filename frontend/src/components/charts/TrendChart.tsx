import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ChartDataPoint } from '../../types';

interface TrendChartProps {
  data: ChartDataPoint[];
  height?: number;
}

export function TrendChart({ data, height = 300 }: TrendChartProps) {
  const formatXAxisDate = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipDate = (label: string) => {
    const date = new Date(label);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {formatTooltipDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center text-sm">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-600 mr-2">{entry.name}:</span>
              <span className="font-medium text-gray-900">{entry.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Find min and max values for better y-axis scaling
  const values = data.map(d => d.value);
  const targets = data.map(d => d.target).filter(Boolean) as number[];
  const allValues = [...values, ...targets];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxisDate}
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis
          domain={[minValue - padding, maxValue + padding]}
          stroke="#6b7280"
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Target line */}
        {data[0]?.target && (
          <ReferenceLine
            y={data[0].target}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{ value: "Target", position: "top" }}
          />
        )}

        {/* Actual value line */}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          name="Actual"
        />

        {/* Target value line (if targets vary) */}
        {data.some(d => d.target !== data[0]?.target) && (
          <Line
            type="monotone"
            dataKey="target"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Target"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}