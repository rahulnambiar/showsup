import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("gsc_refresh_token, gsc_connected_at, gsc_site_url")
    .eq("id", user.id)
    .single();

  const connected = !!profile?.gsc_refresh_token;
  return NextResponse.json({
    connected,
    site_url:     connected ? (profile?.gsc_site_url ?? null)      : null,
    connected_at: connected ? (profile?.gsc_connected_at ?? null)  : null,
  });
}
