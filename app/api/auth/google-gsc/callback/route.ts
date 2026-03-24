import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { exchangeGscCode, fetchGscData } from "@/lib/gsc/client";
import { google } from "googleapis";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/app/settings?gsc=error&reason=${error ?? "missing_code"}`);
  }

  // Decode state → userId
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { userId: string };
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${origin}/app/settings?gsc=error&reason=invalid_state`);
  }

  try {
    const { accessToken, refreshToken } = await exchangeGscCode(code);

    // Get the list of verified sites for this account
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!,
    );
    oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    const webmasters = google.webmasters({ version: "v3", auth: oauth2 });
    const sitesRes   = await webmasters.sites.list();
    const sites      = sitesRes.data.siteEntry ?? [];

    // Pick the first verified site as default
    const siteUrl = sites.find((s) => s.permissionLevel !== "siteUnverifiedUser")?.siteUrl
      ?? sites[0]?.siteUrl
      ?? null;

    const admin = getAdmin();
    await admin.from("profiles").upsert({
      id:                userId,
      gsc_refresh_token: refreshToken,
      gsc_connected_at:  new Date().toISOString(),
      gsc_site_url:      siteUrl,
    }, { onConflict: "id" });

    return NextResponse.redirect(`${origin}/app/settings?gsc=connected`);
  } catch (err) {
    console.error("[gsc callback]", err);
    return NextResponse.redirect(`${origin}/app/settings?gsc=error&reason=token_exchange`);
  }
}
