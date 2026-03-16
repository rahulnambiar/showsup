import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScoresSortable } from "./scores-sortable";

export const metadata: Metadata = { title: "All Scans — ShowsUp" };

export default async function ScoresPage() {
  const supabase = await createClient();

  const { data: scans } = await supabase
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Scans</h1>
          <p className="text-gray-500 text-sm mt-1">Your AI visibility scan history.</p>
        </div>
        <Link
          href="/app/report-builder"
          className="inline-flex items-center bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
        >
          New analysis
        </Link>
      </div>

      <ScoresSortable scans={scans ?? []} />
    </div>
  );
}
