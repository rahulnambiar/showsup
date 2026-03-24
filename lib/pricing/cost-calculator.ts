import { LLM_PRICING, ANALYSIS_PRICING, PRICING_CONFIG } from './llm-costs';

export interface ReportConfig {
  scanDepth: 'quick_check' | 'standard' | 'deep';
  models: string[];        // e.g. ['gpt-4o-mini', 'claude-3-haiku']
  competitorCount: number;
  regionCount?: number;    // 1 = global only (default); >1 = multi-region, +20 tokens per extra region
  modules: {
    persona: boolean;
    commerce: boolean;
    sentiment: boolean;
    citations: boolean;
    improvementPlan: boolean;
    categoryBenchmark: boolean;
  };
}

export interface CostBreakdownItem {
  component: string;
  description: string;
  tokens: number;
  apiCostUSD: number;
}

export interface CostBreakdown {
  totalTokens: number;
  totalApiCostUSD: number;
  breakdown: CostBreakdownItem[];
}

// Calculate cost for N queries on a specific model
function queryBatchCost(modelKey: string, queryCount: number): number {
  for (const provider of Object.values(LLM_PRICING)) {
    if (provider[modelKey]) {
      const p = provider[modelKey];
      const inputCost  = (p.input_per_1m  * p.avg_input_tokens  * queryCount) / 1_000_000;
      const outputCost = (p.output_per_1m * p.avg_output_tokens * queryCount) / 1_000_000;
      return inputCost + outputCost;
    }
  }
  return 0;
}

// Calculate cost for an internal analysis call
function analysisCost(type: keyof typeof ANALYSIS_PRICING, count = 1): number {
  const p = ANALYSIS_PRICING[type];
  const inputCost  = (p.input_per_1m  * p.avg_input_tokens  * count) / 1_000_000;
  const outputCost = (p.output_per_1m * p.avg_output_tokens * count) / 1_000_000;
  return inputCost + outputCost;
}

// Convert USD API cost to tokens
function usdToTokens(usd: number): number {
  const buffered = usd * PRICING_CONFIG.MARGIN_BUFFER;
  const raw = Math.ceil(buffered * PRICING_CONFIG.TOKEN_MULTIPLIER);
  return Math.max(
    PRICING_CONFIG.MIN_TOKENS,
    Math.ceil(raw / PRICING_CONFIG.ROUND_TO) * PRICING_CONFIG.ROUND_TO,
  );
}

