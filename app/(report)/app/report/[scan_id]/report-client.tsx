"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { getActionCost } from "@/lib/pricing/cost-calculator";
import { ChevronDown, Lock, ArrowLeft, ExternalLink, Zap } from "lucide-react";

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
interface CompetitorProfile { name: string; mention_count: number; total_queries: number; mention_rate: number; avg_position: number | null; recommend_count: number; sentiment: string | null }
interface CompetitorsData { brand_profile: CompetitorProfile; competitors: CompetitorProfile[]; share_of_voice: Array<{ name: string; share: number; mentions: number; isBrand: boolean }>; insights: string[] }

interface TocSection { id: string; label: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const MODEL_LABELS: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini" };
const MODEL_COLORS: Record<string, string> = { chatgpt: "#10B981", claude: "#C084FC", gemini: "#60A5FA" };
const MODEL_ICONS: Record<string, string> = { chatgpt: "C", claude: "A", gemini: "G" };

const CATEGORY_LABELS: Record<string, string> = {
  awareness:      "Direct Awareness",
  discovery:      "Category Discovery",
  competitive:    "Competitive Positioning",
  purchase_intent:"Purchase Intent",
  alternatives:   "Alternatives",
  reputation:     "Reputation",
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
      {/* Glow */}
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
          <text x="110" y="100" textAnchor="middle" fill={color} fontSize="52" fontWeight="800" fontFamily="monospace">
            {display}
          </text>
          <text x="110" y="130" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="16" fontWeight="500">
            / 100
          </text>
        </g>
      </svg>
    </div>
  );
}

// ── Floating TOC ──────────────────────────────────────────────────────────────

function FloatingTOC({ sections, activeId }: { sections: TocSection[]; activeId: string }) {
  const [hovered, setHovered] = useState<string | null>(null);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5 hidden lg:flex">
      {sections.map((s) => {
        const isActive = activeId === s.id;
        return (
          <div key={s.id} className="relative flex items-center justify-end gap-2">
            {hovered === s.id && (
              <span className="absolute right-7 bg-[#1F2937] text-gray-300 text-xs rounded-md px-2.5 py-1 whitespace-nowrap border border-white/10 shadow-xl pointer-events-none">
                {s.label}
              </span>
            )}
            <button
              onClick={() => scrollTo(s.id)}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-200",
                isActive ? "scale-125" : "opacity-40 hover:opacity-80"
              )}
              style={{ background: isActive ? "#10B981" : "rgba(255,255,255,0.4)" }}
            />
          </div>
        );
      })}
    </nav>
  );
}

// ── Query Row ─────────────────────────────────────────────────────────────────

