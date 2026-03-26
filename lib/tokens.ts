import { createClient } from "@supabase/supabase-js";

type TxType = "signup_bonus" | "purchase" | "report_spend" | "refund" | "subscription_credit" | "bonus";

const SIGNUP_BONUS = 1000;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Ensure a user_tokens row exists, returns current balance
async function getOrCreateTokenRow(userId: string): Promise<number> {
  const supabase = getAdmin();

  const { data, error } = await supabase
    .from("user_tokens")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data) return data.balance;

  // Row doesn't exist — insert with 0 (bonus granted separately)
  await supabase.from("user_tokens").insert({ user_id: userId, balance: 0 });
  return 0;
}

export async function getBalance(userId: string): Promise<number> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("user_tokens")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.balance ?? 0;
}

export async function deductTokens(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): Promise<{ success: boolean; balance: number; error?: string }> {
  const supabase = getAdmin();

  const current = await getOrCreateTokenRow(userId);

  if (current < amount) {
    return { success: false, balance: current, error: `Insufficient tokens. Need ${amount}, have ${current}.` };
  }

  const newBalance = current - amount;

  const { error } = await supabase
    .from("user_tokens")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) return { success: false, balance: current, error: "Balance update failed." };

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

  const current = await getOrCreateTokenRow(userId);
  const newBalance = current + amount;

  await supabase
    .from("user_tokens")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

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

  // Check whether the bonus has already been granted for this user
  const { data: existing } = await supabase
    .from("token_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "signup_bonus")
    .maybeSingle();

  if (existing) return; // already granted — nothing to do

  // Not yet granted — credit the tokens
  const { data: existing_row } = await supabase
    .from("user_tokens")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  const newBalance = (existing_row?.balance ?? 0) + SIGNUP_BONUS;

  await supabase
    .from("user_tokens")
    .upsert(
      { user_id: userId, balance: newBalance, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  await supabase.from("token_transactions").insert({
    user_id: userId,
    amount: SIGNUP_BONUS,
    balance_after: newBalance,
    type: "signup_bonus",
    description: "Welcome! 1,000 free tokens to get started",
  });
}
