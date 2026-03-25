import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ModelResult {
  model: string;
  label: string;
  score: number;
  mentioned: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 71) return "#10B981";
  if (s >= 51) return "#14B8A6";
  if (s >= 31) return "#F59E0B";
  return "#EF4444";
}

function scoreVerdict(s: number): string {
  if (s >= 71) return "Excellent AI Visibility";
  if (s >= 51) return "Good AI Presence";
  if (s >= 31) return "Partial AI Presence";
  return "Low AI Visibility";
}

function scoreRing(s: number) {
  const r = 54;
  const total = 2 * Math.PI * r;
  const dash = (s / 100) * total;
  return { r, dash, gap: total - dash };
}

// ── Data fetching ──────────────────────────────────────────────────────────────

async function getScan(scanId: string) {
  const supabase = await createServiceClient();

  const { data: scan } = await supabase
    .from("scans")
    .select("id, brand_name, category, url, website, overall_score, category_scores, created_at, competitors_data")
    .eq("id", scanId)
    .single();

  if (!scan || !scan.overall_score) return null;

  const { data: results } = await supabase
    .from("scan_results")
    .select("model, brand_mentioned, score")
    .eq("scan_id", scanId);

  return { scan, results: results ?? [] };
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ scan_id: string }> }): Promise<Metadata> {
  const { scan_id } = await params;
  const data = await getScan(scan_id);
  if (!data) return { title: "AI Visibility Report — ShowsUp" };
  const { scan } = data;
  return {
    title: `${scan.brand_name} AI Visibility Report — ShowsUp`,
    description: `${scan.brand_name} scored ${scan.overall_score}/100 on AI Visibility. See how this brand shows up in ChatGPT, Claude, and Gemini.`,
    openGraph: {
      title: `${scan.brand_name} scores ${scan.overall_score}/100 on AI Visibility`,
      description: `See how ${scan.brand_name} appears in AI model responses. Powered by ShowsUp.`,
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function SharePage({ params }: { params: Promise<{ scan_id: string }> }) {
  const { scan_id } = await params;
  const data = await getScan(scan_id);
  if (!data) notFound();

  const { scan, results } = data;
  const score = scan.overall_score as number;
  const brand = scan.brand_name as string;
  const dateStr = new Date(scan.created_at as string).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Build per-model summary from scan_results
  const byModel: Record<string, { score: number; count: number; mentioned: number }> = {};
  for (const r of results) {
    if (!byModel[r.model]) byModel[r.model] = { score: 0, count: 0, mentioned: 0 };
    byModel[r.model]!.score += r.score ?? 0;
    byModel[r.model]!.count++;
    if (r.brand_mentioned) byModel[r.model]!.mentioned++;
  }

  const MODEL_LABELS: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini 2.5 Flash" };
  const MODEL_COLORS: Record<string, string> = { chatgpt: "#10B981", claude: "#C084FC", gemini: "#60A5FA" };

  const modelResults: ModelResult[] = Object.entries(byModel).map(([model, d]) => ({
    model,
    label: MODEL_LABELS[model] ?? model,
    score: Math.round(d.score / Math.max(1, d.count)),
    mentioned: d.mentioned > 0,
  }));

  const { r, dash, gap } = scoreRing(score);
  const color = scoreColor(score);
  const verdict = scoreVerdict(score);

  // Competitor names for teaser (blurred)
  const competitorsData = scan.competitors_data as Json;
  const competitorNames: string[] = (competitorsData?.competitors ?? [])
    .slice(0, 3)
    .map((c: { name: string }) => c.name)
    .filter(Boolean);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0E17", color: "#F9FAFB", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <header style={{ backgroundColor: "#111827", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: "#10B981", textDecoration: "none" }}>
            ShowsUp
          </Link>
          <span style={{ fontSize: 12, color: "#6B7280" }}>AI Visibility Intelligence</span>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Brand + Score hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#6B7280", marginBottom: 12 }}>
            AI Visibility Report · {dateStr}
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>{brand}</h1>
          {scan.category && (
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>{scan.category}</p>
          )}

          {/* Score circle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <svg width={140} height={140} viewBox="0 0 140 140">
              <circle cx={70} cy={70} r={r} fill="none" stroke="#1F2937" strokeWidth={10} />
              <circle
                cx={70} cy={70} r={r} fill="none"
                stroke={color} strokeWidth={10}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
              <text x={70} y={66} textAnchor="middle" fontSize={32} fontWeight="bold" fill={color}>{score}</text>
              <text x={70} y={84} textAnchor="middle" fontSize={12} fill="#6B7280">/100</text>
            </svg>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color, marginBottom: 8 }}>{verdict}</p>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            {brand} appears in AI responses across {modelResults.length} platform{modelResults.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Platform breakdown */}
        {modelResults.length > 0 && (
          <div style={{ backgroundColor: "#111827", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#D1D5DB", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
              Platform Scores
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {modelResults.map((mr) => {
                const mc = MODEL_COLORS[mr.model] ?? "#6B7280";
                const sc = scoreColor(mr.score);
                return (
                  <div key={mr.model}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: mc }} />
                        <span style={{ fontSize: 13, color: "#D1D5DB", fontWeight: 600 }}>{mr.label}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, borderRadius: 20,
                          padding: "2px 8px",
                          backgroundColor: mr.mentioned ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                          color: mr.mentioned ? "#10B981" : "#6B7280",
                        }}>
                          {mr.mentioned ? "Mentioned" : "Not found"}
                        </span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: sc }}>{mr.score}</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: "#1F2937", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${mr.score}%`, backgroundColor: sc, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          {[
            { label: "Competitive Analysis", desc: competitorNames.length > 0 ? `vs ${competitorNames.join(", ")} and more` : "Competitor mention rates & share of voice" },
            { label: "AI Improvement Plan", desc: "90-day action plan to boost your score" },
            { label: "Sentiment & Perception", desc: "How AI models describe your brand" },
            { label: "Recommendations", desc: "Prioritised actions tailored to your results" },
          ].map(({ label, desc }) => (
            <div key={label} style={{
              backgroundColor: "#111827", borderRadius: 10, padding: "16px 20px",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              filter: "none",
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#4B5563", marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 12, color: "#374151" }}>{desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151" }}>
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Locked</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          backgroundColor: "#111827", borderRadius: 16, padding: 32, textAlign: "center",
          border: "1px solid rgba(16,185,129,0.25)",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.15)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F9FAFB", marginBottom: 8 }}>
            How does your brand show up?
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            Get your own AI Visibility Report — see exactly how ChatGPT, Claude, and Gemini describe your brand, who you compete with, and how to improve.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-block",
              backgroundColor: "#10B981", color: "#0A0E17",
              fontWeight: 700, fontSize: 15,
              padding: "12px 28px", borderRadius: 10,
              textDecoration: "none",
            }}
          >
            Get your free report →
          </Link>
          <p style={{ fontSize: 11, color: "#374151", marginTop: 12 }}>No credit card required · Results in under 2 minutes</p>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#374151" }}>
          Powered by{" "}
          <Link href="/" style={{ color: "#10B981", textDecoration: "none", fontWeight: 600 }}>ShowsUp</Link>
          {" "}— AI Visibility Intelligence
        </p>
      </footer>
    </div>
  );
}
