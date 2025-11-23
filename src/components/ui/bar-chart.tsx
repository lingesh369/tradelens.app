
import * as React from "react";
import { BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface BarChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  yAxisWidth?: number;
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["blue", "green", "yellow", "red", "purple"],
  valueFormatter = (value: number) => value.toString(),
  showLegend = true,
  yAxisWidth = 40,
}: BarChartProps) {
  // Create a configuration object that matches the chart component's expectations
  const chartConfig = categories.reduce(
    (config, category, i) => ({
      ...config,
      [category]: {
        label: category,
        color: colors[i % colors.length],
      },
    }),
    {}
  );

  return (
    <ChartContainer config={chartConfig}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            width={yAxisWidth}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => valueFormatter(value)}
          />
          <Tooltip 
            content={({ active, payload, label }) => (
              <ChartTooltipContent
                active={active}
                payload={payload}
                label={label}
                formatter={(value: number) => valueFormatter(value)}
              />
            )}
          />
          {showLegend && <Legend wrapperStyle={{ bottom: 0 }} />}
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={`var(--color-${category}, ${colors[i % colors.length]})`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
