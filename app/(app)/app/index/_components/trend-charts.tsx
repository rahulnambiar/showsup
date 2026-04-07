"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "./score-utils";
import type { BrandRow } from "./score-utils";

interface Props {
  rows: BrandRow[];
}

const LINE_COLORS = ["#10B981", "#60A5FA", "#C084FC", "#F59E0B", "#F472B6"];

const SIGNAL_KEYS = [
  { key: "llm_probing_score",        label: "LLM Probing",        color: "#10B981" },
  { key: "structured_data_score",    label: "Structured Data",    color: "#60A5FA" },
  { key: "training_data_score",      label: "Training Data",      color: "#C084FC" },
  { key: "citation_sources_score",   label: "Citation Sources",   color: "#F59E0B" },
  { key: "search_correlation_score", label: "Search Correlation", color: "#F472B6" },
  { key: "crawler_readiness_score",  label: "Crawler Readiness",  color: "#34D399" },
] as const;

type HistoryPoint = Record<string, number | string | null>;

const TOP5_PRESETS = ["Apple", "Google", "Microsoft", "Amazon", "Samsung"];
const MOVERS_PRESETS = ["Tesla", "Nike", "Netflix", "Disney", "Airbnb"];

export function TrendCharts({ rows }: Props) {
  const [tab, setTab] = useState<"multi" | "category" | "brand">("multi");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(TOP5_PRESETS.slice(0, 5));
  const [selectedBrand, setSelectedBrand] = useState<string>("Apple");
  const [brandHistory, setBrandHistory] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Group rows by brand/month for multi-brand chart
  const allBrands = Array.from(new Set(rows.map((r) => r.brand_name))).sort();
  const allCategories = Array.from(new Set(rows.map((r) => r.category))).sort();

  // Category averages from current rows
  const categoryData = allCategories.map((cat) => {
    const catRows = rows.filter((r) => r.category === cat && r.composite_score !== null);
    const avg = catRows.length > 0
      ? Math.round(catRows.reduce((s, r) => s + r.composite_score!, 0) / catRows.length)
      : null;
    return { category: cat, avg };
  }).filter((d) => d.avg !== null);

  // Per-brand signal history
  const fetchBrandHistory = useCallback(async (brandName: string) => {
    const brand = rows.find((r) => r.brand_name === brandName);
    if (!brand) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/brand-index/data?history=${encodeURIComponent(brand.brand_url)}`);
      const data = await res.json() as { history?: HistoryPoint[] };
      setBrandHistory(data.history ?? []);
    } catch {
      setBrandHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [rows]);

  useEffect(() => {
    if (tab === "brand") {
      fetchBrandHistory(selectedBrand);
    }
  }, [tab, selectedBrand, fetchBrandHistory]);

  function toggleBrand(name: string) {
    setSelectedBrands((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : prev.length < 5 ? [...prev, name] : prev
    );
  }

  const tabs = [
    { key: "multi",    label: "Multi-Brand Comparison" },
    { key: "category", label: "Category Averages"       },
    { key: "brand",    label: "Brand Signal Evolution"  },
  ] as const;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-100 mb-4 -mx-5 px-5">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "pb-2.5 px-1 text-xs font-medium border-b-2 transition-colors",
              tab === key ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Multi-brand comparison */}
      {tab === "multi" && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-gray-500 font-medium">Presets:</span>
            {[
              { label: "Top 5", brands: TOP5_PRESETS },
              { label: "Movers", brands: MOVERS_PRESETS },
            ].map(({ label, brands }) => (
              <button
                key={label}
                onClick={() => setSelectedBrands(brands)}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
              >
                {label}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-1">(select up to 5)</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {allBrands.slice(0, 40).map((b) => (
              <button
                key={b}
                onClick={() => toggleBrand(b)}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border transition-colors",
                  selectedBrands.includes(b)
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {b}
              </button>
            ))}
          </div>
          {selectedBrands.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Select at least one brand</p>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-3 text-center">
                Current month composite scores — historical trend available after multiple monthly runs
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {selectedBrands.map((name, i) => {
                  const row = rows.find((r) => r.brand_name === name);
                  const score = row?.composite_score ?? null;
                  return (
                    <div key={name} className="flex flex-col items-center gap-1">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center border-4"
                        style={{ borderColor: LINE_COLORS[i % LINE_COLORS.length] }}
                      >
                        <span className="text-xl font-bold text-gray-800">{score ?? "—"}</span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-4 text-xs text-gray-400 text-center">
            Multi-month trend lines appear here after the second monthly scan runs.
          </div>
        </div>
      )}

      {/* Category averages */}
      {tab === "category" && (
        <div>
          <p className="text-xs text-gray-500 mb-4">Average composite score per category for current month</p>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart_
                data={categoryData}
                margin={{ left: 20, right: 40, top: 0, bottom: 0 }}
              />
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Per-brand signal evolution */}
      {tab === "brand" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-gray-500 font-medium">Brand:</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              {allBrands.map((b) => <option key={b}>{b}</option>)}
            </select>
            {loadingHistory && <span className="text-xs text-emerald-600 animate-pulse">Loading…</span>}
          </div>
          {brandHistory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              {loadingHistory ? "Loading history…" : "No historical data yet. Available after multiple monthly scans."}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={brandHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                {SIGNAL_KEYS.map(({ key, label, color }) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={label}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

// Inline bar chart for category averages (avoids recharts import issue with layout="vertical")
import { BarChart, Bar, Cell } from "recharts";
import { scoreHex as sh } from "./score-utils";

function BarChart_({ data, margin }: { data: { category: string; avg: number | null }[]; margin: object }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={margin as { left: number; right: number; top: number; bottom: number }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={110} />
        <Tooltip formatter={(v) => [`${v}`, "Avg Score"]} contentStyle={{ fontSize: 11 }} />
        <Bar dataKey="avg" radius={[0, 3, 3, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? sh(entry.avg)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
