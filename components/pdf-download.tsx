"use client";

import { useState, useRef, useEffect } from "react";
import { type PDFCompetitorsData, type ExtendedPDFProps } from "./pdf-document";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Recommendation {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
}

interface ModelResult {
  model: string;
  label: string;
  score: number;
  mentioned: boolean;
}

export interface PDFDownloadProps {
  scanId?: string;
  brand: string;
  score: number;
  date: string;
  category?: string;
  url?: string;
  modelResults: ModelResult[];
  recommendations: Recommendation[];
  categoryScores?: Record<string, number>;
  competitorsData?: PDFCompetitorsData;
  improvementPlan?: ExtendedPDFProps["improvementPlan"];
  scanResults?: ExtendedPDFProps["scanResults"];
  tokenBalance?: number | null;
}

type Tier = "sample" | "full" | "board_ready";

const TIERS: Array<{
  key: Tier;
  label: string;
  cost: number;
  desc: string;
  pages: string;
}> = [
  { key: "sample",      label: "Sample PDF",         cost: 0,  desc: "Score + platform breakdown preview", pages: "3 pages"  },
  { key: "full",        label: "Full Report",         cost: 25, desc: "Complete analysis + improvement plan", pages: "6+ pages" },
  { key: "board_ready", label: "Board-Ready Report",  cost: 50, desc: "Exec summary + full report for leadership", pages: "8+ pages" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function PDFDownload(props: PDFDownloadProps) {
  const { scanId, brand, score, date, category, url, modelResults, recommendations, categoryScores, competitorsData, improvementPlan, scanResults, tokenBalance } = props;

  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState<Tier | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleTier(tier: Tier) {
    if (loading) return;
    setOpen(false);
    setError(null);
    setLoading(tier);

    try {
      // For paid tiers, call API first (deduct tokens, get exec summary for board)
      let execSummary: string | undefined;
      if (tier !== "sample") {
        if (!scanId) {
          setError("Save your scan first to unlock paid PDF tiers");
          return;
        }
        const res = await fetch("/api/report/pdf-export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scan_id: scanId,
            tier,
            model_results: modelResults,
            competitors: (competitorsData?.competitors ?? []).map((c) => ({
              name: c.name,
              mention_rate: c.mention_rate,
            })),
            top_recs: recommendations.slice(0, 3).map((r) => r.title),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error === "Insufficient tokens"
            ? `Not enough tokens — need ${data.required}, have ${data.balance}`
            : data.error ?? "Export failed";
          setError(msg);
          return;
        }
        if (data.exec_summary) execSummary = data.exec_summary;
      }

      // Generate PDF client-side
      const [{ pdf }, pdfDoc] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./pdf-document"),
      ]);

      const extProps: ExtendedPDFProps = {
        brand, score, date, category, url,
        modelResults, recommendations, categoryScores, competitorsData,
        improvementPlan, scanResults, execSummary,
      };

      const docEl =
        tier === "sample"      ? pdfDoc.FreeSamplePDF(extProps)  :
        tier === "full"        ? pdfDoc.FullReportPDF(extProps)   :
                                 pdfDoc.BoardReadyPDF(extProps);

      const blob  = await pdf(docEl).toBlob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = brand.toLowerCase().replace(/\s+/g, "-");
      const dateSlug = new Date().toISOString().slice(0, 10);
      const suffix = tier === "sample" ? "sample" : tier === "full" ? "full" : "board";
      a.href     = blobUrl;
      a.download = `ShowsUp-${slug}-${suffix}-${dateSlug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("PDF generation failed", err);
      setError("PDF generation failed — please try again");
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setError(null); setOpen((o) => !o); }}
        disabled={isLoading}
        className="inline-flex items-center gap-2 text-sm font-semibold bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-[#0A0E17] rounded-lg px-4 py-2 transition-colors"
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-[#0A0E17]/30 border-t-[#0A0E17] rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        {isLoading
          ? (loading === "board_ready" ? "Generating…" : "Generating…")
          : "Download PDF"}
        {!isLoading && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#111827] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {tokenBalance !== null && tokenBalance !== undefined && (
            <div className="px-4 py-2.5 border-b border-white/8 bg-white/4">
              <p className="text-xs text-gray-400">Balance: <span className="font-semibold text-white">🪙 {tokenBalance.toLocaleString()}</span></p>
            </div>
          )}

          {TIERS.map((tier) => {
            const isBusy      = loading === tier.key;
            const cantAfford  = tier.cost > 0 && tokenBalance !== null && tokenBalance !== undefined && tokenBalance < tier.cost;
            return (
              <button
                key={tier.key}
                onClick={() => handleTier(tier.key)}
                disabled={isBusy || cantAfford}
                className="w-full text-left px-4 py-3.5 hover:bg-white/6 disabled:opacity-50 transition-colors border-b border-white/6 last:border-0 group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-white group-hover:text-[#10B981] transition-colors">
                    {tier.label}
                  </span>
                  <span className={`text-xs font-bold ${tier.cost === 0 ? "text-[#10B981]" : "text-amber-400"}`}>
                    {tier.cost === 0 ? "Free" : `🪙 ${tier.cost}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">{tier.desc}</span>
                  <span className="text-[10px] text-gray-600">{tier.pages}</span>
                </div>
                {cantAfford && (
                  <p className="text-[10px] text-red-400 mt-1">Insufficient tokens</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="absolute right-0 top-full mt-2 text-xs text-red-400 bg-[#111827] border border-red-500/20 rounded-lg px-3 py-2 w-64 z-50">
          {error}
        </p>
      )}
    </div>
  );
}
