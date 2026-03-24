/**
 * GET /api/v1/scan/:scan_id/fixes
 * Returns previously generated fix artifacts for a scan.
 * 0 tokens. Fixes must have been generated first via POST /generate-fixes.
 */

import { NextResponse } from "next/server";
import { authenticateApiToken, getAdmin } from "@/lib/api/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await authenticateApiToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdmin();
  const { data: scan } = await admin
    .from("scans")
    .select("id, brand_name, generated_fixes, fixes_generated_at")
    .eq("id", params.id)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (!scan.generated_fixes) {
    return NextResponse.json(
      { error: "Fixes not yet generated. Call POST /api/v1/scan/:id/generate-fixes first." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    scan_id:             scan.id,
    brand:               scan.brand_name,
    fixes_generated_at:  scan.fixes_generated_at,
    fixes:               scan.generated_fixes,
  });
}
