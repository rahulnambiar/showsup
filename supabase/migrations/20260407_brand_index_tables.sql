-- Brand Index tables
-- Run in Supabase SQL editor or via migration runner.

CREATE TABLE IF NOT EXISTS public.brand_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  brand_url text NOT NULL,
  category text NOT NULL,
  month text NOT NULL,                          -- e.g. "2026-04"
  scan_id uuid,

  -- Composite + signal scores (0-100)
  composite_score integer,
  llm_probing_score integer,
  structured_data_score integer,
  training_data_score integer,
  citation_sources_score integer,
  search_correlation_score integer,
  crawler_readiness_score integer,

  -- Full signal detail payloads
  signal_details jsonb DEFAULT '{}',

  -- Per-model LLM scores
  chatgpt_score integer,
  claude_score integer,
  gemini_score integer,

  -- Category-level scores
  category_scores jsonb DEFAULT '{}',

  -- LLM probing aggregates
  mention_rate numeric,
  avg_position numeric,
  recommendation_rate numeric,
  sentiment text,

  -- Competitive context
  competitors jsonb DEFAULT '[]',
  key_descriptors text[] DEFAULT '{}',

  -- Website snapshot summary (from structured data signal)
  website_snapshot jsonb DEFAULT '{}',

  -- Month-over-month change tracking
  changes_detected jsonb DEFAULT '[]',
  score_delta integer,

  -- Stock correlation
  stock_ticker text,
  stock_price_close numeric,
  stock_price_change_pct numeric,
  market_cap_billions numeric,

  created_at timestamptz DEFAULT now(),

  UNIQUE(brand_url, month)
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.brand_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_url text NOT NULL,
  month text NOT NULL,

  -- Homepage content
  homepage_h1 text,
  meta_description text,

  -- llms.txt
  llms_txt_exists boolean DEFAULT false,
  llms_txt_content text,
  llms_txt_length integer DEFAULT 0,

  -- Schema markup
  schema_types text[] DEFAULT '{}',
  faq_schema_exists boolean DEFAULT false,
  org_schema_exists boolean DEFAULT false,

  -- robots.txt AI crawler rules
  robots_txt_ai_rules jsonb DEFAULT '{}',

  -- Sitemap
  sitemap_exists boolean DEFAULT false,
  sitemap_url_count integer,

  -- Performance + content metrics
  page_load_ms integer,
  word_count integer,
  h2_count integer,

  created_at timestamptz DEFAULT now(),

  UNIQUE(brand_url, month)
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.brand_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL CHECK (insight_type IN ('correlation', 'hypothesis', 'finding', 'anomaly')),
  title text NOT NULL,
  description text NOT NULL,
  data_evidence jsonb NOT NULL DEFAULT '{}',
  category text,
  brands_involved text[] DEFAULT '{}',
  months_analyzed text[] DEFAULT '{}',
  confidence text CHECK (confidence IN ('high', 'medium', 'low')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'published', 'disproved')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_ticker text NOT NULL,
  month text NOT NULL,
  close_price numeric,
  change_pct numeric,
  market_cap_billions numeric,
  created_at timestamptz DEFAULT now(),

  UNIQUE(stock_ticker, month)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes

CREATE INDEX IF NOT EXISTS idx_brand_index_category    ON public.brand_index(category, month);
CREATE INDEX IF NOT EXISTS idx_brand_index_month       ON public.brand_index(month);
CREATE INDEX IF NOT EXISTS idx_brand_index_brand       ON public.brand_index(brand_name);
CREATE INDEX IF NOT EXISTS idx_brand_index_composite   ON public.brand_index(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_brand_snapshots_url     ON public.brand_snapshots(brand_url, month);
CREATE INDEX IF NOT EXISTS idx_stock_prices_ticker     ON public.stock_prices(stock_ticker, month);
