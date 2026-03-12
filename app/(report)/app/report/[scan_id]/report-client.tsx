"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { getActionCost } from "@/lib/pricing/cost-calculator";
import {
  ChevronDown, Lock, ArrowLeft, ExternalLink, Zap, Lightbulb, CheckCircle2, Circle,
  Share2, Download, Send, TrendingUp, FlaskConical,
} from "lucide-react";
import { CompetitorHeatmap } from "./CompetitorHeatmap";

const PDFDownload = dynamic(
  () => import("@/components/pdf-download").then((m) => m.PDFDownload),
  { ssr: false }
);

// ── Types ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

interface ScanRow {
  id: string;
  brand_name: string;
  url: string | null;
  website: string | null;
  category: string | null;
  overall_score: number | null;
  category_scores: Json;
  recommendations: Json;
  competitors_data: Json;
  perception_data: Json;
  citation_data: Json;
  improvement_plan: Json;
  benchmark_data: Json;
  created_at: string;
}

interface ScanResultRow {
  id: string;
  model: string;
  prompt: string;
  response: string | null;
  brand_mentioned: boolean | null;
  mention_count: number | null;
  score: number | null;
  mention_position: number | null;
  is_recommended: boolean | null;
  sentiment: string | null;
  key_context: string | null;
}

interface Recommendation { title: string; description: string; priority: "High" | "Medium" | "Low" }
interface CompetitorProfile {
  name: string; mention_count: number; total_queries: number;
  mention_rate: number; avg_position: number | null;
  recommend_count: number; sentiment: string | null;
}
interface BrandProfile extends CompetitorProfile {
  sentiment_breakdown?: { positive: number; neutral: number; negative: number };
  sentiment_by_model?: Record<string, string>;
  example_quotes?: Array<{ model: string; prompt: string; key_context: string }>;
}
interface CompetitorsData {
  brand_profile: BrandProfile;
  competitors: CompetitorProfile[];
  share_of_voice: Array<{ name: string; share: number; mentions: number; isBrand: boolean }>;
  insights: string[];
}

