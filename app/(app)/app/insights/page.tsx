"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CorrelationResult } from "@/lib/correlation/engine";

// ── Types ────────────────────────────────────────────────────────────────

interface MatrixCell { x: string; y: string; value: number | null }

interface InsightsData {
  correlations:   CorrelationResult[];
  timeline:       Array<Record<string, number | string>>;
  matrix:         MatrixCell[];
  matrix_labels:  string[];
  scan_series:    Array<{ date: string; score: number }>;
}

// ── Colour helpers ────────────────────────────────────────────────────────

const LINE_COLORS = [
  "#10B981", "#60A5FA", "#C084FC", "#F59E0B",
  "#34D399", "#818CF8", "#F472B6", "#FBBF24",
];

function corrColor(v: number | null): string {
  if (v === null) return "bg-white/5 text-gray-600";
  const abs = Math.abs(v);
  if (abs >= 0.7) return v > 0 ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#EF4444]/20 text-[#EF4444]";
  if (abs >= 0.4) return v > 0 ? "bg-[#F59E0B]/15 text-[#F59E0B]"  : "bg-orange-500/15 text-orange-400";
  return "bg-white/5 text-gray-400";
}

function trendIcon(t: CorrelationResult["trend"]) {
  if (t === "rising")  return <span className="text-[#10B981]">↑</span>;
  if (t === "falling") return <span className="text-[#EF4444]">↓</span>;
  return <span className="text-gray-500">→</span>;
}

// ── Revenue impact estimation ─────────────────────────────────────────────

