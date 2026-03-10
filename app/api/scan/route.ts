import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Prompts ──────────────────────────────────────────────────────────────────

const COMMERCE_CATEGORIES = ["Insurance", "Travel", "Finance", "E-commerce"];

function buildPrompts(brand: string, category: string) {
  const prompts = [
    {
      id: "direct",
      text: `What is ${brand}? Describe what they do in 2-3 sentences.`,
    },
    {
      id: "category",
      text: `What are the top ${category} companies/tools? List 5-8.`,
    },
    {
      id: "competitive",
      text: `Compare ${brand} with its main competitors in ${category}.`,
    },
    {
      id: "reputation",
      text: `${brand} reviews — is it worth using? What are pros and cons?`,
    },
    {
      id: "alternatives",
      text: `What are the best alternatives to ${brand}?`,
    },
    {
      id: "usecase",
      text: `Best ${category} solutions for small businesses or startups.`,
    },
  ];

  if (COMMERCE_CATEGORIES.includes(category)) {
    prompts.push({
      id: "value",
      text: `Which ${category} company should I choose for the best value?`,
    });
    prompts.push({
      id: "reliability",
      text: `Recommend a good ${category} option for someone looking for reliability.`,
    });
  }

  return prompts;
}

// ── Model callers (raw fetch — no extra SDK deps) ─────────────────────────────

async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "OpenAI error");
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Anthropic error");
  return data.content?.[0]?.text ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Gemini error");
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreBrand(brand: string, response: string) {
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  const count = (response.match(regex) ?? []).length;
  const score = count === 0 ? 0 : Math.min(100, 35 + count * 13);
  return { mentioned: count > 0, count, score };
}

function overallScore(results: { score: number }[]) {
  if (!results.length) return 0;
  return Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
}

// ── Competitor extraction ──────────────────────────────────────────────────────

const COMMON_WORDS = new Set([
  "the", "and", "for", "with", "you", "your", "they", "that", "this", "from",
  "have", "what", "are", "will", "can", "would", "should", "could", "does",
  "been", "its", "also", "into", "more", "many", "some", "most", "best",
  "great", "good", "well", "very", "highly", "their", "which", "when",
  "than", "then", "there", "here", "such", "other", "these", "those",
  "pros", "cons", "plan", "option", "service", "product", "company", "tool",
  "platform", "solution", "provider", "business", "brand", "user", "users",
  "both", "each", "every", "any", "all", "only", "just", "like", "how",
]);

function extractCompetitors(
  brand: string,
  modelResults: Array<{ prompts: Array<{ response: string }> }>
): Array<{ name: string; mentions: number; platforms: number }> {
  const brandLower = brand.toLowerCase();
  const counts: Record<string, { count: number; platforms: Set<number> }> = {};

  modelResults.forEach((mr, modelIdx) => {
    mr.prompts.forEach((pr) => {
      if (!pr.response) return;
      // Match capitalized words/phrases (1-3 words, each capitalized)
      const regex = /\b([A-Z][a-zA-Z]{1,}(?:\s+[A-Z][a-zA-Z]+){0,2})\b/g;
      let match;
      while ((match = regex.exec(pr.response)) !== null) {
        const name = match[1].trim();
        if (!name) continue;
        // Filter out common words and the target brand
        const words = name.split(" ");
        if (words.some((w) => COMMON_WORDS.has(w.toLowerCase()))) continue;
        if (name.toLowerCase().includes(brandLower)) continue;
        if (name.length < 3) continue;
        // Skip single common sentence starters
        if (COMMON_WORDS.has(name.toLowerCase())) continue;

        if (!counts[name]) counts[name] = { count: 0, platforms: new Set() };
        counts[name].count++;
        counts[name].platforms.add(modelIdx);
      }
    });
  });

  return Object.entries(counts)
    .map(([name, { count, platforms }]) => ({
      name,
      mentions: count,
      platforms: platforms.size,
    }))
    .filter((c) => c.mentions >= 2)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 5);
}

// ── Recommendations ───────────────────────────────────────────────────────────

interface Recommendation {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
}

function fallbackRecommendations(
  brand: string,
  category: string,
  score: number
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (score < 30) {
    recs.push({
      title: "Establish AI-friendly content",
      description: `Create clear, authoritative content about ${brand} that AI models can reference. Focus on your unique value proposition in ${category}.`,
      priority: "High",
    });
    recs.push({
      title: "Build brand mentions across the web",
      description: "Get cited in industry publications, review sites, and comparison articles to increase your brand's presence in AI training data.",
      priority: "High",
    });
  } else if (score < 60) {
    recs.push({
      title: "Strengthen competitive positioning",
      description: `Publish comparison content between ${brand} and key ${category} competitors to appear in alternative-seeking queries.`,
      priority: "High",
    });
  }

  recs.push({
    title: "Optimize for category keywords",
    description: `Ensure your website prominently features ${category.toLowerCase()} terminology so AI models associate your brand with the right category.`,
    priority: "Medium",
  });

  recs.push({
    title: "Gather and publish customer reviews",
    description: "AI models often cite review content. Actively collect testimonials and ensure they appear on authoritative platforms.",
    priority: "Medium",
  });

  recs.push({
    title: "Monitor and track your AI visibility",
    description: "Run weekly scans to track progress and identify which query types are improving. Use trend data to prioritize efforts.",
    priority: "Low",
  });

  return recs.slice(0, 5);
}

