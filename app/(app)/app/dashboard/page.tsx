import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — ShowsUp" };

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreTextColor(s: number) {
  if (s >= 71) return "text-emerald-600";
  if (s >= 51) return "text-teal-600";
  if (s >= 31) return "text-amber-600";
  return "text-red-500";
}

function scoreBarColor(s: number): string {
  if (s >= 71) return "#10B981";
  if (s >= 51) return "#14B8A6";
  if (s >= 31) return "#F59E0B";
  return "#EF4444";
}

function scoreBg(s: number) {
  if (s >= 51) return "bg-emerald-50 border-emerald-200";
  if (s >= 31) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: allScans }, { data: platformData }] = await Promise.all([
    supabase.from("scans").select("*").order("created_at", { ascending: false }),
    supabase.from("scan_results").select("model, score"),
  ]);

  const scans        = allScans ?? [];
  const totalScans   = scans.length;
  const latestScore  = scans[0]?.overall_score ?? null;
  const uniqueBrands = new Set(scans.map((s) => s.brand_name.toLowerCase())).size;
  const recentScans  = scans.slice(0, 10);

  const pMap: Record<string, { total: number; count: number }> = {};
  for (const row of platformData ?? []) {
    if (!row.model || row.score === null) continue;
    if (!pMap[row.model]) pMap[row.model] = { total: 0, count: 0 };
    pMap[row.model].total += row.score;
    pMap[row.model].count++;
  }
  const platformScores = (["chatgpt", "claude"] as const)
    .filter((m) => pMap[m])
    .map((m) => ({
      model: m,
      label: m === "chatgpt" ? "ChatGPT" : "Claude",
      avg: Math.round(pMap[m].total / pMap[m].count),
    }));

  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {firstName}.</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ShowsUp Score */}
        <div className={cn(
          "rounded-xl border p-5 space-y-3",
          latestScore !== null ? scoreBg(latestScore) : "bg-white border-gray-200"
        )}>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">ShowsUp Score</p>
          {latestScore !== null ? (
            <>
              <p className={cn("text-5xl font-bold leading-none tabular-nums font-mono", scoreTextColor(latestScore))}>
                {latestScore}
              </p>
              <p className="text-xs text-gray-500">Latest scan result</p>
            </>
          ) : (
            <>
              <p className="text-5xl font-bold leading-none text-gray-300 font-mono">—</p>
              <p className="text-xs text-gray-400">No scans yet</p>
            </>
          )}
        </div>

        {/* Brands Tracked */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Brands Tracked</p>
          <p className="text-5xl font-bold leading-none text-gray-900 tabular-nums font-mono">{uniqueBrands}</p>
          <p className="text-xs text-gray-400">Unique brands scanned</p>
        </div>

        {/* Scans Run */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Scans Run</p>
          <p className="text-5xl font-bold leading-none text-gray-900 tabular-nums font-mono">{totalScans}</p>
          <p className="text-xs text-gray-400">Total scans completed</p>
        </div>
      </div>

      {/* ── Platform Performance ── */}
      {platformScores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Platform Performance</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
            {platformScores.map((p) => (
              <div key={p.model}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{p.label} Average</span>
                  <span className={cn("text-sm font-bold tabular-nums font-mono", scoreTextColor(p.avg))}>
                    {p.avg}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.avg}%`, backgroundColor: scoreBarColor(p.avg) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Scans / Empty State ── */}
      {totalScans === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-900 font-semibold">No scans yet.</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">
              Run your first scan to see how your brand shows up in AI.
            </p>
          </div>
          <Link
            href="/app/report-builder"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            Analyse your brand →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Scans</h2>
            <div className="flex items-center gap-4">
              <Link href="/app/scores" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                View all
              </Link>
              <Link
                href="/app/report-builder"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                New analysis →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {recentScans.map((scan, i) => {
              const siteUrl = scan.url || scan.website;
              return (
                <Link
                  key={scan.id}
                  href={`/app/report/${scan.id}`}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors",
                    i !== recentScans.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{scan.brand_name}</p>
                    {siteUrl && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{siteUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
                      {timeAgo(scan.created_at)}
                    </span>
                    <span className={cn(
                      "text-sm font-bold tabular-nums font-mono w-8 text-right",
                      scoreTextColor(scan.overall_score ?? 0)
                    )}>
                      {scan.overall_score ?? "—"}
                    </span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
