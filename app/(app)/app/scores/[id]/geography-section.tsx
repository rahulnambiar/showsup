"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { REGION_MAP } from "@/lib/engine/regions";

interface RegionalScore {
  score: number;
  mention_rate: number;
  avg_position: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  top_competitor: string | null;
}

interface Props {
  regionalScores: Record<string, RegionalScore>;
  regionalInsights?: string[];
}

function scoreColor(score: number) {
  if (score >= 71) return "text-[#10B981]";
  if (score >= 51) return "text-[#14B8A6]";
  if (score >= 31) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function scoreBg(score: number) {
  if (score >= 71) return "bg-[#10B981]/10";
  if (score >= 51) return "bg-[#14B8A6]/10";
  if (score >= 31) return "bg-[#F59E0B]/10";
  return "bg-[#EF4444]/10";
}

function sentimentBadge(s: "positive" | "neutral" | "negative" | null) {
  if (!s) return null;
  const styles = {
    positive: "bg-[#10B981]/10 text-[#10B981]",
    neutral:  "bg-gray-500/10 text-gray-400",
    negative: "bg-[#EF4444]/10 text-[#EF4444]",
  };
  return (
    <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-medium capitalize", styles[s])}>
      {s}
    </span>
  );
}

export function GeographySection({ regionalScores, regionalInsights }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const entries = Object.entries(regionalScores).filter(([code]) => code !== "global");
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-400">Geography</h2>

      {/* Heatmap table */}
      <Card className="bg-[#111827] border-white/10 overflow-hidden">
        <CardContent className="pt-0 pb-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-gray-500 font-medium py-3 pr-4">Region</th>
                <th className="text-center text-xs text-gray-500 font-medium py-3 px-2">Score</th>
                <th className="text-center text-xs text-gray-500 font-medium py-3 px-2">Mention Rate</th>
                <th className="text-center text-xs text-gray-500 font-medium py-3 px-2">Avg Position</th>
                <th className="text-center text-xs text-gray-500 font-medium py-3 px-2">Sentiment</th>
                <th className="text-left text-xs text-gray-500 font-medium py-3 pl-2">Top Competitor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([code, data]) => {
                const region = REGION_MAP[code];
                const isOpen = expanded === code;
                return (
                  <tr
                    key={code}
                    className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpanded(isOpen ? null : code)}
                  >
                    <td className="py-2.5 pr-4">
                      <span className="text-gray-200 font-medium">
                        {region?.flag ?? ""} {region?.name ?? code}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={cn("font-bold tabular-nums", scoreColor(data.score))}>
                        {data.score}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={cn(
                        "text-xs rounded px-1.5 py-0.5 font-medium tabular-nums",
                        scoreBg(data.mention_rate * 100),
                        scoreColor(data.mention_rate * 100)
                      )}>
                        {Math.round(data.mention_rate * 100)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-gray-400 tabular-nums text-xs">
                      {data.avg_position !== null ? `#${data.avg_position.toFixed(1)}` : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {sentimentBadge(data.sentiment) ?? <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="py-2.5 pl-2 text-gray-400 text-xs">
                      {data.top_competitor ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Expanded region card */}
      {expanded && regionalScores[expanded] && (() => {
        const data = regionalScores[expanded]!;
        const region = REGION_MAP[expanded];
        return (
          <Card className="bg-[#111827] border-[#10B981]/20">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {region?.flag} {region?.name ?? expanded} — Detail
                </p>
                <button
                  onClick={() => setExpanded(null)}
                  className="text-gray-600 hover:text-white text-xs transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Score",        value: String(data.score) },
                  { label: "Mention Rate", value: `${Math.round(data.mention_rate * 100)}%` },
                  { label: "Avg Position", value: data.avg_position !== null ? `#${data.avg_position.toFixed(1)}` : "—" },
                  { label: "Sentiment",    value: data.sentiment ?? "—" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 rounded-lg px-3 py-2.5 space-y-0.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-sm font-bold text-white capitalize">{stat.value}</p>
                  </div>
                ))}
              </div>
              {data.top_competitor && (
                <p className="text-xs text-gray-500">
                  Top competitor in this region: <span className="text-gray-300 font-medium">{data.top_competitor}</span>
                </p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* AI-generated insights */}
      {regionalInsights && regionalInsights.length > 0 && (
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Regional Insights</p>
            <ul className="space-y-2">
              {regionalInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-[#10B981] mt-0.5 flex-shrink-0">▸</span>
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
