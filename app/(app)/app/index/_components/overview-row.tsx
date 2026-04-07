"use client";

import { TrendingUp, TrendingDown, Globe2, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandRow } from "./score-utils";

interface Props {
  rows: BrandRow[];
  prevRows: BrandRow[];
}

export function OverviewRow({ rows, prevRows }: Props) {
  // Avg composite
  const withScore = rows.filter((r) => r.composite_score !== null);
  const avgComposite = withScore.length > 0
    ? Math.round(withScore.reduce((s, r) => s + r.composite_score!, 0) / withScore.length)
    : null;
  const prevAvg = prevRows.filter((r) => r.composite_score !== null);
  const prevAvgScore = prevAvg.length > 0
    ? Math.round(prevAvg.reduce((s, r) => s + r.composite_score!, 0) / prevAvg.length)
    : null;
  const avgDelta = avgComposite !== null && prevAvgScore !== null ? avgComposite - prevAvgScore : null;

  // llms.txt adoption
  const llmsCount = rows.filter((r) => (r.website_snapshot as { llms_txt_exists?: boolean } | null)?.llms_txt_exists).length;
  const prevLlmsCount = prevRows.filter((r) => (r.website_snapshot as { llms_txt_exists?: boolean } | null)?.llms_txt_exists).length;
  const llmsDelta = prevRows.length > 0 ? llmsCount - prevLlmsCount : null;
  const llmsPct = rows.length > 0 ? Math.round((llmsCount / rows.length) * 100) : 0;

  // Biggest mover
  const movers = rows.filter((r) => r.score_delta !== null).sort((a, b) => Math.abs(b.score_delta!) - Math.abs(a.score_delta!));
  const biggestMover = movers[0] ?? null;

  const cards = [
    {
      icon: Globe2,
      label: "Brands Tracked",
      value: "100",
      sub: "Global brands",
      delta: null,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: BarChart3,
      label: "Avg Composite Score",
      value: avgComposite !== null ? `${avgComposite}/100` : "—",
      sub: "Across all brands",
      delta: avgDelta,
      color: avgComposite !== null && avgComposite >= 60 ? "text-emerald-600" : avgComposite !== null && avgComposite >= 30 ? "text-amber-600" : "text-red-500",
      bg: avgComposite !== null && avgComposite >= 60 ? "bg-emerald-50" : avgComposite !== null && avgComposite >= 30 ? "bg-amber-50" : "bg-red-50",
    },
    {
      icon: Zap,
      label: "llms.txt Adoption",
      value: rows.length > 0 ? `${llmsCount} brands` : "—",
      sub: `${llmsPct}% of index`,
      delta: llmsDelta,
      color: llmsPct >= 30 ? "text-emerald-600" : "text-amber-600",
      bg: llmsPct >= 30 ? "bg-emerald-50" : "bg-amber-50",
    },
    {
      icon: biggestMover && biggestMover.score_delta! > 0 ? TrendingUp : TrendingDown,
      label: "Biggest Mover",
      value: biggestMover ? biggestMover.brand_name : "—",
      sub: biggestMover ? biggestMover.category : "No data yet",
      delta: biggestMover ? biggestMover.score_delta : null,
      color: biggestMover && biggestMover.score_delta! > 0 ? "text-emerald-600" : "text-red-500",
      bg: biggestMover && biggestMover.score_delta! > 0 ? "bg-emerald-50" : "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ icon: Icon, label, value, sub, delta, color, bg }) => (
        <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
          </div>
          <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">{sub}</p>
            {delta !== null && (
              <span className={cn("text-xs font-semibold", delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-gray-400")}>
                {delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta} vs last mo.
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
