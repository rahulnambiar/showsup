import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { revokeGscToken } from "@/lib/gsc/client";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("gsc_refresh_token")
    .eq("id", user.id)
    .single();

  if (profile?.gsc_refresh_token) {
    try {
      await revokeGscToken(profile.gsc_refresh_token as string);
    } catch { /* Ignore revocation errors — still clear from DB */ }
  }

  await admin.from("profiles").update({
    gsc_refresh_token: null,
    gsc_connected_at:  null,
    gsc_site_url:      null,
  }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
