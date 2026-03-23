/**
 * ShowsUp fix generator — creates AEO fix files for a brand.
 * Used by API routes and CLI.
 */

import type { FixInput, FixOutput, GeneratedFix, FixType } from "./types";
import { ALL_FIX_TYPES } from "./types";

async function callAI(prompt: string, maxTokens = 1000): Promise<string> {
  // Try Anthropic first, fall back to OpenAI
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json() as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? "";
  }
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: maxTokens }),
    });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  }
  throw new Error("No LLM provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
}

// ── Individual fix generators ─────────────────────────────────────────────────

async function generateLlmsTxt(input: FixInput): Promise<GeneratedFix[]> {
  const { brand, category, url, niche, competitors = [] } = input;
  const prompt = `Generate a llms.txt file for ${brand} (${niche || category}) at ${url}.

llms.txt is a plain text file at the root of a website that helps AI models understand what the site is about.

Include these sections:
# ${brand}
> One-sentence description

## About
2-3 sentences about what ${brand} does, who it's for, and why it's different.

## Key Pages
- [Home](${url}): ...
- [Product/Service name](${url}/...): ...
(list 5-8 key pages with descriptions)

## What we do
Bullet list of core offerings (5-8 items)

## Who we serve
Bullet list of target audiences

## Key differentiators
Bullet list of 3-5 unique selling points vs ${competitors.slice(0, 3).join(", ") || "competitors"}

## Common Questions
Q: [question]
A: [answer]
(include 5 common questions AI assistants ask about ${brand})

Keep it concise, factual, and AI-friendly. No marketing fluff. Return only the file content, no explanation.`;

  const content = await callAI(prompt, 1200);
  return [{
    filename:    "llms.txt",
    content,
    description: "AI-readable brand overview file",
    sizeBytes:   Buffer.byteLength(content, "utf8"),
  }];
}

async function generateSchema(input: FixInput): Promise<GeneratedFix[]> {
  const { brand, category, url } = input;

  const orgPrompt = `Generate a valid JSON-LD schema.org Organization markup for ${brand} at ${url} (${category}).
Include: @context, @type, name, url, description (1-2 sentences), foundingDate (approximate year or omit), sameAs (array of common social/review URLs for a ${category} company).
Return only the JSON, no explanation or markdown fences.`;

  const faqPrompt = `Generate a valid JSON-LD schema.org FAQPage markup for ${brand} in the ${category} space.
Include exactly 5 questions that AI assistants commonly ask about ${category} companies.
Make the questions specific enough that ${brand} should appear in answers.
Return only the JSON, no explanation or markdown fences.`;

  const [orgContent, faqContent] = await Promise.all([
    callAI(orgPrompt, 600),
    callAI(faqPrompt, 800),
  ]);

  // Clean any markdown fences
  const cleanOrg = orgContent.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const cleanFaq = faqContent.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();

  return [
    {
      filename:    "schema-organization.json",
      content:     cleanOrg,
      description: "JSON-LD Organization schema",
      sizeBytes:   Buffer.byteLength(cleanOrg, "utf8"),
    },
    {
      filename:    "schema-faq.json",
      content:     cleanFaq,
      description: "JSON-LD FAQPage schema (5 questions)",
      sizeBytes:   Buffer.byteLength(cleanFaq, "utf8"),
    },
  ];
}

