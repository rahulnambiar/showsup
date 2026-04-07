import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rahul@showsup.co";

function getAdminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// POST /api/brand-index/save-insight
// Body: { title, description, data_evidence, insight_type, category?, brands_involved?, months_analyzed?, status? }
// PATCH /api/brand-index/save-insight  (publish)
// Body: { id, status }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    title: string;
    description: string;
    data_evidence: Record<string, unknown>;
    insight_type?: string;
    category?: string;
    brands_involved?: string[];
    months_analyzed?: string[];
    confidence?: string;
    status?: string;
  };

  const admin = getAdminDb();
  const { data, error } = await admin
    .from("brand_insights")
    .insert({
      title: body.title,
      description: body.description,
      data_evidence: body.data_evidence ?? {},
      insight_type: body.insight_type ?? "finding",
      category: body.category ?? null,
      brands_involved: body.brands_involved ?? [],
      months_analyzed: body.months_analyzed ?? [],
      confidence: body.confidence ?? "medium",
      status: body.status ?? "draft",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { id: string; status: string };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const admin = getAdminDb();
  const { error } = await admin
    .from("brand_insights")
    .update({
      status: body.status,
      ...(body.status === "published" ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
