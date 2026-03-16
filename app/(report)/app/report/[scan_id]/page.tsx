import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReportPage } from "./report-client";

export async function generateMetadata({ params }: { params: Promise<{ scan_id: string }> }): Promise<Metadata> {
  const { scan_id } = await params;
  const supabase = await createClient();
  const { data: scan } = await supabase
    .from("scans").select("brand_name, overall_score").eq("id", scan_id).single();
  if (!scan) return { title: "AI Visibility Report — ShowsUp" };
  return {
    title: `AI Visibility Report for ${scan.brand_name}`,
    openGraph: {
      title: `${scan.brand_name} scores ${scan.overall_score ?? "?"}/100 on AI Visibility`,
      description: `See how ${scan.brand_name} performs across ChatGPT, Claude, and Gemini. Get your own free report at showsup.co`,
    },
  };
}

export default async function ReportDetailPage({ params }: { params: Promise<{ scan_id: string }> }) {
  const { scan_id } = await params;
  const supabase = await createClient();

  const [{ data: scan }, { data: results }] = await Promise.all([
    supabase.from("scans").select("*").eq("id", scan_id).single(),
    supabase
      .from("scan_results")
      .select("*")
      .eq("scan_id", scan_id)
      .order("model"),
  ]);

  if (!scan) notFound();

  return <ReportPage scan={scan} scanResults={results ?? []} />;
}
