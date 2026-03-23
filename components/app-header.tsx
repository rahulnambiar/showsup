"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard":      "Dashboard",
  "/app/report-builder": "Analyse your Brand",
  "/app/scores":         "All Scans",
  "/app/trends":         "Trends",
  "/app/tokens":         "Tokens",
  "/app/settings":       "Settings",
};

export function AppHeader({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      fetch("/api/tokens/balance")
        .then((r) => r.json())
        .then((d) => setBalance(d.balance ?? null))
        .catch(() => {});
    };
    refresh();
    window.addEventListener("tokenBalanceChanged", refresh);
    return () => window.removeEventListener("tokenBalanceChanged", refresh);
  }, []);

  const pageTitle =
    Object.entries(PAGE_TITLES).find(
      ([path]) => pathname === path || pathname.startsWith(path + "/")
    )?.[1] ?? "";

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "SU";
  const isLow    = balance !== null && balance < 50;
  const isEmpty  = balance === 0;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left: logo on mobile, page title on desktop */}
      <div className="flex items-center gap-3">
        <Link href="/app/dashboard" className="lg:hidden flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold text-gray-900">ShowsUp</span>
        </Link>
        {pageTitle && (
          <span className="text-sm font-semibold text-gray-800 hidden lg:block">
            {pageTitle}
          </span>
        )}
      </div>

      {/* Right: token pill + avatar */}
      <div className="flex items-center gap-3">
        {balance !== null && (
          <Link
            href="/app/tokens"
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors",
              isEmpty
                ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                : isLow
                ? "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
            )}
          >
            <Coins className="w-3 h-3" />
            {balance.toLocaleString()}
          </Link>
        )}
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0 select-none">
          {initials}
        </div>
      </div>
    </header>
  );
}
