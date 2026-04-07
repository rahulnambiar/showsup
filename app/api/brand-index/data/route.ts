import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rahul@showsup.co";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// GET /api/brand-index/data
// ?month=YYYY-MM        — fetch one month (default: current)
// ?all_months=1         — fetch all available months (returns array of month strings)
// ?history=brand_url    — fetch all months for one brand

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const admin = getAdmin();

  // ── All available months ───────────────────────────────────────────────────

  if (searchParams.get("all_months") === "1") {
    const { data } = await admin
      .from("brand_index")
      .select("month")
      .order("month", { ascending: false });

    const months = Array.from(new Set((data ?? []).map((r: { month: string }) => r.month)));
    return NextResponse.json({ months });
  }

  // ── Historical data for one brand ─────────────────────────────────────────

  const historyUrl = searchParams.get("history");
  if (historyUrl) {
    const { data, error } = await admin
      .from("brand_index")
      .select("month, composite_score, llm_probing_score, structured_data_score, training_data_score, citation_sources_score, search_correlation_score, crawler_readiness_score, stock_price_close, stock_price_change_pct")
      .eq("brand_url", historyUrl)
      .order("month", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ history: data ?? [] });
  }

  // ── Single-month leaderboard ───────────────────────────────────────────────

  const month = searchParams.get("month") ?? (() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  const { data, error } = await admin
    .from("brand_index")
    .select("brand_name, brand_url, category, month, composite_score, llm_probing_score, structured_data_score, training_data_score, citation_sources_score, search_correlation_score, crawler_readiness_score, chatgpt_score, claude_score, gemini_score, mention_rate, avg_position, recommendation_rate, sentiment, score_delta, stock_ticker, stock_price_close, stock_price_change_pct, market_cap_billions, website_snapshot, changes_detected, signal_details")
    .eq("month", month)
    .order("composite_score", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Changes feed (last 3 months, all brands) ───────────────────────────────

  const threeMonthsAgo = (() => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 4, 1)); // 3 months prior
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  const { data: changesData } = await admin
    .from("brand_index")
    .select("brand_name, category, month, composite_score, score_delta, changes_detected")
    .gte("month", threeMonthsAgo)
    .lte("month", month)
    .order("month", { ascending: false });

  return NextResponse.json({ rows: data ?? [], changes_feed: changesData ?? [], month });
}
