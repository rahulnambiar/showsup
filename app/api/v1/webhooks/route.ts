/**
 * GET  /api/v1/webhooks — list registered webhooks
 * POST /api/v1/webhooks — register a webhook
 */

import { NextResponse } from "next/server";
import { authenticateApiToken, getAdmin } from "@/lib/api/auth";
import { randomBytes } from "crypto";

const VALID_EVENTS = ["scan.completed", "score.changed", "fixes.generated", "*"];

export async function GET(request: Request) {
  const user = await authenticateApiToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  const { data: hooks } = await admin
    .from("webhooks")
    .select("id, url, events, active, created_at")
    .eq("user_id", user.userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ webhooks: hooks ?? [] });
}

export async function POST(request: Request) {
  const user = await authenticateApiToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { url?: string; events?: string[] };
  const url  = (body.url ?? "").trim();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  try { new URL(url); } catch {
    return NextResponse.json({ error: "url must be a valid HTTPS URL" }, { status: 400 });
  }

  const events = Array.isArray(body.events)
    ? body.events.filter((e): e is string => VALID_EVENTS.includes(e))
    : ["scan.completed"];

  if (events.length === 0) {
    return NextResponse.json(
      { error: `events must include at least one of: ${VALID_EVENTS.join(", ")}` },
      { status: 400 }
    );
  }

  const secret = randomBytes(24).toString("hex");
  const admin  = getAdmin();

  // Limit to 10 webhooks per user
  const { count } = await admin
    .from("webhooks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.userId);
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Maximum 10 webhooks per account" }, { status: 429 });
  }

  const { data: hook, error } = await admin
    .from("webhooks")
    .insert({ user_id: user.userId, url, events, secret, active: true })
    .select("id, url, events, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ...hook,
    secret, // shown once — store it to verify signatures
  }, { status: 201 });
}