async function generateContentBriefs(input: FixInput): Promise<GeneratedFix[]> {
  const { brand, category, niche, category_scores = {}, competitors = [] } = input;
  const space = niche || category;

  // Identify the 3 weakest categories → generate briefs targeting those
  const sorted = Object.entries(category_scores).sort(([, a], [, b]) => a - b);
  const targets = sorted.slice(0, 3).map(([cat]) => cat);
  if (targets.length === 0) targets.push("discovery", "purchase_intent", "competitive");

  const queryMap: Record<string, string> = {
    discovery:      `best ${space} tools in 2026`,
    purchase_intent: `why choose ${brand} for ${space}`,
    competitive:    `${brand} vs competitors in ${space}`,
    awareness:      `what is ${brand} and what does it do`,
    reputation:     `${brand} reviews and customer success stories`,
    alternatives:   `alternatives to ${brand} for ${space}`,
  };

  const briefs: GeneratedFix[] = [];

  await Promise.all(
    targets.slice(0, 3).map(async (cat, i) => {
      const targetQuery = queryMap[cat] ?? `${brand} ${space} guide`;
      const comp        = competitors[i] ?? "leading alternatives";

      const prompt = `Create a detailed content brief for a blog post targeting this AI search query:
"${targetQuery}"

Brand: ${brand} (${space})
Target competitor to outrank: ${comp}

Include:
## Target Query
The exact query and variations

## Why This Matters for AI Visibility
How ranking for this query improves ${brand}'s ShowsUp score

## Recommended Title
3 title options (H1)

## Target Audience
Who is searching for this and why

## Article Structure
Detailed H2/H3 outline (8-12 sections)

## Key Points to Cover
Bullet list of must-include information

## Competitive Angle
How to position ${brand} favorably vs ${comp}

## Internal Links
5 suggested internal links to create/use

## Success Metrics
How to measure if this content improves AI visibility

Keep it practical and actionable. Return the brief as Markdown.`;

      const content = await callAI(prompt, 1000);
      briefs.push({
        filename:    `content-brief-${i + 1}.md`,
        content,
        description: `Content brief: "${targetQuery}"`,
        sizeBytes:   Buffer.byteLength(content, "utf8"),
      });
    })
  );

  return briefs.sort((a, b) => a.filename.localeCompare(b.filename));
}

async function generateComparisonPages(input: FixInput): Promise<GeneratedFix[]> {
  const { brand, category, niche, competitors = [] } = input;
  const space     = niche || category;
  const topComps  = competitors.slice(0, 3);
  if (topComps.length === 0) return [];

  const pages: GeneratedFix[] = [];

  await Promise.all(
    topComps.map(async (comp) => {
      const prompt = `Create a detailed comparison page brief for "${brand} vs ${comp}" in the ${space} space.

Include:
## Page Title
SEO-optimized title options

## Introduction
3-sentence intro that AI models would quote

## Quick Comparison Table
Markdown table with 8-10 comparison criteria (pricing, features, ease of use, support, integrations, etc.)

## When to Choose ${brand}
5 specific scenarios where ${brand} is the better choice

## When to Choose ${comp}
3 honest scenarios where ${comp} might be preferred (builds trust)

## Detailed Feature Comparison
H3 sections for 5 key feature categories

## Pricing Comparison
How to frame the pricing discussion favorably

## Customer Reviews Summary
Structure for featuring review quotes

## Bottom Line
Recommended 2-3 sentence verdict that AI models would quote

## Schema Markup Note
Suggest using FAQPage schema for 3 comparison questions

Return as Markdown.`;

      const content = await callAI(prompt, 1000);
      const slug    = comp.toLowerCase().replace(/[^a-z0-9]/g, "-");
      pages.push({
        filename:    `comparison-vs-${slug}.md`,
        content,
        description: `Comparison page: ${brand} vs ${comp}`,
        sizeBytes:   Buffer.byteLength(content, "utf8"),
      });
    })
  );

  return pages.sort((a, b) => a.filename.localeCompare(b.filename));
}

async function generateCitationPlaybook(input: FixInput): Promise<GeneratedFix[]> {
  const { brand, category, url } = input;

  const prompt = `Create a comprehensive citation building playbook for ${brand} (${category}) at ${url}.

AI models rank brands higher when they appear in high-authority sources. This playbook helps build those citations.

Include:
## Why Citations Matter for AI Visibility
2-3 sentences on the mechanism

## Priority Tier 1: High-Impact Citations (do this week)
5 specific directories/sites with instructions for each

## Priority Tier 2: Industry Citations (this month)
5 industry-specific publications, review sites, databases

## Priority Tier 3: Long-tail Citations (this quarter)
5 additional sources for sustained coverage

## PR & Media Strategy
How to get featured in publications that AI models cite frequently

## Review Generation Strategy
Specific platforms to target, email templates outline, review velocity targets

## Content Syndication
Where to syndicate ${brand}'s content for maximum AI indexing

## Tracking Progress
How to measure citation building success via ShowsUp rescans

## 30-Day Action Plan
Week-by-week checklist

Return as Markdown.`;

  const content = await callAI(prompt, 1200);
  return [{
    filename:    "citation-playbook.md",
    content,
    description: "Citation building strategy and action plan",
    sizeBytes:   Buffer.byteLength(content, "utf8"),
  }];
}

