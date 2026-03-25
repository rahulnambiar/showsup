import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { analyzeWebsite } from "@/lib/fixes/website-analyzer";
import Anthropic from "@anthropic-ai/sdk";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ── AEO 10-dimension prompt ───────────────────────────────────────────────────

function buildPlanPrompt(
  brand: string,
  category: string,
  websiteJson: string,
  scanSummary: string
): string {
  return `You are an AEO (Answer Engine Optimization) expert. Analyze the brand and website data below and generate a prioritized improvement plan for AI visibility.

BRAND: ${brand}
CATEGORY: ${category}

WEBSITE ANALYSIS:
${websiteJson}

AI SCAN SUMMARY:
${scanSummary}

Generate a JSON array of improvement plan items across these 10 AEO dimensions:
1. crawler_readiness - Can AI bots crawl and read the site? (robots.txt, SSR/JS, llms.txt) → funnel_stage: awareness
2. entity_strength - Brand entity recognition (consistent name/descriptions across the web) → funnel_stage: awareness
3. training_data - Is the brand present on authoritative sites that LLMs train on? → funnel_stage: awareness
4. content_citability - Comprehensive, citable content with FAQ, stats, quotes → funnel_stage: consideration
5. content_freshness - Content recency and update frequency signals → funnel_stage: consideration
6. intent_alignment - Content covers the question space for the category → funnel_stage: consideration
7. competitive_narrative - Clear differentiation vs competitors AI mentions → funnel_stage: competition
8. mention_positioning - Brand appears early and prominently in AI responses → funnel_stage: competition
9. citation_sources - External sites and press that AI crawlers can cite → funnel_stage: conversion
10. multi_platform - Presence across review sites, directories, social → funnel_stage: conversion

Return ONLY a valid JSON array. Each item must match this exact schema:
{
  "layer": string (one of the 10 dimension keys above, e.g. "crawler_readiness"),
  "title": string (≤60 chars, action-oriented),
  "description": string (2-3 sentences explaining the issue and its impact on AI visibility),
  "priority": "critical" | "high" | "medium" | "low",
  "effort": "quick_win" | "medium" | "project",
  "funnel_stage": "awareness" | "consideration" | "competition" | "conversion",
  "current_score": number (0-100, your assessment of current state),
  "target_score": number (0-100, realistic target after fix),
  "action_steps": string (3-5 specific steps written as plain text, one step per line),
  "verification_type": string (one of: robots_txt_block | missing_llms_txt | missing_schema_faq | missing_organization_schema | missing_sitemap | thin_content | no_faq_content | no_statistics | no_quotes | no_answer_first | not_ssr | missing_h1 | missing_meta_description | manual),
  "verification_page_url": string | null (specific page URL to verify, null means homepage),
  "impact": string | null (brief outcome sentence, e.g. "Could increase AI mentions by 30%"),
  "why_it_matters": string (1-2 sentences on why this matters for AI visibility),
  "current_state": string | null (what we found on the site right now),
  "desired_state": string | null (what it should look like after the fix)
}

Rules:
- Generate 8-12 items covering the most impactful improvements
- Base findings on the actual website analysis data, not generic advice
- Mark items "critical" only if they actively prevent AI from indexing content
- Quick wins = fixes achievable in 1-2 hours; Projects = multi-week efforts
- Be specific: reference actual missing schema types, actual word counts, actual blocked crawlers found
- Omit dimensions where the site already performs well (score ≥ 80)

Respond with ONLY the JSON array, no markdown, no explanation.`;
}

