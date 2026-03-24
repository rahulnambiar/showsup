/**
 * Google Search Console client.
 * Uses a stored refresh_token to pull 90-day performance data.
 */

import { google } from "googleapis";
import type { GscData, GscQuery, GscPage } from "./types";

function makeOAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );
}

/** Returns the Google OAuth authorization URL for GSC. */
export function getGscAuthUrl(state: string): string {
  const oauth2 = makeOAuth2();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/webmasters.readonly"],
    prompt: "consent",
    state,
  });
}

/** Exchanges an auth code for tokens; returns { access_token, refresh_token }. */
export async function exchangeGscCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
  const oauth2 = makeOAuth2();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) throw new Error("No refresh token returned — ensure prompt=consent.");
  return { accessToken: tokens.access_token!, refreshToken: tokens.refresh_token };
}

/** Revoke a refresh token (used on disconnect). */
export async function revokeGscToken(refreshToken: string): Promise<void> {
  const oauth2 = makeOAuth2();
  oauth2.setCredentials({ refresh_token: refreshToken });
  await oauth2.revokeToken(refreshToken);
}

function isAiQuery(query: string): boolean {
  const words = query.trim().split(/\s+/);
  if (words.length > 6) return true;
  const lower = query.toLowerCase();
  const patterns = [
    /\bwhat is\b/, /\bhow (does|do|to)\b/, /\bwhy (is|does|do)\b/,
    /\bbest\b.*\bfor\b/, /\bvs\b/, /\bversus\b/,
    /\balternative to\b/, /\bcompare\b/, /\breview\b.*\b2[0-9]{3}\b/,
    /\bshould i\b/, /\bwhich is\b/,
  ];
  return patterns.some((p) => p.test(lower));
}

function isBranded(query: string, brand: string): boolean {
  return query.toLowerCase().includes(brand.toLowerCase());
}

/** Fetch 90-day GSC data for a given site URL, filtered around a brand name. */
export async function fetchGscData(refreshToken: string, siteUrl: string, brand: string): Promise<GscData> {
  const oauth2 = makeOAuth2();
  oauth2.setCredentials({ refresh_token: refreshToken });

  const webmasters = google.webmasters({ version: "v3", auth: oauth2 });

  const endDate   = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 90);

  const fmt = (d: Date) => d.toISOString().split("T")[0]!;

  // Pull top 1000 queries
  const queryRes = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: fmt(startDate),
      endDate:   fmt(endDate),
      dimensions: ["query"],
      rowLimit: 1000,
    },
  });

  // Pull top 200 pages
  const pageRes = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: fmt(startDate),
      endDate:   fmt(endDate),
      dimensions: ["page"],
      rowLimit: 200,
    },
  });

  const allQueries: GscQuery[] = (queryRes.data.rows ?? []).map((r) => ({
    query:       r.keys?.[0] ?? "",
    impressions: r.impressions ?? 0,
    clicks:      r.clicks ?? 0,
    position:    Math.round((r.position ?? 0) * 10) / 10,
    ctr:         Math.round((r.ctr ?? 0) * 1000) / 10,
  }));

  const brandedQueries    = allQueries.filter((q) => isBranded(q.query, brand));
  const nonBrandedQueries = allQueries.filter((q) => !isBranded(q.query, brand));
  const aiQueries         = allQueries.filter((q) => isAiQuery(q.query) && !isBranded(q.query, brand));

  const sumImpressions = (qs: GscQuery[]) => qs.reduce((s, q) => s + q.impressions, 0);
  const sumClicks      = (qs: GscQuery[]) => qs.reduce((s, q) => s + q.clicks, 0);

  const topPages: GscPage[] = (pageRes.data.rows ?? []).slice(0, 50).map((r) => ({
    page:        r.keys?.[0] ?? "",
    impressions: r.impressions ?? 0,
    clicks:      r.clicks ?? 0,
    position:    Math.round((r.position ?? 0) * 10) / 10,
  }));

  return {
    site_url:   siteUrl,
    synced_at:  new Date().toISOString(),
    branded: {
      impressions: sumImpressions(brandedQueries),
      clicks:      sumClicks(brandedQueries),
      top_queries: brandedQueries.slice(0, 20),
    },
    non_branded: {
      impressions: sumImpressions(nonBrandedQueries),
      clicks:      sumClicks(nonBrandedQueries),
      top_queries: nonBrandedQueries.slice(0, 20),
    },
    ai_queries: aiQueries.sort((a, b) => b.impressions - a.impressions).slice(0, 30),
    top_pages:  topPages,
  };
}
