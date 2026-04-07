"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreColor, scoreBg, deltaColor, deltaPrefix } from "./score-utils";
import type { BrandRow } from "./score-utils";

interface Props {
  rows: BrandRow[];
  months: string[];
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  loading?: boolean;
}

type SortKey = "rank" | "brand_name" | "category" | "composite_score" | "score_delta" | "llm_probing_score" | "structured_data_score" | "training_data_score" | "citation_sources_score" | "search_correlation_score" | "crawler_readiness_score" | "stock_price_change_pct";

const COLUMNS: { key: SortKey; label: string; short?: string }[] = [
  { key: "rank",                    label: "#"           },
  { key: "brand_name",              label: "Brand"       },
  { key: "category",                label: "Category"    },
  { key: "composite_score",         label: "Composite"   },
  { key: "score_delta",             label: "Δ"           },
  { key: "llm_probing_score",       label: "LLM",   short: "LLM"     },
  { key: "structured_data_score",   label: "Struct", short: "STR"    },
  { key: "training_data_score",     label: "Train",  short: "TRN"    },
  { key: "citation_sources_score",  label: "Cite",   short: "CIT"    },
  { key: "search_correlation_score",label: "Search", short: "SCH"    },
  { key: "crawler_readiness_score", label: "Crawl",  short: "CRL"    },
];

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-300">—</span>;
  return (
    <span className={cn("inline-block w-9 text-center text-xs font-semibold rounded px-1 py-0.5 tabular-nums", scoreBg(value))}>
      {value}
    </span>
  );
}

