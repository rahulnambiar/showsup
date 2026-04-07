"use client";

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import type { IndexRow } from "../_lib/data";
import { scoreHex } from "../_lib/utils";

interface Props {
  rows: IndexRow[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Technology": "#10B981", "Automotive": "#60A5FA", "Luxury": "#C084FC",
  "Fashion": "#F472B6", "Consumer Goods": "#FBBF24", "Food & Beverage": "#F97316",
  "Financial Services": "#34D399", "Entertainment": "#38BDF8", "Healthcare": "#86EFAC",
};

const CustomDot = (props: { cx?: number; cy?: number; payload?: { brand: string; category: string } }) => {
  const { cx, cy, payload } = props;
  if (!payload || cx === undefined || cy === undefined) return null;
  return (
    <circle cx={cx} cy={cy} r={5}
      fill={CATEGORY_COLORS[payload.category] ?? "#9CA3AF"}
      stroke="white" strokeWidth={1.5} opacity={0.85} />
  );
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { brand: string; composite: number; stock: number; category: string } }> }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm px-3 py-2 text-[12px]">
      <p className="font-semibold text-[#111827]">{d.brand}</p>
      <p className="text-[#059669]">AI Score: {d.composite}</p>
      <p className="text-[#3B82F6]">Stock: {d.stock > 0 ? "+" : ""}{d.stock}%</p>
    </div>
  );
};

export function StockScatterPreview({ rows }: Props) {
  const data = rows
    .filter((r) => r.stock_price_change_pct !== null && r.composite_score !== null)
    .map((r) => ({
      brand: r.brand_name,
      category: r.category,
      composite: r.composite_score!,
      stock: r.stock_price_change_pct!,
      x: r.composite_score!,
      y: r.stock_price_change_pct!,
    }));

  if (data.length < 3) {
    return (
      <div className="flex items-center justify-center h-[240px] rounded-xl bg-[#F9FAFB] text-[13px] text-[#9CA3AF]">
        Stock correlation data appears after the first monthly scan.
      </div>
    );
  }

  // Top vs bottom quartile
  const sorted = [...data].sort((a, b) => a.composite - b.composite);
  const q1 = sorted.slice(0, Math.floor(sorted.length / 4));
  const q4 = sorted.slice(Math.ceil(sorted.length * 3 / 4));
  const avgQ4 = q4.length > 0 ? (q4.reduce((s, d) => s + d.stock, 0) / q4.length).toFixed(1) : null;
  const avgQ1 = q1.length > 0 ? (q1.reduce((s, d) => s + d.stock, 0) / q1.length).toFixed(1) : null;
  const diff = avgQ4 !== null && avgQ1 !== null ? (Number(avgQ4) - Number(avgQ1)).toFixed(1) : null;

  return (
    <div className="space-y-4">
      {diff !== null && (
        <p className="text-[15px] font-semibold text-[#111827] text-center">
          Top quartile AI visibility brands outperformed bottom quartile by{" "}
          <span className="text-[#10B981]">{Number(diff) > 0 ? "+" : ""}{diff}%</span> this month.
        </p>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis type="number" dataKey="x" domain={[0, 100]}
            label={{ value: "AI Visibility Score", position: "insideBottom", offset: -10, fontSize: 10, fill: "#9CA3AF" }}
            tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
          <YAxis type="number" dataKey="y"
            label={{ value: "Stock Δ%", angle: -90, position: "insideLeft", fontSize: 10, fill: "#9CA3AF" }}
            tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="4 4" />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-[#9CA3AF] text-center">Correlation does not imply causation. Past performance is not indicative of future results.</p>
    </div>
  );
}
