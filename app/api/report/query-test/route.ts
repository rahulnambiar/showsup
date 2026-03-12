import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBalance, deductTokens } from "@/lib/tokens";

const QUERY_COST = 5;

async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "OpenAI error");
  return data.choices?.[0]?.message?.content ?? "";
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Anthropic error");
  return data.content?.[0]?.text ?? "";
}

async function analyzeResponse(brand: string, query: string, response: string) {
  const truncated = response.length > 800 ? response.slice(0, 800) + "…" : response;
  const prompt = `Analyze this AI response for brand visibility of "${brand}".
Query: "${query}"
Response: "${truncated}"
Return ONLY valid JSON (no other text):
{"brand_mentioned":true,"mention_position":1,"sentiment":"positive","competitors_found":["name"],"key_context":"summary"}
Fields: brand_mentioned (bool), mention_position (1-10 or null), sentiment ("positive"|"neutral"|"negative"|null), competitors_found (array of brand names), key_context (1-sentence summary of brand mention or why not mentioned)`;

  try {
    const text = await callClaude(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON");
    const parsed = JSON.parse(match[0]);
    return {
      brand_mentioned: Boolean(parsed.brand_mentioned),
      mention_position: typeof parsed.mention_position === "number" ? parsed.mention_position : null,
      sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment) ? parsed.sentiment : null,
      competitors_found: Array.isArray(parsed.competitors_found) ? parsed.competitors_found : [],
      key_context: typeof parsed.key_context === "string" ? parsed.key_context : "",
    };
  } catch {
    const mentioned = response.toLowerCase().includes(brand.toLowerCase());
    return {
      brand_mentioned: mentioned,
      mention_position: mentioned ? 5 : null,
      sentiment: mentioned ? "neutral" as const : null,
      competitors_found: [],
      key_context: mentioned ? `${brand} appears in the response` : `${brand} was not found`,
    };
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { scan_id, model, query } = body as { scan_id: string; model: string; query: string };

  if (!query?.trim()) return NextResponse.json({ error: "Query is required" }, { status: 400 });
  if (!["chatgpt", "claude"].includes(model)) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  // Verify scan belongs to user and get brand name
  const { data: scan } = await supabase
    .from("scans").select("id, brand_name, competitors_data")
    .eq("id", scan_id).eq("user_id", user.id).single();
  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

  const balance = await getBalance(user.id);
  if (balance < QUERY_COST) {
    return NextResponse.json({ error: "Insufficient tokens", required: QUERY_COST, balance }, { status: 402 });
  }

  const result = await deductTokens(user.id, QUERY_COST, "query_test", scan_id);
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Token deduction failed" }, { status: 402 });
  }

  try {
    const response = model === "chatgpt"
      ? await callOpenAI(query.trim())
      : await callClaude(query.trim());

    const analysis = await analyzeResponse(scan.brand_name, query.trim(), response);

    return NextResponse.json({
      response,
      analysis,
      cost: QUERY_COST,
      new_balance: result.balance,
    });
  } catch (err) {
    // Failed after deduction — best effort, don't refund (query was sent)
    const msg = err instanceof Error ? err.message : "Model call failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
