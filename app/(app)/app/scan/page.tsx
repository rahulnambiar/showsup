"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { CompetitiveBenchmark, type CompetitorsData } from "@/components/competitive-benchmark";
import { PDFDownload } from "@/components/pdf-download";
import { ShareButton } from "@/components/share-button";
import { trackScanStarted, trackScanCompleted, trackScanFailed } from "@/lib/analytics";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StepState {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  visible: boolean;
}

const COMMERCE_CATS = ["Insurance", "Travel", "Finance", "E-commerce"];

function getDomain(rawUrl: string): string {
  try {
    const u = rawUrl.includes("://") ? rawUrl : `https://${rawUrl}`;
    return new URL(u).hostname.replace(/^www\./, "");
  } catch { return rawUrl; }
}

interface PromptAnalysis {
  sentiment?: "positive" | "neutral" | "negative" | null;
  is_recommended?: boolean;
  key_context?: string;
  mention_position?: number | null;
}

interface PromptResult {
  prompt: string;
  response: string;
  mentioned: boolean;
  count: number;
  score: number;
  analysis?: PromptAnalysis;
}

interface ModelResult {
  model: string;
  label: string;
  score: number;
  mentioned: boolean;
  prompts: PromptResult[];
}

interface ScanResult {
  overall_score: number;
  brand: string;
  category: string;
  results: ModelResult[];
  recommendations: Array<{ title: string; description: string; priority: string }>;
  category_scores?: Record<string, number>;
  competitors_data?: CompetitorsData;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 71) return "text-[#10B981]";
  if (score >= 51) return "text-[#14B8A6]";
  if (score >= 31) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function scoreBorderBg(score: number) {
  if (score >= 71) return "border-[#10B981]/20 bg-[#10B981]/5";
  if (score >= 51) return "border-[#14B8A6]/20 bg-[#14B8A6]/5";
  if (score >= 31) return "border-[#F59E0B]/20 bg-[#F59E0B]/5";
  return "border-[#EF4444]/20 bg-[#EF4444]/5";
}

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10B981",
  claude: "#C084FC",
  gemini: "#60A5FA",
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
  Medium: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  Low: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

// ── Inline Results View ───────────────────────────────────────────────────────