export function calculateReportCost(config: ReportConfig): CostBreakdown {
  const breakdown: CostBreakdownItem[] = [];
  let totalApiCost = 0;

  const baseQueries = { quick_check: 8, standard: 20, deep: 50 }[config.scanDepth];

  // 1. Probing cost — queries sent to each selected model
  for (const model of config.models) {
    let label = model;
    for (const provider of Object.values(LLM_PRICING)) {
      if (provider[model]) label = provider[model].label;
    }
    const cost = queryBatchCost(model, baseQueries);
    totalApiCost += cost;
    breakdown.push({ component: 'probing', description: `${baseQueries} queries × ${label}`, tokens: 0, apiCostUSD: cost });
  }

  // 2. Response analysis — Claude Haiku analyzes every response
  const totalResponses = baseQueries * config.models.length;
  const analysisApiCost = analysisCost('response_analysis', totalResponses);
  totalApiCost += analysisApiCost;
  breakdown.push({ component: 'analysis', description: `Analyzing ${totalResponses} AI responses`, tokens: 0, apiCostUSD: analysisApiCost });

  // 3. Brand detection (fixed cost per scan)
  const brandDetectCost = analysisCost('brand_detection');
  totalApiCost += brandDetectCost;
  breakdown.push({ component: 'brand_detection', description: 'Brand & competitor detection', tokens: 0, apiCostUSD: brandDetectCost });

  // 4. Volume estimation (fixed cost per scan)
  const volumeCost = analysisCost('volume_estimation');
  totalApiCost += volumeCost;
  breakdown.push({ component: 'volume', description: 'AI query volume estimation', tokens: 0, apiCostUSD: volumeCost });

  // 5. Competitor insights (if competitors exist)
  if (config.competitorCount > 0) {
    const insightCost = analysisCost('competitive_insights');
    totalApiCost += insightCost;
    breakdown.push({ component: 'competitors', description: `Competitive insights (${config.competitorCount} competitor${config.competitorCount !== 1 ? 's' : ''})`, tokens: 0, apiCostUSD: insightCost });
  }

  // 6. Persona module — 15 extra queries per model
  if (config.modules.persona) {
    for (const model of config.models) {
      let label = model;
      for (const provider of Object.values(LLM_PRICING)) {
        if (provider[model]) label = provider[model].label;
      }
      const cost = queryBatchCost(model, 15);
      totalApiCost += cost;
      breakdown.push({ component: 'persona', description: `Persona analysis (15 queries × ${label})`, tokens: 0, apiCostUSD: cost });
    }
    const personaAnalysis = analysisCost('response_analysis', 15 * config.models.length);
    totalApiCost += personaAnalysis;
  }

  // 7. Commerce module — 15 extra queries per model
  if (config.modules.commerce) {
    for (const model of config.models) {
      let label = model;
      for (const provider of Object.values(LLM_PRICING)) {
        if (provider[model]) label = provider[model].label;
      }
      const cost = queryBatchCost(model, 15);
      totalApiCost += cost;
      breakdown.push({ component: 'commerce', description: `Commerce deep dive (15 queries × ${label})`, tokens: 0, apiCostUSD: cost });
    }
    const commerceAnalysis = analysisCost('response_analysis', 15 * config.models.length);
    totalApiCost += commerceAnalysis;
  }

  // 8. Sentiment deep dive — extra analysis pass on existing responses
  if (config.modules.sentiment) {
    const sentimentCost = analysisApiCost * 0.5;
    totalApiCost += sentimentCost;
    breakdown.push({ component: 'sentiment', description: 'Detailed sentiment analysis', tokens: 0, apiCostUSD: sentimentCost });
  }

  // 9. Citation tracking — light analysis of existing responses
  if (config.modules.citations) {
    const citationCost = analysisApiCost * 0.3;
    totalApiCost += citationCost;
    breakdown.push({ component: 'citations', description: 'Citation page tracking', tokens: 0, apiCostUSD: citationCost });
  }

  // 10. Improvement plan — Claude Sonnet call
  if (config.modules.improvementPlan) {
    const planCost = analysisCost('recommendations');
    totalApiCost += planCost;
    breakdown.push({ component: 'improvement_plan', description: '3-tier AI improvement plan', tokens: 0, apiCostUSD: planCost });
  }

  // 11. Category benchmark
  if (config.modules.categoryBenchmark) {
    const benchCost = analysisCost('brand_detection');
    totalApiCost += benchCost;
    breakdown.push({ component: 'benchmark', description: 'Category benchmarking', tokens: 0, apiCostUSD: benchCost });
  }

  // Convert total API cost to tokens (base cost only)
  const baseTokens = usdToTokens(totalApiCost);

  // Distribute tokens proportionally across breakdown items
  for (const item of breakdown) {
    if (totalApiCost > 0) {
      item.tokens = Math.max(
        PRICING_CONFIG.MIN_TOKENS,
        Math.ceil(Math.ceil((item.apiCostUSD / totalApiCost) * baseTokens / PRICING_CONFIG.ROUND_TO) * PRICING_CONFIG.ROUND_TO),
      );
    } else {
      item.tokens = PRICING_CONFIG.MIN_TOKENS;
    }
  }

  // Adjust rounding so breakdown sums match baseTokens
  const breakdownSum = breakdown.reduce((s, b) => s + b.tokens, 0);
  if (breakdownSum !== baseTokens && breakdown.length > 0) {
    breakdown[0]!.tokens += (baseTokens - breakdownSum);
  }

  // Add flat region surcharge on top (not proportional — fixed cost)
  const extraRegionTokens = config.regionCount && config.regionCount > 1
    ? (config.regionCount - 1) * 20
    : 0;
  if (extraRegionTokens > 0) {
    breakdown.push({
      component: 'regions',
      description: `${config.regionCount! - 1} additional region${config.regionCount! > 2 ? 's' : ''} (+20 🪙 each)`,
      tokens: extraRegionTokens,
      apiCostUSD: 0,
    });
  }

  const totalTokens = baseTokens + extraRegionTokens;
  return { totalTokens, totalApiCostUSD: totalApiCost, breakdown };
}

// Standalone action costs (for in-report unlocks, Query Explorer, PDFs)
export function getActionCost(action: string): number {
  const costs: Record<string, number> = {
    custom_query:            usdToTokens(queryBatchCost('gpt-4o-mini', 1) + analysisCost('response_analysis', 1)),
    unlock_persona:          usdToTokens(queryBatchCost('gpt-4o-mini', 15) * 2 + analysisCost('response_analysis', 30)),
    unlock_commerce:         usdToTokens(queryBatchCost('gpt-4o-mini', 15) * 2 + analysisCost('response_analysis', 30)),
    unlock_sentiment:        usdToTokens(analysisCost('response_analysis', 40) * 0.5),
    unlock_citations:        usdToTokens(analysisCost('response_analysis', 40) * 0.3),
    unlock_improvement_plan: usdToTokens(analysisCost('recommendations')),
    unlock_benchmark:        usdToTokens(analysisCost('brand_detection')),
    pdf_full:       25,  // full report PDF
    pdf_board_ready: 50,  // board-ready PDF with AI exec summary
  };
  return costs[action] ?? PRICING_CONFIG.MIN_TOKENS;
}

// Get model info for UI display
export function getAvailableModels(): {
  key: string;
  label: string;
  tier: 'free' | 'paid';
  provider: string;
  costPer20Queries: number;
}[] {
  const models = [];
  for (const [provider, providerModels] of Object.entries(LLM_PRICING)) {
    for (const [key, info] of Object.entries(providerModels)) {
      models.push({
        key,
        label: info.label,
        tier: info.tier,
        provider,
        costPer20Queries: usdToTokens(queryBatchCost(key, 20)),
      });
    }
  }
  return models;
}

// Helper: compute cost delta when adding a single module
export function getModuleDelta(
  baseConfig: ReportConfig,
  moduleKey: keyof ReportConfig['modules'],
): number {
  const without = calculateReportCost({ ...baseConfig, modules: { ...baseConfig.modules, [moduleKey]: false } }).totalTokens;
  const withIt  = calculateReportCost({ ...baseConfig, modules: { ...baseConfig.modules, [moduleKey]: true  } }).totalTokens;
  return withIt - without;
}
