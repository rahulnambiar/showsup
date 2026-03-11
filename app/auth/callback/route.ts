import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureSignupBonus } from "@/lib/tokens";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fire-and-forget — don't block redirect on this
        ensureSignupBonus(user.id).catch(() => {});
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
