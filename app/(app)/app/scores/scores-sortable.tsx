"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Scan = {
  id: string;
  brand_name: string;
  website?: string | null;
  url?: string | null;
  category?: string | null;
  overall_score: number | null;
  created_at: string;
  // Allow any extra columns from select("*")
  [key: string]: unknown;
};

type SortKey = "recent" | "highest" | "lowest";

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreBadgeCls(s: number) {
  if (s >= 71) return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30";
  if (s >= 51) return "bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/30";
  if (s >= 31) return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30";
  return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30";
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ScoresSortable({ scans }: { scans: Scan[] }) {
  const [sort, setSort] = useState<SortKey>("recent");

  if (scans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#111827] flex flex-col items-center justify-center py-16 text-center space-y-3">
        <p className="text-white font-semibold">No scans yet</p>
        <p className="text-gray-500 text-sm">Run your first scan to see results here.</p>
        <Link
          href="/app/scan"
          className="inline-flex items-center bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors mt-2"
        >
          Run a scan
        </Link>
      </div>
    );
  }

  // Sort all scans first
  const sorted = [...scans].sort((a, b) => {
    if (sort === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "highest") return (b.overall_score ?? 0) - (a.overall_score ?? 0);
    return (a.overall_score ?? 0) - (b.overall_score ?? 0);
  });

  // Group by brand name (case-insensitive)
  const groupMap = new Map<string, { displayName: string; scans: Scan[] }>();
  for (const scan of sorted) {
    const key = scan.brand_name.toLowerCase();
    if (!groupMap.has(key)) groupMap.set(key, { displayName: scan.brand_name, scans: [] });
    groupMap.get(key)!.scans.push(scan);
  }

  // Order brand groups by the first scan in sorted order
  const groups = Array.from(groupMap.values());

  return (
    <div className="space-y-6">
      {/* Sort bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">Sort by</span>
        {(["recent", "highest", "lowest"] as SortKey[]).map((key) => {
          const labels: Record<SortKey, string> = {
            recent: "Most Recent",
            highest: "Highest Score",
            lowest: "Lowest Score",
          };
          return (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                sort === key
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] font-medium"
                  : "border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              )}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      {/* Grouped scan list */}
      {groups.map(({ displayName, scans: groupScans }) => (
        <div key={displayName.toLowerCase()} className="space-y-1">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-1 mb-2">
            <h3 className="text-sm font-semibold text-white">{displayName}</h3>
            <span className="text-xs text-gray-600">{groupScans.length} scan{groupScans.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Scans in this group */}
          <div className="rounded-xl border border-white/10 bg-[#111827] overflow-hidden">
            {groupScans.map((scan, i) => {
              const siteUrl = scan.url || scan.website;
              const score   = scan.overall_score ?? 0;
              return (
                <Link
                  key={scan.id}
                  href={`/app/scores/${scan.id}`}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors",
                    i !== groupScans.length - 1 && "border-b border-white/5"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">{timeAgo(scan.created_at)}</p>
                    {siteUrl && (
                      <p className="text-xs text-gray-600 truncate mt-0.5">{siteUrl}</p>
                    )}
                    {scan.category && (
                      <span className="inline-block mt-1 text-[10px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5">
                        {scan.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={cn(
                      "text-sm font-bold tabular-nums px-3 py-1 rounded-full border",
                      scoreBadgeCls(score)
                    )}>
                      {score}
                    </span>
                    <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
