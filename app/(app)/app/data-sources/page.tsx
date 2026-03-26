"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Upload, FileText, Trash2, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRESET_TEMPLATES } from "@/lib/correlation/csv-detect";
import type { CsvDetectionResult, CsvColumnMeta } from "@/lib/correlation/csv-detect";

// ── CSV parser (lightweight, client-side) ─────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { result.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  }

  const headers = splitLine(lines[0]!);
  const rows    = lines.slice(1).filter((l) => l.trim()).map(splitLine);
  return { headers, rows };
}

function rowsToObjects(headers: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });
}

// ── Source type badges ────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  keyword:       "bg-blue-500/10 text-blue-400",
  sales:         "bg-green-500/10 text-green-400",
  revenue:       "bg-emerald-500/10 text-emerald-400",
  social:        "bg-purple-500/10 text-purple-400",
  brand_tracking:"bg-amber-500/10 text-amber-400",
  custom:        "bg-gray-500/10 text-gray-400",
  gsc:           "bg-blue-500/10 text-blue-400",
};

// ── Main page ─────────────────────────────────────────────────────────────

interface DataSource {
  id: string;
  source_type: string;
  source_name: string;
  last_synced_at: string | null;
  point_count: number;
}

type UploadStep =
  | { step: "idle" }
  | { step: "parsing" }
  | { step: "detecting"; headers: string[]; rows: string[][] }
  | { step: "mapping"; detection: CsvDetectionResult; headers: string[]; rows: string[][] }
  | { step: "importing" }
  | { step: "done"; source_name: string; points: number }
  | { step: "error"; message: string };

