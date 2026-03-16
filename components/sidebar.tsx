"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Coins,
  ChevronDown,
  Wand2,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

interface SidebarProps {
  user: User | null;
  mobile?: boolean;
}

function TokenWidget() {
  const [balance, setBalance] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function refreshBalance() {
    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? null))
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

  if (balance === null) return null;

  const color =
    balance === 0     ? "text-[#EF4444]" :
    balance < 50      ? "text-[#F59E0B]" :
                        "text-[#10B981]";

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
          <span className={cn("font-semibold tabular-nums", color)}>{balance.toLocaleString()}</span>
          <span className="text-gray-500 text-xs">tokens</span>
        </span>
        <ChevronDown className={cn("w-3 h-3 text-gray-600 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/10 bg-[#1F2937] shadow-xl p-3 space-y-3 z-50">
          <div className="space-y-0.5">
            <p className="text-xs text-gray-500">Token balance</p>
            <p className={cn("text-2xl font-bold tabular-nums", color)}>{balance.toLocaleString()}</p>
          </div>
          {balance === 0 && (
            <p className="text-xs text-[#EF4444]">No tokens left — buy more to run scans.</p>
          )}
          {balance > 0 && balance < 150 && (
            <p className="text-xs text-[#F59E0B]">Running low — a standard scan costs ~140 tokens.</p>
          )}
          <div className="space-y-1.5">
            <Link
              href="/app/tokens"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg px-3 py-1.5 transition-colors"
            >
              Buy Tokens
            </Link>
            <Link
              href="/app/tokens/history"
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

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full"
    >
      {theme === "dark"
        ? <Sun className="w-4 h-4 flex-shrink-0" />
        : <Moon className="w-4 h-4 flex-shrink-0" />}
      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

// ── Full sidebar (desktop) ────────────────────────────────────────────────────

function DesktopSidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "SU";

  return (
    <aside className="flex flex-col w-60 h-screen sticky top-0 border-r transition-colors duration-200"
      style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--border-color)" }}>
      {/* Logo */}
      <Link href="/app/dashboard" className="flex items-center gap-2 px-5 py-5 mb-2">
        <BarChart3 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
        <span className="text-base font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>ShowsUp</span>
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#10B981]/15 text-[#10B981]"
                  : "hover:bg-white/5"
              )}
              style={!active ? { color: "var(--text-secondary)" } : undefined}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-[#10B981]" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <TokenWidget />

      <Separator className="mx-2 mb-2" style={{ backgroundColor: "var(--border-color)" }} />

      <div className="px-2 pb-2 space-y-0.5">
        <ThemeToggle />
        <div className="flex items-center gap-3 px-3 py-1.5">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-[#10B981]/20 text-[#10B981] text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs truncate flex-1" style={{ color: "var(--text-secondary)" }}>{user?.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 px-3"
          style={{ color: "var(--text-tertiary)" }}
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

// ── Mobile sidebar (slide-in drawer + top bar) ────────────────────────────────

function MobileSidebar({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "SU";

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 border-b transition-colors duration-200"
        style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--border-color)" }}>
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#10B981]" />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>ShowsUp</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-secondary)" }}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-secondary)" }}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out border-r",
        open ? "translate-x-0" : "-translate-x-full"
      )} style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#10B981]" />
            <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>ShowsUp</span>
          </Link>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-[#10B981]/15 text-[#10B981]" : "hover:bg-white/5"
                )}
                style={!active ? { color: "var(--text-secondary)" } : undefined}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-[#10B981]" : "")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 space-y-0.5 border-t" style={{ borderColor: "var(--border-color)" }}>
          <ThemeToggle />
          <div className="flex items-center gap-3 px-3 py-1.5">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-[#10B981]/20 text-[#10B981] text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 px-3"
            style={{ color: "var(--text-tertiary)" }} onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />Sign out
          </Button>
        </div>
      </div>

      {/* Spacer so content doesn't hide under mobile header */}
      <div className="h-14" />
    </>
  );
}

// ── Exported component ────────────────────────────────────────────────────────

export function Sidebar({ user, mobile = false }: SidebarProps) {
  if (mobile) return <MobileSidebar user={user} />;
  return <DesktopSidebar user={user} />;
}
