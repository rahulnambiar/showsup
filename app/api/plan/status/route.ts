import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// PATCH /api/plan/status
// Body: { plan_item_id: string; status: "pending" | "in_progress" | "done" | "skipped" }
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { plan_item_id?: string; item_id?: string; status: string };
    const plan_item_id = body.plan_item_id ?? body.item_id;
    const { status } = body;

    const VALID_STATUSES = ["pending", "not_started", "in_progress", "done", "marked_fixed", "skipped", "verified", "failed"];
    if (!plan_item_id || !status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "plan_item_id and valid status required" }, { status: 400 });
    }

    const admin = getAdmin();

    // Verify ownership via the linked scan
    const { data: item } = await admin
      .from("plan_items")
      .select("id, scans(user_id)")
      .eq("id", plan_item_id)
      .single();

    if (!item) return NextResponse.json({ error: "Plan item not found" }, { status: 404 });

    const scan = item.scans as unknown as { user_id: string } | null;
    if (!scan || scan.user_id !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await admin
      .from("plan_items")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", plan_item_id);

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("plan/status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
