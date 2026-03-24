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

interface ImportBody {
  source_name: string;
  source_type: string;
  date_column: string | null;
  metric_columns: Array<{ name: string; description: string }>;
  rows: Record<string, string>[];  // parsed CSV rows as objects
}

/** Attempt to parse a date string into a YYYY-MM-DD ISO string. */
function parseDate(raw: string): string | null {
  if (!raw) return null;
  // Try ISO, "YYYY/MM/DD", "MM/DD/YYYY", "DD-MM-YYYY", Unix timestamps
  const cleaned = raw.trim();
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0]!;
  // Epoch seconds
  const n = Number(cleaned);
  if (!isNaN(n) && n > 1e9) return new Date(n * 1000).toISOString().split("T")[0]!;
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as ImportBody;
  const { source_name, source_type, date_column, metric_columns, rows } = body;

  if (!source_name || !source_type || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "source_name, source_type, rows required" }, { status: 400 });
  }

  const admin = getAdmin();

  // Create the data_source record
  const { data: source, error: srcErr } = await admin
    .from("data_sources")
    .insert({
      user_id:        user.id,
      source_type,
      source_name,
      config: { date_column, metric_columns },
      last_synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (srcErr || !source) {
    return NextResponse.json({ error: srcErr?.message ?? "Failed to create source" }, { status: 500 });
  }

  // Build data_points rows
  const points: Array<{
    user_id: string;
    source_id: string;
    metric_name: string;
    metric_value: number;
    date: string;
    metadata: Record<string, string>;
  }> = [];

  // Use today as fallback date if no date column, spread across days
  const today = new Date();

  rows.forEach((row, rowIdx) => {
    let date: string | null = null;
    if (date_column && row[date_column]) {
      date = parseDate(row[date_column]!);
    }
    if (!date) {
      // Fallback: spread rows daily backwards from today
      const d = new Date(today);
      d.setDate(d.getDate() - rowIdx);
      date = d.toISOString().split("T")[0]!;
    }

    for (const col of metric_columns) {
      const raw = row[col.name];
      if (raw === undefined || raw === null || raw === "") continue;
      // Strip currency symbols, commas, percent signs
      const cleaned = String(raw).replace(/[$€£¥,\s%]/g, "");
      const value   = parseFloat(cleaned);
      if (isNaN(value)) continue;

      points.push({
        user_id:      user.id,
        source_id:    source.id as string,
        metric_name:  col.name,
        metric_value: value,
        date,
        metadata:     { raw_value: String(raw), description: col.description },
      });
    }
  });

  if (points.length === 0) {
    // Clean up the source we just created
    await admin.from("data_sources").delete().eq("id", source.id);
    return NextResponse.json({ error: "No valid numeric data found in uploaded rows" }, { status: 400 });
  }

  // Batch insert (Supabase accepts up to 1000 rows per call)
  const BATCH = 1000;
  for (let i = 0; i < points.length; i += BATCH) {
    const { error: ptErr } = await admin.from("data_points").insert(points.slice(i, i + BATCH));
    if (ptErr) {
      console.error("[data_points] insert error:", ptErr.message);
    }
  }

  return NextResponse.json({
    source_id:    source.id,
    points_saved: points.length,
    source_name,
    source_type,
  });
}
