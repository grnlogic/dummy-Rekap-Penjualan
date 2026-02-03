"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReportChartProps {
  data: Array<{
    product: string;
    quantity: number;
    revenue: number;
    percentage: string | number;
  }>;
}

export function ReportsChart({ data }: ReportChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="product"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis
            tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toLocaleString("id-ID"),
              name === "revenue" ? "Revenue" : "Quantity",
            ]}
            labelFormatter={(label: string) => `Produk: ${label}`}
          />
          <Bar dataKey="revenue" fill="#3B82F6" name="revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
