"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ArrowRight, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/client";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    fn(); // run once on mount
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, []);

  function scrollOrLink(id: string) {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${id}`);
    }
  }

  const navLinkCls = (href: string) =>
    cn(
      "text-sm transition-colors",
      pathname === href || pathname.startsWith(href + "/")
        ? "text-white font-medium"
        : "text-[#9CA3AF] hover:text-white"
    );

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || !isHome
          ? "bg-[#0A0E17]/95 backdrop-blur-md border-b border-white/8"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <BarChart3 className="w-5 h-5 text-[#10B981]" />
          <span className="text-base font-semibold text-white tracking-tight">ShowsUp</span>
        </Link>

        {/* Center links */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            onClick={() => scrollOrLink("how-it-works")}
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            How It Works
          </button>
          <Link href={loggedIn ? "/app/report-builder" : "/report-builder"} className={navLinkCls("/report-builder")}>
            Analyse your Brand
          </Link>
          <button
            onClick={() => scrollOrLink("pricing")}
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            Pricing
          </button>
          <Link href="/blog" className={navLinkCls("/blog")}>
            Blog
          </Link>
          {loggedIn ? (
            <Link href="/app/dashboard" className="text-sm text-[#10B981] hover:text-[#059669] font-medium transition-colors">
              Dashboard →
            </Link>
          ) : (
            <Link href="/login" className={navLinkCls("/login")}>
              Login
            </Link>
          )}
        </nav>

        {/* Right: theme toggle + CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/8 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {loggedIn ? (
            <Link
              href="/app/report-builder"
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg px-4 py-2 transition-all"
            >
              Analyse your brand <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#10B981] border border-[#10B981]/60 hover:border-[#10B981] hover:bg-[#10B981]/8 rounded-lg px-4 py-2 transition-all"
            >
              Get started free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
