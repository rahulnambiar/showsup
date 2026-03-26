import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShareButton } from "@/components/share-button";
import { AnimatedScoreRing } from "./animated-score";
import { PlatformCard } from "./platform-card";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { CompetitiveBenchmark, type CompetitorsData } from "@/components/competitive-benchmark";
import { ReportTracker } from "./report-tracker";
import { GeographySection } from "./geography-section";
import { GscSection } from "./gsc-section";
import { ChatTrigger } from "./chat-trigger";
import { type ChatMessage } from "@/lib/chat/prompt";

// Dynamic imports (client only)
const PDFDownload = dynamic(
  () => import("@/components/pdf-download").then((m) => m.PDFDownload),
  { ssr: false }
);
const ChatPanel = dynamic(
  () => import("./chat-panel").then((m) => m.ChatPanel),
  { ssr: false }
);

export const metadata: Metadata = { title: "Scan Results — ShowsUp" };

// ── Types ──────────────────────────────────────────────────────────────────────

interface Recommendation {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 71) return "text-[#10B981]";
  if (score >= 51) return "text-[#14B8A6]";
  if (score >= 31) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function scoreVerdict(score: number) {
  if (score >= 71) return "Excellent visibility — AI consistently recommends your brand";
  if (score >= 51) return "Good presence — appearing in most AI responses";
  if (score >= 31) return "Partial presence — room to grow";
  return "Low visibility — action needed";
}

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10B981",
  claude: "#C084FC",
  gemini: "#60A5FA",
};

const MODEL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini 2.5 Flash",
};

