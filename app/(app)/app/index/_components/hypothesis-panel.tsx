"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, BookmarkPlus, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Brands with llms.txt score higher than those without",
  "FAQ schema correlates with purchase intent scores",
  "Blocking AI crawlers reduces visibility",
  "Wikipedia presence predicts LLM mention rate",
  "Reddit presence correlates with higher scores",
  "ChatGPT and Claude disagree on category leaders",
  "Stock performance correlates with AI visibility",
  "Luxury brands have the lowest AI visibility",
  "Content freshness matters more than domain age",
];

interface HypothesisResult {
  supported: boolean | "partial";
  confidence: "high" | "medium" | "low";
  summary: string;
  evidence: Array<{ metric: string; value: string }>;
  examples: Array<{ brand: string; detail: string }>;
  caveats: string[];
  visualization: "scatter" | "bar" | "line" | "table";
}

interface AnalysisCard {
  hypothesis: string;
  result: HypothesisResult;
  savedId?: string;
}

export function HypothesisPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<AnalysisCard[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  async function runAnalysis(hypothesis: string) {
    if (!hypothesis.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brand-index/hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis }),
      });
      const data = await res.json() as { result?: HypothesisResult; error?: string };
      if (!res.ok || !data.result) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setCards((prev) => [{ hypothesis, result: data.result! }, ...prev]);
      setInput("");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function saveInsight(card: AnalysisCard, status: "draft" | "published") {
    setSaving(card.hypothesis);
    try {
      const res = await fetch("/api/brand-index/save-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: card.hypothesis,
          description: card.result.summary,
          data_evidence: card.result,
          insight_type: "hypothesis",
          confidence: card.result.confidence,
          status,
        }),
      });
      const data = await res.json() as { id?: string };
      if (data.id) {
        setCards((prev) =>
          prev.map((c) => c.hypothesis === card.hypothesis ? { ...c, savedId: data.id } : c)
        );
      }
    } finally {
      setSaving(null);
    }
  }

  function supportedBadge(supported: boolean | "partial") {
    if (supported === true) return { label: "Supported", cls: "bg-emerald-100 text-emerald-700" };
    if (supported === false) return { label: "Not Supported", cls: "bg-red-100 text-red-700" };
    return { label: "Partial", cls: "bg-amber-100 text-amber-700" };
  }

  function confidenceBadge(c: string) {
    if (c === "high") return "bg-emerald-50 text-emerald-600 border-emerald-200";
    if (c === "medium") return "bg-amber-50 text-amber-600 border-amber-200";
    return "bg-gray-100 text-gray-500 border-gray-200";
  }

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Hypothesis Testing</h2>
        <p className="text-xs text-gray-500 mb-4">Enter a hypothesis about AI visibility patterns. Claude will test it against the brand index dataset.</p>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAnalysis(input)}
            placeholder="Enter a hypothesis..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={() => runAnalysis(input)}
            disabled={loading || !input.trim()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              loading || !input.trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analyzing…
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {cards.map((card) => {
        const badge = supportedBadge(card.result.supported);
        return (
          <div key={card.hypothesis} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className={cn(
              "px-5 py-4 border-b border-gray-100",
              card.result.supported === true ? "bg-emerald-50" :
              card.result.supported === false ? "bg-red-50" : "bg-amber-50"
            )}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-800 leading-snug italic">&ldquo;{card.hypothesis}&rdquo;</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", badge.cls)}>{badge.label}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded border", confidenceBadge(card.result.confidence))}>
                    {card.result.confidence} confidence
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2">{card.result.summary}</p>
            </div>

            <div className="p-5 grid md:grid-cols-2 gap-5">
              {/* Evidence */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence</p>
                <div className="space-y-2">
                  {card.result.evidence.map((e, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50">
                      <span className="text-xs text-gray-600">{e.metric}</span>
                      <span className="text-xs font-semibold text-gray-900">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Examples + Caveats */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Examples</p>
                  <div className="space-y-1.5">
                    {card.result.examples.map((e, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">{e.brand}:</span> {e.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                {card.result.caveats.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Caveats</p>
                    <div className="space-y-1">
                      {card.result.caveats.map((c, i) => (
                        <p key={i} className="text-xs text-gray-500 italic">{c}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
              {card.savedId ? (
                <span className="text-xs text-emerald-600 font-medium">Saved as insight</span>
              ) : (
                <>
                  <button
                    onClick={() => saveInsight(card, "draft")}
                    disabled={saving === card.hypothesis}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Save as Insight
                  </button>
                  <button
                    onClick={() => saveInsight(card, "published")}
                    disabled={saving === card.hypothesis}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    Publish
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