interface TocSection { id: string; label: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const MODEL_LABELS: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini" };
const MODEL_COLORS: Record<string, string> = { chatgpt: "#10B981", claude: "#C084FC", gemini: "#60A5FA" };
const MODEL_ICONS: Record<string, string>  = { chatgpt: "C", claude: "A", gemini: "G" };

const CATEGORY_LABELS: Record<string, string> = {
  awareness:       "Direct Awareness",
  discovery:       "Category Discovery",
  competitive:     "Competitive Positioning",
  purchase_intent: "Purchase Intent",
  alternatives:    "Alternatives",
  reputation:      "Reputation",
};

const PRIORITY_STYLES: Record<string, string> = {
  High:   "bg-red-500/10 text-red-400 border border-red-500/25",
  Medium: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  Low:    "bg-gray-500/10 text-gray-400 border border-gray-500/25",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  return s >= 71 ? "#10B981" : s >= 51 ? "#14B8A6" : s >= 31 ? "#F59E0B" : "#EF4444";
}
function scoreVerdict(s: number) {
  if (s >= 71) return "Excellent AI Visibility";
  if (s >= 51) return "Good Presence";
  if (s >= 31) return "Room to Grow";
  return "Low Visibility — Action Needed";
}
function barColor(s: number) {
  return s >= 70 ? "bg-[#10B981]" : s >= 40 ? "bg-[#F59E0B]" : "bg-[#EF4444]";
}

function getHighlightedHTML(text: string, brand: string, competitors: string[]): string {
  let s = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  if (brand) {
    s = s.replace(
      new RegExp(`(${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
      '<mark style="background:rgba(16,185,129,0.2);color:#6ee7b7;border-radius:2px;padding:0 2px">$1</mark>'
    );
  }
  for (const c of competitors) {
    if (!c || c.toLowerCase() === brand.toLowerCase()) continue;
    s = s.replace(
      new RegExp(`(${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
      '<mark style="background:rgba(245,158,11,0.15);color:#fcd34d;border-radius:2px;padding:0 2px">$1</mark>'
    );
  }
  return s;
}

// ── Score Gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const r = 90;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(display);
  const offset = circ - (display / 100) * circ;

  useEffect(() => {
    const duration = 2000;
    const start = Date.now();
    let raf: number;
    function tick() {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute rounded-full blur-3xl opacity-20 transition-colors duration-1000"
        style={{ width: 220, height: 220, background: color }}
      />
      <svg width="220" height="220" viewBox="0 0 220 220" className="rotate-[-90deg] relative z-10">
        <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        <circle
          cx="110" cy="110" r={r} fill="none"
          stroke={color} strokeWidth="14"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s ease" }}
        />
        <g style={{ transform: "rotate(90deg)", transformOrigin: "110px 110px" }}>
          <text x="110" y="100" textAnchor="middle" fill={color} fontSize="52" fontWeight="800" fontFamily="monospace">{display}</text>
          <text x="110" y="130" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="16" fontWeight="500">/ 100</text>
        </g>
      </svg>
    </div>
  );
}

// ── Floating TOC ──────────────────────────────────────────────────────────────

function FloatingTOC({ sections, activeId }: { sections: TocSection[]; activeId: string }) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-1 hidden xl:flex">
      {sections.map((s) => {
        const isActive = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all duration-200 group",
              isActive ? "bg-white/6 text-white" : "text-gray-600 hover:text-gray-400 hover:bg-white/3"
            )}
          >
            <span
              className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200", isActive ? "scale-125" : "opacity-50")}
              style={{ background: isActive ? "#10B981" : "currentColor" }}
            />
            <span className={cn("text-xs font-medium whitespace-nowrap", isActive ? "text-gray-200" : "text-gray-600 group-hover:text-gray-400")}>
              {s.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Query Row ─────────────────────────────────────────────────────────────────

function QueryRow({ result, brand, competitorNames }: {
  result: ScanResultRow; brand: string; competitorNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const mentioned = result.brand_mentioned;
  const sentiment = result.sentiment;
  const sentimentDot = sentiment === "positive" ? "#10B981" : sentiment === "negative" ? "#EF4444" : "#6B7280";

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-600 flex-shrink-0 transition-transform", open && "rotate-180")} />
        <span className="flex-1 text-sm text-gray-300 truncate">{result.prompt}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ background: sentimentDot }} />
          <span className={cn(
            "text-[11px] font-medium px-2 py-0.5 rounded-full border",
            mentioned
              ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25"
              : "bg-white/5 text-gray-500 border-white/10"
          )}>
            {mentioned ? "Mentioned" : "Not Found"}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {result.key_context && (
            <p className="text-xs text-gray-500 italic border-l-2 border-white/10 pl-3">{result.key_context}</p>
          )}
          {result.response ? (
            <div
              className="text-sm text-gray-300 leading-relaxed bg-white/[0.02] rounded-lg p-4 max-h-80 overflow-y-auto border border-white/5"
              dangerouslySetInnerHTML={{ __html: getHighlightedHTML(result.response, brand, competitorNames) }}
            />
          ) : (
            <p className="text-sm text-gray-600 italic">No response stored.</p>
          )}
          {result.is_recommended && (
            <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
              <Zap className="w-3 h-3" />
              <span>Brand was recommended by the AI</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Platform Section ──────────────────────────────────────────────────────────

function PlatformSection({ byModel, brand, competitorNames }: {
  byModel: Record<string, ScanResultRow[]>; brand: string; competitorNames: string[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {Object.entries(byModel).map(([modelId, results]) => {
        const color       = MODEL_COLORS[modelId] ?? "#6B7280";
        const label       = MODEL_LABELS[modelId] ?? modelId;
        const icon        = MODEL_ICONS[modelId]  ?? modelId[0].toUpperCase();
        const modelScore  = Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / Math.max(1, results.length));
        const mentionCount= results.filter((r) => r.brand_mentioned).length;
        const mentionRate = Math.round((mentionCount / Math.max(1, results.length)) * 100);
        const isExpanded  = expanded === modelId;

        return (
          <div key={modelId} className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : modelId)}
              className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: `${color}20`, color }}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{mentionRate}% mention rate · {results.length} queries</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold tabular-nums" style={{ color }}>{modelScore}</p>
                <p className="text-xs text-gray-600">/100</p>
              </div>
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0",
                mentionCount > 0 ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25" : "bg-white/5 text-gray-500 border-white/10"
              )}>
                {mentionCount > 0 ? `Found in ${mentionCount}` : "Not Found"}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-gray-600 flex-shrink-0 transition-transform", isExpanded && "rotate-180")} />
            </button>

            {isExpanded && (
              <div className="border-t border-white/5">
                <p className="px-4 pt-3 pb-2 text-[11px] text-gray-600 uppercase tracking-wider font-medium">All {results.length} queries</p>
                {results.map((r) => (
                  <QueryRow key={r.id} result={r} brand={brand} competitorNames={competitorNames} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Visibility Section ────────────────────────────────────────────────────────

function VisibilitySection({ scores }: { scores: Record<string, number> }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const items = Object.entries(CATEGORY_LABELS)
    .map(([key, label]) => ({ key, label, score: scores[key] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div ref={ref} className="space-y-4">
      {items.map(({ key, label, score }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 font-medium">{label}</span>
            <span className="tabular-nums font-bold" style={{ color: scoreColor(score) }}>{score}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/6 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", barColor(score))}
              style={{ width: visible ? `${score}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Share of Voice Section ────────────────────────────────────────────────────

function ShareOfVoiceSection({ data, brand }: { data: CompetitorsData; brand: string }) {
  const chartData = data.share_of_voice.map((item) => ({
    name: item.isBrand ? brand : item.name,
    share: item.share,
    isBrand: item.isBrand,
  }));

  const brandShare = data.brand_profile?.mention_rate ?? 0;
  const category = "AI mentions";

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-400">
        {brand} captures{" "}
        <span className="font-bold text-[#10B981]">{data.share_of_voice.find((s) => s.isBrand)?.share ?? 0}%</span>
        {" "}of AI mentions in your category.{" "}
        {brandShare >= 40
          ? "Strong share of voice — you're a category leader."
          : brandShare >= 20
          ? "Moderate presence. There's room to capture more mindshare."
          : "Low share of voice — competitors dominate AI responses."}
      </p>

      <ResponsiveContainer width="100%" height={chartData.length * 52 + 20}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#4B5563", fontSize: 11 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }} width={100} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{ background: "#1F2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${v}% share of voice`]}
            labelStyle={{ color: "#fff", fontWeight: 600 }}
          />
          <Bar dataKey="share" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isBrand ? "#10B981" : "#374151"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.isBrand ? "#10B981" : "#374151" }} />
            <span>{item.name}</span>
            <span className="text-gray-700">({item.share}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Competitive Insights Section ──────────────────────────────────────────────

function CompetitorInsightsSection({ insights }: { insights: string[] }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3">
      {insights.map((insight, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-white/8 bg-[#111827] p-4">
          <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
        </div>
      ))}
    </div>
  );
}

// ── Sentiment Section (enriched) ──────────────────────────────────────────────

function SentimentSection({
  scanResults, byModel, perceptionData, brand, brandProfile,
}: {
  scanResults: ScanResultRow[];
  byModel: Record<string, ScanResultRow[]>;
  perceptionData: Json;
  brand: string;
  brandProfile?: BrandProfile | null;
}) {
  // Prefer stored aggregate sentiment_breakdown (computed at scan time from full analysis)
  // Fall back to per-result r.sentiment (requires DB column that may not exist)
  const hasBrandBreakdown = brandProfile?.sentiment_breakdown &&
    (brandProfile.sentiment_breakdown.positive + brandProfile.sentiment_breakdown.neutral + brandProfile.sentiment_breakdown.negative) > 0;

  let pct: { pos: number; neu: number; neg: number };
  if (hasBrandBreakdown) {
    pct = {
      pos: brandProfile!.sentiment_breakdown!.positive,
      neu: brandProfile!.sentiment_breakdown!.neutral,
      neg: brandProfile!.sentiment_breakdown!.negative,
    };
  } else {
    const mentioned = scanResults.filter((r) => r.brand_mentioned && r.sentiment);
    const pos   = mentioned.filter((r) => r.sentiment === "positive").length;
    const neu   = mentioned.filter((r) => r.sentiment === "neutral").length;
    const neg   = mentioned.filter((r) => r.sentiment === "negative").length;
    const total = Math.max(1, pos + neu + neg);
    pct = { pos: Math.round((pos / total) * 100), neu: Math.round((neu / total) * 100), neg: Math.round((neg / total) * 100) };
  }

  // Example quotes — prefer stored example_quotes, fall back to per-result key_context
  const quotes: Array<{ model: string; prompt: string; key_context: string }> =
    (brandProfile?.example_quotes && brandProfile.example_quotes.length > 0)
      ? brandProfile.example_quotes
      : scanResults
          .filter((r) => r.brand_mentioned && r.key_context)
          .slice(0, 3)
          .map((r) => ({ model: r.model, prompt: r.prompt, key_context: r.key_context! }));

  // Platform breakdown — prefer stored sentiment_by_model
  const platformSentiment = Object.entries(byModel).map(([modelId, results]) => {
    const stored = brandProfile?.sentiment_by_model?.[modelId];
    if (stored) {
      return { modelId, label: MODEL_LABELS[modelId] ?? modelId, dominant: stored as string };
    }
    const m = results.filter((r) => r.brand_mentioned && r.sentiment);
    const p = m.filter((r) => r.sentiment === "positive").length;
    const t = Math.max(1, m.length);
    const dominant = p / t >= 0.5 ? "positive" : m.filter((r) => r.sentiment === "negative").length / t >= 0.5 ? "negative" : "neutral";
    return { modelId, label: MODEL_LABELS[modelId] ?? modelId, dominant };
  });

  return (
    <div className="space-y-6">
      {/* Sentiment distribution bar */}
      <div className="space-y-3">
        <div className="flex rounded-xl overflow-hidden h-8 gap-0.5">
          {pct.pos > 0 && (
            <div className="bg-[#10B981] flex items-center justify-center text-xs font-bold text-[#0A0E17]" style={{ width: `${pct.pos}%` }} title={`Positive: ${pct.pos}%`}>
              {pct.pos >= 10 && `${pct.pos}%`}
            </div>
          )}
          {pct.neu > 0 && (
            <div className="bg-[#F59E0B]/60 flex items-center justify-center text-xs font-bold text-[#0A0E17]" style={{ width: `${pct.neu}%` }} title={`Neutral: ${pct.neu}%`}>
              {pct.neu >= 10 && `${pct.neu}%`}
            </div>
          )}
          {pct.neg > 0 && (
            <div className="bg-[#EF4444]/60 flex items-center justify-center text-xs font-bold text-white" style={{ width: `${pct.neg}%` }} title={`Negative: ${pct.neg}%`}>
              {pct.neg >= 10 && `${pct.neg}%`}
            </div>
          )}
        </div>
        <div className="flex gap-5 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" />{pct.pos}% Positive</span>
          <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]/60 inline-block" />{pct.neu}% Neutral</span>
          <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]/60 inline-block" />{pct.neg}% Negative</span>
        </div>
      </div>

      {/* Platform breakdown */}
      {platformSentiment.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {platformSentiment.map(({ modelId, label, dominant }) => {
            const color = dominant === "positive" ? "#10B981" : dominant === "negative" ? "#EF4444" : "#F59E0B";
            return (
              <div key={modelId} className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#111827] px-4 py-2.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-sm text-gray-300">{label} is <span className="font-semibold" style={{ color }}>{dominant}</span></span>
              </div>
            );
          })}
        </div>
      )}

      {/* Example quotes */}
      {quotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Example responses</p>
          {quotes.map((r, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-[#111827] p-4 space-y-1.5">
              <p className="text-xs text-gray-600 uppercase tracking-wider">{r.model} · {r.prompt.slice(0, 60)}{r.prompt.length > 60 ? "…" : ""}</p>
              <p className="text-sm text-gray-300 leading-relaxed italic">&ldquo;{r.key_context}&rdquo;</p>
            </div>
          ))}
        </div>
      )}

      {/* Deep analysis (locked or unlocked) */}
      {perceptionData ? (
        <div className="space-y-4 pt-2 border-t border-white/8">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Deep Perception Analysis</p>
          <p className="text-gray-300 leading-relaxed">{perceptionData.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#10B981]/15 bg-[#10B981]/5 p-4 space-y-2">
              <p className="text-xs text-[#10B981] font-semibold uppercase tracking-wider">Positive descriptors</p>
              <div className="flex flex-wrap gap-2">
                {(perceptionData.positive_descriptors ?? []).map((d: string, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">{d}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4 space-y-2">
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Critical descriptors</p>
              <div className="flex flex-wrap gap-2">
                {(perceptionData.negative_descriptors ?? []).map((d: string, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{d}</span>
                ))}
              </div>
            </div>
          </div>
          {(perceptionData.perception_mismatches ?? []).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Perception gaps</p>
              {perceptionData.perception_mismatches.map((m: string, i: number) => (
                <div key={i} className="flex gap-2 text-sm text-gray-400">
                  <span className="text-amber-400 flex-shrink-0">!</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Citations Section (enriched) ──────────────────────────────────────────────

function CitationsSection({ citationData }: { citationData: Json }) {
  const pages: Array<{ url: string; count: number }> = citationData.cited_pages ?? [];
  const mostCited = pages[0];
  const neverCited = pages.length === 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 leading-relaxed">{citationData.insight}</p>

      {pages.length > 0 ? (
        <>
          <div className="space-y-2">
            {pages.map((page, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border bg-[#111827] px-4 py-3"
                style={{ borderColor: i === 0 ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)" }}>
                <ExternalLink className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                <span className="text-xs text-gray-300 flex-1 truncate font-mono">{page.url}</span>
                {i === 0 && (
                  <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-full px-2 py-0.5 flex-shrink-0">
                    Most cited
                  </span>
                )}
                <span className="text-sm font-bold text-[#10B981] tabular-nums flex-shrink-0">{page.count}×</span>
              </div>
            ))}
          </div>

          {mostCited && (
            <div className="rounded-xl border border-[#10B981]/15 bg-[#10B981]/5 p-4">
              <p className="text-xs text-[#10B981] font-semibold uppercase tracking-wider mb-1.5">Recommendation</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-white">{mostCited.url}</strong> is your most AI-cited page.
                Ensure it stays up-to-date and includes specific, factual claims about your brand.
                Pages not listed here are never mentioned by AI — consider adding more detailed, structured content to those sections.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
          <p className="text-sm text-gray-300">
            No pages from your site were explicitly cited. This is common — most AI models don&apos;t cite sources in conversational answers.
            Focus on getting your brand mentioned in third-party reviews, directories, and authoritative publications instead.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Improvement Plan Section (with checkboxes + score simulator) ──────────────

function ImprovementPlanSection({ plan, currentScore }: { plan: Json; currentScore: number }) {
  const [done, setDone] = useState<Set<string>>(new Set());

  const tiers = [
    { key: "quick_wins",   label: "Quick Wins",   color: "#10B981", badge: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20", desc: "Do this week"   },
    { key: "this_month",   label: "This Month",   color: "#F59E0B", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",  desc: "Do this month"  },
    { key: "this_quarter", label: "This Quarter", color: "#6366F1", badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",desc: "Do this quarter"},
  ];

  const allItems: Array<{ key: string; tier: string; impact: number }> = tiers.flatMap(({ key }) =>
    (plan[key] ?? []).map((item: Json, i: number) => {
      const match = String(item?.impact ?? "").match(/\+?(\d+)/);
      return { key: `${key}-${i}`, tier: key, impact: match ? parseInt(match[1]) : 0 };
    })
  );
  const total     = allItems.length;
  const completed = allItems.filter((x) => done.has(x.key)).length;
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Score simulator
  const projectedGain   = allItems.filter((x) => done.has(x.key)).reduce((s, x) => s + x.impact, 0);
  const projectedScore  = Math.min(100, currentScore + projectedGain);
  const hasSelections   = done.size > 0;

  function toggle(key: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{completed} of {total} recommendations completed</span>
          <span className="font-semibold text-[#10B981]">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/6 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#10B981] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {tiers.map(({ key, label, color, badge, desc }) => {
        const items: Json[] = plan[key] ?? [];
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <p className="text-sm font-semibold text-white">{label}</p>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", badge)}>{desc}</span>
            </div>
            <div className="space-y-2">
              {items.map((item: Json, i: number) => {
                const itemKey = `${key}-${i}`;
                const isDone = done.has(itemKey);
                return (
                  <div
                    key={i}
                    className={cn("rounded-xl border bg-[#111827] p-4 space-y-2 transition-opacity", isDone && "opacity-50")}
                    style={{ borderColor: isDone ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggle(itemKey)}
                        className="flex-shrink-0 mt-0.5 text-gray-600 hover:text-[#10B981] transition-colors"
                      >
                        {isDone
                          ? <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          : <Circle className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className={cn("text-sm font-medium", isDone ? "line-through text-gray-600" : "text-white")}>{item.title}</p>
                          <div className="flex gap-2 flex-shrink-0">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">{item.impact}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">{item.effort}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mt-1">{item.description}</p>
                        {Array.isArray(item.affected_categories) && item.affected_categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.affected_categories.map((cat: string, j: number) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{cat}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Score Simulator ── */}
      <div className={cn(
        "rounded-2xl border p-5 transition-all duration-500",
        hasSelections
          ? "border-[#10B981]/25 bg-[#10B981]/5"
          : "border-white/8 bg-[#111827]"
      )}>
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-4 h-4 text-[#10B981]" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What-If Score Simulator</p>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Check recommendations above to project your score improvement.
        </p>
        <div className="flex items-center gap-4">
          {/* Current score */}
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums text-gray-400">{currentScore}</p>
            <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wider">Current</p>
          </div>
          {/* Arrow + gain */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-0.5 bg-white/8" />
              <TrendingUp className={cn("w-4 h-4 flex-shrink-0 transition-colors", hasSelections ? "text-[#10B981]" : "text-gray-700")} />
              <div className="flex-1 h-0.5 bg-white/8" />
            </div>
            {hasSelections && (
              <span className="text-xs font-bold text-[#10B981]">+{projectedGain} pts from {done.size} action{done.size !== 1 ? "s" : ""}</span>
            )}
          </div>
          {/* Projected score */}
          <div className="text-center">
            <p
              className="text-3xl font-bold tabular-nums transition-all duration-500"
              style={{ color: hasSelections ? scoreColor(projectedScore) : "#374151" }}
            >
              {hasSelections ? projectedScore : "—"}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wider">Projected</p>
          </div>
        </div>
        {hasSelections && projectedScore !== currentScore && (
          <div className="mt-4 h-2 rounded-full bg-white/6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${projectedScore}%`, background: scoreColor(projectedScore) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Benchmark Section ─────────────────────────────────────────────────────────

function BenchmarkSection({ data, actualScore }: { data: Json; actualScore: number }) {
  const tiers = [
    { key: "leader",      label: "Market Leader", color: "#10B981" },
    { key: "average",     label: "Average Brand",  color: "#F59E0B" },
    { key: "new_entrant", label: "New Entrant",    color: "#6B7280" },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#10B981] font-semibold w-28 flex-shrink-0">Your Brand</span>
          <div className="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden relative">
            <div className="h-full rounded-lg bg-[#10B981]/50" style={{ width: `${actualScore}%` }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#10B981]">{actualScore}</span>
          </div>
        </div>
        {tiers.map(({ key, label, color }) => {
          const s = data[key]?.score ?? 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-28 flex-shrink-0">{label}</span>
              <div className="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden relative">
                <div className="h-full rounded-lg" style={{ width: `${s}%`, background: `${color}30` }} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color }}>{s}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-600 italic">Benchmark values are AI-generated estimates for your industry category.</p>
    </div>
  );
}

// ── Locked Module Card ─────────────────────────────────────────────────────────

function LockedModuleCard({
  title, description, unlockKey, scanId, tokenBalance, onUnlocked,
}: {
  title: string;
  description: string;
  unlockKey: string;
  scanId: string;
  tokenBalance: number | null;
  onUnlocked: (data: Json) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const cost = getActionCost(`unlock_${unlockKey}`);
  const hasBalance = tokenBalance === null || tokenBalance >= cost;

  async function handleUnlock() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report/unlock-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_id: scanId, module: unlockKey }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Unlock failed"); setLoading(false); return; }
      window.dispatchEvent(new Event("tokenBalanceChanged"));
      onUnlocked(data.data);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative rounded-2xl border border-white/8 bg-[#111827] overflow-hidden min-h-[220px]">
      {/* Blurred preview */}
      <div className="p-6 blur-sm select-none pointer-events-none opacity-30 space-y-3">
        {[75, 50, 90, 60, 40, 70].map((w, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="h-3 rounded-full bg-white/15" style={{ width: `${w}%` }} />
            <div className="h-3 rounded-full bg-white/6 flex-1" />
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0E17]/80 backdrop-blur-[2px] p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-white font-semibold">{title}</p>
          <p className="text-gray-500 text-sm mt-1 max-w-sm">{description}</p>
        </div>

        {error && (
          <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Insufficient balance */}
        {!hasBalance && !confirming && (
          <div className="space-y-2 text-center">
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Need {cost - (tokenBalance ?? 0)} more tokens to unlock
            </p>
            <Link
              href="/app/tokens"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-xl transition-colors"
            >
              Buy tokens
            </Link>
          </div>
        )}

        {/* Has balance */}
        {hasBalance && (confirming ? (
          <div className="space-y-3 w-full max-w-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
              This will deduct <span className="font-bold text-white">{cost} tokens</span> from your balance.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/15 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                disabled={loading}
                className="flex-1 px-5 py-2 text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-[#0A0E17]/30 border-t-[#0A0E17] rounded-full animate-spin" />}
                {loading ? "Unlocking…" : "Confirm unlock"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="px-6 py-2.5 text-sm font-semibold bg-white/8 hover:bg-white/12 text-white border border-white/15 rounded-xl transition-all hover:border-white/25 flex items-center gap-2.5"
          >
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            Unlock for {cost} tokens
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Upgrade Banner ─────────────────────────────────────────────────────────────

function UpgradeBanner({ queryCount }: { queryCount: number }) {
  const isQuick    = queryCount <= 12;
  const isStandard = queryCount > 12 && queryCount <= 30;
  const [dismissed, setDismissed] = useState(false);
  if ((!isQuick && !isStandard) || dismissed) return null;

  return (
    <div className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/5 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
        <Zap className="w-5 h-5 text-[#10B981]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">
          {isQuick ? "Running a Quick Check?" : "Want deeper insights?"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isQuick
            ? "Upgrade to Standard for 20 queries, competitor analysis, and full recommendations."
            : "Upgrade to Deep Analysis for 50 queries, persona insights, and comprehensive scoring."}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => setDismissed(true)} className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1">Dismiss</button>
        <Link href="/app/report-builder" className="text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg px-3 py-2 transition-colors">
          Upgrade →
        </Link>
      </div>
    </div>
  );
}

// ── Query Explorer Section ────────────────────────────────────────────────────

const MODEL_OPTIONS = [
  { id: "chatgpt", label: "ChatGPT", color: "#10B981" },
  { id: "claude",  label: "Claude",  color: "#C084FC" },
];

interface QueryResult {
  id: number;
  query: string;
  model: string;
  response: string;
  analysis: {
    brand_mentioned: boolean;
    mention_position: number | null;
    sentiment: string | null;
    competitors_found: string[];
    key_context: string;
  };
}

function QueryExplorerSection({
  scan, brand, competitorNames, tokenBalance,
}: {
  scan: ScanRow; brand: string; competitorNames: string[]; tokenBalance: number | null;
}) {
  const [query,    setQuery]   = useState("");
  const [model,    setModel]   = useState("chatgpt");
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState<string | null>(null);
  const [history,  setHistory] = useState<QueryResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_QUERIES = 20;
  const COST = 5;
  const canSubmit = query.trim().length > 0 && !loading && history.length < MAX_QUERIES;
  const insufficientBalance = tokenBalance !== null && tokenBalance < COST;

  async function submit() {
    if (!canSubmit || insufficientBalance) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report/query-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_id: scan.id, model, query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      window.dispatchEvent(new Event("tokenBalanceChanged"));
      setHistory((prev) => [{
        id: Date.now(), query: query.trim(), model,
        response: data.response, analysis: data.analysis,
      }, ...prev]);
      setQuery("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-400">
        Test any query live against ChatGPT or Claude — see if {brand} gets mentioned and how.
        Each query costs <span className="font-semibold text-white">5 🪙</span>.
      </p>

      {/* Input area */}
      <div className="rounded-2xl border border-white/8 bg-[#111827] p-4 space-y-4">
        {/* Platform toggle */}
        <div className="flex gap-2">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all border",
                model === m.id
                  ? "border-transparent text-[#0A0E17]"
                  : "border-white/10 text-gray-500 bg-transparent hover:text-gray-300"
              )}
              style={model === m.id ? { background: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Query input */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type any question about your brand or category..."
          className="w-full bg-[#0A0E17] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/40 transition-colors"
          disabled={loading || history.length >= MAX_QUERIES}
        />

        {error && (
          <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">
            {history.length}/{MAX_QUERIES} queries used this session
          </span>
          <button
            onClick={submit}
            disabled={!canSubmit || insufficientBalance}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
              canSubmit && !insufficientBalance
                ? "bg-[#10B981] hover:bg-[#059669] text-[#0A0E17]"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {loading ? "Querying…" : insufficientBalance ? `Need ${COST} 🪙` : `Test Query — ${COST} 🪙`}
          </button>
        </div>
      </div>

      {/* Query history */}
      {history.length > 0 && (
        <div className="space-y-3">
          {history.map((item) => (
            <QueryResultCard key={item.id} item={item} brand={brand} competitorNames={competitorNames} />
          ))}
        </div>
      )}
    </div>
  );
}

function QueryResultCard({ item, brand, competitorNames }: {
  item: QueryResult; brand: string; competitorNames: string[];
}) {
  const [open, setOpen] = useState(true);
  const { analysis } = item;
  const modelLabel = MODEL_LABELS[item.model] ?? item.model;
  const modelColor = MODEL_COLORS[item.model] ?? "#6B7280";
  const sentColor  = analysis.sentiment === "positive" ? "#10B981" : analysis.sentiment === "negative" ? "#EF4444" : "#F59E0B";

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <ChevronDown className={cn("w-4 h-4 text-gray-600 flex-shrink-0 transition-transform", open && "rotate-180")} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 truncate">{item.query}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${modelColor}20`, color: modelColor }}>{modelLabel}</span>
          <span className={cn(
            "text-[11px] font-medium px-2 py-0.5 rounded-full border",
            analysis.brand_mentioned
              ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25"
              : "bg-white/5 text-gray-500 border-white/10"
          )}>
            {analysis.brand_mentioned ? "✓ Mentioned" : "✗ Not found"}
          </span>
          {analysis.sentiment && (
            <span className="text-[11px] font-medium" style={{ color: sentColor }}>{analysis.sentiment}</span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Analysis badges */}
          <div className="flex flex-wrap gap-2">
            {analysis.brand_mentioned && analysis.mention_position !== null && (
              <span className="text-xs bg-white/5 text-gray-400 border border-white/10 rounded-full px-3 py-1">
                Position #{analysis.mention_position}
              </span>
            )}
            {analysis.competitors_found.length > 0 && (
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1">
                Competitors: {analysis.competitors_found.slice(0, 3).join(", ")}
              </span>
            )}
            {analysis.key_context && (
              <span className="text-xs bg-white/5 text-gray-400 border border-white/10 rounded-full px-3 py-1 italic">
                {analysis.key_context}
              </span>
            )}
          </div>
          {/* Full response */}
          <div
            className="text-sm text-gray-300 leading-relaxed bg-[#0A0E17] rounded-xl p-4 max-h-72 overflow-y-auto border border-white/5"
            dangerouslySetInnerHTML={{ __html: getHighlightedHTML(item.response, brand, competitorNames) }}
          />
        </div>
      )}
    </div>
  );
}

// ── Share Button ──────────────────────────────────────────────────────────────

function ShareButton({ targetRef, label }: { targetRef: React.RefObject<HTMLElement | null>; label: string }) {
  const [state, setState] = useState<"idle" | "capturing" | "done">("idle");

  async function handleShare() {
    if (!targetRef.current || state !== "idle") return;
    setState("capturing");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: "#0A0E17",
        pixelRatio: 2,
        style: { borderRadius: "0px" },
      });
      const link = document.createElement("a");
      link.download = `showsup-${label.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg border transition-all",
        state === "done"
          ? "border-[#10B981]/30 text-[#10B981] bg-[#10B981]/5"
          : "border-white/8 text-gray-600 hover:text-gray-400 hover:border-white/15 bg-transparent"
      )}
      title="Download as image"
    >
      {state === "capturing" ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : state === "done" ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Download className="w-3 h-3" />
      )}
      {state === "done" ? "Saved" : "Save"}
    </button>
  );
}

// ── Section Wrapper ───────────────────────────────────────────────────────────

function Section({ id, title, children, className, shareable }: {
  id: string; title: string; children: React.ReactNode; className?: string; shareable?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} id={id} className={cn("scroll-mt-20", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</h2>
        {shareable && <ShareButton targetRef={ref} label={title} />}
      </div>
      {children}
    </section>
  );
}

// ── Main Report Page ──────────────────────────────────────────────────────────

export function ReportPage({ scan, scanResults }: { scan: ScanRow; scanResults: ScanResultRow[] }) {
  const [tokenBalance,   setTokenBalance]   = useState<number | null>(null);
  const [activeSection,  setActiveSection]  = useState<string>("score");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [improvementPlan,setImprovementPlan]= useState<Json>(scan.improvement_plan ?? null);
  const [benchmarkData,  setBenchmarkData]  = useState<Json>(scan.benchmark_data   ?? null);
  const [perceptionData, setPerceptionData] = useState<Json>(scan.perception_data  ?? null);
  const [citationData,   setCitationData]   = useState<Json>(scan.citation_data    ?? null);

  const score    = scan.overall_score ?? 0;
  const brand    = scan.brand_name;
  const siteUrl  = scan.url || scan.website;
  const dateStr  = new Date(scan.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const byModel = useMemo(() =>
    scanResults.reduce<Record<string, ScanResultRow[]>>((acc, r) => {
      if (!acc[r.model]) acc[r.model] = [];
      acc[r.model]!.push(r);
      return acc;
    }, {}),
    [scanResults]
  );

  const competitorsData: CompetitorsData | null = scan.competitors_data ?? null;
  const competitorNames = useMemo(() =>
    (competitorsData?.competitors ?? []).map((c) => c.name).filter(Boolean),
    [competitorsData]
  );

  const recommendations: Recommendation[] = useMemo(() => {
    // Stored inside competitors_data.recommendations (no dedicated column on scans)
    const fromCompetitors = (scan.competitors_data as Json)?.recommendations;
    const fromScan = (scan as Json).recommendations;
    const src = Array.isArray(fromCompetitors) ? fromCompetitors : Array.isArray(fromScan) ? fromScan : [];
    return src;
  }, [scan]);

  const categoryScores: Record<string, number> | null = scan.category_scores ?? null;
  const totalQueries = scanResults.length;

  const modelResultsSummary = useMemo(() =>
    Object.entries(byModel).map(([modelId, results]) => ({
      model: modelId,
      label: MODEL_LABELS[modelId] ?? modelId,
      score: Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / Math.max(1, results.length)),
      mentioned: results.some((r) => r.brand_mentioned),
    })),
    [byModel]
  );

  // byModel summary for heatmap (mention count + total per model)
  const byModelSummary = useMemo(() =>
    Object.fromEntries(
      Object.entries(byModel).map(([modelId, results]) => [
        modelId,
        { mention_count: results.filter((r) => r.brand_mentioned).length, total: results.length },
      ])
    ),
    [byModel]
  );

  // ── Token balance ─────────────────────────────────────────────────────────
  useEffect(() => {
    function load() {
      fetch("/api/tokens/balance").then((r) => r.json()).then((d) => setTokenBalance(d.balance ?? null)).catch(() => {});
    }
    load();
    window.addEventListener("tokenBalanceChanged", load);
    return () => window.removeEventListener("tokenBalanceChanged", load);
  }, []);

  // ── Build TOC ─────────────────────────────────────────────────────────────
  const hasCompetitors = !!(competitorsData?.brand_profile && (competitorsData?.competitors?.length ?? 0) > 0);

  const tocSections: TocSection[] = useMemo(() => {
    const s: TocSection[] = [
      { id: "score",     label: "Score"     },
      { id: "platforms", label: "Platforms" },
    ];
    if (categoryScores)         s.push({ id: "visibility",  label: "Visibility"  });
    if (hasCompetitors)         s.push({ id: "heatmap",     label: "Heatmap"     });
    if (hasCompetitors)         s.push({ id: "share",       label: "Share"       });
    if (recommendations.length) s.push({ id: "actions",     label: "Actions"     });
    s.push({ id: "sentiment",      label: "Sentiment"   });
    s.push({ id: "citations",      label: "Citations"   });
    s.push({ id: "improvement",    label: "Improvement" });
    s.push({ id: "benchmark",      label: "Benchmark"   });
    s.push({ id: "query-explorer", label: "Try Query"   });
    return s;
  }, [categoryScores, hasCompetitors, recommendations.length]);

  // ── Scroll tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      // Active section
      const threshold = window.innerHeight * 0.4;
      let best: string | null = null;
      for (const { id } of tocSections) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) best = id;
      }
      if (best) setActiveSection(best);
      // Scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [tocSections]);

  return (
    <div className="min-h-screen bg-[#0A0E17]">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-[#0A0E17]/90 backdrop-blur-xl border-b border-white/6">
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/4">
          <div
            className="h-full bg-[#10B981] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href="/app/scores" className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 flex items-center justify-center flex-shrink-0 text-[#10B981] text-xs font-bold">
              {brand[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-white truncate block">{brand}</span>
              {siteUrl && <span className="text-[11px] text-gray-600 truncate block">{siteUrl}</span>}
            </div>
          </div>
          <div className="hidden md:block text-center flex-shrink-0">
            <p className="text-xs text-gray-500 font-medium">AI Visibility Report</p>
            <p className="text-[11px] text-gray-700">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {tokenBalance !== null && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 border border-white/8 rounded-lg px-2.5 py-1.5">
                🪙 {tokenBalance.toLocaleString()}
              </span>
            )}
            <PDFDownload
              brand={brand} score={score} date={dateStr}
              category={scan.category ?? undefined}
              url={siteUrl ?? undefined}
              modelResults={modelResultsSummary}
              recommendations={recommendations}
              categoryScores={categoryScores ?? undefined}
              competitorsData={competitorsData?.brand_profile ? {
                ...competitorsData,
                brand_profile: { ...competitorsData.brand_profile, sentiment: competitorsData.brand_profile.sentiment as "positive" | "neutral" | "negative" | null },
                competitors: (competitorsData.competitors ?? []).map((c) => ({ ...c, sentiment: c.sentiment as "positive" | "neutral" | "negative" | null })),
              } : undefined}
            />
          </div>
        </div>
      </header>

      <FloatingTOC sections={tocSections} activeId={activeSection} />

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-24">

        {/* ── 1: Score ── */}
        <section id="score" className="scroll-mt-20 text-center space-y-6">
          <ScoreGauge score={score} />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">{scoreVerdict(score)}</h1>
            <p className="text-gray-400 text-lg">
              {brand} appears in{" "}
              <span className="font-semibold" style={{ color: scoreColor(score) }}>
                {competitorsData?.brand_profile?.mention_rate ?? Math.round((scanResults.filter((r) => r.brand_mentioned).length / Math.max(1, scanResults.length)) * 100)}%
              </span>{" "}
              of AI queries about {scan.category ?? "your category"}
            </p>
            <p className="text-sm text-gray-600">
              Scanned across {Object.keys(byModel).length} AI platform{Object.keys(byModel).length !== 1 ? "s" : ""} · {totalQueries} queries analysed · {dateStr}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 pt-2">
            {Object.entries(byModel).map(([modelId, results]) => {
              const ms = Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / Math.max(1, results.length));
              return (
                <div key={modelId} className="text-center">
                  <p className="text-2xl font-bold tabular-nums" style={{ color: MODEL_COLORS[modelId] ?? "#fff" }}>{ms}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{MODEL_LABELS[modelId] ?? modelId}</p>
                </div>
              );
            })}
          </div>
        </section>

        <UpgradeBanner queryCount={totalQueries} />

        {/* ── 2: Platform Breakdown ── */}
        <Section id="platforms" title="Platform Breakdown" shareable>
          <PlatformSection byModel={byModel} brand={brand} competitorNames={competitorNames} />
        </Section>

        {/* ── 3: Visibility Breakdown ── */}
        {categoryScores && (
          <Section id="visibility" title="Visibility Breakdown" shareable>
            <VisibilitySection scores={categoryScores} />
          </Section>
        )}

        {/* ── 4: Competitor Heatmap ── */}
        {hasCompetitors && competitorsData && (
          <Section id="heatmap" title="Competitor Heatmap" shareable>
            <CompetitorHeatmap
              brand={brand}
              brandProfile={competitorsData.brand_profile}
              competitors={competitorsData.competitors}
              byModel={byModelSummary}
              scanResults={scanResults.map((r) => ({
                prompt: r.prompt,
                response: r.response,
                brand_mentioned: r.brand_mentioned,
                key_context: r.key_context,
                model: r.model,
              }))}
            />
          </Section>
        )}

        {/* ── 5: Share of Voice ── */}
        {hasCompetitors && competitorsData && (competitorsData.share_of_voice?.length ?? 0) > 0 && (
          <Section id="share" title="Share of Voice" shareable>
            <ShareOfVoiceSection data={competitorsData} brand={brand} />
            {(competitorsData.insights?.length ?? 0) > 0 && (
              <div className="mt-8">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Competitive Insights</p>
                <CompetitorInsightsSection insights={competitorsData.insights} />
              </div>
            )}
          </Section>
        )}

        {/* ── 6: Recommendations ── */}
        {recommendations.length > 0 && (
          <Section id="actions" title="Recommended Actions">
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-[#111827] p-4 flex items-start gap-3">
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5", PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES["Low"])}>
                    {rec.priority}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{rec.title}</p>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── 7: Sentiment ── */}
        <Section id="sentiment" title="Brand Sentiment">
          <SentimentSection
            scanResults={scanResults}
            byModel={byModel}
            perceptionData={perceptionData}
            brand={brand}
            brandProfile={competitorsData?.brand_profile}
          />
          {!perceptionData && (
            <div className="mt-6">
              <LockedModuleCard
                title="Deep Perception Analysis"
                description="How AI models describe your brand — key descriptors, perception gaps vs. your positioning, and sentiment mismatches."
                unlockKey="sentiment"
                scanId={scan.id}
                tokenBalance={tokenBalance}
                onUnlocked={(data) => setPerceptionData(data)}
              />
            </div>
          )}
        </Section>

        {/* ── 8: Citations ── */}
        <Section id="citations" title="Citation Tracking">
          {citationData ? (
            <CitationsSection citationData={citationData} />
          ) : (
            <LockedModuleCard
              title="Citation Page Tracking"
              description="Which pages on your website AI models cite — and which are never mentioned."
              unlockKey="citations"
              scanId={scan.id}
              tokenBalance={tokenBalance}
              onUnlocked={(data) => setCitationData(data)}
            />
          )}
        </Section>

        {/* ── 9: Improvement Plan ── */}
        <Section id="improvement" title="AI Improvement Plan">
          {improvementPlan ? (
            <ImprovementPlanSection plan={improvementPlan} currentScore={score} />
          ) : (
            <LockedModuleCard
              title="3-Tier Improvement Plan"
              description="A prioritised action plan — quick wins, monthly goals, and quarterly initiatives to boost your AI visibility."
              unlockKey="improvement_plan"
              scanId={scan.id}
              tokenBalance={tokenBalance}
              onUnlocked={(data) => setImprovementPlan(data)}
            />
          )}
        </Section>

        {/* ── 10: Benchmark ── */}
        <Section id="benchmark" title="Industry Benchmark" shareable>
          {benchmarkData ? (
            <BenchmarkSection data={benchmarkData} actualScore={score} />
          ) : (
            <LockedModuleCard
              title="Category Benchmarking"
              description="Compare your scores against typical market leaders, average brands, and new entrants in your category."
              unlockKey="benchmark"
              scanId={scan.id}
              tokenBalance={tokenBalance}
              onUnlocked={(data) => setBenchmarkData(data)}
            />
          )}
        </Section>

        {/* ── 11: Query Explorer ── */}
        <Section id="query-explorer" title="Try Your Own Query">
          <QueryExplorerSection
            scan={scan}
            brand={brand}
            competitorNames={competitorNames}
            tokenBalance={tokenBalance}
          />
        </Section>

        {/* ── Footer ── */}
        <div className="pt-8 pb-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-4">
          <Link href="/app/report-builder" className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors">
            <Zap className="w-4 h-4" />
            Run Another Report
          </Link>
          <Link href="/app/scores" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            View all reports →
          </Link>
        </div>

      </main>
    </div>
  );
}
