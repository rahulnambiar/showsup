import { createClient } from "@supabase/supabase-js";

type TxType = "signup_bonus" | "purchase" | "report_spend" | "refund" | "subscription_credit" | "bonus";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function getBalance(userId: string): Promise<number> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("token_balance")
    .eq("id", userId)
    .single();
  return data?.token_balance ?? 0;
}

export async function deductTokens(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): Promise<{ success: boolean; balance: number; error?: string }> {
  const supabase = getAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("token_balance")
    .eq("id", userId)
    .single();

  const current = profile?.token_balance ?? 0;
  if (current < amount) {
    return { success: false, balance: current, error: `Insufficient tokens. Need ${amount}, have ${current}.` };
  }

  const newBalance = current - amount;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ token_balance: newBalance })
    .eq("id", userId);

  if (updateError) {
    return { success: false, balance: current, error: "Balance update failed." };
  }

  await supabase.from("token_transactions").insert({
    user_id: userId,
    amount: -amount,
    balance_after: newBalance,
    type: "report_spend",
    description,
    ...(referenceId ? { reference_id: referenceId } : {}),
  });

  return { success: true, balance: newBalance };
}

export async function addTokens(
  userId: string,
  amount: number,
  type: TxType,
  description: string
): Promise<{ success: boolean; balance: number }> {
  const supabase = getAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("token_balance")
    .eq("id", userId)
    .single();

  const current = profile?.token_balance ?? 0;
  const newBalance = current + amount;

  await supabase
    .from("profiles")
    .update({ token_balance: newBalance })
    .eq("id", userId);

  await supabase.from("token_transactions").insert({
    user_id: userId,
    amount,
    balance_after: newBalance,
    type,
    description,
  });

  return { success: true, balance: newBalance };
}

export async function getTransactionHistory(userId: string, limit = 20) {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("token_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function ensureSignupBonus(userId: string): Promise<void> {
  const supabase = getAdmin();

  // Upsert profile — creates with default 50 tokens if missing
  await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  // Only log once
  const { data: existing } = await supabase
    .from("token_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "signup_bonus")
    .maybeSingle();

  if (existing) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("token_balance")
    .eq("id", userId)
    .single();

  const balance = profile?.token_balance ?? 50;

  await supabase.from("token_transactions").insert({
    user_id: userId,
    amount: 50,
    balance_after: balance,
    type: "signup_bonus",
    description: "Welcome! 50 free tokens to get started",
  });
}
