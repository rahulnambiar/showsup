import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";
import { ShareButton } from "@/components/share-button";

// Dynamic import for PDF (client only)
const PDFDownload = dynamic(
  () => import("@/components/pdf-download").then((m) => m.PDFDownload),
  { ssr: false }
);

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

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 71 ? "#10B981" : score >= 51 ? "#14B8A6" : score >= 31 ? "#F59E0B" : "#EF4444";
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
      <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="64" y="72" textAnchor="middle" fill={color} fontSize="24" fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "64px 64px" }}>
        {score}
      </text>
    </svg>
  );
}

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10B981",
  claude: "#C084FC",
  gemini: "#60A5FA",
};

const MODEL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
  Medium: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  Low: "bg-gray-500/10 text-gray-400 border-gray-500/30",
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

// ── Expandable platform section (client) ──────────────────────────────────────

import { PlatformCard } from "./platform-card";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { CompetitiveBenchmark, type CompetitorsData } from "@/components/competitive-benchmark";

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ScanDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const [{ data: scan }, { data: results }] = await Promise.all([
    supabase.from("scans").select("*").eq("id", params.id).single(),
    supabase
      .from("scan_results")
      .select("*")
      .eq("scan_id", params.id)
      .order("model"),
  ]);

  if (!scan) notFound();

  const score = scan.overall_score ?? 0;

  // Group results by model
  type ScanResult = NonNullable<typeof results>[number];
  const byModel = (results ?? []).reduce<Record<string, ScanResult[]>>((acc, r) => {
    if (!acc[r.model]) acc[r.model] = [];
    acc[r.model]!.push(r);
    return acc;
  }, {});

  // Recommendations — from DB or empty array
  let recommendations: Recommendation[] = [];
  try {
    if (scan.recommendations) {
      recommendations = Array.isArray(scan.recommendations)
        ? (scan.recommendations as Recommendation[])
        : [];
    }
  } catch {
    recommendations = [];
  }

  // Competitors from responses
  const competitors = extractCompetitors(scan.brand_name, results ?? []);

  // Model results summary for PDF
  const modelResultsSummary = Object.entries(byModel).map(([modelId, modelResults]) => ({
    model: modelId,
    label: MODEL_LABELS[modelId] ?? modelId,
    score: Math.round(
      (modelResults ?? []).reduce((s, r) => s + (r.score ?? 0), 0) /
        Math.max(1, (modelResults ?? []).length)
    ),
    mentioned: (modelResults ?? []).some((r) => r.brand_mentioned),
  }));

  const dateStr = new Date(scan.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/scores"
          className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-1"
        >
          ← All Scans
        </Link>
        <div className="flex items-center gap-2">
          <PDFDownload
            brand={scan.brand_name}
            score={score}
            date={dateStr}
            category={scan.category ?? undefined}
            modelResults={modelResultsSummary}
            recommendations={recommendations}
          />
          <ShareButton />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{scan.brand_name}</h1>
            {scan.category && (
              <Badge className="border border-white/15 bg-white/5 text-gray-300 text-xs">
                {scan.category}
              </Badge>
            )}
          </div>
          {(scan.url || scan.website) && (
            <p className="text-sm text-gray-500">{scan.url || scan.website}</p>
          )}
          <p className="text-xs text-gray-600">{dateStr}</p>
        </div>
      </div>

      {/* Overall score */}
      <Card className="bg-[#111827] border-white/10">
        <CardContent className="pt-6 flex items-center gap-8 flex-wrap">
          <ScoreRing score={score} />
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Overall AI Visibility</p>
            <p className={`text-5xl font-bold ${scoreColor(score)}`}>
              {score}<span className="text-2xl text-gray-500">/100</span>
            </p>
            <p className="text-sm text-gray-300 font-medium">{scoreVerdict(score)}</p>
            {scan.category && (
              <p className="text-xs text-gray-500">Category: {scan.category}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-400">Platform breakdown</h2>
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

      {/* Visibility Breakdown */}
      {scan.category_scores && (
        <CategoryBreakdown scores={scan.category_scores as Record<string, number>} />
      )}

      {/* Competitive Benchmark */}
      {scan.competitors_data && (
        <CompetitiveBenchmark data={scan.competitors_data as unknown as CompetitorsData} />
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400">Recommendations</h2>
          <div className="space-y-3">
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

      {/* Competitor mentions */}
      {competitors.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400">Competitor mentions</h2>
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-4 pb-4">
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

      <div className="pt-2">
        <Link
          href="/app/scan"
          className={cn(
            buttonVariants(),
            "bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold"
          )}
        >
          Run another scan
        </Link>
      </div>
    </div>
  );
}
