"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Coins,
  ChevronDown,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/app/dashboard",      icon: LayoutDashboard, label: "Dashboard"           },
  { href: "/app/report-builder", icon: Wand2,           label: "Analyse your Brand"  },
  { href: "/app/scores",         icon: BarChart3,       label: "Scores"              },
  { href: "/app/trends",         icon: TrendingUp,      label: "Trends"              },
  { href: "/app/tokens",         icon: Coins,           label: "Tokens"              },
  { href: "/app/settings",       icon: Settings,        label: "Settings"            },
];

const mobileTabItems = [
  { href: "/app/dashboard",      icon: LayoutDashboard, label: "Home"    },
  { href: "/app/report-builder", icon: Wand2,           label: "Analyse" },
  { href: "/app/scores",         icon: BarChart3,       label: "Scores"  },
  { href: "/app/tokens",         icon: Coins,           label: "Tokens"  },
  { href: "/app/settings",       icon: Settings,        label: "Settings"},
];

// ── Token widget ──────────────────────────────────────────────────────────────

function TokenWidget() {
  const [balance, setBalance] = useState<number | null>(null);
  const [selfHost, setSelfHost] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function refreshBalance() {
    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((d) => {
        if (d.selfHost) { setSelfHost(true); setBalance(null); }
        else setBalance(d.balance ?? null);
      })
      .catch(() => {});
  }

  useEffect(() => {
    refreshBalance();
    window.addEventListener("tokenBalanceChanged", refreshBalance);
    return () => window.removeEventListener("tokenBalanceChanged", refreshBalance);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (selfHost) {
    return (
      <div className="mx-2 mb-3">
        <div className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm border border-emerald-200 bg-emerald-50">
          <Coins className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold text-sm text-emerald-700">Unlimited</span>
          <span className="text-emerald-500 text-xs">self-host</span>
        </div>
      </div>
    );
  }

  if (balance === null) return null;

  const isEmpty = balance === 0;
  const isLow   = !isEmpty && balance < 50;

  return (
    <div ref={ref} className="relative mx-2 mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm border transition-colors",
          isEmpty
            ? "border-red-200 bg-red-50 hover:bg-red-100"
            : isLow
            ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
        )}
      >
        <span className="flex items-center gap-2">
          <Coins className={cn("w-3.5 h-3.5 flex-shrink-0",
            isEmpty ? "text-red-500" : isLow ? "text-amber-500" : "text-emerald-600")} />
          <span className={cn("font-semibold tabular-nums text-sm",
            isEmpty ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-800")}>
            {balance.toLocaleString()}
          </span>
          <span className="text-gray-400 text-xs">tokens</span>
        </span>
        <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-gray-200 bg-white shadow-lg p-3 space-y-3 z-50">
          <div className="space-y-0.5">
            <p className="text-xs text-gray-500">Token balance</p>
            <p className={cn("text-2xl font-bold tabular-nums",
              isEmpty ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-900")}>
              {balance.toLocaleString()}
            </p>
          </div>
          {isEmpty && <p className="text-xs text-red-500">No tokens left — buy more to run scans.</p>}
          {isLow && <p className="text-xs text-amber-600">Running low — a standard scan costs ~140 tokens.</p>}
          <div className="space-y-1.5">
            <Link
              href="/app/tokens"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 transition-colors"
            >
              Buy Tokens
            </Link>
            <Link
              href="/app/tokens/history"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-gray-500 hover:text-gray-700 transition-colors py-0.5"
            >
              Token history →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "SU";

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-[220px] h-screen sticky top-0 bg-white border-r border-gray-200 flex-shrink-0">
        {/* Logo */}
        <Link href="/app/dashboard" className="flex items-center gap-2.5 px-5 py-[18px] mb-1">
          <BarChart3 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-bold text-gray-900 tracking-tight">ShowsUp</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <TokenWidget />

        <div className="border-t border-gray-200 px-2 py-2 space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500 truncate flex-1">{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 flex items-stretch h-16">
        {mobileTabItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
