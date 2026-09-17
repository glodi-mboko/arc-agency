"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface WeeklyChartProps {
  data: { week: string; count: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="week"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            stroke="rgb(var(--muted-foreground))"
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            stroke="rgb(var(--muted-foreground))"
          />
          <Tooltip
            cursor={{ fill: "rgb(var(--muted))" }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "rgb(var(--border))",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="count"
            fill="rgb(var(--accent))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
