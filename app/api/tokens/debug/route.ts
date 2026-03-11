import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const [tokensRes, txRes] = await Promise.all([
    admin.from("user_tokens").select("*").eq("user_id", user.id).maybeSingle(),
    admin.from("token_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    token_row: tokensRes.data,
    token_error: tokensRes.error?.message ?? null,
    transactions: txRes.data,
    tx_error: txRes.error?.message ?? null,
  });
}
