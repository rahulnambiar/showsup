"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Github, Menu, X, ArrowRight, Star, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const GITHUB_URL = "https://github.com/rahulnambiar/showsup";

function ChromeBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("showsup_chrome_banner_dismissed");
    if (dismissed) return;
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg|Edge|OPR|Opera/.test(navigator.userAgent);
    if (isChrome) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem("showsup_chrome_banner_dismissed", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="w-full bg-[#F0FDF4] border-b border-[#D1FAE5] flex items-center justify-center gap-3 px-4" style={{ height: 44 }}>
      <span className="text-[13px] text-[#065F46] text-center hidden sm:inline">
        🌐 ShowsUp is available as a Chrome extension — check any site&apos;s AI visibility in one click
      </span>
      <span className="text-[13px] text-[#065F46] text-center sm:hidden">
        🌐 ShowsUp Chrome extension available
      </span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-[12px] font-medium text-[#065F46] bg-white border border-[#D1FAE5] hover:border-[#10B981] rounded-md px-3 py-1 transition-colors duration-200"
      >
        Add to Chrome →
      </a>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-[#9CA3AF] hover:text-[#4B5563] transition-colors duration-200 ml-1"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled]   = useState(false);
  const [loggedIn, setLoggedIn]   = useState(false);
  const [stars, setStars]         = useState<number | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const isHome   = pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
  }, []);

  useEffect(() => {
    fetch("https://api.github.com/repos/rahulnambiar/showsup")
      .then((r) => r.json())
      .then((d) => typeof d.stargazers_count === "number" && setStars(d.stargazers_count))
      .catch(() => {});
  }, []);

  function scrollOrLink(id: string) {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${id}`);
    }
  }

  return (
    <>
    <header className="fixed top-0 inset-x-0 z-50 flex flex-col">
      <ChromeBanner />
      <div
        className={cn(
          "transition-all duration-300",
          scrolled || !isHome
            ? "bg-white/90 backdrop-blur-lg border-b border-[#E5E7EB]"
            : "bg-transparent"
        )}
      >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
          <span style={{ fontFamily: "var(--font-inter, system-ui)" }} className="text-[20px] font-semibold text-[#111827] tracking-tight">
            ShowsUp
          </span>
        </Link>

        {/* Center links — desktop */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            onClick={() => scrollOrLink("product")}
            className={cn(
              "text-[14px] transition-colors duration-200",
              isHome ? "text-[#111827] font-medium" : "text-[#4B5563] hover:text-[#111827]"
            )}
          >
            Product
          </button>
          {[
            { label: "Methodology", href: "/methodology" },
            { label: "Blog",        href: "/blog"        },
            { label: "About",       href: "/about"       },
          ].map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[14px] transition-colors duration-200",
                  active ? "text-[#111827] font-medium" : "text-[#4B5563] hover:text-[#111827]"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[13px] text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-lg px-3 py-1.5 transition-all duration-200"
          >
            <Github className="w-3.5 h-3.5" />
            {stars !== null ? (
              <span className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 text-[#F59E0B]" fill="#F59E0B" />
                {stars.toLocaleString()}
              </span>
            ) : (
              <span>GitHub</span>
            )}
          </a>

          {loggedIn ? (
            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-4 py-2 transition-all duration-200 hover:scale-[1.02] shadow-sm"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-[13px] text-[#4B5563] hover:text-[#111827] transition-colors duration-200">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-4 py-2 transition-all duration-200 hover:scale-[1.02] shadow-sm"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile: CTA stays visible */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href={loggedIn ? "/app/dashboard" : "/signup"}
            className="text-[13px] font-medium bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-3 py-1.5 transition-colors duration-200"
          >
            {loggedIn ? "Dashboard" : "Get Started"}
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[#4B5563] hover:text-[#111827] transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB] px-6 py-5 space-y-1 shadow-lg">
          <button
            onClick={() => { scrollOrLink("product"); setMenuOpen(false); }}
            className="block w-full text-left text-[14px] text-[#4B5563] hover:text-[#111827] py-2.5 transition-colors duration-200"
          >
            Product
          </button>
          {[
            { label: "Methodology", href: "/methodology" },
            { label: "Blog",        href: "/blog"        },
            { label: "About",       href: "/about"       },
          ].map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block text-[14px] py-2.5 transition-colors duration-200",
                  active ? "text-[#111827] font-medium" : "text-[#4B5563] hover:text-[#111827]"
                )}
              >
                {label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
            {loggedIn ? (
              <Link href="/app/dashboard" className="block text-[14px] text-[#10B981] font-medium py-1">
                Dashboard →
              </Link>
            ) : (
              <Link href="/login" className="block text-[14px] text-[#4B5563] hover:text-[#111827] py-1">
                Sign in
              </Link>
            )}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[14px] text-[#4B5563] py-1"
            >
              <Github className="w-4 h-4" />
              GitHub {stars !== null && `· ★ ${stars.toLocaleString()}`}
            </a>
          </div>
        </div>
      )}
      </div>
    </header>
    {/* Spacer — pushes page content below the fixed nav (h-16 = 64px nav height) */}
    <div className="h-16" aria-hidden="true" />
    </>
  );
}
