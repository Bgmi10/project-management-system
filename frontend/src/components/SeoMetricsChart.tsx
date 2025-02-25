import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface MetricsChartProps {
  data: Array<{
    date: string;
    organic_traffic: number;
    bounce_rate: number;
    avg_position: number;
    conversions: number;
  }>;
  metrics: string[];
}

export function SeoMetricsChart({ data, metrics }: MetricsChartProps) {
  const colors = {
    organic_traffic: '#10B981',
    bounce_rate: '#EF4444',
    avg_position: '#3B82F6',
    conversions: '#8B5CF6'
  };

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'bounce_rate':
        return `${value.toFixed(2)}%`;
      case 'avg_position':
        return value.toFixed(1);
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatValue(value, name),
              name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            ]}
          />
          <Legend />
          {metrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={colors[metric as keyof typeof colors]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8 }}
              name={metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}