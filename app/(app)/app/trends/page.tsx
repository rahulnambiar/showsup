import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TrendsChart } from "./trends-chart";

export const metadata: Metadata = { title: "Trends — ShowsUp" };

export default async function TrendsPage() {
  const supabase = await createClient();

  const { data: scans } = await supabase
    .from("scans")
    .select("id, brand_name, overall_score, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trends</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track how your AI visibility changes over time.
        </p>
      </div>
      <TrendsChart scans={scans ?? []} />
    </div>
  );
}
