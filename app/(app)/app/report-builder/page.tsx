"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins, Zap, ChevronDown, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const COMMERCE_CATS = ["Insurance", "Travel", "Finance", "E-commerce"];
const CATEGORIES = ["Insurance", "Travel", "Finance", "E-commerce", "SaaS", "Healthcare", "Other"];

const BASE_COSTS = { quick_check: 50, standard: 150, deep: 400 } as const;
type ReportType = keyof typeof BASE_COSTS;

const ADDON_COSTS = {
  persona_analysis:    50,
  commerce_deep_dive:  50,
  sentiment_deep_dive: 30,
  citation_tracking:   25,
  improvement_plan:    40,
  category_benchmark:  35,
} as const;
type AddonKey = keyof typeof ADDON_COSTS;

const EXTRA_COMPETITOR_COST = 30;

// ── Templates ─────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  label: string;
  value: string;
  description: string;
  reportType: ReportType;
  addons: AddonKey[];
  extraCompetitors: number;
}

const TEMPLATES: Template[] = [
  {
    id: "quick",
    label: "Quick Check",
    value: "~50 🪙",
    description: "Basic score, 2 platforms",
    reportType: "quick_check",
    addons: [],
    extraCompetitors: 0,
  },
  {
    id: "standard",
    label: "Standard Report",
    value: "~190 🪙",
    description: "Full scan + improvement plan",
    reportType: "standard",
    addons: ["improvement_plan"],
    extraCompetitors: 0,
  },
  {
    id: "competitive",
    label: "Competitive Intel",
    value: "~290 🪙",
    description: "Competitors, sentiment, personas",
    reportType: "standard",
    addons: ["persona_analysis", "sentiment_deep_dive"],
    extraCompetitors: 2,
  },
  {
    id: "full",
    label: "Full Analysis",
    value: "~630 🪙",
    description: "Everything, all modules",
    reportType: "deep",
    addons: ["persona_analysis", "commerce_deep_dive", "sentiment_deep_dive", "citation_tracking", "improvement_plan", "category_benchmark"],
    extraCompetitors: 4,
  },
];

// ── Step indicator for progress view ──────────────────────────────────────────

interface StepState {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
}

