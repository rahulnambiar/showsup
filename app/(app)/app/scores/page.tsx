import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";

function scoreBadge(score: number) {
  if (score >= 60) return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30";
  if (score >= 30) return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30";
  return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30";
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

export default async function ScoresPage() {
  const supabase = await createClient();

  const { data: scans } = await supabase
    .from("scans")
    .select("id, brand_name, website, overall_score, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Scores</h1>
          <p className="text-gray-400 text-sm">Your AI visibility scan history.</p>
        </div>
        <Link
          href="/app/scan"
          className={cn(
            buttonVariants(),
            "bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold"
          )}
        >
          New scan
        </Link>
      </div>

      {!scans?.length ? (
        <Card className="bg-[#111827] border-white/10 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <p className="text-white font-semibold">No scans yet</p>
            <p className="text-gray-500 text-sm">Run your first scan to see results here.</p>
            <Link
              href="/app/scan"
              className={cn(
                buttonVariants(),
                "bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold mt-2"
              )}
            >
              Run a scan
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <Link key={scan.id} href={`/app/scores/${scan.id}`}>
              <Card className="bg-[#111827] border-white/10 hover:border-white/20 transition-colors cursor-pointer">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <CardTitle className="text-base text-white font-semibold">
                        {scan.brand_name}
                      </CardTitle>
                      {scan.website && (
                        <p className="text-xs text-gray-500">{scan.website}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-600">
                        {timeAgo(scan.created_at)}
                      </span>
                      <Badge
                        className={cn(
                          "text-sm font-bold px-3 py-1 border",
                          scoreBadge(scan.overall_score ?? 0)
                        )}
                      >
                        {scan.overall_score ?? "—"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
