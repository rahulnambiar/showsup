-- ShowsUp database schema
-- Run via: npm run db:setup
-- Or paste into: Supabase dashboard → SQL Editor

-- ── Extensions ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Scans ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name        TEXT NOT NULL,
  website           TEXT,
  category          TEXT,
  status            TEXT DEFAULT 'completed',
  overall_score     INTEGER,
  category_scores   JSONB,
  competitors_data  JSONB,
  perception_data   JSONB,
  citation_data     JSONB,
  improvement_plan  JSONB,
  benchmark_data    JSONB,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scans_user_id_idx ON scans(user_id);
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans(created_at DESC);

-- ── Scan results (per-model, per-query rows) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id          UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  model            TEXT NOT NULL,
  prompt           TEXT,
  response         TEXT,
  brand_mentioned  BOOLEAN DEFAULT false,
  mention_count    INTEGER DEFAULT 0,
  score            INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scan_results_scan_id_idx ON scan_results(scan_id);

-- ── Brands ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  domain      TEXT,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brands_user_id_idx ON brands(user_id);

-- ── Audits ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audits_brand_id_idx ON audits(brand_id);
CREATE INDEX IF NOT EXISTS audits_user_id_idx ON audits(user_id);

-- ── Audit queries (one row per unique query per audit) ────────────────────────

CREATE TABLE IF NOT EXISTS audit_queries (
  id           UUID PRIMARY KEY,  -- stable UUID from scan route
  audit_id     UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  query_text   TEXT NOT NULL,
  query_type   TEXT CHECK (query_type IN ('recommendation', 'comparison', 'review')),
  is_commerce  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_queries_audit_id_idx ON audit_queries(audit_id);

-- ── Audit results (one row per model × query) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id              UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  audit_query_id        UUID NOT NULL REFERENCES audit_queries(id) ON DELETE CASCADE,
  provider              TEXT NOT NULL,
  model                 TEXT NOT NULL,
  model_tier            TEXT DEFAULT 'free' CHECK (model_tier IN ('free', 'paid')),
  response_text         TEXT,
  brand_mentioned       BOOLEAN DEFAULT false,
  mention_position      INTEGER,
  sentiment             TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_recommended        BOOLEAN DEFAULT false,
  competitors_mentioned TEXT[],
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_results_audit_id_idx ON audit_results(audit_id);
CREATE INDEX IF NOT EXISTS audit_results_query_id_idx ON audit_results(audit_query_id);

-- ── Token system (cloud mode only — ignored in self-host mode) ────────────────

CREATE TABLE IF NOT EXISTS user_tokens (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance     INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type          TEXT NOT NULL CHECK (type IN (
    'signup_bonus', 'purchase', 'report_spend',
    'refund', 'subscription_credit', 'bonus'
  )),
  description   TEXT,
  reference_id  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS token_transactions_user_id_idx ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS token_transactions_created_at_idx ON token_transactions(created_at DESC);

-- ── Profiles (API tokens for CLI cloud mode) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_token   TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- ── Waitlist ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE scans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_queries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist           ENABLE ROW LEVEL SECURITY;

-- scans: users see only their own
CREATE POLICY IF NOT EXISTS "scans_own" ON scans
  FOR ALL USING (auth.uid() = user_id);

-- scan_results: via scan ownership
CREATE POLICY IF NOT EXISTS "scan_results_own" ON scan_results
  FOR ALL USING (
    scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid())
  );

-- brands: users see only their own
CREATE POLICY IF NOT EXISTS "brands_own" ON brands
  FOR ALL USING (auth.uid() = user_id);

-- audits: users see only their own
CREATE POLICY IF NOT EXISTS "audits_own" ON audits
  FOR ALL USING (auth.uid() = user_id);

-- audit_queries: via audit ownership
CREATE POLICY IF NOT EXISTS "audit_queries_own" ON audit_queries
  FOR ALL USING (
    audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid())
  );

-- audit_results: via audit ownership
CREATE POLICY IF NOT EXISTS "audit_results_own" ON audit_results
  FOR ALL USING (
    audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid())
  );

-- user_tokens: own row only
CREATE POLICY IF NOT EXISTS "user_tokens_own" ON user_tokens
  FOR ALL USING (auth.uid() = user_id);

-- token_transactions: own rows only
CREATE POLICY IF NOT EXISTS "token_transactions_own" ON token_transactions
  FOR ALL USING (auth.uid() = user_id);

-- waitlist: insert only (anyone can join), no read
CREATE POLICY IF NOT EXISTS "waitlist_insert" ON waitlist
  FOR INSERT WITH CHECK (true);


-- ── Geography columns (added for regional scanning feature) ──────────────────
ALTER TABLE scans ADD COLUMN IF NOT EXISTS regions text[] DEFAULT '{"global"}';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS regional_scores jsonb DEFAULT '{}';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS regional_insights jsonb DEFAULT '[]';

-- ── GSC integration (added for Google Search Console feature) ────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gsc_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gsc_connected_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gsc_site_url text;

-- ── Data Sources & Correlation ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.data_sources (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type    text NOT NULL,
  source_name    text NOT NULL,
  config         jsonb DEFAULT '{}',
  last_synced_at timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_points (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_id     uuid REFERENCES public.data_sources(id) ON DELETE CASCADE,
  metric_name   text NOT NULL,
  metric_value  numeric NOT NULL,
  date          date NOT NULL,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_points_user_date ON public.data_points(user_id, date);
CREATE INDEX IF NOT EXISTS idx_data_points_source ON public.data_points(source_id);

ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_points  ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "data_sources_own" ON public.data_sources
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "data_points_own" ON public.data_points
  FOR ALL USING (auth.uid() = user_id);
