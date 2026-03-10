"use client";

import { useState } from "react";
import { type PDFCompetitorsData } from "./pdf-document";

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
  brand: string;
  score: number;
  date: string;
  category?: string;
  url?: string;
  modelResults: ModelResult[];
  recommendations: Recommendation[];
  categoryScores?: Record<string, number>;
  competitorsData?: PDFCompetitorsData;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PDFDownload(props: PDFDownloadProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const [{ pdf }, { ShowsUpPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./pdf-document"),
      ]);

      const blob = await pdf(ShowsUpPDF(props)).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const slug = props.brand.toLowerCase().replace(/\s+/g, "-");
      const dateSlug = new Date().toISOString().slice(0, 10);
      a.href     = url;
      a.download = `ShowsUp-Report-${slug}-${dateSlug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm font-semibold bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-[#0A0E17] rounded-lg px-4 py-2 transition-colors"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-[#0A0E17]/30 border-t-[#0A0E17] rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
      {loading ? "Generating…" : "Download PDF"}
    </button>
  );
}
