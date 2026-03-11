"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TxType = "signup_bonus" | "purchase" | "report_spend" | "refund" | "subscription_credit" | "bonus";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: TxType;
  description: string;
  reference_id: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<TxType, string> = {
  signup_bonus:        "Bonus",
  purchase:            "Purchase",
  report_spend:        "Scan",
  refund:              "Refund",
  subscription_credit: "Credit",
  bonus:               "Bonus",
};

const FILTERS = [
  { id: "all",       label: "All" },
  { id: "purchase",  label: "Purchases" },
  { id: "report_spend", label: "Scans" },
  { id: "bonus",     label: "Bonuses" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function TokenHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    fetch("/api/tokens/history")
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    if (filter === "bonus") return transactions.filter((t) => t.type === "signup_bonus" || t.type === "bonus" || t.type === "subscription_credit");
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/tokens"
          className="text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Token History</h1>
          <p className="text-gray-400 text-sm">All your token credits and debits</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "text-sm px-3 py-1.5 rounded-lg border transition-colors",
              filter === f.id
                ? "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]"
                : "border-white/10 text-gray-400 hover:text-white hover:border-white/20"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-[#111827] border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Date</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-3 py-3">Description</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-3 py-3">Type</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-3">Amount</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-5 py-3">Balance after</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx, i) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <tr
                        key={tx.id}
                        className={cn(
                          "border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors",
                          i % 2 === 0 ? "" : "bg-white/[0.01]"
                        )}
                      >
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="px-3 py-3 text-gray-300 max-w-[200px] truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                            isCredit
                              ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                              : "bg-white/5 text-gray-400 border-white/10"
                          )}>
                            {TYPE_LABELS[tx.type] ?? tx.type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          <span className={cn(
                            "flex items-center justify-end gap-1 font-semibold",
                            isCredit ? "text-[#10B981]" : "text-[#EF4444]"
                          )}>
                            {isCredit
                              ? <ArrowUpRight className="w-3.5 h-3.5" />
                              : <ArrowDownLeft className="w-3.5 h-3.5" />
                            }
                            {isCredit ? "+" : ""}{tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-400 tabular-nums text-xs">
                          {tx.balance_after.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && transactions.length > 0 && (
        <p className="text-center text-xs text-gray-600">
          Showing {filtered.length} of {transactions.length} transactions
        </p>
      )}
    </div>
  );
}