function RevenueEstimate({ score }: { score: number }) {
  const aiSearchesPerMonth = 50_000;
  const visibility = score / 100;
  const missed     = Math.round(aiSearchesPerMonth * (1 - visibility));
  const convRate   = 0.02;
  const avgValue   = 80;
  const estLost    = Math.round(missed * convRate * avgValue);

  return (
    <Card className="bg-[#111827] border-white/10">
      <CardContent className="pt-4 pb-4 space-y-2">
        <p className="text-sm font-medium text-white">Revenue Impact Estimate</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your category has ~{aiSearchesPerMonth.toLocaleString()} AI searches/mo.
          You{"'"}re visible in <span className="text-white font-medium">{Math.round(visibility * 100)}%</span> of them.
          {estLost > 0 && (
            <> Estimated missed revenue from {missed.toLocaleString()} un-reached searches: <span className="text-[#F59E0B] font-semibold">${estLost.toLocaleString()}/mo</span>.</>
          )}
        </p>
        <p className="text-[10px] text-gray-600">Based on 2% AI-to-site conversion rate × $80 avg order value. Adjust for your actuals.</p>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [data, setData]       = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLines, setActiveLines] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/correlation")
      .then((r) => r.json())
      .then((d: InsightsData) => {
        setData(d);
        // Activate ShowsUp Score + first metric by default
        const keys = d.timeline.length > 0
          ? Object.keys(d.timeline[0]!).filter((k) => k !== "date")
          : [];
        setActiveLines(new Set(keys.slice(0, 3)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  const noData = !data || (data.timeline.length === 0 && data.scan_series.length === 0);
  const latestScore = data?.scan_series.at(-1)?.score ?? 0;

  if (noData) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="space-y-1 mb-8">
          <h1 className="text-2xl font-bold text-white">Insights</h1>
          <p className="text-gray-400 text-sm">Multi-signal correlation across all your data.</p>
        </div>
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <p className="text-4xl">📊</p>
            <p className="text-white font-semibold">No data to correlate yet</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Run a scan first, then upload a CSV (revenue, keywords, social metrics) to see correlations with your AI visibility.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/app/report-builder" className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg px-4 py-2 text-sm transition-colors">
                Run a Scan →
              </Link>
              <Link href="/app/data-sources" className="inline-flex items-center gap-1.5 border border-white/20 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors">
                Upload Data →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build line keys and colors
  const allLineKeys = data.timeline.length > 0
    ? Object.keys(data.timeline[0]!).filter((k) => k !== "date")
    : [];
  const lineColor = (key: string) =>
    key === "ShowsUp Score" ? "#10B981" : LINE_COLORS[(allLineKeys.indexOf(key) - 1 + LINE_COLORS.length) % LINE_COLORS.length]!;

  function toggleLine(key: string) {
    setActiveLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Insights</h1>
        <p className="text-gray-400 text-sm">How your AI visibility correlates with real-world metrics.</p>
      </div>

      {/* ── Multi-signal timeline ── */}
      {data.timeline.length > 0 && (
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm font-semibold text-white">Multi-Signal Timeline</p>
              <p className="text-xs text-gray-500">Last 90 days</p>
            </div>

            {/* Line toggles */}
            <div className="flex flex-wrap gap-2">
              {allLineKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => toggleLine(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 transition-all",
                    activeLines.has(key)
                      ? "border-transparent text-white"
                      : "border-white/10 text-gray-500 hover:text-gray-300"
                  )}
                  style={activeLines.has(key) ? { backgroundColor: lineColor(key) + "20", borderColor: lineColor(key) + "50", color: lineColor(key) } : {}}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lineColor(key) }} />
                  {key.length > 28 ? key.slice(0, 28) + "…" : key}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data.timeline} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => v.slice(5)} // show MM-DD
                />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1F2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#fff", fontSize: 12 }}
                  itemStyle={{ fontSize: 11 }}
                />
                {allLineKeys.filter((k) => activeLines.has(k)).map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={lineColor(key)}
                    strokeWidth={key === "ShowsUp Score" ? 2.5 : 1.5}
                    dot={false}
                    connectNulls
                    name={key}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Correlation cards ── */}
      {data.correlations.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Correlation with AI Visibility</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.correlations.map((c, i) => (
              <Card key={i} className="bg-[#111827] border-white/10">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.metric_name}</p>
                      <p className="text-[11px] text-gray-500">{c.source_name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {trendIcon(c.trend)}
                      <span className={cn("text-sm font-bold rounded px-1.5 py-0.5 tabular-nums", corrColor(c.pearson))}>
                        {c.pearson !== null ? (c.pearson > 0 ? "+" : "") + c.pearson : "—"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{c.insight}</p>
                  <p className="text-[10px] text-gray-600">{c.sample_size} overlapping data points</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Correlation matrix ── */}
      {data.matrix.length > 0 && data.matrix_labels.length > 1 && (
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Correlation Matrix</p>
          <Card className="bg-[#111827] border-white/10 overflow-hidden">
            <CardContent className="pt-4 pb-4 overflow-x-auto">
              <table className="text-xs border-collapse min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-gray-500 pb-2 pr-3 font-medium whitespace-nowrap" />
                    {data.matrix_labels.map((l) => (
                      <th key={l} className="text-gray-500 pb-2 px-1 font-medium whitespace-nowrap max-w-[80px] overflow-hidden">
                        <div className="truncate max-w-[80px]">{l.split(" — ").pop()}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.matrix_labels.map((rowLabel) => (
                    <tr key={rowLabel}>
                      <td className="text-gray-400 pr-3 py-1 whitespace-nowrap font-medium max-w-[120px]">
                        <div className="truncate max-w-[120px]">{rowLabel.split(" — ").pop()}</div>
                      </td>
                      {data.matrix_labels.map((colLabel) => {
                        const cell = data.matrix.find((m) => m.x === rowLabel && m.y === colLabel);
                        const val  = cell?.value ?? null;
                        return (
                          <td key={colLabel} className="px-1 py-1 text-center">
                            <span className={cn(
                              "inline-block rounded px-1.5 py-0.5 tabular-nums font-semibold min-w-[40px]",
                              corrColor(val)
                            )}>
                              {val !== null ? val.toFixed(2) : "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-600 mt-3">
                Values range −1 to +1. Green = strong positive. Red = strong negative. 0 = no correlation.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Revenue impact ── */}
      {latestScore > 0 && <RevenueEstimate score={latestScore} />}

      {/* ── CTA ── */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/app/data-sources" className="text-xs text-gray-500 hover:text-white transition-colors">
          ← Manage data sources
        </Link>
        <Link href="/app/report-builder" className="text-xs text-[#10B981] hover:underline">
          Run new scan →
        </Link>
      </div>
    </div>
  );
}
