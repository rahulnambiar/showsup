"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CompetitorProfile {
  name: string;
  mention_count: number;
  total_queries: number;
  mention_rate: number;
  avg_position: number | null;
  recommend_count: number;
  sentiment: string | null;
}

interface SlimResult {
  prompt: string;
  response: string | null;
  brand_mentioned: boolean | null;
  key_context: string | null;
  model: string;
}

interface CompetitorHeatmapProps {
  brand: string;
  brandProfile: CompetitorProfile;
  competitors: CompetitorProfile[];
  byModel: Record<string, { mention_count: number; total: number }>;
  scanResults: SlimResult[];
}

// ── Color helpers ──────────────────────────────────────────────────────────────

function heatBg(rank: number, total: number, lowerIsBetter = false): string {
  if (total <= 1) return "bg-[#064E3B] text-emerald-200";
  const idx = lowerIsBetter ? rank : (total - 1 - rank);
  const ratio = idx / (total - 1);
  if (ratio <= 0.25) return "bg-[#064E3B] text-emerald-200";
  if (ratio <= 0.5)  return "bg-[#065F46] text-emerald-300";
  if (ratio <= 0.75) return "bg-[#78350F] text-amber-200";
  return "bg-[#7F1D1D] text-red-200";
}

function sentimentToNum(s: string | null) {
  return s === "positive" ? 3 : s === "neutral" ? 2 : s === "negative" ? 1 : 0;
}
function sentimentLabel(v: number) {
  return v === 3 ? "Positive" : v === 2 ? "Neutral" : v === 1 ? "Negative" : "—";
}

// ── Stat card (slide-over) ─────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#0A0E17] p-3 space-y-1">
      <p className="text-[10px] text-gray-600 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-xl font-bold tabular-nums" style={{ color: color ?? "#fff" }}>{value}</p>
      <p className="text-[11px] text-gray-600">{sub}</p>
    </div>
  );
}

// ── Competitor slide-over ─────────────────────────────────────────────────────