const PRIORITY_COLORS: Record<string, string> = {
  High:   "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
  Medium: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  Low:    "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

const COMMON_WORDS = new Set([
  "the", "and", "for", "with", "you", "your", "they", "that", "this", "from",
  "have", "what", "are", "will", "can", "would", "should", "could", "does",
  "been", "its", "also", "into", "more", "many", "some", "most", "best",
  "great", "good", "well", "very", "highly", "their", "which", "when",
  "than", "then", "there", "here", "such", "other", "these", "those",
]);

function extractCompetitors(
  brand: string,
  results: Array<{ response: string | null; model: string }>
): Array<{ name: string; mentions: number; platforms: string[] }> {
  const brandLower = brand.toLowerCase();
  const counts: Record<string, { count: number; platforms: Set<string> }> = {};
  results.forEach((r) => {
    if (!r.response) return;
    const regex = /\b([A-Z][a-zA-Z]{1,}(?:\s+[A-Z][a-zA-Z]+){0,2})\b/g;
    let match;
    while ((match = regex.exec(r.response)) !== null) {
      const name = match[1].trim();
      if (!name || name.length < 3) continue;
      const words = name.split(" ");
      if (words.some((w) => COMMON_WORDS.has(w.toLowerCase()))) continue;
      if (name.toLowerCase().includes(brandLower)) continue;
      if (COMMON_WORDS.has(name.toLowerCase())) continue;
      if (!counts[name]) counts[name] = { count: 0, platforms: new Set() };
      counts[name].count++;
      counts[name].platforms.add(r.model);
    }
  });
  return Object.entries(counts)
    .map(([name, { count, platforms }]) => ({
      name,
      mentions: count,
      platforms: Array.from(platforms).map((m) => MODEL_LABELS[m] ?? m),
    }))
    .filter((c) => c.mentions >= 2)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 5);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ScanDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const [{ data: scan }, { data: results }, { data: chatRecord }] = await Promise.all([
    supabase.from("scans").select("*").eq("id", params.id).single(),
    supabase.from("scan_results").select("*").eq("scan_id", params.id).order("model"),
    supabase.from("report_chats").select("messages, free_messages_used").eq("scan_id", params.id).maybeSingle(),
  ]);

  if (!scan) notFound();

  const score = scan.overall_score ?? 0;

  type ScanResult = NonNullable<typeof results>[number];
  const byModel = (results ?? []).reduce<Record<string, ScanResult[]>>((acc, r) => {
    if (!acc[r.model]) acc[r.model] = [];
    acc[r.model]!.push(r);
    return acc;
  }, {});

  let recommendations: Recommendation[] = [];
  try {
    if (scan.recommendations) {
      recommendations = Array.isArray(scan.recommendations)
        ? (scan.recommendations as Recommendation[])
        : [];
    }
  } catch { recommendations = []; }

  const competitors = extractCompetitors(scan.brand_name, results ?? []);

  // ── Chat data ────────────────────────────────────────────────────────────────
  const chatMessages      = (chatRecord?.messages as ChatMessage[] | null) ?? [];
  const chatFreeUsed      = (chatRecord?.free_messages_used as number) ?? 0;

  // Competitors for chat suggestions (prefer structured data over extracted)
  const competitorNames: string[] = scan.competitors_data
    ? ((scan.competitors_data as { competitors?: Array<{ name: string }> }).competitors?.map(c => c.name) ?? [])
    : competitors.map(c => c.name);

  const modelResultsSummary = Object.entries(byModel).map(([modelId, modelResults]) => ({
    model: modelId,
    label: MODEL_LABELS[modelId] ?? modelId,
    score: Math.round(
      (modelResults ?? []).reduce((s, r) => s + (r.score ?? 0), 0) /
        Math.max(1, (modelResults ?? []).length)
    ),
    mentioned: (modelResults ?? []).some((r) => r.brand_mentioned),
  }));

  const siteUrl = scan.url || scan.website;
  const dateStr = new Date(scan.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <ReportTracker scanId={params.id} score={score} brand={scan.brand_name} />

      {/* ── Nav bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/app/scores"
          className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Scans
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <PDFDownload
            brand={scan.brand_name}
            score={score}
            date={dateStr}
            category={scan.category ?? undefined}
            url={siteUrl ?? undefined}
            modelResults={modelResultsSummary}
            recommendations={recommendations}
            categoryScores={scan.category_scores as Record<string, number> | undefined}
            competitorsData={scan.competitors_data as CompetitorsData | undefined}
          />
          <ShareButton />
          <ChatTrigger
            message="Give me a quick summary of this report and the top 3 things I should do."
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#10B981] border border-[#10B981]/30 hover:border-[#10B981] hover:bg-[#10B981]/10 rounded-lg px-3 py-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Ask AI
          </ChatTrigger>
          <Link
            href="/app/report-builder"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-3 py-2 transition-colors"
          >
            New Analysis
          </Link>
        </div>
      </div>

      {/* ── Report header ── */}
      <div className="space-y-1.5">
        <p className="text-sm text-gray-500 font-medium">AI Visibility Report for</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-white">{scan.brand_name}</h1>
          {scan.category && (
            <Badge className="border border-white/15 bg-white/5 text-gray-300 text-xs">
              {scan.category}
            </Badge>
          )}
        </div>
        {siteUrl && (
          <a
            href={siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
          >
            {siteUrl}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
        <p className="text-xs text-gray-600">Scanned on {dateStr}</p>
      </div>

      {/* ── Overall score ── */}
      <Card className="bg-[#111827] border-white/10">
        <CardContent className="pt-6 pb-6 flex items-center gap-8 flex-wrap">
          <AnimatedScoreRing score={score} />
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Overall AI Visibility</p>
            <p className={`text-5xl font-bold ${scoreColor(score)}`}>
              {score}<span className="text-2xl text-gray-500">/100</span>
            </p>
            <p className="text-sm text-gray-300 font-medium">{scoreVerdict(score)}</p>
            {scan.category && (
              <p className="text-xs text-gray-600">Category: {scan.category}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Platform breakdown ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-400">Platform breakdown</h2>
          <ChatTrigger
            message="Explain my platform scores in detail. Where am I strongest and weakest, and why?"
            className="text-xs text-[#10B981] hover:text-[#059669] transition-colors"
          >
            Ask AI →
          </ChatTrigger>
        </div>
        {Object.entries(byModel).map(([modelId, modelResults]) => {
          const color = MODEL_COLORS[modelId] ?? "#6B7280";
          const label = MODEL_LABELS[modelId] ?? modelId;
          const modelScore = Math.round(
            (modelResults ?? []).reduce((s, r) => s + (r.score ?? 0), 0) /
              Math.max(1, (modelResults ?? []).length)
          );
          const mentioned = (modelResults ?? []).some((r) => r.brand_mentioned);
          return (
            <PlatformCard
              key={modelId}
              modelId={modelId}
              label={label}
              color={color}
              score={modelScore}
              mentioned={mentioned}
              results={modelResults ?? []}
            />
          );
        })}
      </div>

      {/* ── Visibility Breakdown ── */}
      {scan.category_scores && (
        <CategoryBreakdown scores={scan.category_scores as Record<string, number>} />
      )}

      {/* ── Competitive Benchmark ── */}
      {scan.competitors_data && (
        <div className="space-y-0">
          <div className="flex items-center justify-end mb-[-8px]">
            <ChatTrigger
              message={`Compare me to my top competitors. Why are they outranking me in AI responses?`}
              className="text-xs text-[#10B981] hover:text-[#059669] transition-colors"
            >
              Ask AI →
            </ChatTrigger>
          </div>
          <CompetitiveBenchmark data={scan.competitors_data as unknown as CompetitorsData} />
        </div>
      )}

      {/* ── Geography ── */}
      {scan.regional_scores && Object.keys(scan.regional_scores as object).filter((k) => k !== "global").length > 0 && (
        <GeographySection
          regionalScores={scan.regional_scores as Record<string, { score: number; mention_rate: number; avg_position: number | null; sentiment: "positive" | "neutral" | "negative" | null; top_competitor: string | null }>}
          regionalInsights={Array.isArray(scan.regional_insights) ? (scan.regional_insights as string[]) : undefined}
        />
      )}

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">Recommendations</h2>
            <ChatTrigger
              message="Walk me through my top recommendations. Where should I start and what's the expected impact?"
              className="text-xs text-[#10B981] hover:text-[#059669] transition-colors"
            >
              Ask AI →
            </ChatTrigger>
          </div>
          <div className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <Card key={i} className="bg-[#111827] border-white/10">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Badge
                      className={cn(
                        "text-xs border flex-shrink-0 mt-0.5",
                        PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS["Low"]
                      )}
                    >
                      {rec.priority}
                    </Badge>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <p className="text-sm text-gray-400 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Competitor mentions (fallback for old scans) ── */}
      {!scan.competitors_data && competitors.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400">Competitor mentions</h2>
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-4 pb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-gray-500 font-medium pb-2">Competitor</th>
                    <th className="text-left text-xs text-gray-500 font-medium pb-2">Mentions</th>
                    <th className="text-left text-xs text-gray-500 font-medium pb-2">Platforms</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((comp, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="py-2 text-gray-200 font-medium">{comp.name}</td>
                      <td className="py-2 text-gray-400">{comp.mentions}</td>
                      <td className="py-2 text-gray-400">{comp.platforms.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Search Correlation ── */}
      <GscSection
        brand={scan.brand_name}
        scanId={params.id}
        overallScore={score}
        aiResponses={(results ?? []).map((r) => r.response ?? "").filter(Boolean)}
      />

      {/* ── Footer CTA ── */}
      <div className="pt-2 pb-4">
        <Link
          href="/app/report-builder"
          className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
        >
          New analysis
        </Link>
      </div>

      {/* ── AI Chat Panel ── */}
      <ChatPanel
        scanId={params.id}
        brand={scan.brand_name}
        score={score}
        competitors={competitorNames}
        categoryScores={scan.category_scores as Record<string, number> | null}
        hasRegionalData={
          !!(scan.regional_scores && Object.keys(scan.regional_scores as object).filter(k => k !== "global").length > 0)
        }
        initialMessages={chatMessages}
        initialFreeUsed={chatFreeUsed}
      />
    </div>
  );
}
