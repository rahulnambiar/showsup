import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportPage } from "./report-client";

export const metadata = { title: "AI Visibility Report — ShowsUp" };

export default async function ReportDetailPage({ params }: { params: { scan_id: string } }) {
  const supabase = await createClient();

  const [{ data: scan }, { data: results }] = await Promise.all([
    supabase.from("scans").select("*").eq("id", params.scan_id).single(),
    supabase
      .from("scan_results")
      .select("*")
      .eq("scan_id", params.scan_id)
      .order("model"),
  ]);

  if (!scan) notFound();

  return <ReportPage scan={scan} scanResults={results ?? []} />;
}
