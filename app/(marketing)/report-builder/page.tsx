"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  calculateReportCost,
  getAvailableModels,
  getModuleDelta,
  type ReportConfig,
} from "@/lib/pricing/cost-calculator";
import { Zap, Info, ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

// ── Constants ─────────────────────────────────────────────────────────────────

const COMMERCE_CATS = ["Insurance", "Travel", "Finance", "E-commerce"];
const CATEGORIES = ["Insurance", "Travel", "Finance", "E-commerce", "SaaS", "Healthcare", "Other"];

type ScanDepth = "quick_check" | "standard" | "deep";
type ModuleKey = keyof ReportConfig["modules"];

const MODULE_META: Record<ModuleKey, { label: string; desc: string; autoFor?: string[] }> = {
  persona:           { label: "Persona-Based Analysis",  desc: "Test from 5 different buyer perspectives" },
  commerce:          { label: "Commerce Deep Dive",       desc: "15 purchase-intent queries", autoFor: COMMERCE_CATS },
  sentiment:         { label: "Detailed Sentiment",       desc: "How AI describes your brand in depth" },
  citations:         { label: "Citation Page Tracking",   desc: "Which of your pages AI cites" },
  improvementPlan:   { label: "AI Improvement Plan",      desc: "Prioritized 3-tier action roadmap" },
  categoryBenchmark: { label: "Category Benchmarking",    desc: "Compare to your industry average" },
};

const MODEL_TO_PLATFORM: Record<string, string> = {
  "gpt-4o-mini":      "chatgpt",
  "gpt-4o":           "chatgpt",
  "claude-3-haiku":   "claude",
  "claude-sonnet":    "claude",
  "gemini-2.5-flash": "gemini",
};

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
  { id: "quick",       label: "Quick Check",       description: "Basic score, 2 platforms",         scanDepth: "quick_check", modules: {},                                                                                                         extraCompetitors: 0 },
  { id: "standard",    label: "Standard Report",   description: "Full scan + improvement plan",     scanDepth: "standard",    modules: { improvementPlan: true },                                                                                  extraCompetitors: 0 },
  { id: "competitive", label: "Competitive Intel", description: "Competitors, sentiment, personas", scanDepth: "standard",    modules: { persona: true, sentiment: true },                                                                         extraCompetitors: 2 },
  { id: "full",        label: "Full Analysis",     description: "Everything, all modules",          scanDepth: "deep",        modules: { persona: true, commerce: true, sentiment: true, citations: true, improvementPlan: true, categoryBenchmark: true }, extraCompetitors: 4 },
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReportBuilderPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0E17]" />}>
      <PublicReportBuilderPage />
    </Suspense>
  );
}

function PublicReportBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

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
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt-4o-mini", "claude-3-haiku"]);
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

  // ── Auth check + config restore ───────────────────────────────────────────

  function applyTemplate(t: Template) {
    setActiveTemplate(t.id);
    setScanDepth(t.scanDepth);
    const newModules = { persona: false, commerce: false, sentiment: false, citations: false, improvementPlan: false, categoryBenchmark: false, ...t.modules };
    if (COMMERCE_CATS.includes(category)) newModules.commerce = true;
    setModules(newModules);
    setExtraCompetitorNames([]);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setAuthChecked(true);
      if (session) {
        fetch("/api/tokens/balance")
          .then((r) => r.json())
          .then((d) => typeof d.balance === "number" && setTokenBalance(d.balance))
          .catch(() => {});
      }
    });

    // Restore pending config from localStorage (after signup redirect)
    const saved = localStorage.getItem("pendingReportConfig");
    if (saved) {
      try {
        const cfg = JSON.parse(saved);
        if (cfg.url) setUrl(cfg.url);
        if (cfg.brand) setBrand(cfg.brand);
        if (cfg.category) setCategory(cfg.category);
        if (cfg.niche) setNiche(cfg.niche);
        if (Array.isArray(cfg.baseCompetitors)) setBaseCompetitors(cfg.baseCompetitors);
        if (Array.isArray(cfg.extraCompetitorNames)) setExtraCompetitorNames(cfg.extraCompetitorNames);
        if (cfg.scanDepth) setScanDepth(cfg.scanDepth);
        if (Array.isArray(cfg.selectedModels)) setSelectedModels(cfg.selectedModels);
        if (cfg.modules) setModules(cfg.modules);
        if (cfg.activeTemplate) setActiveTemplate(cfg.activeTemplate);
        localStorage.removeItem("pendingReportConfig");
      } catch { /* ignore */ }
      return; // Don't apply URL template param if we restored config
    }

    // Apply template from URL param
    const templateId = searchParams.get("template");
    if (templateId) {
      const t = TEMPLATES.find((tmpl) => tmpl.id === templateId);
      if (t) applyTemplate(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-check Commerce for commerce categories
  useEffect(() => {
    if (COMMERCE_CATS.includes(category)) {
      setModules((prev) => ({ ...prev, commerce: true }));
    }
  }, [category]);

  // ── Cost calculation ──────────────────────────────────────────────────────

  const allCompetitors = [...baseCompetitors, ...extraCompetitorNames];

  const reportConfig: ReportConfig = useMemo(() => ({
    scanDepth, models: selectedModels, competitorCount: allCompetitors.length, modules,
  }), [scanDepth, selectedModels, allCompetitors.length, modules]);

  const cost = useMemo(() => calculateReportCost(reportConfig), [reportConfig]);
  const totalCost = cost.totalTokens;

  const moduleDeltaMap = useMemo<Record<ModuleKey, number>>(() => {
    const base = (k: ModuleKey) => getModuleDelta(reportConfig, k);
    return {
      persona: base("persona"), commerce: base("commerce"), sentiment: base("sentiment"),
      citations: base("citations"), improvementPlan: base("improvementPlan"), categoryBenchmark: base("categoryBenchmark"),
    };
  }, [reportConfig]);

  const templateCosts = useMemo(() => TEMPLATES.map((t) => ({
    id: t.id,
    tokens: calculateReportCost({
      scanDepth: t.scanDepth, models: ["gpt-4o-mini", "claude-3-haiku"], competitorCount: 0,
      modules: { persona: false, commerce: false, sentiment: false, citations: false, improvementPlan: false, categoryBenchmark: false, ...t.modules },
    }).totalTokens,
  })), []);

  // ── Brand detection ───────────────────────────────────────────────────────

  async function detectFromUrl(targetUrl: string) {
    if (!targetUrl.trim()) return;
    setDetecting(true);
    try {
      const res = await fetch("/api/detect-brand", {
        method: "POST", headers: { "Content-Type": "application/json" },
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

  function toggleModule(key: ModuleKey) {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
    setActiveTemplate(null);
  }

  function toggleModel(key: string) {
    if (!SCAN_CAPABLE.has(key)) return;
    setSelectedModels((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
    setActiveTemplate(null);
  }

  // ── Step helpers ──────────────────────────────────────────────────────────

  function updateStep(id: string, status: StepState["status"]) {
    stepsRef.current = stepsRef.current.map((s) => s.id === id ? { ...s, status } : s);
    setSteps([...stepsRef.current]);
  }

  function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

  // ── Generate ──────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!brand.trim() || !url.trim()) return;

    // Not logged in → save config + redirect to signup
    if (!isLoggedIn) {
      localStorage.setItem("pendingReportConfig", JSON.stringify({
        url, brand, category, niche, baseCompetitors, extraCompetitorNames,
        scanDepth, selectedModels, modules, activeTemplate,
      }));
      router.push("/signup");
      return;
    }

    setScanError(null);
    setScanning(true);

    const initialSteps: StepState[] = [
      { id: "setup",   label: `Configuring report for ${brand}…`, status: "running" },
      { id: "chatgpt", label: "Querying ChatGPT…",                status: "pending" },
      { id: "claude",  label: "Querying Claude…",                 status: "pending" },
      { id: "analyze", label: "Analyzing responses with AI…",     status: "pending" },
      { id: "score",   label: "Calculating ShowsUp Score…",       status: "pending" },
    ];
    stepsRef.current = initialSteps;
    setSteps([...initialSteps]);

    await delay(600);
    updateStep("setup", "done");
    updateStep("chatgpt", "running");
    updateStep("claude", "running");

    try {
      const addonKeys = (Object.keys(modules) as ModuleKey[]).filter((k) => modules[k]);
      const addonMap: Record<ModuleKey, string> = {
        persona: "persona_analysis", commerce: "commerce_deep_dive", sentiment: "sentiment_deep_dive",
        citations: "citation_tracking", improvementPlan: "improvement_plan", categoryBenchmark: "category_benchmark",
      };

      const res = await fetch("/api/scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.trim(), category, niche: niche || undefined, url: url.trim(),
          models: {
            chatgpt: selectedModels.some((m) => MODEL_TO_PLATFORM[m] === "chatgpt"),
            claude:  selectedModels.some((m) => MODEL_TO_PLATFORM[m] === "claude"),
          },
          competitors: allCompetitors,
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
        setScanError(`Insufficient tokens. Need ${data.required ?? totalCost}, have ${data.balance ?? 0}.`);
        setScanning(false);
        return;
      }

      if (!res.ok) {
        updateStep("chatgpt", "error");
        updateStep("claude", "error");
        setScanError(data.error ?? "Report generation failed.");
        setScanning(false);
        return;
      }

      updateStep("chatgpt", "done");
      updateStep("claude", "done");
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
      setScanError("Network error. Please try again.");
      setScanning(false);
    }
  }

  const estimatedMinutes = scanDepth === "deep" ? 4 : scanDepth === "standard" ? 2 : 1;
  const needsMoreTokens = isLoggedIn && tokenBalance !== null && tokenBalance < totalCost;
  const canGenerate = !!brand.trim() && !!url.trim() && selectedModels.length > 0 && !needsMoreTokens;

  // ── Progress view ─────────────────────────────────────────────────────────

  if (scanning) {
    return (
      <div className="min-h-screen bg-[#0A0E17] flex flex-col">
        <MarketingNav />
        <div className="flex-1 p-8 max-w-2xl mx-auto w-full space-y-6 pt-24">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">Generating Report…</h1>
            <p className="text-gray-400 text-sm">Querying AI models and calculating your ShowsUp Score.</p>
          </div>
          <div className="bg-[#111827] border border-white/10 rounded-xl p-6 space-y-4 min-h-[140px]">
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
          </div>
          {scanError && (
            <div className="rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 px-4 py-3">
              <p className="text-sm text-[#EF4444]">{scanError}</p>
              <button onClick={() => setScanning(false)} className="mt-2 text-xs text-gray-400 hover:text-white underline">
                Go back to builder
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Builder view ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0E17]">
      <MarketingNav />

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Report Builder</h1>
          <p className="text-gray-400 text-sm">Configure your report and see the token cost update in real time.</p>
          {!authChecked ? null : !isLoggedIn && (
            <div className="inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/25 rounded-lg px-3 py-1.5 text-xs text-[#10B981]">
              🎁 Sign up for 1,000 free tokens — enough to generate this report
            </div>
          )}
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

            {/* Brand */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 space-y-4">
              <p className="text-sm font-semibold text-white">Your Brand</p>

              <div className="flex gap-2">
                <input
                  placeholder="https://yoursite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => !detectedFrom && detectFromUrl(url)}
                  className="flex-1 rounded-lg bg-[#1F2937] border border-white/10 text-white placeholder:text-gray-600 px-3 py-2 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => { setDetectedFrom(null); detectFromUrl(url); }}
                  disabled={detecting || !url.trim()}
                  className="border border-white/20 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 whitespace-nowrap bg-transparent"
                >
                  {detecting ? <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin block" /> : "Detect"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-gray-400 text-xs">Brand name</label>
                  <div className="relative">
                    <input
                      placeholder="e.g. Notion, Stripe"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full rounded-lg bg-[#1F2937] border border-white/10 text-white placeholder:text-gray-600 px-3 py-2 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
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
                  <label className="text-gray-400 text-xs">Category</label>
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
                <label className="text-gray-400 text-xs">
                  Competitors
                  {baseCompetitors.length > 0 && (
                    <span className="ml-1.5 text-gray-600 font-normal">({baseCompetitors.length} included)</span>
                  )}
                </label>
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
                  <input
                    placeholder="Add competitor (updates cost)"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraCompetitor(); } }}
                    className="flex-1 rounded-lg bg-[#1F2937] border border-white/10 text-white placeholder:text-gray-600 px-3 py-2 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addExtraCompetitor}
                    disabled={!competitorInput.trim()}
                    className="border border-white/20 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 bg-transparent"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Report Depth */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-white">Report Depth</p>
              {([
                { id: "quick_check" as ScanDepth, label: "Quick Check",     desc: "Basic score across 2 platforms, 8 queries"              },
                { id: "standard"    as ScanDepth, label: "Standard Report", desc: "20 queries, competitor benchmark, recommendations"       },
                { id: "deep"        as ScanDepth, label: "Deep Analysis",   desc: "50 queries, all platforms, comprehensive analysis"       },
              ]).map((opt) => {
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
                      type="radio" name="scanDepth" value={opt.id} checked={scanDepth === opt.id}
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
            </div>

            {/* AI Models */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 space-y-3">
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
                      onClick={() => isCapable && !isComingSoon && toggleModel(model.key)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3.5 py-3 transition-all",
                        isComingSoon  ? "border-white/5 opacity-40" :
                        isCapable     ? (isSelected ? "border-[#10B981]/30 bg-[#10B981]/5 cursor-pointer" : "border-white/10 hover:border-white/20 cursor-pointer") :
                        "border-white/5 opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={isSelected} readOnly disabled={!isCapable || isComingSoon}
                          className="w-4 h-4 rounded accent-[#10B981] disabled:opacity-60 pointer-events-none" />
                        <div>
                          <span className="text-sm text-white">{model.label}</span>
                          <span className={cn(
                            "ml-2 text-[10px] rounded-full px-1.5 py-0.5 font-medium",
                            model.tier === "free" ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#F59E0B]/20 text-[#F59E0B]"
                          )}>
                            {model.tier}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">
                        {isComingSoon ? "Coming soon" : !isCapable ? `+${delta} 🪙 (soon)` : isSelected ? `${delta} 🪙` : `+${delta} 🪙`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis Modules */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 space-y-3">
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
                      <input type="checkbox" checked={modules[key]} onChange={() => toggleModule(key)}
                        className="mt-0.5 w-4 h-4 rounded accent-[#10B981]" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white">{meta.label}</span>
                            {isAuto && <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-1.5 py-0.5 rounded-full">Auto</span>}
                          </div>
                          <span className="text-xs font-semibold text-gray-400">+{delta} 🪙</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Cost Summary */}
          <div className="lg:sticky lg:top-6 space-y-3">
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 space-y-4">
              <p className="text-sm font-semibold text-white">Report Cost Breakdown</p>

              <div className="space-y-1.5">
                {cost.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs gap-2">
                    <span className="text-gray-400 truncate">{item.description}</span>
                    <span className="text-gray-300 tabular-nums font-medium whitespace-nowrap flex-shrink-0">{item.tokens} 🪙</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-xl font-bold text-white tabular-nums">{totalCost} 🪙</span>
                </div>
              </div>

              {/* Balance info (logged in) */}
              {isLoggedIn && tokenBalance !== null && (
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

              {/* Not logged in — show signup prompt */}
              {!isLoggedIn && authChecked && (
                <div className="rounded-xl bg-[#10B981]/8 border border-[#10B981]/20 px-3 py-3 space-y-1">
                  <p className="text-xs text-[#10B981] font-semibold">🎁 1,000 free tokens on signup</p>
                  <p className="text-[11px] text-gray-500">Enough to generate this report and more.</p>
                </div>
              )}

              {scanError && (
                <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">
                  {scanError}
                </p>
              )}

              {/* Generate / Get tokens / Signup button */}
              {needsMoreTokens ? (
                <div className="space-y-2">
                  <button disabled className="w-full bg-white/5 text-gray-500 font-semibold cursor-not-allowed border border-white/10 rounded-lg py-2.5 text-sm">
                    Need {(totalCost - (tokenBalance ?? 0)).toLocaleString()} more 🪙
                  </button>
                  <Link href="/app/tokens" className="block text-center text-xs text-[#10B981] hover:underline py-0.5">
                    💡 Buy more tokens →
                  </Link>
                </div>
              ) : !isLoggedIn && authChecked ? (
                <button
                  onClick={handleGenerate}
                  disabled={!brand.trim() || !url.trim() || selectedModels.length === 0}
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Get 1,000 free tokens &amp; generate
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate Report — {totalCost} 🪙
                </button>
              )}

              {!brand.trim() && (
                <p className="text-center text-xs text-gray-600">Enter a website URL to get started</p>
              )}

              <div className="flex items-center gap-1.5 justify-center">
                <Info className="w-3 h-3 text-gray-600" />
                <p className="text-xs text-gray-600">~{estimatedMinutes} minute{estimatedMinutes !== 1 ? "s" : ""} estimated</p>
              </div>

              <details className="group">
                <summary className="text-[11px] text-gray-600 cursor-pointer hover:text-gray-400 transition-colors list-none flex items-center gap-1">
                  <span className="group-open:hidden">ℹ How is cost calculated?</span>
                  <span className="hidden group-open:inline">ℹ Hide explanation</span>
                </summary>
                <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                  Token costs reflect actual AI compute needed for your report. Premium models cost more because they provide deeper analysis. We add a 20% margin for reliability.
                </p>
              </details>
            </div>

            {isLoggedIn && (
              <div className="flex items-center justify-center">
                <Link href="/app/tokens" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  Buy more tokens →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}

