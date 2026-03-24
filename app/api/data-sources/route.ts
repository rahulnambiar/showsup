import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sources } = await supabase
    .from("data_sources")
    .select("id, source_type, source_name, config, last_synced_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get point counts per source
  const counts: Record<string, number> = {};
  if (sources && sources.length > 0) {
    const { data: pts } = await supabase
      .from("data_points")
      .select("source_id")
      .eq("user_id", user.id)
      .in("source_id", sources.map((s) => s.id));

    (pts ?? []).forEach((p) => {
      counts[p.source_id as string] = (counts[p.source_id as string] ?? 0) + 1;
    });
  }

  return NextResponse.json({
    sources: (sources ?? []).map((s) => ({
      ...s,
      point_count: counts[s.id as string] ?? 0,
    })),
  });
}
