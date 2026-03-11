"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Coins,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/scan", icon: Search, label: "New Scan" },
  { href: "/app/scores", icon: BarChart3, label: "Scores" },
  { href: "/app/trends", icon: TrendingUp, label: "Trends" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  user: User | null;
}

function TokenWidget() {
  const [balance, setBalance] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? null))
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (balance === null) return null;

  const color =
    balance === 0
      ? "text-[#EF4444]"
      : balance < 50
      ? "text-[#F59E0B]"
      : "text-[#10B981]";

  return (
    <div ref={ref} className="relative mx-2 mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm border transition-colors",
          balance === 0
            ? "border-[#EF4444]/25 bg-[#EF4444]/5 hover:bg-[#EF4444]/10"
            : balance < 50
            ? "border-[#F59E0B]/25 bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10"
            : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
        )}
      >
        <span className="flex items-center gap-2">
          <Coins className={cn("w-3.5 h-3.5 flex-shrink-0", color)} />
          <span className={cn("font-semibold tabular-nums", color)}>{balance}</span>
          <span className="text-gray-500 text-xs">tokens</span>
        </span>
        <ChevronDown className={cn("w-3 h-3 text-gray-600 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/10 bg-[#1F2937] shadow-xl p-3 space-y-3 z-50">
          <div className="space-y-0.5">
            <p className="text-xs text-gray-500">Token balance</p>
            <p className={cn("text-2xl font-bold tabular-nums", color)}>{balance}</p>
          </div>
          {balance === 0 && (
            <p className="text-xs text-[#EF4444]">No tokens left — buy more to run scans.</p>
          )}
          {balance > 0 && balance < 150 && (
            <p className="text-xs text-[#F59E0B]">Running low — a scan costs 150 tokens.</p>
          )}
          <div className="space-y-1.5">
            <button
              disabled
              className="w-full text-xs font-semibold bg-[#10B981]/90 text-[#0A0E17] rounded-lg px-3 py-1.5 opacity-50 cursor-not-allowed"
            >
              Buy Tokens — coming soon
            </button>
            <Link
              href="/app/tokens"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-gray-500 hover:text-gray-300 transition-colors py-0.5"
            >
              Token history →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "SU";

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#111827] border-r border-white/[0.08] px-3 py-4">
      {/* Logo */}
      <Link href="/app/dashboard" className="flex items-center gap-2 px-2 mb-8">
        <BarChart3 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
        <span className="text-base font-semibold text-white tracking-tight">ShowsUp</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#10B981]/15 text-[#10B981]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-[#10B981]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <TokenWidget />

      <Separator className="bg-white/[0.08] my-3" />

      {/* User + sign out */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-[#10B981]/20 text-[#10B981] text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-400 truncate flex-1">{user?.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-gray-500 hover:text-white hover:bg-white/5 px-3"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