function CompetitorSlideOver({
  competitor, brand, scanResults, onClose,
}: {
  competitor: CompetitorProfile;
  brand: string;
  scanResults: SlimResult[];
  onClose: () => void;
}) {
  const sentColor = competitor.sentiment === "positive" ? "#10B981" : competitor.sentiment === "negative" ? "#EF4444" : "#F59E0B";
  const nameLower = competitor.name.toLowerCase();

  const missedQueries = scanResults
    .filter((r) => !r.brand_mentioned && r.response?.toLowerCase().includes(nameLower))
    .slice(0, 5);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#111827] border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Competitor profile</p>
            <h3 className="text-lg font-bold text-white">{competitor.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Mention Rate" value={`${competitor.mention_rate}%`} sub={`${competitor.mention_count} of ${competitor.total_queries} queries`} color="#10B981" />
            <StatCard label="Avg Position" value={competitor.avg_position !== null ? `#${competitor.avg_position}` : "—"} sub="Lower = higher visibility" />
            <StatCard label="Recommended" value={String(competitor.recommend_count)} sub="times across all queries" />
            <StatCard label="Sentiment" value={competitor.sentiment ?? "unknown"} sub="overall tone from AI" color={sentColor} />
          </div>

          {/* Missed queries */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
              Where {competitor.name} appears but {brand} doesn&apos;t ({missedQueries.length})
            </p>
            {missedQueries.length === 0 ? (
              <p className="text-sm text-gray-600 italic py-2">None detected — solid coverage here.</p>
            ) : (
              <div className="space-y-2">
                {missedQueries.map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-[#0A0E17] p-3 space-y-1.5">
                    <p className="text-xs text-gray-300 leading-relaxed">{r.prompt}</p>
                    {r.key_context && (
                      <p className="text-[11px] text-gray-600 italic border-l-2 border-white/10 pl-2">{r.key_context}</p>
                    )}
                    <span className="text-[10px] text-gray-700 uppercase tracking-wider">{r.model}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-4 text-center space-y-3">
            <p className="text-sm text-gray-300">
              See how <strong className="text-white">{competitor.name}</strong> scores in a full AI visibility audit
            </p>
            <a
              href={`/app/report-builder?brand=${encodeURIComponent(competitor.name)}`}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold text-sm rounded-lg transition-colors"
            >
              Analyse {competitor.name} →
            </a>
            <p className="text-[11px] text-gray-600">Standard scan cost applies</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main heatmap ──────────────────────────────────────────────────────────────

export function CompetitorHeatmap({ brand, brandProfile, competitors, byModel, scanResults }: CompetitorHeatmapProps) {
  const [slideOver, setSlideOver] = useState<CompetitorProfile | null>(null);
  const cols = [brandProfile, ...competitors.slice(0, 3)];

  type HeatRow = {
    label: string;
    tooltip: (p: CompetitorProfile) => string;
    value: (p: CompetitorProfile) => number | null;
    format: (v: number | null, p: CompetitorProfile) => string;
    lowerIsBetter?: boolean;
  };

  const rows: HeatRow[] = [
    {
      label: "Mention Rate",
      tooltip: (p) => `Mentioned in ${p.mention_count} of ${p.total_queries} queries`,
      value: (p) => p.mention_rate,
      format: (v) => v === null ? "—" : `${v}%`,
    },
    {
      label: "Avg Position",
      tooltip: (p) => `Avg position ${p.avg_position ?? "N/A"} — lower is better`,
      value: (p) => p.avg_position,
      format: (v) => v === null ? "—" : `#${v}`,
      lowerIsBetter: true,
    },
    {
      label: "Recommend Rate",
      tooltip: (p) => `Recommended ${p.recommend_count} of ${p.total_queries} times`,
      value: (p) => Math.round((p.recommend_count / Math.max(1, p.total_queries)) * 100),
      format: (v) => v === null ? "—" : `${v}%`,
    },
    {
      label: "Sentiment",
      tooltip: (p) => `Overall sentiment: ${p.sentiment ?? "unknown"}`,
      value: (p) => sentimentToNum(p.sentiment),
      format: (v) => sentimentLabel(v ?? 0),
    },
  ];

  return (
    <>
      {/* ── Main heatmap table ── */}
      <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#111827]">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left text-[10px] text-gray-600 font-medium py-3 pl-4 pr-3 uppercase tracking-wider w-36">Metric</th>
              {cols.map((p, i) => (
                <th key={p.name} className="py-3 px-2 text-center">
                  {i === 0 ? (
                    <span className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 rounded-lg px-3 py-1">You</span>
                  ) : (
                    <button
                      onClick={() => setSlideOver(p)}
                      className="text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1 transition-colors"
                    >
                      {p.name}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const vals = cols.map((p) => row.value(p));
              const ranked = cols
                .map((p, idx) => ({ idx, val: row.value(p) }))
                .filter((x) => x.val !== null)
                .sort((a, b) => (row.lowerIsBetter ? a.val! - b.val! : b.val! - a.val!));
              const rankMap = new Map(ranked.map((x, rank) => [x.idx, rank]));

              return (
                <tr key={row.label} className={cn("", ri < rows.length - 1 && "border-b border-white/5")}>
                  <td className="text-xs text-gray-500 pl-4 pr-3 py-2 font-medium">{row.label}</td>
                  {cols.map((p, ci) => {
                    const val = vals[ci];
                    const rank = rankMap.get(ci) ?? 0;
                    const cls = val === null
                      ? "bg-white/3 text-gray-600"
                      : heatBg(rank, ranked.length, row.lowerIsBetter);
                    return (
                      <td key={p.name} className="px-2 py-2">
                        <div
                          className={cn("rounded-lg py-2 text-center text-xs font-semibold tabular-nums select-none", cls)}
                          title={row.tooltip(p)}
                        >
                          {row.format(val, p)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Platform heatmap ── */}
      {Object.keys(byModel).length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/8 bg-[#111827]">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left text-[10px] text-gray-600 font-medium py-3 pl-4 pr-3 uppercase tracking-wider w-36">Platform</th>
                {cols.map((p, i) => (
                  <th key={p.name} className="py-3 px-2 text-center">
                    <span className={cn("text-xs font-medium", i === 0 ? "text-[#10B981]" : "text-gray-500")}>
                      {i === 0 ? "You" : p.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byModel).map(([modelId, { mention_count, total }], ri) => {
                const brandRate = total > 0 ? Math.round((mention_count / total) * 100) : 0;
                const modelRates = cols.map((p, i) => i === 0 ? brandRate : p.mention_rate);
                const ranked = modelRates
                  .map((v, idx) => ({ idx, v }))
                  .sort((a, b) => b.v - a.v);
                const rankMap = new Map(ranked.map((x, rank) => [x.idx, rank]));

                return (
                  <tr key={modelId} className={cn("", ri < Object.keys(byModel).length - 1 && "border-b border-white/5")}>
                    <td className="text-xs text-gray-500 pl-4 pr-3 py-2 font-medium capitalize">{modelId}</td>
                    {cols.map((p, ci) => {
                      const rate = modelRates[ci]!;
                      const rank = rankMap.get(ci) ?? 0;
                      return (
                        <td key={p.name} className="px-2 py-2">
                          <div
                            className={cn("rounded-md py-1.5 text-center text-xs font-semibold tabular-nums", heatBg(rank, cols.length))}
                            title={`${p.name}: ${rate}% mention rate on ${modelId}`}
                          >
                            {rate}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Slide-over ── */}
      {slideOver && (
        <CompetitorSlideOver
          competitor={slideOver}
          brand={brand}
          scanResults={scanResults}
          onClose={() => setSlideOver(null)}
        />
      )}
    </>
  );
}
