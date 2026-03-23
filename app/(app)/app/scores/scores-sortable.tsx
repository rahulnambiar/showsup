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
  [key: string]: unknown;
};

type SortKey = "recent" | "highest" | "lowest";

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreBadgeCls(s: number) {
  if (s >= 71) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s >= 51) return "bg-teal-50 text-teal-700 border-teal-200";
  if (s >= 31) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-600 border-red-200";
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
      <div className="rounded-xl border border-dashed border-gray-200 bg-white flex flex-col items-center justify-center py-16 text-center space-y-3">
        <p className="text-gray-900 font-semibold">No scans yet</p>
        <p className="text-gray-500 text-sm">Run your first scan to see results here.</p>
        <Link
          href="/app/report-builder"
          className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors mt-2"
        >
          Analyse your brand
        </Link>
      </div>
    );
  }

  const sorted = [...scans].sort((a, b) => {
    if (sort === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "highest") return (b.overall_score ?? 0) - (a.overall_score ?? 0);
    return (a.overall_score ?? 0) - (b.overall_score ?? 0);
  });

  const groupMap = new Map<string, { displayName: string; scans: Scan[] }>();
  for (const scan of sorted) {
    const key = scan.brand_name.toLowerCase();
    if (!groupMap.has(key)) groupMap.set(key, { displayName: scan.brand_name, scans: [] });
    groupMap.get(key)!.scans.push(scan);
  }
  const groups = Array.from(groupMap.values());

  return (
    <div className="space-y-6">
      {/* Sort bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">Sort by</span>
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
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium"
                  : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white"
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
          <div className="flex items-center gap-3 px-1 mb-2">
            <h3 className="text-sm font-semibold text-gray-800">{displayName}</h3>
            <span className="text-xs text-gray-400">{groupScans.length} scan{groupScans.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {groupScans.map((scan, i) => {
              const siteUrl = scan.url || scan.website;
              const score   = scan.overall_score ?? 0;
              return (
                <Link
                  key={scan.id}
                  href={`/app/report/${scan.id}`}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors",
                    i !== groupScans.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">{timeAgo(scan.created_at)}</p>
                    {siteUrl && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{siteUrl}</p>
                    )}
                    {scan.category && (
                      <span className="inline-block mt-1 text-[10px] text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50">
                        {scan.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={cn(
                      "text-sm font-bold tabular-nums font-mono px-3 py-1 rounded-full border",
                      scoreBadgeCls(score)
                    )}>
                      {score}
                    </span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
