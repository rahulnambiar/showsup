import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ReportPage } from "./report-client";

// The sample Dyson scan is accessible to all logged-in users as a demo
const SAMPLE_SCAN_ID = "9627517f-3baa-4213-b7d6-be97b8b1e634";

export async function generateMetadata({ params }: { params: Promise<{ scan_id: string }> }): Promise<Metadata> {
  const { scan_id } = await params;
  const supabase = await createClient();
  let { data: scan } = await supabase
    .from("scans").select("brand_name, overall_score").eq("id", scan_id).single();
  // Fall back to service role for the sample scan
  if (!scan && scan_id === SAMPLE_SCAN_ID) {
    const admin = await createServiceClient();
    ({ data: scan } = await admin.from("scans").select("brand_name, overall_score").eq("id", scan_id).single());
  }
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

  // Try user-scoped client first (own scans)
  const supabase = await createClient();
  let { data: scan } = await supabase.from("scans").select("*").eq("id", scan_id).single();
  let { data: results } = await supabase.from("scan_results").select("*").eq("scan_id", scan_id).order("model");

  // For the sample scan, fall back to service role so any user can view it
  if (!scan && scan_id === SAMPLE_SCAN_ID) {
    const admin = await createServiceClient();
    [{ data: scan }, { data: results }] = await Promise.all([
      admin.from("scans").select("*").eq("id", scan_id).single(),
      admin.from("scan_results").select("*").eq("scan_id", scan_id).order("model"),
    ]);
  }

  if (!scan) notFound();

  return <ReportPage scan={scan} scanResults={results ?? []} isSample={scan_id === SAMPLE_SCAN_ID} />;
}
