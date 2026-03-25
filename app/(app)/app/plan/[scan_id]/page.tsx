import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { PlanClient } from "./plan-client";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>;

function dbRowToPlanItem(row: DbRow) {
  return {
    id: row.id as string,
    layer: row.dimension as string,
    funnel_stage: row.funnel_stage as "awareness" | "consideration" | "competition" | "conversion",
    issue_type: row.dimension as string,
    priority: row.priority as "critical" | "high" | "medium" | "low",
    title: row.title as string,
    description: row.description as string,
    why_it_matters: (row.why_it_matters as string) ?? "",
    research_backing: "",
    current_state: (row.current_state as string) ?? null,
    desired_state: (row.desired_state as string) ?? null,
    specific_page: (row.verification_page_url as string) ?? null,
    target_query: null,
    addresses_competitor: null,
    action_steps: (row.action_items as string) ?? "",
    impact: (row.impact as string) ?? null,
    effort: row.effort as string,
    verification_type: row.verification_type as string,
    status: (row.status as "not_started" | "in_progress" | "marked_fixed" | "verified" | "failed" | "skipped"),
    verified_at: (row.last_verified_at as string) ?? null,
    verification_result: row.last_verified_passed != null
      ? { passed: row.last_verified_passed, message: row.last_verified_message }
      : {} as Record<string, unknown>,
  };
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ scan_id: string }>;
}) {
  const { scan_id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getAdmin();

  // Fetch scan — only select columns that definitely exist
  const { data: scan, error: scanError } = await admin
    .from("scans")
    .select("id, brand_name, category, url, website, overall_score, created_at")
    .eq("id", scan_id)
    .eq("user_id", user.id)
    .single();

  if (scanError || !scan) notFound();

  // Fetch aeo_readiness separately — column may not exist yet on older DBs
  let aeoReadiness: Record<string, number> | null = null;
  try {
    const { data } = await admin
      .from("scans")
      .select("aeo_readiness")
      .eq("id", scan_id)
      .single();
    aeoReadiness = (data?.aeo_readiness as Record<string, number>) ?? null;
  } catch {
    // column doesn't exist yet — fine, proceed without it
  }

  // Fetch plan items — table may not exist yet on older DBs
  let planRows: DbRow[] = [];
  try {
    const { data } = await admin
      .from("plan_items")
      .select("*")
      .eq("scan_id", scan_id)
      .order("priority_order", { ascending: true });
    planRows = data ?? [];
  } catch {
    // table doesn't exist yet — fine, empty state will trigger generate flow
  }

  const initialItems = planRows.map(dbRowToPlanItem);

  const aeoScores = aeoReadiness
    ? Object.fromEntries(
        Object.entries(aeoReadiness).map(([k, v]) => [k, { score: v, summary: "" }])
      )
    : null;

  return (
    <PlanClient
      scanId={scan.id as string}
      brand={scan.brand_name as string}
      scanDate={scan.created_at as string}
      overallScore={(scan.overall_score as number) ?? 0}
      websiteUrl={(scan.website as string) ?? (scan.url as string) ?? null}
      initialItems={initialItems}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      aeoScores={aeoScores as any}
      overallAeoReadiness={
        aeoReadiness
          ? Math.round(
              Object.values(aeoReadiness).reduce((a, b) => a + b, 0) /
                Math.max(1, Object.values(aeoReadiness).length)
            )
          : null
      }
    />
  );
}
