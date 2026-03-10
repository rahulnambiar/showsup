"use client";

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