function QueryRow({
  result, brand, competitorNames,
}: {
  result: ScanResultRow;
  brand: string;
  competitorNames: string[];
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
          {/* Sentiment dot */}
          <div className="w-2 h-2 rounded-full" style={{ background: sentimentDot }} />
          {/* Mentioned badge */}
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

function PlatformSection({
  byModel, brand, competitorNames,
}: {
  byModel: Record<string, ScanResultRow[]>;
  brand: string;
  competitorNames: string[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {Object.entries(byModel).map(([modelId, results]) => {
        const color = MODEL_COLORS[modelId] ?? "#6B7280";
        const label = MODEL_LABELS[modelId] ?? modelId;
        const icon  = MODEL_ICONS[modelId] ?? modelId[0].toUpperCase();
        const modelScore = Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / Math.max(1, results.length));
        const mentionCount = results.filter((r) => r.brand_mentioned).length;
        const mentionRate  = Math.round((mentionCount / Math.max(1, results.length)) * 100);
        const isExpanded   = expanded === modelId;

        return (
          <div key={modelId} className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
            {/* Card header */}
            <button
              onClick={() => setExpanded(isExpanded ? null : modelId)}
              className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors text-left"
            >
              {/* Model icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: `${color}20`, color }}>
                {icon}
              </div>

              {/* Name + score */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{mentionRate}% mention rate · {results.length} queries</p>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold tabular-nums" style={{ color }}>
                  {modelScore}
                </p>
                <p className="text-xs text-gray-600">/100</p>
              </div>

              {/* Mentioned badge */}
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0",
                mentionCount > 0
                  ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25"
                  : "bg-white/5 text-gray-500 border-white/10"
              )}>
                {mentionCount > 0 ? `Found in ${mentionCount}` : "Not Found"}
              </span>

              <ChevronDown className={cn("w-4 h-4 text-gray-600 flex-shrink-0 transition-transform", isExpanded && "rotate-180")} />
            </button>

            {/* Expanded query list */}
            {isExpanded && (
              <div className="border-t border-white/5">
                <p className="px-4 pt-3 pb-2 text-[11px] text-gray-600 uppercase tracking-wider font-medium">
                  All {results.length} queries
                </p>
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

  const items = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key, label, score: scores[key] ?? 0,
  })).sort((a, b) => b.score - a.score);

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

// ── Competitor Section ────────────────────────────────────────────────────────

function CompetitorSection({ data, brand }: { data: CompetitorsData; brand: string }) {
  const all = [
    { ...data.brand_profile, isBrand: true },
    ...(data.competitors ?? []).map((c) => ({ ...c, isBrand: false })),
  ].slice(0, 5);

  const maxMentions = Math.max(...all.map((c) => c.mention_count), 1);

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="space-y-3">
        {all.map((comp) => (
          <div key={comp.name} className="flex items-center gap-3">
            <span className={cn("text-sm w-28 truncate flex-shrink-0", comp.isBrand ? "text-[#10B981] font-semibold" : "text-gray-400")}>
              {comp.name}
            </span>
            <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden relative">
              <div
                className={cn("h-full rounded-lg transition-all duration-700", comp.isBrand ? "bg-[#10B981]/40" : "bg-white/15")}
                style={{ width: `${(comp.mention_count / maxMentions) * 100}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 tabular-nums">
                {comp.mention_count}
              </span>
            </div>
            <span className="text-xs text-gray-600 w-16 text-right flex-shrink-0">{comp.mention_rate}% rate</span>
          </div>
        ))}
      </div>

      {/* Share of voice */}
      {data.share_of_voice && data.share_of_voice.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Share of Voice</p>
          <div className="flex rounded-xl overflow-hidden h-8 gap-0.5">
            {data.share_of_voice.map((item) => (
              <div
                key={item.name}
                style={{ width: `${item.share}%`, background: item.isBrand ? "#10B981" : "#1F2937" }}
                className="relative group flex-shrink-0"
                title={`${item.name}: ${item.share}%`}
              >
                {item.share >= 10 && (
                  <span className={cn(
                    "absolute inset-0 flex items-center justify-center text-[11px] font-semibold",
                    item.isBrand ? "text-[#0A0E17]" : "text-gray-400"
                  )}>
                    {item.share}%
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {data.share_of_voice.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full" style={{ background: item.isBrand ? "#10B981" : "#374151" }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((insight, i) => (
            <div key={i} className="flex gap-2.5 text-sm text-gray-400">
              <span className="text-[#10B981] flex-shrink-0 mt-0.5">→</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Locked Module Card ─────────────────────────────────────────────────────────

function LockedModuleCard({
  title, description, unlockKey, scanId, onUnlocked,
}: {
  title: string;
  description: string;
  unlockKey: string;
  scanId: string;
  onUnlocked: (data: Json) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cost = getActionCost(`unlock_${unlockKey}`);

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
    <div className="relative rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
      {/* Blurred content preview */}
      <div className="p-6 blur-sm select-none pointer-events-none opacity-40">
        <div className="space-y-3">
          {[70, 45, 85, 55, 30].map((w, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-3 rounded bg-white/10" style={{ width: `${w}%` }} />
              <div className="h-3 rounded bg-white/5 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0E17]/70 backdrop-blur-sm p-6 text-center space-y-4">
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

        {confirming ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/15 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUnlock}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-[#0A0E17]/30 border-t-[#0A0E17] rounded-full animate-spin" /> : null}
              Confirm — {cost} 🪙
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="px-5 py-2 text-sm font-semibold bg-white/8 hover:bg-white/12 text-white border border-white/15 rounded-lg transition-colors flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-[#10B981]" />
            Unlock — {cost} 🪙
          </button>
        )}
      </div>
    </div>
  );
}

// ── Improvement Plan Section ──────────────────────────────────────────────────

function ImprovementPlanSection({ plan }: { plan: Json }) {
  const tiers = [
    { key: "quick_wins",   label: "Quick Wins",    color: "#10B981", desc: "Do this week"   },
    { key: "this_month",   label: "This Month",    color: "#14B8A6", desc: "Do this month"  },
    { key: "this_quarter", label: "This Quarter",  color: "#6366F1", desc: "Do this quarter"},
  ];

  return (
    <div className="space-y-6">
      {tiers.map(({ key, label, color, desc }) => {
        const items: Json[] = plan[key] ?? [];
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <p className="text-sm font-semibold text-white">{label}</p>
              <span className="text-xs text-gray-600">{desc}</span>
            </div>
            <div className="space-y-2">
              {items.map((item: Json, i: number) => (
                <div key={i} className="rounded-xl border border-white/8 bg-[#111827] p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">{item.impact}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">{item.effort}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                  {Array.isArray(item.affected_categories) && item.affected_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.affected_categories.map((cat: string, j: number) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{cat}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Benchmark Section ─────────────────────────────────────────────────────────

function BenchmarkSection({ data, actualScore }: { data: Json; actualScore: number }) {
  const tiers = [
    { key: "leader",      label: "Market Leader",  color: "#10B981" },
    { key: "average",     label: "Average Brand",  color: "#F59E0B" },
    { key: "new_entrant", label: "New Entrant",     color: "#6B7280" },
  ];

  return (
    <div className="space-y-4">
      {/* Your score vs benchmarks */}
      <div className="space-y-3">
        {/* Your score */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#10B981] font-semibold w-28 flex-shrink-0">Your Brand</span>
          <div className="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden relative">
            <div className="h-full rounded-lg bg-[#10B981]/50" style={{ width: `${actualScore}%` }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#10B981]">{actualScore}</span>
          </div>
        </div>

        {tiers.map(({ key, label, color }) => {
          const score = data[key]?.score ?? 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-28 flex-shrink-0">{label}</span>
              <div className="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden relative">
                <div className="h-full rounded-lg" style={{ width: `${score}%`, background: `${color}30` }} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color }}>{score}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 italic">
        Benchmark values are AI-generated estimates for the {`industry`} category.
      </p>
    </div>
  );
}

// ── Upsell Banner ─────────────────────────────────────────────────────────────

function UpgradeBanner({ queryCount, scanId }: { queryCount: number; scanId: string }) {
  const isQuick = queryCount <= 12;
  const isStandard = queryCount > 12 && queryCount <= 30;
  if (!isQuick && !isStandard) return null;

  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

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
        <button onClick={() => setDismissed(true)} className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1">
          Dismiss
        </button>
        <Link
          href="/app/report-builder"
          className="text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg px-3 py-2 transition-colors"
        >
          Upgrade →
        </Link>
      </div>
    </div>
  );
}

// ── Section Wrapper ───────────────────────────────────────────────────────────

function Section({ id, title, children, className }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">{title}</h2>
      {children}
    </section>
  );
}

// ── Main Report Page ──────────────────────────────────────────────────────────

export function ReportPage({ scan, scanResults }: { scan: ScanRow; scanResults: ScanResultRow[] }) {
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("score");

  // Module state (can be unlocked)
  const [improvementPlan, setImprovementPlan] = useState<Json>(scan.improvement_plan ?? null);
  const [benchmarkData,   setBenchmarkData]   = useState<Json>(scan.benchmark_data   ?? null);
  const [perceptionData,  setPerceptionData]  = useState<Json>(scan.perception_data  ?? null);
  const [citationData,    setCitationData]    = useState<Json>(scan.citation_data    ?? null);

  const score = scan.overall_score ?? 0;
  const brand = scan.brand_name;
  const siteUrl = scan.url || scan.website;
  const dateStr = new Date(scan.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Group results by model
  const byModel = useMemo(() =>
    scanResults.reduce<Record<string, ScanResultRow[]>>((acc, r) => {
      if (!acc[r.model]) acc[r.model] = [];
      acc[r.model]!.push(r);
      return acc;
    }, {}),
    [scanResults]
  );

  // Competitor names for highlighting
  const competitorsData: CompetitorsData | null = scan.competitors_data ?? null;
  const competitorNames = useMemo(() =>
    (competitorsData?.competitors ?? []).map((c) => c.name).filter(Boolean),
    [competitorsData]
  );

  const recommendations: Recommendation[] = useMemo(() =>
    Array.isArray(scan.recommendations) ? scan.recommendations : [],
    [scan.recommendations]
  );

  const categoryScores: Record<string, number> | null = scan.category_scores ?? null;
  const totalQueries = scanResults.length;

  // Model results summary for PDF
  const modelResultsSummary = useMemo(() =>
    Object.entries(byModel).map(([modelId, results]) => ({
      model: modelId,
      label: MODEL_LABELS[modelId] ?? modelId,
      score: Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / Math.max(1, results.length)),
      mentioned: results.some((r) => r.brand_mentioned),
    })),
    [byModel]
  );

  // ── Token balance ───────────────────────────────────────────────────────────
  useEffect(() => {
    function load() {
      fetch("/api/tokens/balance").then((r) => r.json()).then((d) => setTokenBalance(d.balance ?? null)).catch(() => {});
    }
    load();
    window.addEventListener("tokenBalanceChanged", load);
    return () => window.removeEventListener("tokenBalanceChanged", load);
  }, []);

  // ── Build TOC ───────────────────────────────────────────────────────────────
  const tocSections: TocSection[] = useMemo(() => {
    const sections: TocSection[] = [
      { id: "score",      label: "Score"       },
      { id: "platforms",  label: "Platforms"   },
    ];
    if (categoryScores)                              sections.push({ id: "visibility",     label: "Visibility"    });
    if (competitorsData?.competitors?.length)        sections.push({ id: "competitors",    label: "Competitors"   });
    if (recommendations.length)                      sections.push({ id: "recommendations",label: "Actions"       });
    sections.push({ id: "sentiment",   label: "Sentiment"     });
    sections.push({ id: "citations",   label: "Citations"     });
    sections.push({ id: "improvement", label: "Improvement"   });
    sections.push({ id: "benchmark",   label: "Benchmark"     });
    return sections;
  }, [categoryScores, competitorsData, recommendations]);

  // ── Scroll tracking ─────────────────────────────────────────────────────────
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) setActiveSection(entry.target.id);
    }
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(observerCallback, { threshold: 0.3, rootMargin: "-10% 0px -60% 0px" });
    tocSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [tocSections, observerCallback]);

  return (
    <div className="min-h-screen bg-[#0A0E17]">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-[#0A0E17]/90 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href="/app/scores" className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 flex items-center justify-center flex-shrink-0 text-[#10B981] text-xs font-bold">
              {brand[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-white truncate block">{brand}</span>
              {siteUrl && (
                <span className="text-[11px] text-gray-600 truncate block">{siteUrl}</span>
              )}
            </div>
          </div>

          {/* Center */}
          <div className="hidden md:block text-center flex-shrink-0">
            <p className="text-xs text-gray-500 font-medium">AI Visibility Report</p>
            <p className="text-[11px] text-gray-700">{dateStr}</p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {tokenBalance !== null && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 border border-white/8 rounded-lg px-2.5 py-1.5">
                🪙 {tokenBalance.toLocaleString()}
              </span>
            )}
            <PDFDownload
              brand={brand}
              score={score}
              date={dateStr}
              category={scan.category ?? undefined}
              url={siteUrl ?? undefined}
              modelResults={modelResultsSummary}
              recommendations={recommendations}
              categoryScores={categoryScores ?? undefined}
              competitorsData={competitorsData ? {
                ...competitorsData,
                brand_profile: { ...competitorsData.brand_profile, sentiment: competitorsData.brand_profile.sentiment as "positive" | "neutral" | "negative" | null },
                competitors: competitorsData.competitors.map((c) => ({ ...c, sentiment: c.sentiment as "positive" | "neutral" | "negative" | null })),
              } : undefined}
            />
          </div>
        </div>
      </header>

      {/* ── Floating TOC ── */}
      <FloatingTOC sections={tocSections} activeId={activeSection} />

      {/* ── Main Content ── */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-24">

        {/* ── Section 1: Score Hero ── */}
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

          {/* Quick stats row */}
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

        {/* ── Upgrade banner (quick check) ── */}
        <UpgradeBanner queryCount={totalQueries} scanId={scan.id} />

        {/* ── Section 2: Platform Breakdown ── */}
        <Section id="platforms" title="Platform Breakdown">
          <PlatformSection byModel={byModel} brand={brand} competitorNames={competitorNames} />
        </Section>

        {/* ── Section 3: Visibility Breakdown ── */}
        {categoryScores && (
          <Section id="visibility" title="Visibility Breakdown">
            <VisibilitySection scores={categoryScores} />
          </Section>
        )}

        {/* ── Section 4: Competitors ── */}
        {competitorsData && (competitorsData.competitors?.length ?? 0) > 0 && (
          <Section id="competitors" title="Competitive Landscape">
            <CompetitorSection data={competitorsData} brand={brand} />
          </Section>
        )}

        {/* ── Section 5: Recommendations ── */}
        {recommendations.length > 0 && (
          <Section id="recommendations" title="Recommendations">
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

        {/* ── Section 6: Sentiment ── */}
        <Section id="sentiment" title="Brand Perception">
          {perceptionData ? (
            <div className="space-y-5">
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
          ) : (
            <LockedModuleCard
              title="Brand Perception Analysis"
              description="See how AI models describe your brand — top descriptors, sentiment patterns, and perception gaps vs. your positioning."
              unlockKey="sentiment"
              scanId={scan.id}
              onUnlocked={(data) => setPerceptionData(data)}
            />
          )}
        </Section>

        {/* ── Section 7: Citations ── */}
        <Section id="citations" title="Citation Tracking">
          {citationData ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">{citationData.insight}</p>
              {(citationData.cited_pages ?? []).length > 0 ? (
                <div className="space-y-2">
                  {citationData.cited_pages.map((page: Json, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#111827] px-4 py-3">
                      <ExternalLink className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      <span className="text-sm text-gray-300 flex-1 truncate font-mono text-xs">{page.url}</span>
                      <span className="text-sm font-bold text-[#10B981] tabular-nums">{page.count}×</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No specific pages were cited in this scan.</p>
              )}
            </div>
          ) : (
            <LockedModuleCard
              title="Citation Page Tracking"
              description="Discover which pages on your website AI models cite and recommend — and which pages are never mentioned."
              unlockKey="citations"
              scanId={scan.id}
              onUnlocked={(data) => setCitationData(data)}
            />
          )}
        </Section>

        {/* ── Section 8: Improvement Plan ── */}
        <Section id="improvement" title="AI Improvement Plan">
          {improvementPlan ? (
            <ImprovementPlanSection plan={improvementPlan} />
          ) : (
            <LockedModuleCard
              title="3-Tier Improvement Plan"
              description="A specific, prioritized action plan to improve your AI visibility — quick wins, monthly goals, and quarterly initiatives."
              unlockKey="improvement_plan"
              scanId={scan.id}
              onUnlocked={(data) => setImprovementPlan(data)}
            />
          )}
        </Section>

        {/* ── Section 9: Benchmark ── */}
        <Section id="benchmark" title="Industry Benchmark">
          {benchmarkData ? (
            <BenchmarkSection data={benchmarkData} actualScore={score} />
          ) : (
            <LockedModuleCard
              title="Category Benchmarking"
              description="Compare your scores against typical market leaders, average brands, and new entrants in your category."
              unlockKey="benchmark"
              scanId={scan.id}
              onUnlocked={(data) => setBenchmarkData(data)}
            />
          )}
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
