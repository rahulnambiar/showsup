import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { verifyFix } from "@/lib/fixes/fix-verifier";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// POST /api/plan/verify
// Body: { plan_item_id: string }
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { plan_item_id?: string; item_id?: string };
    const plan_item_id = body.plan_item_id ?? body.item_id;
    if (!plan_item_id) return NextResponse.json({ error: "plan_item_id required" }, { status: 400 });

    const admin = getAdmin();

    // Load the plan item + its scan
    const { data: item } = await admin
      .from("plan_items")
      .select("*, scans(id, website, user_id)")
      .eq("id", plan_item_id)
      .single();

    if (!item) return NextResponse.json({ error: "Plan item not found" }, { status: 404 });

    const scan = item.scans as { id: string; website: string; user_id: string } | null;
    if (!scan || scan.user_id !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const siteUrl = scan.website;

    // Run verification
    const result = await verifyFix(
      item.verification_type as string,
      siteUrl,
      item.verification_page_url as string | undefined
    );

    // Update plan item with verification result
    const newStatus = result.passed ? "verified" : item.status;
    await admin
      .from("plan_items")
      .update({
        last_verified_at: result.checkedAt,
        last_verified_passed: result.passed,
        last_verified_message: result.message,
        status: newStatus,
      })
      .eq("id", plan_item_id);

    return NextResponse.json({ result, status: newStatus });
  } catch (err) {
    console.error("plan/verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
