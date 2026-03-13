import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBalance, deductTokens } from "@/lib/tokens";

const COSTS = { sample: 0, full: 25, board_ready: 50 };

async function generateExecSummary(brand: string, score: number, category: string, modelResults: Array<{label: string; score: number; mentioned: boolean}>, competitors: Array<{name: string; mention_rate: number}>, topRecs: string[]): Promise<string> {
  const modelSummary = modelResults.map(m => `${m.label}: ${m.score}/100 (${m.mentioned ? "mentioned" : "not found"})`).join(", ");
  const compSummary = competitors.slice(0, 3).map(c => `${c.name} (${c.mention_rate}%)`).join(", ");
  const recSummary = topRecs.slice(0, 3).join("; ");

  const prompt = `You are a McKinsey-level analyst writing an executive summary for a board presentation.

Brand: ${brand}
Category: ${category}
Overall AI Visibility Score: ${score}/100
Platform Results: ${modelSummary}
Top Competitors: ${compSummary || "none detected"}
Key Recommendations: ${recSummary || "see full report"}

Write a 3-paragraph executive summary (150-200 words total) covering:
1. Current AI visibility position and what it means competitively
2. Key findings from the scan (platforms, gaps, opportunities)
3. Strategic priority — what leadership should focus on first

Write in a professional, direct tone suitable for a board report. No bullet points. No headers. Just 3 clean paragraphs.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { scan_id, tier, model_results, competitors, top_recs } = body as {
    scan_id: string;
    tier: "sample" | "full" | "board_ready";
    model_results?: Array<{label: string; score: number; mentioned: boolean}>;
    competitors?: Array<{name: string; mention_rate: number}>;
    top_recs?: string[];
  };

  if (!["sample", "full", "board_ready"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Verify scan belongs to user
  const { data: scan } = await supabase
    .from("scans").select("id, brand_name, category, overall_score")
    .eq("id", scan_id).eq("user_id", user.id).single();
  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

  const cost = COSTS[tier];

  if (cost > 0) {
    const balance = await getBalance(user.id);
    if (balance < cost) {
      return NextResponse.json({ error: "Insufficient tokens", required: cost, balance }, { status: 402 });
    }
    const result = await deductTokens(user.id, cost, `pdf_${tier}`, scan_id);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Token deduction failed" }, { status: 402 });
    }
  }

  // For board_ready, generate executive summary
  let execSummary: string | undefined;
  if (tier === "board_ready") {
    try {
      execSummary = await generateExecSummary(
        scan.brand_name,
        scan.overall_score ?? 0,
        scan.category ?? "your industry",
        model_results ?? [],
        competitors ?? [],
        top_recs ?? []
      );
    } catch {
      execSummary = undefined;
    }
  }

  return NextResponse.json({ cost, exec_summary: execSummary ?? null });
}
