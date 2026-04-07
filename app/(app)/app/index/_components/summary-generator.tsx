"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Wand2, BookmarkPlus } from "lucide-react";
import type { BrandRow } from "./score-utils";

interface Props {
  rows: BrandRow[];
  month: string;
}

interface InsightCard {
  title: string;
  body: string;
  brands: string[];
  id?: string;
}

export function SummaryGenerator({ rows, month }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [saving, setSaving] = useState<number | null>(null);

  async function generate() {
    if (loading || rows.length === 0) return;
    setLoading(true);
    setError(null);

    const dataset = rows.map((r) => ({
      brand: r.brand_name,
      category: r.category,
      composite: r.composite_score,
      delta: r.score_delta,
      llm: r.llm_probing_score,
      structured: r.structured_data_score,
      changes: r.changes_detected?.length ?? 0,
      has_llms_txt: (r.website_snapshot as { llms_txt_exists?: boolean } | null)?.llms_txt_exists ?? false,
    }));

    const top5 = [...rows].sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0)).slice(0, 5);
    const movers = rows.filter((r) => r.score_delta !== null).sort((a, b) => Math.abs(b.score_delta!) - Math.abs(a.score_delta!)).slice(0, 5);
    const llmsTxtCount = rows.filter((r) => (r.website_snapshot as { llms_txt_exists?: boolean } | null)?.llms_txt_exists).length;

    const prompt = `You are analyzing the ShowsUp Brand AI Visibility Index for ${month}.

Dataset (${rows.length} brands):
${JSON.stringify(dataset.slice(0, 50))}

Context:
- Top 5 brands: ${top5.map((r) => `${r.brand_name} (${r.composite_score})`).join(", ")}
- Biggest movers: ${movers.map((r) => `${r.brand_name} (${r.score_delta! > 0 ? "+" : ""}${r.score_delta})`).join(", ")}
- llms.txt adoption: ${llmsTxtCount}/${rows.length} brands (${Math.round(llmsTxtCount/rows.length*100)}%)

Generate exactly 3 publishable insights about this month's Brand Index data. Each should:
1. Identify a specific finding, pattern, or anomaly
2. Cite specific brand names and numbers
3. Be suitable for public publishing (no speculation, only data-backed)

Return ONLY valid JSON:
[
  {
    "title": "Short compelling title",
    "body": "2-3 sentence insight with specific data points and brand examples",
    "brands": ["Brand1", "Brand2"]
  }
]`;

    try {
      const res = await fetch("/api/brand-index/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, prompt }),
      });
      const data = await res.json() as { insights?: InsightCard[]; error?: string };
      if (!res.ok || !data.insights) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setInsights(data.insights);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function saveInsight(card: InsightCard, index: number, status: "draft" | "published") {
    setSaving(index);
    try {
      const res = await fetch("/api/brand-index/save-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: card.title,
          description: card.body,
          data_evidence: { month, brands_mentioned: card.brands },
          insight_type: "finding",
          brands_involved: card.brands,
          months_analyzed: [month],
          status,
        }),
      });
      const data = await res.json() as { id?: string };
      if (data.id) {
        setInsights((prev) => prev.map((c, i) => i === index ? { ...c, id: data.id } : c));
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Monthly Insights Generator</h2>
            <p className="text-xs text-gray-500 mt-1">
              Send {month} brand data to Claude and auto-generate publishable insights about patterns, movers, and anomalies.
            </p>
          </div>
          <button
            onClick={generate}
            disabled={loading || rows.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0",
              loading || rows.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Monthly Insights
              </>
            )}
          </button>
        </div>
        {rows.length === 0 && (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            No brand data for {month} yet. Run the index scan first.
          </p>
        )}
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      </div>

      {insights.map((card, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">{card.title}</h3>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-gray-700 leading-relaxed">{card.body}</p>
            {card.brands.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {card.brands.map((b) => (
                  <span key={b} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
            {card.id ? (
              <span className="text-xs text-emerald-600 font-medium">Saved</span>
            ) : (
              <>
                <button
                  onClick={() => saveInsight(card, i, "draft")}
                  disabled={saving === i}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Save Draft
                </button>
                <button
                  onClick={() => saveInsight(card, i, "published")}
                  disabled={saving === i}
                  className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  Publish
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
