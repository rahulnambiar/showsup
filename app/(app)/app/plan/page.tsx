import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export default async function PlanIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getAdmin();

  // Find the most recent scan with a completed score
  const { data: latestScan } = await admin
    .from("scans")
    .select("id")
    .eq("user_id", user.id)
    .not("overall_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestScan) {
    redirect(`/app/plan/${latestScan.id}`);
  }

  // No scans yet
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">No scans yet</h1>
      <p className="text-gray-500 mb-6 max-w-sm">
        Run an AI visibility scan to generate your personalised improvement plan.
      </p>
      <Link
        href="/app/report-builder"
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
      >
        Start a scan →
      </Link>
    </div>
  );
}
