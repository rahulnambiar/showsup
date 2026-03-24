/**
 * Shared authentication helper for v1 API endpoints.
 * Validates Bearer / X-Api-Token against the profiles table.
 */

import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export interface ApiUser {
  userId: string;
  apiToken: string;
}

/** Returns the authenticated user or null. */
export async function authenticateApiToken(request: Request): Promise<ApiUser | null> {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-api-token");

  if (!token) return null;

  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("api_token", token)
    .maybeSingle();

  if (!profile?.id) return null;
  return { userId: profile.id as string, apiToken: token };
}

export { getAdmin };

/** Flat token costs for the v1 public API. */
export const API_TOKEN_COSTS: Record<string, number> = {
  "scan.quick_check": 40,
  "scan.standard":    140,
  "scan.deep":        335,
  "generate-fixes":   80,
};

/** Check and deduct tokens, returns false if insufficient balance. */
export async function chargeTokens(
  userId: string,
  action: string,
  description: string,
  scanId?: string,
): Promise<{ ok: boolean; balance?: number; required?: number }> {
  const cost = API_TOKEN_COSTS[action];
  if (!cost) return { ok: true }; // free action

  const admin = getAdmin();
  const { data: tok } = await admin
    .from("user_tokens")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  const balance = (tok?.balance as number) ?? 0;
  if (balance < cost) return { ok: false, balance, required: cost };

  await admin.from("user_tokens").update({ balance: balance - cost }).eq("user_id", userId);
  await admin.from("token_transactions").insert({
    user_id:    userId,
    amount:     -cost,
    type:       "deduction",
    description,
    scan_id:    scanId ?? null,
  });

  return { ok: true };
}