export default function DataSourcesPage() {
  const [sources, setSources]   = useState<DataSource[]>([]);
  const [gscConnected, setGscConnected] = useState(false);
  const [uploading, setUploading] = useState<UploadStep>({ step: "idle" });
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("auto");
  const [customName, setCustomName]  = useState("");
  const [mappingEdits, setMappingEdits] = useState<CsvColumnMeta[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSources = useCallback(async () => {
    const [srcRes, gscRes] = await Promise.all([
      fetch("/api/data-sources"),
      fetch("/api/gsc/status"),
    ]);
    if (srcRes.ok) {
      const d = await srcRes.json() as { sources: DataSource[] };
      setSources(d.sources);
    }
    if (gscRes.ok) {
      const g = await gscRes.json() as { connected: boolean };
      setGscConnected(g.connected);
    }
  }, []);

  useEffect(() => { void loadSources(); }, [loadSources]);

  // ── File / paste handling ─────────────────────────────────────────────

  async function handleFile(file: File) {
    setUploading({ step: "parsing" });
    try {
      const text = await file.text();
      await processCSVText(text, file.name.replace(/\.csv$/i, ""));
    } catch (e) {
      setUploading({ step: "error", message: String(e) });
    }
  }

  async function handlePaste() {
    if (!pasteText.trim()) return;
    setUploading({ step: "parsing" });
    await processCSVText(pasteText, "Pasted Data");
  }

  async function processCSVText(text: string, defaultName: string) {
    const { headers, rows } = parseCSV(text);
    if (headers.length === 0) {
      setUploading({ step: "error", message: "Could not parse CSV — check the format." });
      return;
    }
    setCustomName(defaultName);

    // If a preset template is selected, skip AI detection
    if (selectedTemplate !== "auto") {
      const tpl = PRESET_TEMPLATES.find((t) => t.id === selectedTemplate);
      if (tpl) {
        const detection: CsvDetectionResult = {
          type:            tpl.type,
          detected_source: tpl.label,
          date_column:     tpl.date_column || null,
          metric_columns:  tpl.metric_columns.map((c) => ({ ...c, role: "metric" as const })),
          confidence:      "high",
        };
        setMappingEdits(detection.metric_columns);
        setUploading({ step: "mapping", detection, headers, rows });
        return;
      }
    }

    setUploading({ step: "detecting", headers, rows });
    try {
      const res = await fetch("/api/data-sources/detect", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, sample_rows: rows.slice(0, 20) }),
      });
      const detection = await res.json() as CsvDetectionResult;
      setMappingEdits(detection.metric_columns);
      setUploading({ step: "mapping", detection, headers, rows });
    } catch {
      setUploading({ step: "error", message: "AI detection failed — please select a template manually." });
    }
  }

  async function handleImport() {
    if (uploading.step !== "mapping") return;
    const { detection, headers, rows } = uploading;
    const activeCols = mappingEdits.filter((c) => c.role === "metric");
    if (activeCols.length === 0) {
      setUploading({ step: "error", message: "Select at least one metric column." });
      return;
    }
    setUploading({ step: "importing" });
    try {
      const res = await fetch("/api/data-sources/import", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_name:    customName || detection.detected_source,
          source_type:    detection.type,
          date_column:    detection.date_column,
          metric_columns: activeCols,
          rows:           rowsToObjects(headers, rows),
        }),
      });
      const data = await res.json() as { points_saved?: number; source_name?: string; error?: string };
      if (!res.ok) {
        setUploading({ step: "error", message: data.error ?? "Import failed" });
        return;
      }
      setUploading({ step: "done", source_name: data.source_name!, points: data.points_saved! });
      void loadSources();
    } catch (e) {
      setUploading({ step: "error", message: String(e) });
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/data-sources/${id}`, { method: "DELETE" });
    setSources((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  }

  function resetUpload() {
    setUploading({ step: "idle" });
    setPasteText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Data Sources</h1>
        <p className="text-gray-400 text-sm">Connect your data to correlate with AI visibility.</p>
      </div>

      {/* ── Connected sources ── */}
      <section className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Connected</p>

        {/* GSC */}
        <div className={cn(
          "rounded-xl border px-4 py-3 flex items-center justify-between",
          gscConnected ? "border-[#10B981]/20 bg-[#10B981]/5" : "border-white/10 bg-[#111827]"
        )}>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
              <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z" fill="#4285F4"/>
              <path d="M24 14c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="white"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-white">Google Search Console</p>
              <p className="text-xs text-gray-500">{gscConnected ? "Branded + AI-origin queries" : "Not connected"}</p>
            </div>
          </div>
          {gscConnected ? (
            <span className="text-xs text-[#10B981] font-medium">✓ Active</span>
          ) : (
            <Link href="/app/settings" className="text-xs text-gray-400 hover:text-white border border-white/15 rounded-lg px-3 py-1.5 transition-colors">
              Connect →
            </Link>
          )}
        </div>

        {/* Uploaded sources */}
        {sources.map((src) => (
          <div key={src.id} className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white truncate">{src.source_name}</p>
                  <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5", TYPE_COLORS[src.source_type] ?? TYPE_COLORS.custom)}>
                    {src.source_type}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {src.point_count.toLocaleString()} data points
                  {src.last_synced_at && ` · ${new Date(src.last_synced_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(src.id)}
              disabled={deleting === src.id}
              className="text-gray-600 hover:text-[#EF4444] transition-colors p-1.5 flex-shrink-0"
              title="Remove data source"
            >
              {deleting === src.id
                ? <span className="w-4 h-4 border border-gray-500 border-t-transparent rounded-full animate-spin block" />
                : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        ))}

        {sources.length === 0 && !gscConnected && (
          <p className="text-sm text-gray-600 px-1">No data sources yet — upload a CSV below.</p>
        )}
      </section>

      {/* ── Upload section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Upload Custom Data</p>
          {uploading.step !== "idle" && (
            <button onClick={resetUpload} className="text-xs text-gray-500 hover:text-white transition-colors">Reset</button>
          )}
        </div>

        {/* Template selector */}
        {uploading.step === "idle" && (
          <div className="space-y-3">
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full appearance-none bg-[#1F2937] border border-white/10 text-white rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#10B981]"
              >
                <option value="auto">Auto-detect format (uses AI)</option>
                {PRESET_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
                <option value="generic">Generic CSV (manual mapping)</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setPasteMode(false); fileInputRef.current?.click(); }}
                className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition-all",
                  !pasteMode ? "border-[#10B981]/40 bg-[#10B981]/5 text-white" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white")}
              >
                <Upload className="w-4 h-4" />
                Upload CSV
              </button>
              <button
                onClick={() => setPasteMode(true)}
                className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition-all",
                  pasteMode ? "border-[#10B981]/40 bg-[#10B981]/5 text-white" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white")}
              >
                <FileText className="w-4 h-4" />
                Paste Data
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {!pasteMode ? (
              <div
                className="rounded-xl border-2 border-dashed border-white/10 px-6 py-10 text-center cursor-pointer hover:border-[#10B981]/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Drop CSV here or <span className="text-[#10B981]">click to browse</span></p>
                <p className="text-xs text-gray-600 mt-1">
                  Supported: Ahrefs, Semrush, Google KW Planner, Shopify, Stripe, Brandwatch, any CSV
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"Paste CSV data here...\ndate,revenue,orders\n2025-01-01,12000,45\n..."}
                  className="w-full h-48 bg-[#1F2937] border border-white/10 text-white text-xs font-mono rounded-lg px-3 py-2.5 placeholder:text-gray-600 focus:outline-none focus:border-[#10B981] resize-none"
                />
                <Button
                  onClick={handlePaste}
                  disabled={!pasteText.trim()}
                  className="bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold"
                >
                  Detect & Import
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Parsing / detecting */}
        {(uploading.step === "parsing" || uploading.step === "detecting") && (
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-gray-300">
                {uploading.step === "parsing" ? "Parsing CSV…" : "Detecting data type with AI…"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Mapping confirmation */}
        {uploading.step === "mapping" && (
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <p className="text-sm font-semibold text-white">
                  Detected: <span className="text-[#10B981]">{uploading.detection.detected_source}</span>
                  <span className={cn("ml-2 text-[10px] rounded-full px-2 py-0.5 font-medium", TYPE_COLORS[uploading.detection.type] ?? TYPE_COLORS.custom)}>
                    {uploading.detection.type}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Source name</label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#1F2937] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500">Columns to import as metrics</p>
                <div className="space-y-1.5">
                  {mappingEdits.map((col, i) => (
                    <label key={i} className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-all",
                      col.role === "metric" ? "border-[#10B981]/20 bg-[#10B981]/5" : "border-white/5 opacity-50"
                    )}>
                      <input
                        type="checkbox"
                        checked={col.role === "metric"}
                        onChange={() => setMappingEdits((prev) => prev.map((c, j) => j === i
                          ? { ...c, role: c.role === "metric" ? "ignore" : "metric" }
                          : c))}
                        className="w-4 h-4 accent-[#10B981]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{col.name}</p>
                        <p className="text-xs text-gray-500 truncate">{col.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {uploading.detection.date_column && (
                <p className="text-xs text-gray-500">
                  Date column: <span className="text-gray-300 font-mono">{uploading.detection.date_column}</span>
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleImport}
                  className="bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold"
                >
                  Import {rowsToObjects(uploading.headers, uploading.rows).length.toLocaleString()} rows
                </Button>
                <Button variant="outline" onClick={resetUpload} className="border-white/20 text-gray-300 hover:text-white">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Importing */}
        {uploading.step === "importing" && (
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-gray-300">Importing data points…</p>
            </CardContent>
          </Card>
        )}

        {/* Done */}
        {uploading.step === "done" && (
          <Card className="bg-[#111827] border-[#10B981]/20">
            <CardContent className="pt-5 pb-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <p className="text-sm font-semibold text-white">
                  Imported {uploading.points.toLocaleString()} data points from <span className="text-[#10B981]">{uploading.source_name}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/app/insights"
                  className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
                >
                  View Insights →
                </Link>
                <Button variant="outline" onClick={resetUpload} className="border-white/20 text-gray-300 hover:text-white text-sm">
                  Upload Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {uploading.step === "error" && (
          <Card className="bg-[#111827] border-[#EF4444]/20">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                <p className="text-sm text-[#EF4444]">{uploading.message}</p>
              </div>
              <button onClick={resetUpload} className="text-xs text-gray-500 hover:text-white transition-colors underline">Try again</button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Footer tip ── */}
      {sources.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-600">Data is correlated with your ShowsUp score on the Insights page.</p>
          <Link href="/app/insights" className="text-xs text-[#10B981] hover:underline">View Insights →</Link>
        </div>
      )}
    </div>
  );
}
