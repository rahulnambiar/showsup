"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, Check, X, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateReportCost, getActionCost } from "@/lib/pricing/cost-calculator";

const PACKAGES = [
  {
    id: "starter",
    label: "Starter",
    tokens: 2500,
    price_sgd: 19,
    popular: false,
    per_token: "S$0.008/token",
    savings: null,
  },
  {
    id: "explorer",
    label: "Explorer",
    tokens: 5000,
    price_sgd: 39,
    popular: true,
    per_token: "S$0.008/token",
    savings: null,
  },
  {
    id: "growth",
    label: "Growth",
    tokens: 12000,
    price_sgd: 79,
    popular: false,
    per_token: "S$0.007/token",
    savings: "Save 14% vs Explorer",
  },
  {
    id: "pro",
    label: "Pro",
    tokens: 30000,
    price_sgd: 149,
    popular: false,
    per_token: "S$0.005/token",
    savings: "Best value — Save 36%",
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
  const [balance, setBalance] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<PackageId | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [successPkg, setSuccessPkg] = useState<PackageId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0));
  }, []);

  const selectedPkg = PACKAGES.find((p) => p.id === confirming) ?? null;

  async function handlePurchase() {
    if (!confirming) return;
    setError(null);
    setPurchasing(true);
    try {
      const res = await fetch("/api/tokens/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: confirming }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Purchase failed");
        return;
      }
      setBalance(data.balance);
      setSuccessPkg(confirming);
      setConfirming(null);
      window.dispatchEvent(new Event("tokenBalanceChanged"));
    } finally {
      setPurchasing(false);
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
      {successPkg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-medium">
              {PACKAGES.find((p) => p.id === successPkg)?.tokens.toLocaleString()} tokens added successfully!
            </span>
          </div>
          <button onClick={() => setSuccessPkg(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Package cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PACKAGES.map((pkg) => {
          const scans = Math.floor(pkg.tokens / STANDARD_COST);
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
                  <p className="text-xl font-bold text-gray-900">S${pkg.price_sgd}</p>
                  <p className="text-xs text-gray-400">{pkg.per_token}</p>
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
                  onClick={() => { setSuccessPkg(null); setError(null); setConfirming(pkg.id); }}
                >
                  Buy {pkg.label}
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

      {/* Confirmation modal */}
      {confirming && selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !purchasing && setConfirming(null)}
          />
          <div className="relative bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm purchase</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Add {selectedPkg.tokens.toLocaleString()} tokens to your account.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{selectedPkg.label} package</span>
                  <span className="text-gray-900 font-medium">{selectedPkg.tokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price</span>
                  <span className="text-gray-900 font-medium">S${selectedPkg.price_sgd}</span>
                </div>
                <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm">
                  <span className="text-gray-500">Balance after</span>
                  <span className="text-emerald-700 font-bold tabular-nums">
                    {((balance ?? 0) + selectedPkg.tokens).toLocaleString()} tokens
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-700">
                  🧪 <strong>Test mode</strong> — tokens are added instantly with no charge. Stripe integration coming soon.
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  onClick={() => setConfirming(null)}
                  disabled={purchasing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding…
                    </span>
                  ) : (
                    "Add tokens"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
