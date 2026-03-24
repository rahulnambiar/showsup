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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  // Verify ownership
  const { data: source } = await admin
    .from("data_sources")
    .select("id, user_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // data_points cascade-delete via FK, but delete explicitly to be safe
  await admin.from("data_points").delete().eq("source_id", params.id);
  await admin.from("data_sources").delete().eq("id", params.id);

  return NextResponse.json({ ok: true });
}
