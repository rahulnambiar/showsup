import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBalance } from "@/lib/tokens";
import { isSelfHost } from "@/lib/mode";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Self-host: unlimited tokens — skip the DB entirely
  if (isSelfHost) {
    return NextResponse.json({ balance: null, selfHost: true });
  }

  const balance = await getBalance(user.id);
  return NextResponse.json({ balance, selfHost: false });
}
