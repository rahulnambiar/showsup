"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Coins, Zap, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  calculateReportCost,
  getAvailableModels,
  getModuleDelta,
  type ReportConfig,
} from "@/lib/pricing/cost-calculator";
import { REGIONS } from "@/lib/engine/regions";
import { trackReportBuilderOpened, trackScanStarted, trackScanCompleted, trackScanFailed } from "@/lib/analytics";

// ── Constants ─────────────────────────────────────────────────────────────────

const COMMERCE_CATS = ["Insurance", "Travel", "Finance", "E-commerce"];
const CATEGORIES = ["Insurance", "Travel", "Finance", "E-commerce", "SaaS", "Healthcare", "Other"];

type ScanDepth = "quick_check" | "standard" | "deep";

type ModuleKey = keyof ReportConfig["modules"];

const MODULE_META: Record<ModuleKey, { label: string; desc: string; autoFor?: string[] }> = {
  persona:          { label: "Persona-Based Analysis",  desc: "Test from 5 different buyer perspectives" },
  commerce:         { label: "Commerce Deep Dive",       desc: "15 purchase-intent queries", autoFor: COMMERCE_CATS },
  sentiment:        { label: "Detailed Sentiment",       desc: "How AI describes your brand in depth" },
  citations:        { label: "Citation Page Tracking",   desc: "Which of your pages AI cites" },
  improvementPlan:  { label: "AI Improvement Plan",      desc: "Prioritized 3-tier action roadmap" },
  categoryBenchmark:{ label: "Category Benchmarking",    desc: "Compare to your industry average" },
};

// Model key → platform ID mapping for the scan API
const MODEL_TO_PLATFORM: Record<string, string> = {
  "gpt-4o-mini":      "chatgpt",
  "gpt-4o":           "chatgpt",
  "claude-3-haiku":   "claude",
  "claude-sonnet":    "claude",
  "gemini-2.5-flash": "gemini",
};

// Models available for actual scanning (scan API supports these)
const SCAN_CAPABLE = new Set(["gpt-4o-mini", "claude-3-haiku", "gemini-2.5-flash"]);
const COMING_SOON_PROVIDERS = new Set<string>([]);

// ── Templates ─────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  label: string;
  description: string;
  scanDepth: ScanDepth;
  modules: Partial<ReportConfig["modules"]>;
  extraCompetitors: number;
}

const TEMPLATES: Template[] = [
  { id: "quick",       label: "Quick Check",       description: "Basic score, 2 platforms",          scanDepth: "quick_check", modules: {},                                                                          extraCompetitors: 0 },
  { id: "standard",    label: "Standard Report",   description: "Full scan + improvement plan",      scanDepth: "standard",    modules: { improvementPlan: true },                                                   extraCompetitors: 0 },
  { id: "competitive", label: "Competitive Intel", description: "Competitors, sentiment, personas",  scanDepth: "standard",    modules: { persona: true, sentiment: true },                                          extraCompetitors: 2 },
  { id: "full",        label: "Full Analysis",     description: "Everything, all modules",           scanDepth: "deep",        modules: { persona: true, commerce: true, sentiment: true, citations: true, improvementPlan: true, categoryBenchmark: true }, extraCompetitors: 4 },
];

// ── Step indicator ─────────────────────────────────────────────────────────────

interface StepState { id: string; label: string; status: "pending" | "running" | "done" | "error" }

