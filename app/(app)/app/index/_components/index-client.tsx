"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { OverviewRow } from "./overview-row";
import { SignalHealth } from "./signal-health";
import { LeaderboardTable } from "./leaderboard-table";
import { TrendCharts } from "./trend-charts";
import { ChangesFeed } from "./changes-feed";
import { StockCorrelation } from "./stock-correlation";
import { HypothesisPanel } from "./hypothesis-panel";
import { SummaryGenerator } from "./summary-generator";
import type { BrandRow } from "./score-utils";

interface ChangesFeedItem {
  brand_name: string;
  category: string;
  month: string;
  composite_score: number | null;
  score_delta: number | null;
  changes_detected: Array<{ type: string; detail: string; old_value: unknown; new_value: unknown }>;
}

interface ApiResponse {
  rows: BrandRow[];
  changes_feed: ChangesFeedItem[];
  month: string;
}

const TABS = [
  { key: "overview",    label: "Overview"         },
  { key: "trends",      label: "Trends"           },
  { key: "changes",     label: "Changes"          },
  { key: "stock",       label: "Stock Correlation" },
  { key: "hypothesis",  label: "Hypothesis"       },
  { key: "insights",    label: "Insights"         },
] as const;

type Tab = typeof TABS[number]["key"];

function currentMonthStr() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function IndexClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const [month, setMonth] = useState(currentMonthStr());
  const [months, setMonths] = useState<string[]>([]);
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [prevRows, setPrevRows] = useState<BrandRow[]>([]);
  const [changesFeed, setChangesFeed] = useState<ChangesFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load available months on mount
  useEffect(() => {
    fetch("/api/brand-index/data?all_months=1")
      .then((r) => r.json())
      .then((d: { months?: string[] }) => {
        if (d.months && d.months.length > 0) {
          setMonths(d.months);
          setMonth(d.months[0]);
        }
      })
      .catch(() => {});
  }, []);

  const loadMonth = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/brand-index/data?month=${m}`);
      const data = await res.json() as ApiResponse;
      setRows(data.rows ?? []);
      setChangesFeed(data.changes_feed ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrevMonth = useCallback(async (m: string) => {
    // Compute prev month
    const [y, mo] = m.split("-").map(Number);
    const d = new Date(Date.UTC(y, mo - 2, 1));
    const prev = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/brand-index/data?month=${prev}`);
      const data = await res.json() as ApiResponse;
      setPrevRows(data.rows ?? []);
    } catch {
      setPrevRows([]);
    }
  }, []);

  useEffect(() => {
    loadMonth(month);
    loadPrevMonth(month);
  }, [month, loadMonth, loadPrevMonth]);

  function handleMonthChange(m: string) {
    setMonth(m);
  }

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Brand Index</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI visibility tracking across 100 global brands — admin dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-emerald-600 animate-pulse">Loading…</span>}
          {rows.length === 0 && !loading && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
              No data yet — run the index scan
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-gray-200 mb-6 -mx-4 lg:-mx-6 px-4 lg:px-6 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              tab === key
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div>
          <OverviewRow rows={rows} prevRows={prevRows} />
          <SignalHealth rows={rows} />
          <LeaderboardTable
            rows={rows}
            months={months}
            selectedMonth={month}
            onMonthChange={handleMonthChange}
            loading={loading}
          />
        </div>
      )}

      {tab === "trends" && (
        <TrendCharts rows={rows} />
      )}

      {tab === "changes" && (
        <ChangesFeed changesFeed={changesFeed} />
      )}

      {tab === "stock" && (
        <StockCorrelation rows={rows} />
      )}

      {tab === "hypothesis" && (
        <HypothesisPanel />
      )}

      {tab === "insights" && (
        <SummaryGenerator rows={rows} month={month} />
      )}
    </div>
  );
}
