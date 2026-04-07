"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ComposedChart, Line,
  YAxis as YAxisRight,
} from "recharts";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "./score-utils";
import type { BrandRow } from "./score-utils";

interface Props {
  rows: BrandRow[];
}

function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  if (xs.length < 3) return null;
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
  const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
  if (dx === 0 || dy === 0) return null;
  return Math.round((num / (dx * dy)) * 1000) / 1000;
}

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const slope = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) /
    points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const intercept = my - slope * mx;
  return { slope, intercept };
}

const CustomDot = (props: { cx?: number; cy?: number; payload?: { category: string; brand: string; composite: number; stock: number } }) => {
  const { cx, cy, payload } = props;
  if (!payload || cx === undefined || cy === undefined) return null;
  return (
    <circle
      cx={cx} cy={cy} r={5}
      fill={CATEGORY_COLORS[payload.category] ?? "#6B7280"}
      stroke="white"
      strokeWidth={1.5}
      opacity={0.85}
    />
  );
};

const CustomScatterTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { brand: string; composite: number; stock: number; category: string } }> }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-gray-900">{d.brand}</p>
      <p className="text-gray-500">{d.category}</p>
      <p className="text-emerald-600">AI Visibility: {d.composite}</p>
      <p className="text-blue-600">Stock: {d.stock > 0 ? "+" : ""}{d.stock}%</p>
    </div>
  );
};

export function StockCorrelation({ rows }: Props) {
  const [selectedBrand, setSelectedBrand] = useState<string>("Apple");

  const publicBrands = rows.filter(
    (r) => r.stock_ticker && r.composite_score !== null && r.stock_price_change_pct !== null
  );

  const scatterData = publicBrands.map((r) => ({
    brand: r.brand_name,
    category: r.category,
    composite: r.composite_score!,
    stock: r.stock_price_change_pct!,
    x: r.composite_score!,
    y: r.stock_price_change_pct!,
  }));

  const correlation = useMemo(() => {
    const xs = scatterData.map((d) => d.x);
    const ys = scatterData.map((d) => d.y);
    return pearsonCorrelation(xs, ys);
  }, [scatterData]);

  const regression = useMemo(() => {
    return linearRegression(scatterData.map((d) => ({ x: d.x, y: d.y })));
  }, [scatterData]);

  const regressionPoints = useMemo(() => {
    if (!regression) return [];
    return [
      { x: 0,   y: regression.intercept },
      { x: 100, y: regression.slope * 100 + regression.intercept },
    ];
  }, [regression]);

  // Quartile analysis
  const sorted = [...scatterData].sort((a, b) => a.composite - b.composite);
  const q1 = sorted.slice(0, Math.floor(sorted.length / 4));
  const q4 = sorted.slice(Math.ceil(sorted.length * 3 / 4));
  const avgQ1Stock = q1.length > 0 ? (q1.reduce((s, d) => s + d.stock, 0) / q1.length).toFixed(1) : null;
  const avgQ4Stock = q4.length > 0 ? (q4.reduce((s, d) => s + d.stock, 0) / q4.length).toFixed(1) : null;

  const publicBrandNames = Array.from(new Set(publicBrands.map((r) => r.brand_name))).sort();

  return (
    <div className="space-y-6">
      {/* Scatter plot */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">AI Visibility vs Stock Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">Each dot = a public company. X = composite AI visibility, Y = monthly stock %</p>
          </div>
          {correlation !== null && (
            <div className={cn("text-right")}>
              <p className="text-xs text-gray-500">Pearson r</p>
              <p className={cn("text-xl font-bold tabular-nums",
                Math.abs(correlation) > 0.5 ? "text-emerald-600" : Math.abs(correlation) > 0.3 ? "text-amber-600" : "text-gray-500")}>
                {correlation > 0 ? "+" : ""}{correlation}
              </p>
            </div>
          )}
        </div>

        {scatterData.length < 3 ? (
          <p className="text-sm text-gray-400 text-center py-12">
            Stock correlation data appears after the first monthly scan with stock prices fetched.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                type="number" dataKey="x" domain={[0, 100]}
                label={{ value: "AI Visibility Score", position: "insideBottom", offset: -10, fontSize: 10 }}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                type="number" dataKey="y"
                label={{ value: "Stock Δ%", angle: -90, position: "insideLeft", fontSize: 10 }}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomScatterTooltip />} />
              <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="4 4" />
              <Scatter data={scatterData} shape={<CustomDot />} />
            </ScatterChart>
          </ResponsiveContainer>
        )}

        <p className="text-xs text-gray-400 text-center mt-2">Correlation does not imply causation.</p>
      </div>

      {/* Quartile analysis */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Quartile Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Top Quartile AI (65+)", value: avgQ4Stock !== null ? `${Number(avgQ4Stock) > 0 ? "+" : ""}${avgQ4Stock}%` : "—", desc: "Avg stock Δ", color: "text-emerald-600" },
            { label: "Bottom Quartile (<35)", value: avgQ1Stock !== null ? `${Number(avgQ1Stock) > 0 ? "+" : ""}${avgQ1Stock}%` : "—", desc: "Avg stock Δ", color: "text-red-500" },
            { label: "Brands with stock data", value: String(scatterData.length), desc: "Public companies", color: "text-blue-600" },
            { label: "Correlation (r)", value: correlation !== null ? String(correlation) : "—", desc: "Pearson coefficient", color: Math.abs(correlation ?? 0) > 0.3 ? "text-emerald-600" : "text-gray-500" },
          ].map(({ label, value, desc, color }) => (
            <div key={label} className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-brand dual-axis (stub — needs historical data) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Per-Brand: AI Score vs Stock Price</h2>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          >
            {publicBrandNames.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400 text-center py-8">
          Dual-axis chart (AI score vs stock price over time) appears after the second monthly scan.
        </p>
      </div>
    </div>
  );
}
