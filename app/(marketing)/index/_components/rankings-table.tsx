"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toSlug, scoreHex } from "../_lib/utils";
import type { IndexRow } from "../_lib/data";

interface Props {
  rows: IndexRow[];
  categories: string[];
}

type SortKey = "rank" | "brand_name" | "composite_score" | "llm_probing_score" | "structured_data_score" | "training_data_score" | "citation_sources_score" | "search_correlation_score" | "crawler_readiness_score" | "score_delta";

const COLS: { key: SortKey; label: string; short: string; mobile?: boolean }[] = [
  { key: "rank",                    label: "#",            short: "#",    mobile: true  },
  { key: "brand_name",              label: "Brand",        short: "Brand",mobile: true  },
  { key: "composite_score",         label: "Composite",    short: "Total",mobile: true  },
  { key: "score_delta",             label: "Δ Mo.",        short: "Δ",    mobile: true  },
  { key: "llm_probing_score",       label: "LLM",          short: "LLM"                 },
  { key: "structured_data_score",   label: "Struct",       short: "STR"                 },
  { key: "training_data_score",     label: "Training",     short: "TRN"                 },
  { key: "citation_sources_score",  label: "Citations",    short: "CIT"                 },
  { key: "search_correlation_score",label: "Search",       short: "SCH"                 },
  { key: "crawler_readiness_score", label: "Crawler",      short: "CRL"                 },
];

function ScorePill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[#9CA3AF] text-[13px]">—</span>;
  return (
    <span
      className="inline-block min-w-[34px] text-center text-[12px] font-semibold rounded-md px-1.5 py-0.5 tabular-nums"
      style={{ background: `${scoreHex(value)}18`, color: scoreHex(value) }}
    >
      {value}
    </span>
  );
}

export function RankingsTable({ rows, categories }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "composite_score", dir: "desc" });
  const [category, setCategory] = useState("All");

  const sorted = useMemo(() => {
    let data = category === "All" ? rows : rows.filter((r) => r.category === category);
    data = [...data].sort((a, b) => {
      if (sort.key === "brand_name") {
        const av = a.brand_name.toLowerCase();
        const bv = b.brand_name.toLowerCase();
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const av = sort.key === "rank" ? (a.composite_score ?? -1) : ((a[sort.key] as number | null) ?? -999);
      const bv = sort.key === "rank" ? (b.composite_score ?? -1) : ((b[sort.key] as number | null) ?? -999);
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return data;
  }, [rows, sort, category]);

  const rankMap = useMemo(() => {
    const s = [...rows].sort((a, b) => (b.composite_score ?? -1) - (a.composite_score ?? -1));
    return new Map(s.map((r, i) => [r.brand_url, i + 1]));
  }, [rows]);

  function toggleSort(key: SortKey) {
    setSort((p) => p.key === key ? { key, dir: p.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronsUpDown className="w-3 h-3 text-[#D1D5DB]" />;
    return sort.dir === "desc"
      ? <ChevronDown className="w-3 h-3 text-[#10B981]" />
      : <ChevronUp className="w-3 h-3 text-[#10B981]" />;
  }

  return (
    <div>
      {/* Category filter — horizontal scroll pills on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border",
              category === cat
                ? "bg-[#10B981] border-[#10B981] text-white"
                : "border-[#E5E7EB] text-[#4B5563] hover:border-[#10B981] hover:text-[#10B981]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
        <table className="w-full text-[13px]" style={{ minWidth: 680 }}>
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              {COLS.map(({ key, label, short }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="px-4 py-3 text-left font-semibold text-[#6B7280] uppercase tracking-wide text-[11px] cursor-pointer hover:text-[#111827] whitespace-nowrap select-none"
                >
                  <span className="flex items-center gap-1">
                    <span className="hidden md:inline">{label}</span>
                    <span className="md:hidden">{short}</span>
                    <SortIcon col={key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="text-center py-12 text-[#9CA3AF]">
                  No data yet — check back after the next monthly scan.
                </td>
              </tr>
            )}
            {sorted.map((row) => {
              const rank = rankMap.get(row.brand_url) ?? "—";
              const delta = row.score_delta;
              return (
                <tr
                  key={row.brand_url}
                  className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors"
                >
                  <td className="px-4 py-3 text-[#9CA3AF] font-mono tabular-nums text-[12px]">{rank}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/index/${toSlug(row.brand_name)}`}
                      className="font-semibold text-[#111827] hover:text-[#10B981] transition-colors"
                    >
                      {row.brand_name}
                    </Link>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{row.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[16px] font-bold tabular-nums"
                      style={{ color: scoreHex(row.composite_score) }}
                    >
                      {row.composite_score ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-[13px]"
                    style={{ color: delta == null ? "#9CA3AF" : delta > 0 ? "#10B981" : delta < 0 ? "#EF4444" : "#9CA3AF" }}>
                    {delta == null ? "—" : delta > 0 ? `+${delta}` : delta === 0 ? "—" : String(delta)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><ScorePill value={row.llm_probing_score} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><ScorePill value={row.structured_data_score} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><ScorePill value={row.training_data_score} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><ScorePill value={row.citation_sources_score} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><ScorePill value={row.search_correlation_score} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><ScorePill value={row.crawler_readiness_score} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-[#9CA3AF] mt-3 text-center">
        Click a brand name to view the full AI visibility profile.
      </p>
    </div>
  );
}
