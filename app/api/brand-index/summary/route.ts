import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rahul@showsup.co";

interface InsightCard {
  title: string;
  body: string;
  brands: string[];
}

// POST /api/brand-index/summary
// Body: { month, prompt }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { month?: string; prompt?: string };
  const { month, prompt } = body;
  if (!prompt || !month) {
    return NextResponse.json({ error: "month and prompt required" }, { status: 400 });
  }

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!aiRes.ok) {
    return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
  }

  const aiData = await aiRes.json() as { content?: Array<{ text?: string }> };
  const rawText = aiData.content?.[0]?.text ?? "";

  let insights: InsightCard[];
  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    insights = JSON.parse(jsonMatch?.[0] ?? rawText) as InsightCard[];
    if (!Array.isArray(insights)) throw new Error("not an array");
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: rawText }, { status: 500 });
  }

  return NextResponse.json({ insights });
}
