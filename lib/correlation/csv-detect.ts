/**
 * AI-powered CSV type detection and column mapping.
 * Uses Claude/OpenAI to analyze the first 20 rows and return structured mapping.
 */

export type CsvSourceType = "keyword" | "sales" | "social" | "brand_tracking" | "revenue" | "custom";

export interface CsvColumnMeta {
  name: string;
  description: string;
  role: "date" | "metric" | "label" | "ignore";
}

export interface CsvDetectionResult {
  type: CsvSourceType;
  detected_source: string;   // e.g. "Ahrefs", "Semrush", "Shopify"
  date_column: string | null;
  metric_columns: CsvColumnMeta[];
  confidence: "high" | "medium" | "low";
}

// ── Preset templates (fast path — no AI needed) ───────────────────────────

export const PRESET_TEMPLATES: Array<{
  id: string;
  label: string;
  type: CsvSourceType;
  date_column: string;
  metric_columns: Array<{ name: string; description: string }>;
  header_signals: string[];
}> = [
  {
    id: "ahrefs",
    label: "Ahrefs Export",
    type: "keyword",
    date_column: "",
    header_signals: ["keyword", "volume", "kd", "cpc", "traffic", "position"],
    metric_columns: [
      { name: "volume",   description: "Monthly search volume" },
      { name: "position", description: "SERP position" },
      { name: "traffic",  description: "Estimated monthly clicks" },
    ],
  },
  {
    id: "semrush",
    label: "Semrush Export",
    type: "keyword",
    date_column: "",
    header_signals: ["keyword", "search_volume", "keyword_difficulty", "cpc", "competitive_density"],
    metric_columns: [
      { name: "search_volume",      description: "Monthly search volume" },
      { name: "keyword_difficulty", description: "Keyword difficulty score" },
    ],
  },
  {
    id: "gkp",
    label: "Google Keyword Planner",
    type: "keyword",
    date_column: "",
    header_signals: ["keyword", "avg_monthly_searches", "competition", "top_of_page_bid"],
    metric_columns: [
      { name: "avg_monthly_searches", description: "Average monthly searches" },
    ],
  },
  {
    id: "shopify",
    label: "Shopify Orders Export",
    type: "sales",
    date_column: "created_at",
    header_signals: ["name", "email", "financial_status", "total_price", "subtotal_price"],
    metric_columns: [
      { name: "total_price",    description: "Order total (revenue)" },
      { name: "subtotal_price", description: "Subtotal before tax/shipping" },
    ],
  },
  {
    id: "stripe",
    label: "Stripe Revenue Export",
    type: "revenue",
    date_column: "created",
    header_signals: ["id", "amount", "currency", "status", "customer", "description"],
    metric_columns: [
      { name: "amount", description: "Charge amount (in cents / smallest unit)" },
    ],
  },
  {
    id: "brandwatch",
    label: "Brandwatch Export",
    type: "brand_tracking",
    date_column: "date",
    header_signals: ["date", "mentions", "sentiment", "reach", "impressions", "authors"],
    metric_columns: [
      { name: "mentions",   description: "Brand mention count" },
      { name: "reach",      description: "Estimated audience reach" },
      { name: "sentiment",  description: "Sentiment score" },
      { name: "impressions",description: "Total impressions" },
    ],
  },
];

/** Try to match a CSV's headers against preset templates. Returns the template or null. */
export function matchPreset(headers: string[]): typeof PRESET_TEMPLATES[number] | null {
  const lc = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_"));
  let best: typeof PRESET_TEMPLATES[number] | null = null;
  let bestScore = 0;
  for (const tpl of PRESET_TEMPLATES) {
    const matches = tpl.header_signals.filter((s) =>
      lc.some((h) => h.includes(s) || s.includes(h))
    ).length;
    const score = matches / tpl.header_signals.length;
    if (score > bestScore && score >= 0.5) { best = tpl; bestScore = score; }
  }
  return best;
}

// ── AI detection ──────────────────────────────────────────────────────────

async function callAI(prompt: string): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json() as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? "";
  }
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 600 }),
    });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  }
  throw new Error("No LLM provider configured");
}

export async function detectCsvWithAI(
  headers: string[],
  sampleRows: string[][],
): Promise<CsvDetectionResult> {
  const sampleText = [
    headers.join(","),
    ...sampleRows.slice(0, 20).map((r) => r.join(",")),
  ].join("\n");

  const prompt = `Analyze this CSV data (first 20 rows). Determine what type of data it is and map the columns.

CSV:
\`\`\`
${sampleText}
\`\`\`

Respond with ONLY valid JSON, no explanation:
{
  "type": "keyword" | "sales" | "social" | "brand_tracking" | "revenue" | "custom",
  "detected_source": "tool name or 'Unknown'",
  "date_column": "column name or null",
  "confidence": "high" | "medium" | "low",
  "metric_columns": [
    { "name": "exact column name", "description": "what this metric means", "role": "metric" | "date" | "label" | "ignore" }
  ]
}

Rules:
- type "keyword": keyword research tools (Ahrefs, Semrush, GKP, etc.)
- type "sales": Shopify, WooCommerce, order exports
- type "revenue": Stripe, payment processor exports
- type "social": Twitter/X, Instagram, LinkedIn analytics
- type "brand_tracking": Brandwatch, Mention, Meltwater
- type "custom": anything else with numeric metrics over time
- Only include columns with numeric values as metric_columns
- Set "role": "date" for the date/time column`;

  try {
    const raw  = await callAI(prompt);
    const json = raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(json) as CsvDetectionResult;
    return parsed;
  } catch {
    // Fallback: treat all numeric-looking columns as metrics
    const metricCols = headers.map((h) => ({
      name: h,
      description: h.replace(/_/g, " "),
      role: "metric" as const,
    }));
    return {
      type: "custom",
      detected_source: "Unknown",
      date_column: headers.find((h) => /date|time|period|week|month/i.test(h)) ?? null,
      metric_columns: metricCols,
      confidence: "low",
    };
  }
}
