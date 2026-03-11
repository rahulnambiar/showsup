"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, Check, X, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PACKAGES = [
  {
    id: "starter",
    label: "Starter",
    tokens: 200,
    price_sgd: 19,
    popular: false,
    per_token: "~$0.10",
    savings: null,
    scans: 1,
  },
  {
    id: "explorer",
    label: "Explorer",
    tokens: 500,
    price_sgd: 39,
    popular: true,
    per_token: "~$0.08",
    savings: "Save 18% vs Starter",
    scans: 3,
  },
  {
    id: "growth",
    label: "Growth",
    tokens: 1200,
    price_sgd: 79,
    popular: false,
    per_token: "~$0.07",
    savings: "Save 31% vs Starter",
    scans: 8,
  },
  {
    id: "pro",
    label: "Pro",
    tokens: 3000,
    price_sgd: 149,
    popular: false,
    per_token: "~$0.05",
    savings: "Save 48% vs Starter",
    scans: 20,
  },
] as const;

type PackageId = (typeof PACKAGES)[number]["id"];

const COST_TABLE = [
  { label: "Quick Check",         cost: 50  },
  { label: "Standard Report",     cost: 150 },
  { label: "Deep Analysis",       cost: 400 },
  { label: "Persona Analysis",    cost: 50  },
  { label: "Commerce Deep Dive",  cost: 50  },
  { label: "AI Improvement Plan", cost: 40  },
  { label: "Category Benchmark",  cost: 35  },
  { label: "Sentiment Analysis",  cost: 30  },
  { label: "Citation Tracking",   cost: 25  },
];

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
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Buy Tokens</h1>
          <p className="text-gray-400 text-sm">
            Tokens power every scan and report on ShowsUp.
          </p>
        </div>
        {balance !== null && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <Coins className="w-4 h-4 text-[#10B981]" />
            <span className="text-white font-semibold tabular-nums">{balance.toLocaleString()}</span>
            <span className="text-gray-500 text-sm">tokens</span>
          </div>
        )}
      </div>

      {/* Success banner */}
      {successPkg && (
        <div className="flex items-center justify-between rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm text-[#10B981] font-medium">
              {PACKAGES.find((p) => p.id === successPkg)?.tokens.toLocaleString()} tokens added successfully!
            </span>
          </div>
          <button onClick={() => setSuccessPkg(null)} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Package cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={cn(
              "relative bg-[#111827] transition-all duration-200",
              pkg.popular
                ? "border-[#10B981]/50 ring-1 ring-[#10B981]/20"
                : "border-white/10 hover:border-white/20"
            )}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="text-[10px] font-bold bg-[#10B981] text-[#0A0E17] px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                  Most Popular
                </span>
              </div>
            )}
            <CardContent className="pt-7 pb-5 space-y-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{pkg.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white tabular-nums">{pkg.tokens.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm">tokens</span>
                </div>
                <p className="text-xl font-bold text-white">S${pkg.price_sgd}</p>
                <p className="text-xs text-gray-600">{pkg.per_token}/token</p>
              </div>

              {pkg.savings ? (
                <p className="text-[11px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-2.5 py-1.5 font-medium">
                  {pkg.savings}
                </p>
              ) : (
                <div className="h-[30px]" />
              )}

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Zap className="w-3 h-3 text-gray-600 flex-shrink-0" />
                <span>~{pkg.scans} standard scan{pkg.scans !== 1 ? "s" : ""}</span>
              </div>

              <Button
                className={cn(
                  "w-full text-sm font-semibold",
                  pkg.popular
                    ? "bg-[#10B981] hover:bg-[#059669] text-[#0A0E17]"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                )}
                onClick={() => { setSuccessPkg(null); setError(null); setConfirming(pkg.id); }}
              >
                Buy {pkg.label}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cost reference table */}
      <Card className="bg-[#111827] border-white/10">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-4">Token costs</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2.5">
            {COST_TABLE.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span className="text-xs font-semibold text-[#10B981] tabular-nums whitespace-nowrap">
                  {item.cost} 🪙
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History link */}
      <div className="flex justify-center">
        <Link
          href="/app/tokens/history"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          View transaction history
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Confirmation modal */}
      {confirming && selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !purchasing && setConfirming(null)}
          />
          <div className="relative bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white">Confirm purchase</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Add {selectedPkg.tokens.toLocaleString()} tokens to your account.
                </p>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{selectedPkg.label} package</span>
                  <span className="text-white font-medium">{selectedPkg.tokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="text-white font-medium">S${selectedPkg.price_sgd}</span>
                </div>
                <div className="border-t border-white/10 pt-2.5 flex justify-between text-sm">
                  <span className="text-gray-400">Balance after</span>
                  <span className="text-[#10B981] font-bold tabular-nums">
                    {((balance ?? 0) + selectedPkg.tokens).toLocaleString()} tokens
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-3 py-2">
                <p className="text-xs text-[#F59E0B]">
                  🧪 <strong>Test mode</strong> — tokens are added instantly with no charge. Stripe integration coming soon.
                </p>
              </div>

              {error && (
                <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
                  onClick={() => setConfirming(null)}
                  disabled={purchasing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#0A0E17]/30 border-t-[#0A0E17] rounded-full animate-spin" />
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