// ── POST /api/plan/generate ───────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { scan_id: string };
    const { scan_id } = body;
    if (!scan_id) return NextResponse.json({ error: "scan_id required" }, { status: 400 });

    const admin = getAdmin();

    // Load scan
    const { data: scan } = await admin
      .from("scans")
      .select("id, brand_name, category, website, overall_score, category_scores, competitors_data, user_id")
      .eq("id", scan_id)
      .single();

    if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    if (scan.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check if plan already generated (return cached)
    const { data: existingItems } = await admin
      .from("plan_items")
      .select("id")
      .eq("scan_id", scan_id)
      .limit(1);

    if (existingItems && existingItems.length > 0) {
      const { data: allItems } = await admin
        .from("plan_items")
        .select("*")
        .eq("scan_id", scan_id)
        .order("priority", { ascending: true });
      return NextResponse.json({ plan_items: allItems, cached: true });
    }

    // Analyze website
    const siteUrl = scan.website || scan.brand_name;
    let websiteAnalysis = null;
    let websiteJson = "Website analysis unavailable.";
    try {
      websiteAnalysis = await analyzeWebsite(siteUrl);
      // Build a concise summary instead of dumping the full JSON (avoids huge prompts)
      const wa = websiteAnalysis;
      const homePage = wa.pages[0];
      websiteJson = [
        `Homepage: ${wa.homepageUrl}`,
        `SSR: ${wa.isSSR}`,
        `Has Organization schema: ${wa.hasOrganizationSchema}`,
        `llms.txt: exists=${wa.llmsTxt.exists}, words=${wa.llmsTxt.wordCount}`,
        `robots.txt: blocked crawlers=[${wa.robotsTxt.blockedCrawlers.join(", ") || "none"}]`,
        `sitemap.xml: exists=${wa.sitemapXml.exists}, urls=${wa.sitemapXml.urlCount}, hasLastmod=${wa.sitemapXml.hasLastmod}`,
        homePage ? [
          `Homepage title: "${homePage.title}"`,
          `Homepage H1: "${homePage.h1}"`,
          `Homepage meta description: ${homePage.metaDescription ? `"${homePage.metaDescription.slice(0, 100)}"` : "MISSING"}`,
          `Homepage word count: ${homePage.wordCount}`,
          `Homepage FAQ schema: ${homePage.hasSchemaFAQ}`,
          `Homepage FAQ content: ${homePage.hasFAQContent}`,
          `Homepage statistics: ${homePage.hasStatistics}`,
          `Homepage quotes: ${homePage.hasQuotes}`,
          `Homepage answer-first: ${homePage.answerFirst}`,
          `Homepage schema types: [${homePage.schemaTypes.join(", ") || "none"}]`,
          `Pages analyzed: ${wa.pages.length}`,
          `Headings (h2/h3): ${homePage.headings.slice(0, 8).join(" | ")}`,
        ].join("\n") : "",
      ].filter(Boolean).join("\n");
    } catch {
      websiteJson = `Could not analyze ${siteUrl} — proceeding with scan data only.`;
    }

    // Build scan summary
    const competitorsData = scan.competitors_data as { competitors?: Array<{ name: string }> } | null;
    const topCompetitors = (competitorsData?.competitors ?? [])
      .slice(0, 3)
      .map((c) => c.name)
      .join(", ");
    const categoryScores = scan.category_scores as Record<string, number> | null;
    const scanSummary = [
      `Overall AI visibility score: ${scan.overall_score}/100`,
      topCompetitors ? `Top competitors in AI responses: ${topCompetitors}` : "",
      categoryScores ? `Category scores: ${JSON.stringify(categoryScores)}` : "",
    ].filter(Boolean).join("\n");

    // Call Claude Sonnet for plan generation
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = buildPlanPrompt(
      scan.brand_name as string,
      (scan.category as string) ?? "General",
      websiteJson,
      scanSummary
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = message.content.find((b) => b.type === "text")?.text ?? "[]";
    console.log("[plan/generate] raw AI response:", rawText.slice(0, 500));

    // Parse plan items — handle markdown fences, leading text, etc.
    let planItems: Record<string, unknown>[] = [];
    try {
      // Strip markdown fences
      let cleaned = rawText.trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      // If response has leading text before the array, extract just the array
      const arrayStart = cleaned.indexOf("[");
      const arrayEnd = cleaned.lastIndexOf("]");
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayStart < arrayEnd) {
        cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
      }

      planItems = JSON.parse(cleaned) as Record<string, unknown>[];
      if (!Array.isArray(planItems)) planItems = [];
    } catch (parseErr) {
      console.error("[plan/generate] parse error:", parseErr, "raw:", rawText.slice(0, 1000));
      return NextResponse.json({ error: "Failed to parse plan from AI response", raw: rawText.slice(0, 500) }, { status: 500 });
    }

    // Priority ordering for DB insert
    const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

    const rows = planItems.map((item) => ({
      scan_id,
      dimension: item.layer,       // store layer key as dimension
      title: item.title,
      description: item.description,
      priority: item.priority,
      effort: item.effort,
      funnel_stage: item.funnel_stage,
      current_score: item.current_score,
      target_score: item.target_score,
      action_items: item.action_steps,  // store as text, not array
      verification_type: item.verification_type,
      verification_page_url: item.verification_page_url ?? null,
      why_it_matters: item.why_it_matters ?? null,
      current_state: item.current_state ?? null,
      desired_state: item.desired_state ?? null,
      impact: item.impact ?? null,
      status: "not_started",
      priority_order: PRIORITY_ORDER[item.priority as string] ?? 3,
    }));

    const { data: insertedItems, error: insertError } = await admin
      .from("plan_items")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("plan_items insert error:", insertError);
      return NextResponse.json({ error: "Failed to save plan items" }, { status: 500 });
    }

    // Update scan with aeo_readiness scores and website_analysis
    const aeoReadiness: Record<string, number> = {};
    for (const item of planItems) {
      if (item.layer && typeof item.current_score === "number") {
        aeoReadiness[item.layer as string] = item.current_score as number;
      }
    }

    await admin
      .from("scans")
      .update({
        aeo_readiness: aeoReadiness,
        website_analysis: websiteAnalysis,
      })
      .eq("id", scan_id);

    return NextResponse.json({ plan_items: insertedItems, cached: false });
  } catch (err) {
    console.error("plan/generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
