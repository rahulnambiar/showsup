"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Coins, Check, X, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateReportCost, getActionCost } from "@/lib/pricing/cost-calculator";
import { trackTokensPageViewed, trackTokensPackageSelected, trackTokensPurchaseClicked } from "@/lib/analytics";

const PACKAGES = [
  {
    id:       "starter",
    label:    "Starter",
    tokens:   2500,
    priceUsd: 9,
    popular:  false,
    savings:  null,
  },
  {
    id:       "growth",
    label:    "Growth",
    tokens:   10000,
    priceUsd: 29,
    popular:  true,
    savings:  "Save 26%",
  },
  {
    id:       "pro",
    label:    "Pro",
    tokens:   35000,
    priceUsd: 79,
    popular:  false,
    savings:  "Save 40%",
  },
  {
    id:       "agency",
    label:    "Agency",
    tokens:   100000,
    priceUsd: 199,
    popular:  false,
    savings:  "Best value — Save 49%",
  },
] as const;

type PackageId = (typeof PACKAGES)[number]["id"];

const STANDARD_CONFIG = {
  scanDepth: "standard" as const,
  models: ["gpt-4o-mini", "claude-3-haiku"],
  competitorCount: 0,
  modules: { persona: false, commerce: false, sentiment: false, citations: false, improvementPlan: false, categoryBenchmark: false },
};

const COST_TABLE = [
  { label: "Quick Check",         cost: calculateReportCost({ ...STANDARD_CONFIG, scanDepth: "quick_check" }).totalTokens },
  { label: "Standard Report",     cost: calculateReportCost(STANDARD_CONFIG).totalTokens },
  { label: "Deep Analysis",       cost: calculateReportCost({ ...STANDARD_CONFIG, scanDepth: "deep" }).totalTokens },
  { label: "Persona Analysis",    cost: calculateReportCost({ ...STANDARD_CONFIG, modules: { ...STANDARD_CONFIG.modules, persona: true } }).totalTokens - calculateReportCost(STANDARD_CONFIG).totalTokens },
  { label: "Commerce Deep Dive",  cost: calculateReportCost({ ...STANDARD_CONFIG, modules: { ...STANDARD_CONFIG.modules, commerce: true } }).totalTokens - calculateReportCost(STANDARD_CONFIG).totalTokens },
  { label: "AI Improvement Plan", cost: calculateReportCost({ ...STANDARD_CONFIG, modules: { ...STANDARD_CONFIG.modules, improvementPlan: true } }).totalTokens - calculateReportCost(STANDARD_CONFIG).totalTokens },
  { label: "Category Benchmark",  cost: calculateReportCost({ ...STANDARD_CONFIG, modules: { ...STANDARD_CONFIG.modules, categoryBenchmark: true } }).totalTokens - calculateReportCost(STANDARD_CONFIG).totalTokens },
  { label: "Sentiment Analysis",  cost: calculateReportCost({ ...STANDARD_CONFIG, modules: { ...STANDARD_CONFIG.modules, sentiment: true } }).totalTokens - calculateReportCost(STANDARD_CONFIG).totalTokens },
  { label: "Citation Tracking",   cost: calculateReportCost({ ...STANDARD_CONFIG, modules: { ...STANDARD_CONFIG.modules, citations: true } }).totalTokens - calculateReportCost(STANDARD_CONFIG).totalTokens },
  { label: "Custom Query",        cost: getActionCost("custom_query") },
  { label: "Full PDF Export",     cost: getActionCost("pdf_full") },
];

const STANDARD_COST = calculateReportCost(STANDARD_CONFIG).totalTokens;

export default function TokensPage() {
  const searchParams  = useSearchParams();
  const [balance, setBalance]       = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState<PackageId | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    trackTokensPageViewed();
    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0));

    if (searchParams.get("success") === "1") {
      setShowSuccess(true);
      // Poll balance up to 5 times (webhook can take a few seconds to fire)
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        fetch("/api/tokens/balance")
          .then((r) => r.json())
          .then((d) => {
            setBalance(d.balance ?? 0);
            window.dispatchEvent(new Event("tokenBalanceChanged"));
          });
        if (attempts >= 5) clearInterval(poll);
      }, 3000);
    }
  }, [searchParams]);

  async function handleBuy(pkgId: PackageId) {
    setError(null);
    setRedirecting(pkgId);
    const pkg = PACKAGES.find((p) => p.id === pkgId)!;
    trackTokensPurchaseClicked({ id: pkg.id, tokens: pkg.tokens, price_sgd: pkg.priceUsd });
    try {
      const res  = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ package_id: pkgId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
    } finally {
      setRedirecting(null);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Buy Tokens</h1>
          <p className="text-gray-500 text-sm">
            Tokens power every scan and report. 1,000 free tokens on signup — enough for ~{Math.floor(1000 / STANDARD_COST)} full reports.
          </p>
        </div>
        {balance !== null && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex-shrink-0">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span className="text-gray-900 font-semibold tabular-nums">{balance.toLocaleString()}</span>
            <span className="text-gray-500 text-sm">tokens</span>
          </div>
        )}
      </div>

      {/* Success banner */}
      {showSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-medium">
              Payment successful! Tokens are being credited to your account.
            </span>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cancelled banner */}
      {searchParams.get("cancelled") === "1" && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-sm text-gray-500">Payment cancelled — no charge was made.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Package cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PACKAGES.map((pkg) => {
          const scans = Math.floor(pkg.tokens / STANDARD_COST);
          const isRedirecting = redirecting === pkg.id;
          return (
            <Card
              key={pkg.id}
              className={cn(
                "relative bg-white transition-all duration-200",
                pkg.popular
                  ? "border-emerald-400 ring-1 ring-emerald-100 shadow-md"
                  : "border-gray-200 hover:border-gray-300 shadow-sm"
              )}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}
              <CardContent className="pt-7 pb-5 space-y-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{pkg.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-gray-900 tabular-nums font-mono">{pkg.tokens.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">tokens</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">${pkg.priceUsd} <span className="text-sm font-normal text-gray-400">USD</span></p>
                </div>

                {pkg.savings ? (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 font-medium">
                    {pkg.savings}
                  </p>
                ) : (
                  <div className="h-[30px]" />
                )}

                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Zap className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span>~{scans} standard scan{scans !== 1 ? "s" : ""}</span>
                </div>

                <Button
                  className={cn(
                    "w-full text-sm font-semibold",
                    pkg.popular
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                  )}
                  onClick={() => { trackTokensPackageSelected({ id: pkg.id, tokens: pkg.tokens, price_sgd: pkg.priceUsd }); handleBuy(pkg.id); }}
                  disabled={!!redirecting}
                >
                  {isRedirecting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Redirecting…
                    </span>
                  ) : (
                    `Buy ${pkg.label}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cost reference table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Token costs</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2.5">
            {COST_TABLE.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-xs font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                  {item.cost} 🪙
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-4">
            Costs shown for standard scans with ChatGPT + Claude (free tier models). Premium models cost more.
          </p>
        </CardContent>
      </Card>

      {/* History link */}
      <div className="flex justify-center">
        <Link
          href="/app/tokens/history"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          View transaction history
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
