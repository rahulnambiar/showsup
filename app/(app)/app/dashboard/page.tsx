import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";

function scoreColor(score: number) {
  if (score >= 71) return "text-[#10B981]";
  if (score >= 51) return "text-[#14B8A6]";
  if (score >= 31) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function scoreBadge(score: number) {
  if (score >= 71) return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30";
  if (score >= 51) return "bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/30";
  if (score >= 31) return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30";
  return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30";
}

function barColor(score: number) {
  if (score >= 71) return "#10B981";
  if (score >= 51) return "#14B8A6";
  if (score >= 31) return "#F59E0B";
  return "#EF4444";
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: scans } = await supabase
    .from("scans")
    .select("id, brand_name, overall_score, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch platform performance averages
  const { data: platformData } = await supabase
    .from("scan_results")
    .select("model, score");

  const totalScans = scans?.length ?? 0;
  const latestScore = scans?.[0]?.overall_score ?? null;
  const uniqueBrands = new Set(scans?.map((s) => s.brand_name.toLowerCase())).size;

  // Calculate per-platform averages
  const platformAverages: Record<string, { total: number; count: number }> = {};
  (platformData ?? []).forEach((row) => {
    if (!row.model || row.score === null) return;
    if (!platformAverages[row.model]) platformAverages[row.model] = { total: 0, count: 0 };
    platformAverages[row.model]!.total += row.score;
    platformAverages[row.model]!.count++;
  });

  const platformScores = Object.entries(platformAverages)
    .map(([model, { total, count }]) => ({
      model,
      label: model === "chatgpt" ? "ChatGPT" : model === "claude" ? "Claude" : model,
      avg: Math.round(total / count),
    }))
    .sort((a, b) => b.avg - a.avg);

  // Get model sets for each scan (from the last 5 results)
  const { data: recentResults } = await supabase
    .from("scan_results")
    .select("scan_id, model")
    .in("scan_id", (scans ?? []).map((s) => s.id));

  const scanModels: Record<string, Set<string>> = {};
  (recentResults ?? []).forEach((r) => {
    if (!scanModels[r.scan_id]) scanModels[r.scan_id] = new Set();
    scanModels[r.scan_id].add(r.model);
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm">
          Welcome back, {user?.email?.split("@")[0]}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#111827] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Latest Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestScore !== null ? (
              <span className={`text-4xl font-bold ${scoreColor(latestScore)}`}>
                {latestScore}
              </span>
            ) : (
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">—</span>
                <Badge variant="outline" className="border-gray-700 text-gray-500 mb-1">
                  No scans yet
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Brands Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold text-white">{uniqueBrands}</span>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Scans Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold text-white">{totalScans}</span>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      {platformScores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400">
            Platform Performance — avg across all scans
          </h2>
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 space-y-4">
              {platformScores.map((p) => (
                <div key={p.model} className="flex items-center gap-4">
                  <span className="text-sm text-gray-300 w-20 flex-shrink-0">{p.label}</span>
                  <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.avg}%`,
                        backgroundColor: barColor(p.avg),
                      }}
                    />
                  </div>
                  <span className={`text-sm font-semibold w-8 text-right ${scoreColor(p.avg)}`}>
                    {p.avg}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent scans or empty state */}
      {totalScans === 0 ? (
        <Card className="bg-[#111827] border-white/10 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/15 flex items-center justify-center">
              <span className="text-[#10B981] text-xl">↗</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-semibold">Run your first AI scan</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Enter your brand name and we&apos;ll check how it shows up across ChatGPT and Claude.
              </p>
            </div>
            <Link
              href="/app/scan"
              className={cn(
                buttonVariants(),
                "bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold mt-2"
              )}
            >
              Start a scan
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">Recent scans</h2>
            <Link href="/app/scores" className="text-xs text-[#10B981] hover:underline">
              View all
            </Link>
          </div>
          {scans!.map((scan) => {
            const scanModelSet = scanModels[scan.id] ?? new Set();
            return (
              <Link key={scan.id} href={`/app/scores/${scan.id}`}>
                <Card className="bg-[#111827] border-white/10 hover:border-white/20 transition-colors cursor-pointer">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{scan.brand_name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">{timeAgo(scan.created_at)}</p>
                        {scanModelSet.has("chatgpt") && (
                          <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded px-1.5 py-0.5">
                            ChatGPT
                          </span>
                        )}
                        {scanModelSet.has("claude") && (
                          <span className="text-[10px] bg-[#C084FC]/10 text-[#C084FC] border border-[#C084FC]/20 rounded px-1.5 py-0.5">
                            Claude
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "text-sm font-bold px-3 py-1 border",
                        scoreBadge(scan.overall_score ?? 0)
                      )}
                    >
                      {scan.overall_score ?? "—"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