async function generateRecommendations(
  brand: string,
  category: string,
  score: number,
  modelResults: Array<{ label: string; score: number; mentioned: boolean }>
): Promise<Recommendation[]> {
  try {
    const summary = modelResults
      .map((mr) => `${mr.label}: score ${mr.score}, mentioned: ${mr.mentioned}`)
      .join("; ");

    const prompt = `You are an AI visibility consultant. A brand called "${brand}" in the ${category} category has been scanned across AI models. Overall score: ${score}/100. Per-model results: ${summary}.

Based on this data, provide exactly 3-5 actionable recommendations to improve their AI visibility score. Return ONLY a JSON array with this exact format, no other text:
[{"title":"...", "description":"...", "priority":"High"},{"title":"...", "description":"...", "priority":"Medium"},{"title":"...", "description":"...", "priority":"Low"}]

Priority must be exactly "High", "Medium", or "Low". Make recommendations specific to ${category} and their current score of ${score}.`;

    const response = await callAnthropic(prompt);

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return fallbackRecommendations(brand, category, score);

    const parsed = JSON.parse(jsonMatch[0]) as Recommendation[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallbackRecommendations(brand, category, score);
    }

    // Validate structure
    const valid = parsed.every(
      (r) =>
        typeof r.title === "string" &&
        typeof r.description === "string" &&
        ["High", "Medium", "Low"].includes(r.priority)
    );

    if (!valid) return fallbackRecommendations(brand, category, score);
    return parsed.slice(0, 5);
  } catch {
    return fallbackRecommendations(brand, category, score);
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const brand: string = (body.brand ?? "").trim();
    const category: string = (body.category ?? "Other").trim();
    const url: string = (body.url ?? body.website ?? "").trim();

    if (!brand) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const prompts = buildPrompts(brand, category);

    // Run all model × prompt combinations in parallel
    const enabledModels = body.models ?? { chatgpt: true, claude: true };
    const allModels = [
      { id: "chatgpt", label: "ChatGPT", call: callOpenAI },
      { id: "claude", label: "Claude", call: callAnthropic },
      // { id: "gemini", label: "Gemini", call: callGemini },
    ];
    const models = allModels.filter((m) => enabledModels[m.id] !== false);

    const modelResults = await Promise.all(
      models.map(async (model) => {
        const promptResults = await Promise.all(
          prompts.map(async (p) => {
            try {
              const response = await model.call(p.text);
              const { mentioned, count, score } = scoreBrand(brand, response);
              return { promptId: p.id, prompt: p.text, response, mentioned, count, score };
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Unknown error";
              return { promptId: p.id, prompt: p.text, response: "", mentioned: false, count: 0, score: 0, error: msg };
            }
          })
        );

        const modelScore = overallScore(promptResults);
        const anyMentioned = promptResults.some((r) => r.mentioned);

        return {
          model: model.id,
          label: model.label,
          score: modelScore,
          mentioned: anyMentioned,
          prompts: promptResults,
        };
      })
    );

    const finalScore = overallScore(modelResults);

    // Generate recommendations
    const recommendations = await generateRecommendations(
      brand,
      category,
      finalScore,
      modelResults
    );

    // Extract competitors
    const competitors = extractCompetitors(brand, modelResults);

    // Persist to Supabase (best-effort — try full insert, fall back to minimal)
    let scanId: string | null = null;
    try {
      // Try full insert first
      let scan: { id: string } | null = null;

      const { data: fullScan, error: fullError } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          brand_name: brand,
          website: url || null,
          url: url || null,
          category,
          status: "completed",
          overall_score: finalScore,
          recommendations,
        })
        .select("id")
        .single();

      if (!fullError && fullScan?.id) {
        scan = fullScan;
      } else {
        // Fall back to minimal insert (only guaranteed columns)
        const { data: minScan } = await supabase
          .from("scans")
          .insert({
            user_id: user.id,
            brand_name: brand,
            website: url || null,
            status: "completed",
            overall_score: finalScore,
          })
          .select("id")
          .single();
        scan = minScan ?? null;
      }

      if (scan?.id) {
        scanId = scan.id;
        const rows = modelResults.flatMap((mr) =>
          mr.prompts.map((pr) => ({
            scan_id: scanId,
            model: mr.model,
            prompt: pr.prompt,
            response: pr.response,
            brand_mentioned: pr.mentioned,
            mention_count: pr.count,
            score: pr.score,
          }))
        );
        await supabase.from("scan_results").insert(rows);
      }
    } catch {
      // Tables not set up yet — results still returned to the client
    }

    return NextResponse.json({
      scan_id: scanId,
      brand,
      category,
      url,
      overall_score: finalScore,
      results: modelResults,
      recommendations,
      competitors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