function InlineResultsView({ data, onReset }: { data: ScanResult; onReset: () => void }) {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const score = data.overall_score;
  const color = score >= 71 ? "#10B981" : score >= 51 ? "#14B8A6" : score >= 31 ? "#F59E0B" : "#EF4444";
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onReset}
          className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-1"
        >
          ← New scan
        </button>
        <div className="flex items-center gap-2">
          <PDFDownload
            brand={data.brand}
            score={data.overall_score}
            date={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            category={data.category}
            modelResults={data.results.map((mr) => ({ model: mr.model, label: mr.label, score: mr.score, mentioned: mr.mentioned }))}
            recommendations={data.recommendations as Array<{ title: string; description: string; priority: "High" | "Medium" | "Low" }>}
            categoryScores={data.category_scores}
            competitorsData={data.competitors_data}
          />
          <ShareButton />
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">{data.brand}</h1>
        <p className="text-gray-500 text-xs">{data.category}</p>
      </div>

      {/* Overall score */}
      <Card className="bg-[#111827] border-white/10">
        <CardContent className="pt-6 flex items-center gap-8 flex-wrap">
          <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
            <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }} />
            <text x="64" y="72" textAnchor="middle" fill={color} fontSize="24" fontWeight="700"
              style={{ transform: "rotate(90deg)", transformOrigin: "64px 64px" }}>{score}</text>
          </svg>
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Overall AI Visibility</p>
            <p className={`text-5xl font-bold ${scoreColor(score)}`}>
              {score}<span className="text-2xl text-gray-500">/100</span>
            </p>
            <p className="text-sm text-gray-300 font-medium">
              {score >= 71 ? "Excellent visibility — AI consistently recommends your brand"
                : score >= 51 ? "Good presence — appearing in most AI responses"
                : score >= 31 ? "Partial presence — room to grow"
                : "Low visibility — action needed"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Platform breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-400">Platform breakdown</h2>
        {data.results.map((mr) => {
          const modelColor = MODEL_COLORS[mr.model] ?? "#6B7280";
          const isExpanded = expandedModel === mr.model;
          return (
            <Card key={mr.model} className="bg-[#111827] border-white/10 overflow-hidden">
              <button className="w-full text-left" onClick={() => setExpandedModel(isExpanded ? null : mr.model)}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: modelColor }} />
                    <span className="text-sm font-semibold text-white">{mr.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${mr.mentioned ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30" : "border-gray-700 text-gray-500"}`}>
                      {mr.mentioned ? "Mentioned" : "Not found"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full rounded-full" style={{ width: `${mr.score}%`, backgroundColor: mr.score >= 71 ? "#10B981" : mr.score >= 51 ? "#14B8A6" : mr.score >= 31 ? "#F59E0B" : "#EF4444" }} />
                    </div>
                    <span className={`text-xl font-bold ${scoreColor(mr.score)}`}>{mr.score}</span>
                    <span className="text-gray-600 text-sm">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </CardContent>
              </button>
              {isExpanded && (
                <div className="border-t border-white/5 px-6 pt-4 pb-5 space-y-5">
                  {mr.prompts.map((pr, i) => (
                    <div key={i} className="space-y-2">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {pr.analysis?.sentiment && (
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", {
                            "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30": pr.analysis.sentiment === "positive",
                            "bg-gray-500/10 text-gray-400 border-gray-500/30": pr.analysis.sentiment === "neutral",
                            "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30": pr.analysis.sentiment === "negative",
                          })}>
                            {pr.analysis.sentiment}
                          </span>
                        )}
                        {pr.analysis?.is_recommended && (
                          <span className="text-[10px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                        {pr.analysis?.mention_position && (
                          <span className="text-[10px] text-gray-600">#{pr.analysis.mention_position} mention</span>
                        )}
                      </div>
                      {/* Query */}
                      <p className="text-xs text-gray-500 italic">&ldquo;{pr.prompt}&rdquo;</p>
                      {/* Key context */}
                      {pr.analysis?.key_context && (
                        <p className="text-xs text-gray-500 leading-relaxed">{pr.analysis.key_context}</p>
                      )}
                      {/* Response */}
                      <div className={cn("rounded-lg border p-3 text-sm text-gray-300 leading-relaxed", scoreBorderBg(pr.score))}>
                        {pr.response || <span className="text-gray-600">No response</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Score: <span className={scoreColor(pr.score)}>{pr.score}/100</span></span>
                        {pr.mentioned && pr.count > 0 && <span>· Mentioned {pr.count}×</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Visibility Breakdown */}
      {data.category_scores && <CategoryBreakdown scores={data.category_scores} />}

      {/* Competitive Benchmark */}
      {data.competitors_data && <CompetitiveBenchmark data={data.competitors_data} />}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400">Recommendations</h2>
          <div className="space-y-3">
            {data.recommendations.map((rec, i) => (
              <Card key={i} className="bg-[#111827] border-white/10">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span className={cn("text-xs border flex-shrink-0 mt-0.5 px-2 py-0.5 rounded-full", PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS["Low"])}>
                      {rec.priority}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <p className="text-sm text-gray-400 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="inline-flex items-center justify-center rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold px-5 py-2.5 text-sm transition-colors"
      >
        Run another scan
      </button>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────

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
    return (
      <span className="w-6 h-6 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin flex-shrink-0" />
    );
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
  return (
    <span className="w-6 h-6 rounded-full border-2 border-gray-700 flex-shrink-0" />
  );
}

// ── Progress view ─────────────────────────────────────────────────────────────

function ProgressView({ steps, brand }: { steps: StepState[]; brand: string }) {
  const visibleSteps = steps.filter((s) => s.visible);
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Scanning {brand}…</h1>
        <p className="text-gray-400 text-sm">Querying AI models and calculating your ShowsUp Score.</p>
      </div>
      <Card className="bg-[#111827] border-white/10">
        <CardContent className="pt-6 pb-6 space-y-4 min-h-[120px]">
          {visibleSteps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3"
              style={{ animation: "fadeInStep 0.3s ease-out" }}
            >
              <StepCircle status={step.status} />
              <span
                className={
                  step.status === "done"    ? "text-sm text-gray-400" :
                  step.status === "running" ? "text-sm text-white font-medium" :
                  step.status === "error"   ? "text-sm text-[#EF4444]" :
                  "text-sm text-gray-600"
                }
              >
                {step.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page inner ───────────────────────────────────────────────────────────

function ScanPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Other");
  const [detecting, setDetecting] = useState(false);
  const [detectedFrom, setDetectedFrom] = useState<string | null>(null);
  const [niche, setNiche] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [models, setModels] = useState({ chatgpt: true, claude: true, gemini: true });

  const [scanning, setScanning] = useState(false);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [modelConfig, setModelConfig] = useState<{ chatgpt: boolean; claude: boolean; gemini: boolean } | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  const stepsRef = useRef<StepState[]>([]);

  const CATEGORIES = ["Insurance", "Travel", "Finance", "E-commerce", "SaaS", "Healthcare", "Other"];

  // Fetch model config + token balance on mount
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setModelConfig(d))
      .catch(() => {/* ignore */});
    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((d) => typeof d.balance === "number" && setTokenBalance(d.balance))
      .catch(() => {/* ignore */});
  }, []);

  // Pre-fill from URL param
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      const decoded = decodeURIComponent(urlParam);
      setUrl(decoded);
      detectFromUrl(decoded);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        if (data.category && data.category !== "Other") {
          setCategory(data.category);
        }
        if (data.niche) setNiche(data.niche);
        if (Array.isArray(data.competitors) && data.competitors.length > 0) {
          setCompetitors(data.competitors.map((c: { name: string }) => c.name).filter(Boolean));
        }
        setDetectedFrom(targetUrl.trim());
      }
    } catch {
      // ignore
    } finally {
      setDetecting(false);
    }
  }

  function addCompetitor() {
    const name = competitorInput.trim();
    if (!name || competitors.includes(name)) return;
    setCompetitors((prev) => [...prev, name]);
    setCompetitorInput("");
  }

  function removeCompetitor(name: string) {
    setCompetitors((prev) => prev.filter((c) => c !== name));
  }

  function updateStep(id: string, status: StepState["status"]) {
    stepsRef.current = stepsRef.current.map((s) =>
      s.id === id ? { ...s, status, visible: true } : s
    );
    setSteps([...stepsRef.current]);
  }

  function delay(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !brand.trim() || scanning) return;

    setError(null);
    setScanning(true);
    trackScanStarted({ brand: brand.trim(), url: url.trim(), models: Object.entries(models).filter(([, v]) => v).map(([k]) => k) });

    const promptCount = 6 + (COMMERCE_CATS.includes(category) ? 2 : 0);
    const compText = competitors.length > 0
      ? competitors.slice(0, 3).join(", ") + (competitors.length > 3 ? ` +${competitors.length - 3} more` : "")
      : null;

    type S = StepState;
    const initialSteps: S[] = [
      { id: "fetch",        label: `Analyzing ${getDomain(url)}…`,                 status: "pending", visible: false },
      { id: "brand",        label: `Brand detected: ${brand} in ${category}`,       status: "pending", visible: false },
      ...(compText ? [{ id: "competitors", label: `Competitors: ${compText}`, status: "pending" as const, visible: false }] : []),
      { id: "queries",      label: `Generating ${promptCount} targeted queries…`,   status: "pending", visible: false },
      ...(models.chatgpt ? [{ id: "chatgpt", label: "Scanning ChatGPT…", status: "pending" as const, visible: false }] : []),
      ...(models.claude  ? [{ id: "claude",  label: "Scanning Claude…",  status: "pending" as const, visible: false }] : []),
      ...(models.gemini  ? [{ id: "gemini",  label: "Scanning Gemini…",  status: "pending" as const, visible: false }] : []),
      { id: "analyze",      label: "Analyzing responses with AI…",                  status: "pending", visible: false },
      { id: "score",        label: "Calculating ShowsUp Score…",                    status: "pending", visible: false },
    ];
    stepsRef.current = initialSteps;
    setSteps([...initialSteps]);

    // Step 1: fetch
    updateStep("fetch", "running");
    await delay(700);
    updateStep("fetch", "done");

    // Step 2: brand
    updateStep("brand", "running");
    await delay(400);
    updateStep("brand", "done");

    // Step 3: competitors
    if (compText) {
      updateStep("competitors", "running");
      await delay(350);
      updateStep("competitors", "done");
    }

    // Step 4: queries
    updateStep("queries", "running");
    await delay(450);
    updateStep("queries", "done");

    // Start AI query steps
    if (models.chatgpt) updateStep("chatgpt", "running");
    if (models.claude)  updateStep("claude", "running");
    if (models.gemini)  updateStep("gemini",  "running");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.trim(),
          category,
          niche: niche || undefined,
          url: url.trim(),
          website: url.trim(),
          models,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        updateStep("chatgpt", "error");
        updateStep("claude", "error");
        updateStep("gemini", "error");
        const needed = (data.required ?? 150) - (data.balance ?? 0);
        setError(`Insufficient tokens. You need ${needed} more tokens to run this scan.`);
        setScanning(false);
        return;
      }

      if (!res.ok) {
        updateStep("chatgpt", "error");
        updateStep("claude", "error");
        updateStep("gemini", "error");
        trackScanFailed(data.error ?? "scan_failed");
        setError(data.error ?? "Scan failed. Please try again.");
        setScanning(false);
        return;
      }

      if (models.chatgpt) updateStep("chatgpt", "done");
      if (models.claude)  updateStep("claude", "done");
      if (models.gemini)  updateStep("gemini",  "done");

      updateStep("analyze", "running");
      await delay(600);
      updateStep("analyze", "done");

      updateStep("score", "running");
      await delay(450);
      updateStep("score", "done");

      trackScanCompleted({ brand: data.brand, score: data.overall_score, category: data.category });
      toast.success(`Scan complete! ShowsUp Score: ${data.overall_score}/100`);
      window.dispatchEvent(new Event("tokenBalanceChanged"));

      if (data.scan_id) {
        router.push(`/app/scores/${data.scan_id}`);
      } else {
        // No DB record — show results inline
        setScanResult(data as ScanResult);
        setScanning(false);
      }
    } catch {
      if (models.chatgpt) updateStep("chatgpt", "error");
      if (models.claude)  updateStep("claude", "error");
      if (models.gemini)  updateStep("gemini",  "error");
      setError("Network error. Check your connection and try again.");
      setScanning(false);
    }
  }

  if (scanResult) {
    return <InlineResultsView data={scanResult} onReset={() => { setScanResult(null); setUrl(""); setBrand(""); setCategory("Other"); setNiche(""); setCompetitors([]); setDetectedFrom(null); }} />;
  }

  if (scanning) {
    return <ProgressView steps={steps} brand={brand} />;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">New scan</h1>
        <p className="text-gray-400 text-sm">
          Enter your website URL and we&apos;ll detect your brand and check how it shows up across AI.
        </p>
      </div>

      <Card className="bg-[#111827] border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-white">Brand details</CardTitle>
          <CardDescription className="text-gray-500">
            We query ChatGPT, Claude, and Gemini with targeted prompts and score the responses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* URL field */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-gray-300">Website URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="text"
                  placeholder="https://yoursite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => detectFromUrl(url)}
                  required
                  className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981]"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-gray-300 hover:text-white whitespace-nowrap"
                  onClick={() => detectFromUrl(url)}
                  disabled={detecting || !url.trim()}
                >
                  {detecting ? (
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Detect"
                  )}
                </Button>
              </div>
            </div>

            {/* Brand field */}
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-gray-300">Brand name</Label>
              <div className="relative">
                <Input
                  id="brand"
                  placeholder="e.g. Notion, Stripe, Figma"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981]"
                />
                {detecting && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="w-4 h-4 border-2 border-gray-600 border-t-[#10B981] rounded-full animate-spin block" />
                  </span>
                )}
              </div>
              {detectedFrom && (
                <p className="text-xs text-gray-600">Detected from {detectedFrom}</p>
              )}
            </div>

            {/* Category dropdown */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-[#1F2937] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Competitors */}
            <div className="space-y-2">
              <Label className="text-gray-300">Competitors <span className="text-gray-600 font-normal">(optional)</span></Label>
              {competitors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {competitors.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded-full px-3 py-1"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeCompetitor(name)}
                        className="text-gray-500 hover:text-white transition-colors leading-none"
                        aria-label={`Remove ${name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a competitor…"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }}
                  className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981]"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-gray-300 hover:text-white"
                  onClick={addCompetitor}
                  disabled={!competitorInput.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Models */}
            <div className="space-y-2">
              <Label className="text-gray-300">AI Models</Label>
              <div className="flex gap-4 flex-wrap">
                {(["chatgpt", "claude", "gemini"] as const).map((id) => {
                  const configured = !modelConfig || modelConfig[id];
                  const label = id === "chatgpt" ? "ChatGPT" : id === "claude" ? "Claude" : "Gemini";
                  return (
                    <label key={id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={models[id]}
                        onChange={(e) => setModels((prev) => ({ ...prev, [id]: e.target.checked }))}
                        disabled={!configured}
                        className="w-4 h-4 rounded accent-[#10B981] disabled:opacity-40"
                      />
                      <span className={cn("text-sm", configured ? "text-gray-300" : "text-gray-600")}>
                        {label}
                      </span>
                      {!configured && (
                        <span className="text-[10px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5">
                          Not configured
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Token cost preview */}
            {tokenBalance !== null && (
              <div className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm",
                tokenBalance >= 150
                  ? "border-white/8 bg-white/[0.02]"
                  : "border-[#EF4444]/20 bg-[#EF4444]/5"
              )}>
                <span className="text-gray-400">
                  Scan cost: <span className="text-white font-medium">150 tokens</span>
                </span>
                <span className={cn(
                  "text-xs font-medium",
                  tokenBalance >= 150 ? "text-gray-500" : "text-[#EF4444]"
                )}>
                  {tokenBalance >= 150
                    ? `${tokenBalance} remaining`
                    : `Need ${150 - tokenBalance} more`}
                </span>
              </div>
            )}

            {error && (
              <p className="text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold"
              disabled={
                !url.trim() ||
                !brand.trim() ||
                (!models.chatgpt && !models.claude && !models.gemini) ||
                (tokenBalance !== null && tokenBalance < 150)
              }
            >
              {tokenBalance !== null && tokenBalance < 150
                ? "Insufficient tokens"
                : "Run Scan →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page (with Suspense for useSearchParams) ──────────────────────────────────

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-white/5 rounded animate-pulse mb-4" />
        <div className="h-48 bg-[#111827] border border-white/10 rounded-xl animate-pulse" />
      </div>
    }>
      <ScanPageInner />
    </Suspense>
  );
}
