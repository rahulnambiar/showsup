/**
 * Stock price fetcher using Yahoo Finance public API (no key needed).
 * Fetches monthly close price, % change, and market cap for a given ticker.
 */

import { createClient } from "@supabase/supabase-js";

export interface StockData {
  ticker: string;
  close_price: number | null;
  change_pct: number | null;
  market_cap_billions: number | null;
}

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        marketCap?: number;
        currency?: string;
      };
      indicators?: {
        quote?: Array<{
          close?: (number | null)[];
        }>;
      };
      timestamp?: number[];
    }>;
    error?: { code?: string; description?: string };
  };
}

export async function fetchStockData(ticker: string): Promise<StockData> {
  const empty: StockData = { ticker, close_price: null, change_pct: null, market_cap_billions: null };

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1mo&interval=1d`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ShowsUp-BrandIndex/1.0)",
          Accept: "application/json",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return empty;

    const data = await res.json() as YahooChartResponse;
    const result = data?.chart?.result?.[0];
    if (!result) return empty;

    const meta = result.meta ?? {};
    const closes = result.indicators?.quote?.[0]?.close ?? [];

    // Find the last non-null close
    const validCloses = closes.filter((c): c is number => c !== null && c !== undefined);
    const close_price = validCloses.length > 0 ? validCloses[validCloses.length - 1] : (meta.regularMarketPrice ?? null);

    // Monthly % change: compare last close to first valid close (or previousClose)
    const firstClose = validCloses.length > 1 ? validCloses[0] : (meta.previousClose ?? null);
    let change_pct: number | null = null;
    if (close_price !== null && firstClose !== null && firstClose !== 0) {
      change_pct = Math.round(((close_price - firstClose) / firstClose) * 10000) / 100;
    }

    // Market cap in billions
    const market_cap_billions = meta.marketCap
      ? Math.round((meta.marketCap / 1e9) * 10) / 10
      : null;

    return { ticker, close_price: close_price ?? null, change_pct, market_cap_billions };
  } catch {
    return empty;
  }
}

export async function upsertStockPrice(data: StockData, month: string): Promise<void> {
  if (data.close_price === null) return;

  const admin = getAdmin();
  const { error } = await admin.from("stock_prices").upsert(
    {
      stock_ticker: data.ticker,
      month,
      close_price: data.close_price,
      change_pct: data.change_pct,
      market_cap_billions: data.market_cap_billions,
    },
    { onConflict: "stock_ticker,month" }
  );

  if (error) {
    console.error(`[stock-fetcher] Failed to upsert ${data.ticker} for ${month}:`, error.message);
  }
}
