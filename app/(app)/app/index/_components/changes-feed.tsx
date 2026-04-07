"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { deltaColor } from "./score-utils";

interface ChangeItem {
  brand_name: string;
  category: string;
  month: string;
  composite_score: number | null;
  score_delta: number | null;
  changes_detected: Array<{ type: string; detail: string; old_value: unknown; new_value: unknown }>;
}

interface FlatChange {
  brand: string;
  category: string;
  month: string;
  type: string;
  detail: string;
  score: number | null;
  delta: number | null;
  positive: boolean;
}

interface Props {
  changesFeed: ChangeItem[];
}

const CHANGE_ICONS: Record<string, string> = {
  llms_txt_added:           "🟢",
  llms_txt_removed:         "🔴",
  llms_txt_updated:         "🔵",
  meta_description_changed: "🟡",
  h1_changed:               "🟡",
  faq_schema_added:         "🟢",
  faq_schema_removed:       "🔴",
  org_schema_added:         "🟢",
  org_schema_removed:       "🔴",
  crawler_policy_changed:   "🟠",
  sitemap_added:            "🟢",
  sitemap_removed:          "🔴",
};

const POSITIVE_CHANGES = new Set(["llms_txt_added", "faq_schema_added", "org_schema_added", "sitemap_added"]);

const CHANGE_TYPE_LABELS: Record<string, string> = {
  llms_txt_added:           "llms.txt Added",
  llms_txt_removed:         "llms.txt Removed",
  llms_txt_updated:         "llms.txt Updated",
  meta_description_changed: "Meta Description",
  h1_changed:               "H1 Changed",
  faq_schema_added:         "FAQ Schema Added",
  faq_schema_removed:       "FAQ Schema Removed",
  org_schema_added:         "Org Schema Added",
  org_schema_removed:       "Org Schema Removed",
  crawler_policy_changed:   "Crawler Policy",
  sitemap_added:            "Sitemap Added",
  sitemap_removed:          "Sitemap Removed",
};

export function ChangesFeed({ changesFeed }: Props) {
  const [filterType, setFilterType] = useState("All");
  const [filterDir, setFilterDir] = useState<"all" | "positive" | "negative">("all");
  const [filterCategory, setFilterCategory] = useState("All");

  const flat: FlatChange[] = useMemo(() => {
    const result: FlatChange[] = [];
    for (const item of changesFeed) {
      for (const change of item.changes_detected ?? []) {
        const positive = POSITIVE_CHANGES.has(change.type) ||
          (change.type === "crawler_policy_changed" && String(change.new_value) === "true");
        result.push({
          brand: item.brand_name,
          category: item.category,
          month: item.month,
          type: change.type,
          detail: change.detail,
          score: item.composite_score,
          delta: item.score_delta,
          positive,
        });
      }
    }
    return result.sort((a, b) => b.month.localeCompare(a.month));
  }, [changesFeed]);

  const categories = ["All", ...Array.from(new Set(flat.map((f) => f.category))).sort()];
  const changeTypes = ["All", ...Array.from(new Set(flat.map((f) => f.type))).sort()];

  const filtered = flat.filter((f) => {
    if (filterCategory !== "All" && f.category !== filterCategory) return false;
    if (filterType !== "All" && f.type !== filterType) return false;
    if (filterDir === "positive" && !f.positive) return false;
    if (filterDir === "negative" && f.positive) return false;
    return true;
  });

  // Group by month
  const byMonth = filtered.reduce<Record<string, FlatChange[]>>((acc, item) => {
    if (!acc[item.month]) acc[item.month] = [];
    acc[item.month].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mr-1">Website Changes Feed</h2>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
        >
          {changeTypes.map((t) => <option key={t} value={t}>{t === "All" ? "All changes" : (CHANGE_TYPE_LABELS[t] ?? t)}</option>)}
        </select>

        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
          {(["all", "positive", "negative"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDir(d)}
              className={cn(
                "px-2.5 py-1.5 text-xs capitalize transition-colors",
                filterDir === d ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-400">{filtered.length} changes</span>
      </div>

      <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
        {Object.keys(byMonth).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No changes detected yet. Changes appear after at least 2 monthly scans.
          </p>
        ) : (
          Object.entries(byMonth).map(([month, items]) => (
            <div key={month}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-16 h-px bg-gray-200" />
                {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                <span className="flex-1 h-px bg-gray-200" />
              </h3>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-base leading-5 flex-shrink-0">{CHANGE_ICONS[item.type] ?? "⚪"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold text-gray-900">{item.brand}</span>
                        {" "}
                        {item.detail}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                    </div>
                    {item.delta !== null && (
                      <span className={cn("text-xs font-semibold whitespace-nowrap", deltaColor(item.delta))}>
                        {item.delta > 0 ? `+${item.delta}` : item.delta} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
