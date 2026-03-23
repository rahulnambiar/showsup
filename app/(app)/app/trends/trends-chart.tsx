"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Scan = {
  id: string;
  brand_name: string;
  overall_score: number | null;
  created_at: string;
  [key: string]: unknown;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 71) return "#10B981";
  if (s >= 51) return "#14B8A6";
  if (s >= 31) return "#F59E0B";
  return "#EF4444";
}

function scoreTextColor(s: number) {
  if (s >= 71) return "text-emerald-600";
  if (s >= 51) return "text-teal-600";
  if (s >= 31) return "text-amber-600";
  return "text-red-500";
}

function scoreVerdict(s: number) {
  if (s >= 71) return "Excellent";
  if (s >= 51) return "Good";
  if (s >= 31) return "Partial";
  return "Low";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { score: number; fullDate: string; id: string } }> }) {
  if (!active || !payload?.length) return null;
  const { score, fullDate, id } = payload[0].payload;
  const color = scoreColor(score);
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-lg text-sm">
      <p className="text-gray-400 text-xs mb-1">{fmtDateFull(fullDate)}</p>
      <p className="font-bold" style={{ color }}>{score}/100 — {scoreVerdict(score)}</p>
      <Link href={`/app/report/${id}`} className="text-[10px] text-gray-400 hover:text-gray-600 mt-0.5 block">
        View report →
      </Link>
    </div>
  );
}

// ── Custom dot ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  const color = scoreColor(payload.score);
  return (
    <circle cx={cx} cy={cy} r={5} fill={color} stroke="#FFFFFF" strokeWidth={2} />
  );
}

// ── Empty states ───────────────────────────────────────────────────────────────

function EmptyNoBrand() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div>
        <p className="text-gray-900 font-semibold">No trend data yet</p>
        <p className="text-gray-500 text-sm mt-1 max-w-xs">
          Run your first scan to start tracking your AI visibility over time.
        </p>
      </div>
      <Link
        href="/app/report-builder"
        className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
      >
        Run a scan
      </Link>
    </div>
  );
}

function EmptyNotEnough({ brand }: { brand: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div>
        <p className="text-gray-900 font-semibold">Only one scan for {brand}</p>
        <p className="text-gray-500 text-sm mt-1 max-w-sm">
          Run more scans to see trends. Scan the same brand regularly to track your AI visibility over time.
        </p>
      </div>
      <Link
        href="/app/report-builder"
        className="inline-flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg px-4 py-2 text-sm transition-colors"
      >
        Scan {brand} again →
      </Link>
    </div>
  );
}

// ── Main chart component ───────────────────────────────────────────────────────

export function TrendsChart({ scans }: { scans: Scan[] }) {
  const brandMap = useMemo(() => {
    const map = new Map<string, { displayName: string; scans: Scan[] }>();
    for (const scan of scans) {
      const key = scan.brand_name.toLowerCase();
      if (!map.has(key)) map.set(key, { displayName: scan.brand_name, scans: [] });
      map.get(key)!.scans.push(scan);
    }
    return map;
  }, [scans]);

  const brands = useMemo(() => Array.from(brandMap.values()), [brandMap]);

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    const entries = Array.from(brandMap.entries());
    for (const [key, { scans }] of entries) {
      if (scans.length >= 2) return key;
    }
    return brands[0]?.displayName.toLowerCase() ?? "";
  });

  if (brands.length === 0) return <EmptyNoBrand />;

  const selected    = brandMap.get(selectedKey);
  const brandScans  = selected?.scans ?? [];
  const hasEnough   = brandScans.length >= 2;

  const chartData = brandScans.map((s) => ({
    date:     fmtDate(s.created_at),
    fullDate: s.created_at,
    score:    s.overall_score ?? 0,
    id:       s.id,
  }));

  const latestScore = brandScans[brandScans.length - 1]?.overall_score ?? 0;
  const firstScore  = brandScans[0]?.overall_score ?? 0;
  const scoreDelta  = hasEnough ? latestScore - firstScore : 0;
  const lineColor   = scoreColor(latestScore);

  return (
    <div className="space-y-6">
      {/* Brand selector + stats row */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          {brands.length > 1 ? (
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Brand</label>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="rounded-lg bg-white border border-gray-200 text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                {brands.map(({ displayName }) => (
                  <option key={displayName.toLowerCase()} value={displayName.toLowerCase()}>
                    {displayName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <h2 className="text-base font-semibold text-gray-900">{selected?.displayName}</h2>
          )}
          <p className="text-xs text-gray-400">{brandScans.length} scan{brandScans.length !== 1 ? "s" : ""} recorded</p>
        </div>

        {hasEnough && (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500">Latest Score</p>
              <p className={cn("text-2xl font-bold tabular-nums font-mono", scoreTextColor(latestScore))}>{latestScore}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Change</p>
              <p className={cn("text-2xl font-bold tabular-nums font-mono", scoreDelta >= 0 ? "text-emerald-600" : "text-red-500")}>
                {scoreDelta >= 0 ? "+" : ""}{scoreDelta}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart or empty state */}
      {!hasEnough ? (
        <EmptyNotEnough brand={selected?.displayName ?? ""} />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickCount={6}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0,0,0,0.08)", strokeWidth: 1 }} />
              <ReferenceLine y={70} stroke="rgba(16,185,129,0.25)" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="rgba(245,158,11,0.25)" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="score"
                stroke={lineColor}
                strokeWidth={2.5}
                dot={<CustomDot />}
                activeDot={{ r: 7, stroke: "#FFFFFF", strokeWidth: 2, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 px-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-4 border-t border-dashed" style={{ borderColor: "rgba(16,185,129,0.4)" }} /> 70+ Excellent
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-4 border-t border-dashed" style={{ borderColor: "rgba(245,158,11,0.4)" }} /> 50 threshold
            </span>
          </div>
        </div>
      )}

      {/* All brands mini summary if multiple */}
      {brands.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">All Brands</h3>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {brands.map(({ displayName, scans: bs }, i) => {
              const latest = bs[bs.length - 1]?.overall_score ?? 0;
              const key = displayName.toLowerCase();
              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-3 text-left transition-colors",
                    i !== brands.length - 1 && "border-b border-gray-100",
                    selectedKey === key ? "bg-emerald-50" : "hover:bg-gray-50"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-400">{bs.length} scan{bs.length !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums font-mono", scoreTextColor(latest))}>
                    {latest}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
