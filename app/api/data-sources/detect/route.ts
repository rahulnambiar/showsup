import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectCsvWithAI, matchPreset } from "@/lib/correlation/csv-detect";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    headers: string[];
    sample_rows: string[][];
  };

  const { headers, sample_rows } = body;
  if (!Array.isArray(headers) || headers.length === 0) {
    return NextResponse.json({ error: "headers required" }, { status: 400 });
  }

  // Try preset match first (faster, no AI cost)
  const preset = matchPreset(headers);
  if (preset) {
    return NextResponse.json({
      type:             preset.type,
      detected_source:  preset.label,
      date_column:      preset.date_column || null,
      metric_columns:   preset.metric_columns.map((c) => ({ ...c, role: "metric" })),
      confidence:       "high",
      preset_id:        preset.id,
    });
  }

  // Fall back to AI detection
  try {
    const result = await detectCsvWithAI(headers, sample_rows ?? []);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Detection failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
