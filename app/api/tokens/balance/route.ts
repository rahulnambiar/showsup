import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBalance, ensureSignupBonus } from "@/lib/tokens";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure tokens are granted — idempotent, safe to call on every request
  await ensureSignupBonus(user.id);

  const balance = await getBalance(user.id);
  return NextResponse.json({ balance });
}