function StepCircle({ status }: { status: StepState["status"] }) {
  if (status === "done") {
    return (
      <span className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-[#0A0E17]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === "running") {
    return <span className="w-6 h-6 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin flex-shrink-0" />;
  }
  if (status === "error") {
    return (
      <span className="w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    );
  }
  return <span className="w-6 h-6 rounded-full border-2 border-gray-700 flex-shrink-0" />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportBuilderPage() {
  const router = useRouter();

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
  const [reportType, setReportType] = useState<ReportType>("standard");
  const [addons, setAddons] = useState<Record<AddonKey, boolean>>({
    persona_analysis:    false,
    commerce_deep_dive:  false,
    sentiment_deep_dive: false,
    citation_tracking:   false,
    improvement_plan:    true,
    category_benchmark:  false,
  });

  // Token balance
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  // Active template
  const [activeTemplate, setActiveTemplate] = useState<string | null>("standard");

  // Progress / scanning
  const [scanning, setScanning] = useState(false);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const stepsRef = useRef<StepState[]>([]);

  // Auto-check Commerce Deep Dive for commerce categories
  useEffect(() => {
    if (COMMERCE_CATS.includes(category)) {
      setAddons((prev) => ({ ...prev, commerce_deep_dive: true }));
    }
  }, [category]);

  // Fetch token balance
  useEffect(() => {
    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((d) => typeof d.balance === "number" && setTokenBalance(d.balance));
  }, []);

  // ── Cost calculation ──────────────────────────────────────────────────────

  const totalCost = useMemo(() => {
    const base = BASE_COSTS[reportType];
    const addonCost = (Object.keys(addons) as AddonKey[]).reduce(
      (sum, k) => sum + (addons[k] ? ADDON_COSTS[k] : 0),
      0
    );
    const competitorCost = extraCompetitorNames.length * EXTRA_COMPETITOR_COST;
    return base + addonCost + competitorCost;
  }, [reportType, addons, extraCompetitorNames]);

  const allCompetitors = [...baseCompetitors, ...extraCompetitorNames];

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
    } catch {
      // ignore
    } finally {
      setDetecting(false);
    }
  }

  function addExtraCompetitor() {
    const name = competitorInput.trim();
    if (!name || allCompetitors.includes(name)) return;
    setExtraCompetitorNames((prev) => [...prev, name]);
    setCompetitorInput("");
    setActiveTemplate(null);
  }

  function removeCompetitor(name: string) {
    if (baseCompetitors.includes(name)) {
      setBaseCompetitors((prev) => prev.filter((c) => c !== name));
    } else {
      setExtraCompetitorNames((prev) => prev.filter((c) => c !== name));
    }
    setActiveTemplate(null);
  }

  function applyTemplate(t: Template) {
    setActiveTemplate(t.id);
    setReportType(t.reportType);
    const newAddons = { ...addons };
    (Object.keys(newAddons) as AddonKey[]).forEach((k) => { newAddons[k] = false; });
    t.addons.forEach((a) => { newAddons[a] = true; });
    // Auto-preserve commerce deep dive if applicable
    if (COMMERCE_CATS.includes(category)) newAddons.commerce_deep_dive = true;
    setAddons(newAddons);
    // Handle extra competitors from template
    if (t.extraCompetitors > 0 && extraCompetitorNames.length < t.extraCompetitors) {
      // Just note how many extras the template expects — user adds names manually
    }
    setExtraCompetitorNames([]);
  }

  function toggleAddon(key: AddonKey) {
    setAddons((prev) => ({ ...prev, [key]: !prev[key] }));
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

    const initialSteps: StepState[] = [
      { id: "setup",     label: `Configuring report for ${brand}…`,    status: "running" },
      { id: "chatgpt",   label: "Querying ChatGPT…",                    status: "pending" },
      { id: "claude",    label: "Querying Claude…",                     status: "pending" },
      { id: "analyze",   label: "Analyzing responses with AI…",         status: "pending" },
      { id: "score",     label: "Calculating ShowsUp Score…",           status: "pending" },
    ];
    stepsRef.current = initialSteps;
    setSteps([...initialSteps]);

    await delay(600);
    updateStep("setup", "done");
    updateStep("chatgpt", "running");
    updateStep("claude", "running");

    try {
      const reportConfig = {
        type: reportType,
        addons: (Object.keys(addons) as AddonKey[]).filter((k) => addons[k]),
        extra_competitors: extraCompetitorNames.length,
      };

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.trim(),
          category,
          niche: niche || undefined,
          url: url.trim(),
          models: { chatgpt: true, claude: true },
          competitors: allCompetitors,
          report_config: reportConfig,
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
      if (data.scan_id) {
        router.push(`/app/scores/${data.scan_id}`);
      } else {
        router.push("/app/scores");
      }
    } catch {
      updateStep("chatgpt", "error");
      updateStep("claude", "error");
      setScanError("Network error. Please try again.");
      setScanning(false);
    }
  }

  // ── Estimate time ─────────────────────────────────────────────────────────

  const estimatedMinutes = reportType === "deep" ? 4 : reportType === "standard" ? 2 : 1;

  // ── Addon line items for summary ──────────────────────────────────────────

  const activeAddonLines = (Object.keys(addons) as AddonKey[]).filter((k) => addons[k]);
  const ADDON_LABELS: Record<AddonKey, string> = {
    persona_analysis:    "Persona Analysis",
    commerce_deep_dive:  "Commerce Deep Dive",
    sentiment_deep_dive: "Sentiment Analysis",
    citation_tracking:   "Citation Tracking",
    improvement_plan:    "AI Improvement Plan",
    category_benchmark:  "Category Benchmark",
  };

  const canGenerate = !!brand.trim() && !!url.trim() && (tokenBalance === null || tokenBalance >= totalCost);
  const needsMoreTokens = tokenBalance !== null && tokenBalance < totalCost;
  const cheapestPackage = needsMoreTokens
    ? (totalCost - tokenBalance <= 200 - 50 ? "Starter (200 🪙) for S$19"
      : totalCost - tokenBalance <= 500 - 150 ? "Explorer (500 🪙) for S$39"
      : "Growth (1,200 🪙) for S$79")
    : null;

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
                  step.status === "error"   ? "text-[#EF4444]" :
                  "text-gray-600"
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
            <button
              onClick={() => setScanning(false)}
              className="mt-2 text-xs text-gray-400 hover:text-white transition-colors underline"
            >
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
          {TEMPLATES.map((t) => (
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
                {t.value}
              </p>
            </button>
          ))}
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
                  className="border-white/20 text-gray-300 hover:text-white whitespace-nowrap"
                  onClick={() => { setDetectedFrom(null); detectFromUrl(url); }}
                  disabled={detecting || !url.trim()}
                >
                  {detecting ? (
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                  ) : "Detect"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                        {name} <span className="text-[#10B981]/60 text-[10px]">+{EXTRA_COMPETITOR_COST}🪙</span>
                        <button type="button" onClick={() => removeCompetitor(name)} className="text-[#10B981]/60 hover:text-[#10B981]">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add competitor (+30 🪙 each)"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraCompetitor(); } }}
                    className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981] text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/20 text-gray-300 hover:text-white text-sm"
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
                  { id: "quick_check", label: "Quick Check",       cost: 50,  desc: "Basic score across 2 platforms, 8 queries" },
                  { id: "standard",    label: "Standard Report",   cost: 150, desc: "20 queries, competitor benchmark, recommendations" },
                  { id: "deep",        label: "Deep Analysis",     cost: 400, desc: "50 queries, all platforms, comprehensive analysis" },
                ] as { id: ReportType; label: string; cost: number; desc: string }[]
              ).map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
                    reportType === opt.id
                      ? "border-[#10B981]/40 bg-[#10B981]/8"
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={opt.id}
                    checked={reportType === opt.id}
                    onChange={() => { setReportType(opt.id); setActiveTemplate(null); }}
                    className="mt-0.5 accent-[#10B981]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{opt.label}</span>
                      <span className="text-xs font-semibold text-[#10B981]">{opt.cost} 🪙</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Section 3: AI Platforms */}
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-3">
              <p className="text-sm font-semibold text-white">AI Platforms</p>
              <div className="space-y-2">
                {[
                  { id: "chatgpt", label: "ChatGPT",  included: true,  available: true  },
                  { id: "claude",  label: "Claude",   included: true,  available: true  },
                  { id: "gemini",  label: "Gemini",   included: false, available: false, cost: 40 },
                ].map((platform) => (
                  <div
                    key={platform.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3.5 py-3",
                      platform.available ? "border-white/10" : "border-white/5 opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={platform.included}
                        disabled={!platform.available || platform.included}
                        readOnly
                        className="w-4 h-4 rounded accent-[#10B981] disabled:opacity-60"
                      />
                      <span className="text-sm text-white">{platform.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {platform.included ? "Included" : platform.available ? `+${platform.cost} 🪙` : "Coming soon"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Add-on Modules */}
          <Card className="bg-[#111827] border-white/10">
            <CardContent className="pt-5 pb-5 space-y-3">
              <p className="text-sm font-semibold text-white">Analysis Modules</p>
              <div className="space-y-2">
                {(
                  [
                    { key: "persona_analysis",    label: "Persona-Based Analysis",   cost: 50, desc: "Test from 5 different buyer perspectives" },
                    { key: "commerce_deep_dive",  label: "Commerce Deep Dive",        cost: 50, desc: "15 purchase-intent queries", autoFor: COMMERCE_CATS },
                    { key: "sentiment_deep_dive", label: "Detailed Sentiment",        cost: 30, desc: "How AI describes your brand in depth" },
                    { key: "citation_tracking",   label: "Citation Page Tracking",    cost: 25, desc: "Which of your pages AI cites" },
                    { key: "improvement_plan",    label: "AI Improvement Plan",       cost: 40, desc: "Prioritized 3-tier action roadmap" },
                    { key: "category_benchmark",  label: "Category Benchmarking",     cost: 35, desc: "Compare to your industry average" },
                  ] as { key: AddonKey; label: string; cost: number; desc: string; autoFor?: string[] }[]
                ).map(({ key, label, cost, desc, autoFor }) => {
                  const isAuto = autoFor?.includes(category) && key === "commerce_deep_dive";
                  return (
                    <label
                      key={key}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-all",
                        addons[key]
                          ? "border-[#10B981]/30 bg-[#10B981]/5"
                          : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={addons[key]}
                        onChange={() => toggleAddon(key)}
                        className="mt-0.5 w-4 h-4 rounded accent-[#10B981]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white">{label}</span>
                            {isAuto && (
                              <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-1.5 py-0.5 rounded-full">
                                Auto
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-400">+{cost} 🪙</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
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
              <p className="text-sm font-semibold text-white">Report Summary</p>

              <div className="space-y-1.5">
                {/* Base cost */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {reportType === "quick_check" ? "Quick Check" : reportType === "standard" ? "Standard Report" : "Deep Analysis"}
                  </span>
                  <span className="text-gray-300 tabular-nums font-medium">{BASE_COSTS[reportType]} 🪙</span>
                </div>

                {/* Active addons */}
                {activeAddonLines.map((k) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{ADDON_LABELS[k]}</span>
                    <span className="text-gray-300 tabular-nums font-medium">+{ADDON_COSTS[k]} 🪙</span>
                  </div>
                ))}

                {/* Extra competitors */}
                {extraCompetitorNames.map((name) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 truncate max-w-[140px]">+ {name}</span>
                    <span className="text-gray-300 tabular-nums font-medium">+{EXTRA_COMPETITOR_COST} 🪙</span>
                  </div>
                ))}

                {/* Divider */}
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
                        : `Need ${(totalCost - tokenBalance).toLocaleString()} more`
                      }
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
                  <Button
                    disabled
                    className="w-full bg-white/5 text-gray-500 font-semibold cursor-not-allowed border border-white/10"
                  >
                    Need {(totalCost - (tokenBalance ?? 0)).toLocaleString()} more 🪙
                  </Button>
                  {cheapestPackage && (
                    <Link
                      href="/app/tokens"
                      className="block text-center text-xs text-[#10B981] hover:underline py-0.5"
                    >
                      💡 Buy {cheapestPackage} →
                    </Link>
                  )}
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

              {/* Estimate */}
              <div className="flex items-center gap-1.5 justify-center">
                <Info className="w-3 h-3 text-gray-600" />
                <p className="text-xs text-gray-600">Estimated delivery: ~{estimatedMinutes} minute{estimatedMinutes !== 1 ? "s" : ""}</p>
              </div>
            </CardContent>
          </Card>

          {/* Token balance link */}
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
