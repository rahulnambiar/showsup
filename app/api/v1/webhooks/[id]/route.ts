/**
 * DELETE /api/v1/webhooks/:id — remove a webhook
 * PATCH  /api/v1/webhooks/:id — update events/url/active
 */

import { NextResponse } from "next/server";
import { authenticateApiToken, getAdmin } from "@/lib/api/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await authenticateApiToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  const { data: hook } = await admin
    .from("webhooks")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.from("webhooks").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await authenticateApiToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { url?: string; events?: string[]; active?: boolean };
  const admin = getAdmin();

  const { data: hook } = await admin
    .from("webhooks")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.url    !== undefined) updates.url    = body.url;
  if (body.events !== undefined) updates.events = body.events;
  if (body.active !== undefined) updates.active = body.active;

  const { data: updated } = await admin
    .from("webhooks")
    .update(updates)
    .eq("id", params.id)
    .select("id, url, events, active, created_at")
    .single();

  return NextResponse.json(updated);
}