function exportCsv(rows: BrandRow[]) {
  const headers = ["Rank", "Brand", "Category", "Composite", "Delta", "LLM", "Struct", "Training", "Citations", "Search", "Crawler", "llms.txt", "Stock%"];
  const lines = rows.map((r, i) => [
    i + 1, r.brand_name, r.category, r.composite_score ?? "", r.score_delta ?? "",
    r.llm_probing_score ?? "", r.structured_data_score ?? "", r.training_data_score ?? "",
    r.citation_sources_score ?? "", r.search_correlation_score ?? "", r.crawler_readiness_score ?? "",
    (r.website_snapshot as { llms_txt_exists?: boolean } | null)?.llms_txt_exists ? "Yes" : "No",
    r.stock_price_change_pct ?? "",
  ].join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `brand-index-${rows[0]?.month ?? "export"}.csv`;
  a.click();
}

export function LeaderboardTable({ rows, months, selectedMonth, onMonthChange, loading }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "composite_score", dir: "desc" });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((r) => r.category))).sort()],
    [rows]
  );

  const sorted = useMemo(() => {
    let filtered = rows.filter((r) => {
      if (category !== "All" && r.category !== category) return false;
      if (search && !r.brand_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    filtered = [...filtered].sort((a, b) => {
      if (sort.key === "rank") {
        const av = a.composite_score ?? -1;
        const bv = b.composite_score ?? -1;
        return sort.dir === "asc" ? av - bv : bv - av;
      }
      if (sort.key === "brand_name" || sort.key === "category") {
        const av = (a[sort.key] ?? "").toLowerCase();
        const bv = (b[sort.key] ?? "").toLowerCase();
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const av = (a[sort.key] as number | null) ?? -999;
      const bv = (b[sort.key] as number | null) ?? -999;
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return filtered;
  }, [rows, sort, search, category]);

  // Global rank (before filter) by composite
  const rankMap = useMemo(() => {
    const s = [...rows].sort((a, b) => (b.composite_score ?? -1) - (a.composite_score ?? -1));
    return new Map(s.map((r, i) => [r.brand_url, i + 1]));
  }, [rows]);

  function toggleSort(key: SortKey) {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
    return sort.dir === "desc" ? <ChevronDown className="w-3 h-3 text-emerald-600" /> : <ChevronUp className="w-3 h-3 text-emerald-600" />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mr-1">Leaderboard</h2>

        <input
          type="text"
          placeholder="Search brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
        >
          {months.map((m) => <option key={m}>{m}</option>)}
          {months.length === 0 && <option value={selectedMonth}>{selectedMonth}</option>}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{sorted.length} brands</span>
          {loading && <span className="text-xs text-emerald-600 animate-pulse">Loading…</span>}
          <button
            onClick={() => exportCsv(sorted)}
            className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {COLUMNS.map(({ key, label, short }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 whitespace-nowrap select-none"
                >
                  <span className="flex items-center gap-1">
                    {short ?? label}
                    <SortIcon col={key} />
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">llms.txt</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Stock Δ%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center py-12 text-gray-400">
                  {rows.length === 0 ? "No data for this month yet." : "No brands match your filters."}
                </td>
              </tr>
            )}
            {sorted.map((row) => {
              const rank = rankMap.get(row.brand_url) ?? "—";
              const hasLlmsTxt = (row.website_snapshot as { llms_txt_exists?: boolean } | null)?.llms_txt_exists;
              const isExpanded = expanded === row.brand_url;

              return [
                <tr
                  key={row.brand_url}
                  onClick={() => setExpanded(isExpanded ? null : row.brand_url)}
                  className={cn(
                    "border-b border-gray-50 cursor-pointer transition-colors",
                    isExpanded ? "bg-emerald-50/60" : "hover:bg-gray-50"
                  )}
                >
                  <td className="px-3 py-2.5 text-gray-400 tabular-nums font-mono">{rank}</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{row.brand_name}</td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{row.category}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("text-sm font-bold tabular-nums", scoreColor(row.composite_score))}>
                      {row.composite_score ?? "—"}
                    </span>
                  </td>
                  <td className={cn("px-3 py-2.5 font-semibold tabular-nums whitespace-nowrap", deltaColor(row.score_delta))}>
                    {deltaPrefix(row.score_delta)}
                  </td>
                  <td className="px-3 py-2.5"><ScoreCell value={row.llm_probing_score} /></td>
                  <td className="px-3 py-2.5"><ScoreCell value={row.structured_data_score} /></td>
                  <td className="px-3 py-2.5"><ScoreCell value={row.training_data_score} /></td>
                  <td className="px-3 py-2.5"><ScoreCell value={row.citation_sources_score} /></td>
                  <td className="px-3 py-2.5"><ScoreCell value={row.search_correlation_score} /></td>
                  <td className="px-3 py-2.5"><ScoreCell value={row.crawler_readiness_score} /></td>
                  <td className="px-3 py-2.5">
                    {hasLlmsTxt
                      ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                      : <X className="w-3.5 h-3.5 text-gray-300" />}
                  </td>
                  <td className={cn("px-3 py-2.5 tabular-nums font-medium", deltaColor(row.stock_price_change_pct))}>
                    {row.stock_price_change_pct !== null ? `${row.stock_price_change_pct > 0 ? "+" : ""}${row.stock_price_change_pct}%` : "—"}
                  </td>
                </tr>,
                isExpanded && (
                  <tr key={`${row.brand_url}-expanded`} className="bg-emerald-50/40">
                    <td colSpan={14} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-gray-500 font-medium mb-1">LLM Performance</p>
                          <p className="text-gray-700">ChatGPT: <span className={cn("font-bold", scoreColor(row.chatgpt_score))}>{row.chatgpt_score ?? "—"}</span></p>
                          <p className="text-gray-700">Claude: <span className={cn("font-bold", scoreColor(row.claude_score))}>{row.claude_score ?? "—"}</span></p>
                          <p className="text-gray-700">Gemini: <span className={cn("font-bold", scoreColor(row.gemini_score))}>{row.gemini_score ?? "—"}</span></p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Mention Metrics</p>
                          <p className="text-gray-700">Mention rate: <span className="font-bold text-gray-900">{row.mention_rate !== null ? `${Math.round((row.mention_rate ?? 0) * 100)}%` : "—"}</span></p>
                          <p className="text-gray-700">Avg position: <span className="font-bold text-gray-900">{row.avg_position ?? "—"}</span></p>
                          <p className="text-gray-700">Sentiment: <span className="font-bold text-gray-900 capitalize">{row.sentiment ?? "—"}</span></p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Website</p>
                          <p className="text-gray-700">llms.txt: <span className="font-bold">{hasLlmsTxt ? "Yes" : "No"}</span></p>
                          <p className="text-gray-700">FAQ schema: <span className="font-bold">{(row.website_snapshot as { has_faq_schema?: boolean } | null)?.has_faq_schema ? "Yes" : "No"}</span></p>
                          <p className="text-gray-700">Org schema: <span className="font-bold">{(row.website_snapshot as { has_org_schema?: boolean } | null)?.has_org_schema ? "Yes" : "No"}</span></p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Changes ({row.changes_detected?.length ?? 0})</p>
                          {row.changes_detected?.slice(0, 3).map((c, i) => (
                            <p key={i} className="text-gray-600 truncate">{c.detail}</p>
                          ))}
                          {(!row.changes_detected || row.changes_detected.length === 0) && (
                            <p className="text-gray-400">No changes detected</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
