import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { fetchGscData } from "@/lib/gsc/client";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { brand?: string; site_url?: string };
  const brand = (body.brand ?? "").trim();

  const admin = getAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("gsc_refresh_token, gsc_site_url")
    .eq("id", user.id)
    .single();

  if (!profile?.gsc_refresh_token) {
    return NextResponse.json({ error: "GSC not connected" }, { status: 404 });
  }

  const siteUrl = body.site_url ?? profile.gsc_site_url;
  if (!siteUrl) {
    return NextResponse.json({ error: "No site URL available" }, { status: 400 });
  }

  try {
    const data = await fetchGscData(profile.gsc_refresh_token as string, siteUrl, brand);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "GSC fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