function StepCircle({ status }: { status: StepState["status"] }) {
  if (status === "done") return (
    <span className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-[#0A0E17]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
  if (status === "running") return <span className="w-6 h-6 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin flex-shrink-0" />;
  if (status === "error") return (
    <span className="w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  );
  return <span className="w-6 h-6 rounded-full border-2 border-gray-700 flex-shrink-0" />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function ReportBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Brand config
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Other");
  const [niche, setNiche] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectedFrom, setDetectedFrom] = useState<string | null>(null);
  const [baseCompetitors, setBaseCompetitors] = useState<string[]>([]);
  const [extraCompetitorNames, setExtraCompetitorNames] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");

  // Report config
  const [scanDepth, setScanDepth] = useState<ScanDepth>("standard");
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt-4o-mini", "claude-3-haiku", "gemini-2.5-flash"]);
  const [multiRegion, setMultiRegion] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["global"]);
  const [modules, setModules] = useState<ReportConfig["modules"]>({
    persona: false, commerce: false, sentiment: false,
    citations: false, improvementPlan: true, categoryBenchmark: false,
  });

  // UI state
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>("standard");
  const [scanning, setScanning] = useState(false);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const stepsRef = useRef<StepState[]>([]);

  const allModels = useMemo(() => getAvailableModels(), []);

  // Auto-check Commerce Deep Dive for commerce categories
  useEffect(() => {
    if (COMMERCE_CATS.includes(category)) {
      setModules((prev) => ({ ...prev, commerce: true }));
    }
  }, [category]);

  // Pre-fill URL from ?url= param or pendingUrl in localStorage
  useEffect(() => {
    const paramUrl = searchParams.get("url");
    const pending = localStorage.getItem("pendingUrl");
    const initial = paramUrl || pending || "";
    if (initial) {
      setUrl(initial);
      if (pending) localStorage.removeItem("pendingUrl");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch token balance
  useEffect(() => {
    trackReportBuilderOpened();
    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((d) => typeof d.balance === "number" && setTokenBalance(d.balance));
  }, []);

  // ── Cost calculation ──────────────────────────────────────────────────────

  const allCompetitors = [...baseCompetitors, ...extraCompetitorNames];

  const reportConfig: ReportConfig = useMemo(() => ({
    scanDepth,
    models: selectedModels,
    competitorCount: allCompetitors.length,
    regionCount: multiRegion ? selectedRegions.length : 1,
    modules,
  }), [scanDepth, selectedModels, allCompetitors.length, multiRegion, selectedRegions.length, modules]);

  const cost = useMemo(() => calculateReportCost(reportConfig), [reportConfig]);
  const totalCost = cost.totalTokens;

  // Delta cost per module (computed once per render since it's pure)
  const moduleDeltaMap = useMemo<Record<ModuleKey, number>>(() => {
    const base = (k: ModuleKey) => getModuleDelta(reportConfig, k);
    return {
      persona: base("persona"), commerce: base("commerce"), sentiment: base("sentiment"),
      citations: base("citations"), improvementPlan: base("improvementPlan"), categoryBenchmark: base("categoryBenchmark"),
    };
  }, [reportConfig]);

  // Template costs (default 2 models, 0 competitors)
  const templateCosts = useMemo(() => {
    return TEMPLATES.map((t) => ({
      id: t.id,
      tokens: calculateReportCost({
        scanDepth: t.scanDepth,
        models: ["gpt-4o-mini", "claude-3-haiku"],
        competitorCount: 0,
        modules: { persona: false, commerce: false, sentiment: false, citations: false, improvementPlan: false, categoryBenchmark: false, ...t.modules },
      }).totalTokens,
    }));
  }, []);

  // ── Brand detection ───────────────────────────────────────────────────────

  async function detectFromUrl(targetUrl: string) {
    if (!targetUrl.trim()) return;
    setDetecting(true);
    try {
      const res = await fetch("/api/detect-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.brand_name) {
        setBrand(data.brand_name);
        if (data.category && data.category !== "Other") setCategory(data.category);
        if (data.niche) setNiche(data.niche);
        if (Array.isArray(data.competitors) && data.competitors.length > 0) {
          setBaseCompetitors(data.competitors.map((c: { name: string }) => c.name).filter(Boolean).slice(0, 3));
        }
        setDetectedFrom(targetUrl.trim());
      }
    } catch { /* ignore */ }
    finally { setDetecting(false); }
  }

  function addExtraCompetitor() {
    const name = competitorInput.trim();
    if (!name || allCompetitors.includes(name)) return;
    setExtraCompetitorNames((prev) => [...prev, name]);
    setCompetitorInput("");
    setActiveTemplate(null);
  }

  function removeCompetitor(name: string) {
    if (baseCompetitors.includes(name)) setBaseCompetitors((prev) => prev.filter((c) => c !== name));
    else setExtraCompetitorNames((prev) => prev.filter((c) => c !== name));
    setActiveTemplate(null);
  }

  function applyTemplate(t: Template) {
    setActiveTemplate(t.id);
    setScanDepth(t.scanDepth);
    const newModules = { persona: false, commerce: false, sentiment: false, citations: false, improvementPlan: false, categoryBenchmark: false, ...t.modules };
    if (COMMERCE_CATS.includes(category)) newModules.commerce = true;
    setModules(newModules);
    setExtraCompetitorNames([]);
  }

  function toggleModule(key: ModuleKey) {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
    setActiveTemplate(null);
  }

  function toggleModel(key: string) {
    if (!SCAN_CAPABLE.has(key)) return; // premium/coming-soon models not yet scannable
    setSelectedModels((prev) =>
      prev.includes(key)
        ? prev.filter((m) => m !== key)
        : [...prev, key]
    );
    setActiveTemplate(null);
  }

  // ── Step helpers ──────────────────────────────────────────────────────────

  function updateStep(id: string, status: StepState["status"]) {
    stepsRef.current = stepsRef.current.map((s) => s.id === id ? { ...s, status } : s);
    setSteps([...stepsRef.current]);
  }

  function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

  // ── Generate report ───────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!brand.trim() || !url.trim()) return;
    setScanError(null);
    setScanning(true);
    trackScanStarted({ brand: brand.trim(), url: url.trim(), depth: scanDepth, models: selectedModels });

    const useGemini = selectedModels.some((m) => MODEL_TO_PLATFORM[m] === "gemini");
    const initialSteps: StepState[] = [
      { id: "setup",   label: `Configuring report for ${brand}…`, status: "running" },
      { id: "chatgpt", label: "Querying ChatGPT…",                status: "pending" },
      { id: "claude",  label: "Querying Claude…",                 status: "pending" },
      ...(useGemini ? [{ id: "gemini", label: "Querying Gemini…", status: "pending" as const }] : []),
      { id: "analyze", label: "Analyzing responses with AI…",     status: "pending" },
      { id: "score",   label: "Calculating ShowsUp Score…",       status: "pending" },
    ];
    stepsRef.current = initialSteps;
    setSteps([...initialSteps]);

    await delay(600);
    updateStep("setup", "done");
    updateStep("chatgpt", "running");
    updateStep("claude", "running");
    if (useGemini) updateStep("gemini", "running");

    try {
      const addonKeys = (Object.keys(modules) as ModuleKey[]).filter((k) => modules[k]);
      // Map module keys back to the scan API's addon string format
      const addonMap: Record<ModuleKey, string> = {
        persona: "persona_analysis", commerce: "commerce_deep_dive", sentiment: "sentiment_deep_dive",
        citations: "citation_tracking", improvementPlan: "improvement_plan", categoryBenchmark: "category_benchmark",
      };

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.trim(),
          category,
          niche: niche || undefined,
          url: url.trim(),
          models: {
            chatgpt: selectedModels.some((m) => MODEL_TO_PLATFORM[m] === "chatgpt"),
            claude:  selectedModels.some((m) => MODEL_TO_PLATFORM[m] === "claude"),
            gemini:  selectedModels.some((m) => MODEL_TO_PLATFORM[m] === "gemini"),
          },
          competitors: allCompetitors,
          regions: multiRegion ? selectedRegions : ["global"],
          report_config: {
            type: scanDepth,
            addons: addonKeys.map((k) => addonMap[k]),
            extra_competitors: extraCompetitorNames.length,
          },
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        updateStep("chatgpt", "error");
        updateStep("claude", "error");
        if (useGemini) updateStep("gemini", "error");
        setScanError(`Insufficient tokens. Need ${data.required ?? totalCost}, have ${data.balance ?? 0}.`);
        setScanning(false);
        return;
      }

      if (res.status === 429) {
        updateStep("chatgpt", "error");
        updateStep("claude", "error");
        if (useGemini) updateStep("gemini", "error");
        setScanError("We're at capacity right now. Please try again in a few minutes — we're working on expanding our resources.");
        setScanning(false);
        return;
      }

      if (!res.ok) {
        updateStep("chatgpt", "error");
        updateStep("claude", "error");
        if (useGemini) updateStep("gemini", "error");
        trackScanFailed(data.error ?? "report_generation_failed");
        setScanError(data.error ?? "Report generation failed.");
        setScanning(false);
        return;
      }

      trackScanCompleted({ brand: brand.trim(), score: data.overall_score ?? 0, category, depth: scanDepth });
      updateStep("chatgpt", "done");
      updateStep("claude", "done");
      if (useGemini) updateStep("gemini", "done");
      updateStep("analyze", "running");
      await delay(700);
      updateStep("analyze", "done");
      updateStep("score", "running");
      await delay(400);
      updateStep("score", "done");

      window.dispatchEvent(new Event("tokenBalanceChanged"));

      await delay(300);
      router.push(data.scan_id ? `/app/report/${data.scan_id}` : "/app/scores");
    } catch {
      updateStep("chatgpt", "error");
      updateStep("claude", "error");
      if (useGemini) updateStep("gemini", "error");
      setScanError("Network error. Please try again.");
      setScanning(false);
    }
  }

  const estimatedMinutes = scanDepth === "deep" ? 4 : scanDepth === "standard" ? 2 : 1;
  const canGenerate = !!brand.trim() && !!url.trim() && selectedModels.length > 0 && (tokenBalance === null || tokenBalance >= totalCost);
  const needsMoreTokens = tokenBalance !== null && tokenBalance < totalCost;

  // ── Progress view ─────────────────────────────────────────────────────────

  if (scanning) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Generating Report…</h1>
          <p className="text-gray-400 text-sm">Querying AI models and calculating your ShowsUp Score.</p>
        </div>
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="pt-6 pb-6 space-y-4 min-h-[140px]">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <StepCircle status={step.status} />
                <span className={cn(
                  "text-sm",
                  step.status === "done"    ? "text-gray-400" :
                  step.status === "running" ? "text-white font-medium" :
                  step.status === "error"   ? "text-[#EF4444]" : "text-gray-600"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        {scanError && (
          <div className="rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 px-4 py-3">
            <p className="text-sm text-[#EF4444]">{scanError}</p>
            <button onClick={() => setScanning(false)} className="mt-2 text-xs text-gray-400 hover:text-white transition-colors underline">
              Go back to builder
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Builder view ──────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Report Builder</h1>
        <p className="text-gray-400 text-sm">Configure your report and see the cost update in real time.</p>
      </div>

      {/* Templates */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Start with a template</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((t) => {
            const tCost = templateCosts.find((tc) => tc.id === t.id)?.tokens ?? 0;
            return (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={cn(
                  "text-left rounded-xl border px-4 py-3 transition-all duration-150 space-y-1",
                  activeTemplate === t.id
                    ? "border-[#10B981]/50 bg-[#10B981]/10 ring-1 ring-[#10B981]/20"
                    : "border-white/10 bg-[#111827] hover:border-white/20 hover:bg-white/[0.03]"
                )}
              >
                <p className="text-sm font-semibold text-white">{t.label}</p>
                <p className="text-[11px] text-gray-500">{t.description}</p>
                <p className={cn("text-xs font-semibold", activeTemplate === t.id ? "text-[#10B981]" : "text-gray-400")}>
                  ~{tCost} 🪙
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-5">

          {/* Section 1: Brand */}
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-4">
              <p className="text-sm font-semibold text-white">Your Brand</p>

              <div className="flex gap-2">
                <Input
                  placeholder="https://yoursite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => !detectedFrom && detectFromUrl(url)}
                  className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981]"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15 whitespace-nowrap"
                  onClick={() => { setDetectedFrom(null); detectFromUrl(url); }}
                  disabled={detecting || !url.trim()}
                >
                  {detecting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Detect"}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Brand name</Label>
                  <div className="relative">
                    <Input
                      placeholder="e.g. Notion, Stripe"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981]"
                    />
                    {detecting && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="w-3.5 h-3.5 border-2 border-gray-600 border-t-[#10B981] rounded-full animate-spin block" />
                      </span>
                    )}
                  </div>
                  {detectedFrom && <p className="text-[11px] text-gray-600">Detected from {detectedFrom}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Category</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg bg-[#1F2937] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]"
                  >
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Competitors */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">
                  Competitors
                  {baseCompetitors.length > 0 && (
                    <span className="ml-1.5 text-gray-600 font-normal">({baseCompetitors.length} included free)</span>
                  )}
                </Label>
                {allCompetitors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {baseCompetitors.map((name) => (
                      <span key={name} className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 text-gray-300 rounded-full px-2.5 py-1">
                        {name}
                        <button type="button" onClick={() => removeCompetitor(name)} className="text-gray-600 hover:text-white">×</button>
                      </span>
                    ))}
                    {extraCompetitorNames.map((name) => (
                      <span key={name} className="inline-flex items-center gap-1 text-xs bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] rounded-full px-2.5 py-1">
                        {name}
                        <button type="button" onClick={() => removeCompetitor(name)} className="text-[#10B981]/60 hover:text-[#10B981]">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add competitor (updates cost)"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraCompetitor(); } }}
                    className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981] text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/15 text-sm"
                    onClick={addExtraCompetitor}
                    disabled={!competitorInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Report Depth */}
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-3">
              <p className="text-sm font-semibold text-white">Report Depth</p>
              {(
                [
                  { id: "quick_check" as ScanDepth, label: "Quick Check",     desc: "Basic score across 2 platforms, 8 queries"              },
                  { id: "standard"    as ScanDepth, label: "Standard Report", desc: "20 queries, competitor benchmark, recommendations"       },
                  { id: "deep"        as ScanDepth, label: "Deep Analysis",   desc: "50 queries, all platforms, comprehensive analysis"       },
                ]
              ).map((opt) => {
                const optCost = calculateReportCost({ ...reportConfig, scanDepth: opt.id, modules: { persona: false, commerce: false, sentiment: false, citations: false, improvementPlan: false, categoryBenchmark: false } }).totalTokens;
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
                      scanDepth === opt.id ? "border-[#10B981]/40 bg-[#10B981]/8" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <input
                      type="radio"
                      name="scanDepth"
                      value={opt.id}
                      checked={scanDepth === opt.id}
                      onChange={() => { setScanDepth(opt.id); setActiveTemplate(null); }}
                      className="mt-0.5 accent-[#10B981]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{opt.label}</span>
                        <span className="text-xs font-semibold text-[#10B981]">{optCost} 🪙</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>

          {/* Section 3: AI Models */}
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-3">
              <p className="text-sm font-semibold text-white">AI Models</p>
              <div className="space-y-2">
                {allModels.map((model) => {
                  const isSelected   = selectedModels.includes(model.key);
                  const isCapable    = SCAN_CAPABLE.has(model.key);
                  const isComingSoon = COMING_SOON_PROVIDERS.has(model.provider);
                  const costWith    = calculateReportCost({ ...reportConfig, models: [...selectedModels.filter((m) => m !== model.key), model.key] }).totalTokens;
                  const costWithout = calculateReportCost({ ...reportConfig, models: selectedModels.filter((m) => m !== model.key) }).totalTokens;
                  const delta       = costWith - costWithout;

                  return (
                    <div
                      key={model.key}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3.5 py-3 transition-all",
                        isComingSoon  ? "border-white/5 opacity-40" :
                        isCapable     ? (isSelected ? "border-[#10B981]/30 bg-[#10B981]/5" : "border-white/10 hover:border-white/20 cursor-pointer") :
                        "border-white/5 opacity-50"
                      )}
                      onClick={() => isCapable && !isComingSoon && toggleModel(model.key)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          disabled={!isCapable || isComingSoon}
                          className="w-4 h-4 rounded accent-[#10B981] disabled:opacity-60 pointer-events-none"
                        />
                        <div>
                          <span className="text-sm text-white">{model.label}</span>
                          <span className={cn(
                            "ml-2 text-[10px] rounded-full px-1.5 py-0.5 font-medium",
                            model.tier === 'free' ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#F59E0B]/20 text-[#F59E0B]"
                          )}>
                            {model.tier}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">
                        {isComingSoon ? "Coming soon" :
                         !isCapable   ? `+${delta} 🪙 (coming soon)` :
                         isSelected   ? `${delta} 🪙` :
                         `+${delta} 🪙`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Regions */}
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-3">
              <p className="text-sm font-semibold text-white">Geography</p>
              <div className="space-y-2">
                <label className={cn(
                  "flex items-start gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-all",
                  !multiRegion ? "border-[#10B981]/40 bg-[#10B981]/8" : "border-white/10 hover:border-white/20"
                )}>
                  <input
                    type="radio"
                    name="regionMode"
                    checked={!multiRegion}
                    onChange={() => { setMultiRegion(false); setSelectedRegions(["global"]); }}
                    className="mt-0.5 accent-[#10B981]"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">🌍 Global</span>
                    <p className="text-xs text-gray-500 mt-0.5">Single worldwide scan — no extra cost</p>
                  </div>
                </label>
                <label className={cn(
                  "flex items-start gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-all",
                  multiRegion ? "border-[#10B981]/40 bg-[#10B981]/8" : "border-white/10 hover:border-white/20"
                )}>
                  <input
                    type="radio"
                    name="regionMode"
                    checked={multiRegion}
                    onChange={() => setMultiRegion(true)}
                    className="mt-0.5 accent-[#10B981]"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Multi-Region</span>
                    <p className="text-xs text-gray-500 mt-0.5">Scan multiple regions — +20 🪙 per extra region</p>
                  </div>
                </label>
              </div>

              {multiRegion && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {REGIONS.filter((r) => r.code !== "global").map((r) => {
                    const checked = selectedRegions.includes(r.code);
                    return (
                      <label
                        key={r.code}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all text-sm",
                          checked ? "border-[#10B981]/30 bg-[#10B981]/5 text-white" : "border-white/10 text-gray-400 hover:border-white/20"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedRegions((prev) =>
                              checked
                                ? prev.filter((c) => c !== r.code)
                                : [...prev, r.code]
                            );
                          }}
                          className="w-3.5 h-3.5 accent-[#10B981]"
                        />
                        <span>{r.flag} {r.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Analysis Modules */}
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-3">
              <p className="text-sm font-semibold text-white">Analysis Modules</p>
              <div className="space-y-2">
                {(Object.keys(MODULE_META) as ModuleKey[]).map((key) => {
                  const meta   = MODULE_META[key];
                  const isAuto = meta.autoFor?.includes(category) && key === "commerce";
                  const delta  = moduleDeltaMap[key];
                  return (
                    <label
                      key={key}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-all",
                        modules[key] ? "border-[#10B981]/30 bg-[#10B981]/5" : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={modules[key]}
                        onChange={() => toggleModule(key)}
                        className="mt-0.5 w-4 h-4 rounded accent-[#10B981]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white">{meta.label}</span>
                            {isAuto && (
                              <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-1.5 py-0.5 rounded-full">Auto</span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-400">+{delta} 🪙</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sticky Price Summary */}
        <div className="lg:sticky lg:top-6 space-y-3">
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-4">
              <p className="text-sm font-semibold text-white">Report Cost Breakdown</p>

              {/* Breakdown line items */}
              <div className="space-y-1.5">
                {cost.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs gap-2">
                    <span className="text-gray-400 truncate">{item.description}</span>
                    <span className="text-gray-300 tabular-nums font-medium whitespace-nowrap flex-shrink-0">{item.tokens} 🪙</span>
                  </div>
                ))}

                {/* Divider + Total */}
                <div className="border-t border-white/10 pt-2 mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-xl font-bold text-white tabular-nums">{totalCost} 🪙</span>
                </div>
              </div>

              {/* Balance info */}
              {tokenBalance !== null && (
                <div className="rounded-xl bg-white/5 border border-white/8 px-3 py-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Your balance</span>
                    <span className={cn("font-semibold tabular-nums", tokenBalance >= totalCost ? "text-[#10B981]" : "text-[#EF4444]")}>
                      {tokenBalance.toLocaleString()} 🪙
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">After report</span>
                    <span className={cn("font-semibold tabular-nums", tokenBalance - totalCost >= 0 ? "text-gray-300" : "text-[#EF4444]")}>
                      {tokenBalance >= totalCost
                        ? `${(tokenBalance - totalCost).toLocaleString()} 🪙 remaining`
                        : `Need ${(totalCost - tokenBalance).toLocaleString()} more`}
                    </span>
                  </div>
                </div>
              )}

              {/* Error */}
              {scanError && (
                <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">
                  {scanError}
                </p>
              )}

              {/* Generate button */}
              {needsMoreTokens ? (
                <div className="space-y-2">
                  <Button disabled className="w-full bg-white/5 text-gray-500 font-semibold cursor-not-allowed border border-white/10">
                    Need {(totalCost - (tokenBalance ?? 0)).toLocaleString()} more 🪙
                  </Button>
                  <Link
                    href="/app/tokens"
                    className="block text-center text-xs text-[#10B981] hover:underline py-0.5"
                  >
                    💡 Buy more tokens →
                  </Link>
                </div>
              ) : (
                <Button
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  Generate Report — {totalCost} 🪙
                </Button>
              )}

              {!brand.trim() && (
                <p className="text-center text-xs text-gray-600">Enter a website URL to get started</p>
              )}

              <div className="flex items-center gap-1.5 justify-center">
                <Info className="w-3 h-3 text-gray-600" />
                <p className="text-xs text-gray-600">~{estimatedMinutes} minute{estimatedMinutes !== 1 ? "s" : ""} estimated</p>
              </div>

              {/* Cost explanation */}
              <details className="group">
                <summary className="text-[11px] text-gray-600 cursor-pointer hover:text-gray-400 transition-colors list-none flex items-center gap-1">
                  <span className="group-open:hidden">ℹ How is cost calculated?</span>
                  <span className="hidden group-open:inline">ℹ Hide explanation</span>
                </summary>
                <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                  Token costs reflect the actual AI compute needed for your report. Premium models cost more because they provide deeper analysis. We add a 20% margin for reliability and overhead.
                </p>
              </details>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-gray-600" />
            <Link href="/app/tokens" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Buy more tokens
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportBuilderPageWrapper() {
  return (
    <Suspense>
      <ReportBuilderPage />
    </Suspense>
  );
}