async function generateCrawlabilityAudit(input: FixInput): Promise<GeneratedFix[]> {
  const { brand, category, url, niche } = input;
  const space = niche || category;

  const prompt = `Perform a crawlability audit for ${brand} at ${url} in the ${space} industry.

Focus on what AI models (ChatGPT, Claude, Gemini) need to understand and recommend a brand.

Include:
## AI Crawlability Score
Estimated current score 0-100 with explanation

## Critical Issues (fix immediately)
5 issues that are blocking AI comprehension

## Technical Recommendations
### robots.txt
What to include/exclude for AI crawlers (GPTBot, ClaudeBot, Google-Extended)

### sitemap.xml
Priority pages for AI indexing

### Page structure
Content hierarchy recommendations

### Meta tags
Key meta descriptions to optimize for AI citations

## Content Gaps
5 pages that likely don't exist but AI models commonly reference for ${space} companies:
(For each: page title, URL slug, key content, why AI models want it)

## Structured Data Checklist
Schema types to implement for ${space} businesses

## AI-Friendly Content Guidelines
5 writing principles that help AI models cite ${brand} accurately

## Quick Wins
3 changes that can be implemented in under 1 hour

Return as Markdown.`;

  const content = await callAI(prompt, 1200);
  return [{
    filename:    "crawlability-audit.md",
    content,
    description: "AI crawlability audit and technical recommendations",
    sizeBytes:   Buffer.byteLength(content, "utf8"),
  }];
}

async function generateBrandNarrative(input: FixInput): Promise<GeneratedFix[]> {
  const { brand, category, niche, competitors = [] } = input;
  const space = niche || category;

  const prompt = `Create an AI-optimized brand narrative for ${brand} in the ${space} space.

AI models learn brand positioning from how a brand is consistently described across the web. This narrative ensures consistent, AI-friendly positioning.

Include:
## Core Brand Statement
One sentence that AI models should use when describing ${brand}. (Under 20 words, factual, differentiated)

## Extended Description
3-sentence description for About pages, press kits, directory listings

## Key Differentiators
5 specific, factual differentiators vs ${competitors.slice(0, 2).join(" and ") || "competitors"}.
For each: the claim, evidence/proof point, how to phrase it for AI consumption

## Brand Voice for AI-Friendly Content
Tone guidelines, vocabulary to use/avoid

## Template Language Bank
Ready-to-use phrases for:
- FAQ answers
- Feature descriptions
- Customer testimonials (structure)
- Press release boilerplate

## Messaging by Audience Segment
3 segments × 2-sentence tailored message

## Keyword Integration Guide
10 phrases to naturally include in all content for AI association

## Consistency Checklist
10 places to audit for consistent brand messaging

Return as Markdown.`;

  const content = await callAI(prompt, 1200);
  return [{
    filename:    "brand-narrative.md",
    content,
    description: "AI-optimized brand narrative and messaging guide",
    sizeBytes:   Buffer.byteLength(content, "utf8"),
  }];
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateFixes(input: FixInput): Promise<FixOutput> {
  const types: FixType[] = input.types ?? ALL_FIX_TYPES;

  const generators: Record<FixType, (i: FixInput) => Promise<GeneratedFix[]>> = {
    "llms-txt":          generateLlmsTxt,
    "schema":            generateSchema,
    "content-briefs":    generateContentBriefs,
    "comparison-pages":  generateComparisonPages,
    "citation-playbook": generateCitationPlaybook,
    "crawlability-audit": generateCrawlabilityAudit,
    "brand-narrative":   generateBrandNarrative,
  };

  const results = await Promise.all(
    types.map((type) => generators[type]?.(input) ?? Promise.resolve([]))
  );

  const fixes = results.flat();
  const totalKb = Math.round(fixes.reduce((s, f) => s + f.sizeBytes, 0) / 1024);

  return {
    fixes,
    brand: input.brand,
    estimated_impact: `+${10 + Math.min(types.length * 2, 20)}-${20 + Math.min(types.length * 3, 30)} pts on your ShowsUp Score`,
  };
}
