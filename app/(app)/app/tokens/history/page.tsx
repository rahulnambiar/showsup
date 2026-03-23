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
  { id: "all",          label: "All" },
  { id: "purchase",     label: "Purchases" },
  { id: "report_spend", label: "Scans" },
  { id: "bonus",        label: "Bonuses" },
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
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/tokens" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Token History</h1>
          <p className="text-gray-500 text-sm">All your token credits and debits</p>
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
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium"
                : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Date</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-3 py-3">Description</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-3 py-3">Type</th>
                    <th className="text-right text-xs text-gray-400 font-medium px-3 py-3">Amount</th>
                    <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">Balance after</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx, i) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <tr
                        key={tx.id}
                        className={cn(
                          "border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors",
                          i % 2 === 0 ? "" : "bg-gray-50/50"
                        )}
                      >
                        <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="px-3 py-3 text-gray-700 max-w-[200px] truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                            isCredit
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          )}>
                            {TYPE_LABELS[tx.type] ?? tx.type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          <span className={cn(
                            "flex items-center justify-end gap-1 font-semibold",
                            isCredit ? "text-emerald-600" : "text-red-500"
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
        <p className="text-center text-xs text-gray-400">
          Showing {filtered.length} of {transactions.length} transactions
        </p>
      )}
    </div>
  );
}
