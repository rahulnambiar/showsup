// LLM API pricing — UPDATE THIS when providers change prices
// Last updated: March 2026

export const LLM_PRICING: Record<string, Record<string, {
  input_per_1m: number;    // USD per 1M input tokens
  output_per_1m: number;   // USD per 1M output tokens
  avg_input_tokens: number;
  avg_output_tokens: number;
  tier: 'free' | 'paid';
  label: string;
}>> = {
  openai: {
    'gpt-4o-mini': {
      input_per_1m: 0.15,
      output_per_1m: 0.60,
      avg_input_tokens: 150,
      avg_output_tokens: 500,
      tier: 'free',
      label: 'ChatGPT (GPT-4o-mini)',
    },
    'gpt-4o': {
      input_per_1m: 2.50,
      output_per_1m: 10.00,
      avg_input_tokens: 150,
      avg_output_tokens: 500,
      tier: 'paid',
      label: 'ChatGPT (GPT-4o)',
    },
  },
  anthropic: {
    'claude-3-haiku': {
      input_per_1m: 0.25,
      output_per_1m: 1.25,
      avg_input_tokens: 150,
      avg_output_tokens: 500,
      tier: 'free',
      label: 'Claude (Haiku)',
    },
    'claude-sonnet': {
      input_per_1m: 3.00,
      output_per_1m: 15.00,
      avg_input_tokens: 150,
      avg_output_tokens: 500,
      tier: 'paid',
      label: 'Claude (Sonnet)',
    },
  },
  google: {
    'gemini-2.5-flash': {
      input_per_1m: 0.15,
      output_per_1m: 0.60,
      avg_input_tokens: 150,
      avg_output_tokens: 500,
      tier: 'free',
      label: 'Gemini 2.5 Flash',
    },
  },
};

// Costs for internal analysis calls (not user-selectable)
export const ANALYSIS_PRICING = {
  response_analysis: {
    model: 'claude-3-haiku',
    input_per_1m: 0.25,
    output_per_1m: 1.25,
    avg_input_tokens: 800,   // query + full response as context
    avg_output_tokens: 200,  // structured JSON output
  },
  recommendations: {
    model: 'claude-sonnet',
    input_per_1m: 3.00,
    output_per_1m: 15.00,
    avg_input_tokens: 3000,  // full audit data
    avg_output_tokens: 1500, // detailed recommendations
  },
  brand_detection: {
    model: 'claude-3-haiku',
    input_per_1m: 0.25,
    output_per_1m: 1.25,
    avg_input_tokens: 500,
    avg_output_tokens: 300,
  },
  volume_estimation: {
    model: 'claude-3-haiku',
    input_per_1m: 0.25,
    output_per_1m: 1.25,
    avg_input_tokens: 1000,
    avg_output_tokens: 500,
  },
  competitive_insights: {
    model: 'claude-3-haiku',
    input_per_1m: 0.25,
    output_per_1m: 1.25,
    avg_input_tokens: 1500,
    avg_output_tokens: 500,
  },
};

export const PRICING_CONFIG = {
  TOKEN_MULTIPLIER: 1500,    // converts $1 USD API cost → 1500 tokens
  MARGIN_BUFFER: 1.2,        // 20% buffer for retries, errors, overhead
  MIN_TOKENS: 5,             // minimum charge for any single action
  ROUND_TO: 5,               // round all token costs to nearest 5
  SIGNUP_BONUS: 1000,        // free tokens on signup
};
