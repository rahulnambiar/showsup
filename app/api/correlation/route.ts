import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeCorrelations, type TimePoint, type ScanPoint } from "@/lib/correlation/engine";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pull all data sources + points for this user
  const [sourcesRes, pointsRes, scansRes] = await Promise.all([
    supabase
      .from("data_sources")
      .select("id, source_name, source_type")
      .eq("user_id", user.id),
    supabase
      .from("data_points")
      .select("source_id, metric_name, metric_value, date")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
    supabase
      .from("scans")
      .select("overall_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const sources = sourcesRes.data ?? [];
  const points  = pointsRes.data ?? [];
  const scans   = scansRes.data ?? [];

  if (sources.length === 0 || scans.length === 0) {
    return NextResponse.json({ correlations: [], scan_series: [], metric_series: [] });
  }

  // Build scan time series (dedupe by date — take latest score per date)
  const scanByDate = new Map<string, number>();
  for (const s of scans) {
    const d = (s.created_at as string).split("T")[0]!;
    scanByDate.set(d, s.overall_score as number);
  }
  const scanSeries: ScanPoint[] = Array.from(scanByDate.entries())
    .map(([date, score]) => ({ date, score }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group data_points by source + metric
  const sourceMap = new Map(sources.map((s) => [s.id as string, s.source_name as string]));
  const metricMap = new Map<string, TimePoint[]>();

  for (const p of points) {
    const key = `${p.source_id as string}::${p.metric_name as string}`;
    if (!metricMap.has(key)) metricMap.set(key, []);
    metricMap.get(key)!.push({ date: p.date as string, value: p.metric_value as number });
  }

  const metricInputs = Array.from(metricMap.entries()).map(([key, series]) => {
    const [sourceId, name] = key.split("::");
    return { name: name!, source: sourceMap.get(sourceId!) ?? "Unknown", series };
  });

  const correlations = computeCorrelations(metricInputs, scanSeries);

  // Build combined timeline for the chart — last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split("T")[0]!;

  // All unique dates in range
  const allDates = new Set<string>();
  scanSeries.filter((s) => s.date >= cutoffStr).forEach((s) => allDates.add(s.date));
  Array.from(metricMap.values()).forEach((series) =>
    series.filter((p) => p.date >= cutoffStr).forEach((p) => allDates.add(p.date))
  );
  const sortedDates = Array.from(allDates).sort();

  // Score lookup
  const scoreByDate = new Map<string, number>(scanSeries.map((s) => [s.date, s.score]));

  // Per-metric lookup
  const metricByDate = new Map<string, Map<string, number>>();
  Array.from(metricMap.entries()).forEach(([key, series]) => {
    const [sourceId, name] = key.split("::");
    const label = `${sourceMap.get(sourceId!) ?? "Unknown"} — ${name!}`;
    const m = new Map<string, number>(series.map((p) => [p.date, p.value]));
    metricByDate.set(label, m);
  });

  const timeline = sortedDates.map((date) => {
    const point: Record<string, number | string> = { date };
    const score = scoreByDate.get(date);
    if (score !== undefined) point["ShowsUp Score"] = score;
    Array.from(metricByDate.entries()).forEach(([label, m]) => {
      const v = m.get(date);
      if (v !== undefined) point[label] = v;
    });
    return point;
  });

  // Correlation matrix (metric vs metric + vs score)
  const matrixLabels = ["ShowsUp Score", ...Array.from(metricByDate.keys()).slice(0, 5)];
  const matrix: Array<{ x: string; y: string; value: number | null }> = [];
  const allSeriesMap = new Map<string, TimePoint[]>([
    ["ShowsUp Score", scanSeries.map((s) => ({ date: s.date, value: s.score }))],
    ...Array.from(metricByDate.entries()).map(([label, m]): [string, TimePoint[]] => [
      label,
      Array.from(m.entries()).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date)),
    ]),
  ]);

  for (const x of matrixLabels) {
    for (const y of matrixLabels) {
      if (x === y) { matrix.push({ x, y, value: 1.0 }); continue; }
      const xs = allSeriesMap.get(x);
      const ys = allSeriesMap.get(y);
      if (!xs || !ys) { matrix.push({ x, y, value: null }); continue; }

      const { pearsonCorrelation } = await import("@/lib/correlation/engine");
      const xByDate = new Map(xs.map((p) => [p.date, p.value]));
      const av: number[] = [];
      const bv: number[] = [];
      for (const p of ys) {
        const xv = xByDate.get(p.date);
        if (xv !== undefined) { av.push(xv); bv.push(p.value); }
      }
      matrix.push({ x, y, value: pearsonCorrelation(av, bv) });
    }
  }

  return NextResponse.json({
    correlations,
    timeline,
    matrix,
    matrix_labels: matrixLabels,
    scan_series: scanSeries.slice(-90),
  });
}
