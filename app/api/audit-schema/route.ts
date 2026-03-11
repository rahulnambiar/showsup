import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET() {
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Hit PostgREST OpenAPI spec — lists all tables and their columns
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
  });
  const spec = await res.json() as { definitions?: Record<string, { properties?: Record<string, unknown> }> };

  const tables = ["audit_queries", "audit_results"];
  const result: Record<string, string[]> = {};
  for (const table of tables) {
    const def = spec.definitions?.[table];
    result[table] = def?.properties ? Object.keys(def.properties) : ["(table not found in spec)"];
  }

  return NextResponse.json(result);
}
