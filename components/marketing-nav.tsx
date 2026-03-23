"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Github, Menu, X, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const GITHUB_URL = "https://github.com/rahulnambiar/showsup";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
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
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || !isHome
          ? "bg-[#0A0E17]/95 backdrop-blur-md border-b border-[#1F2937]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-base font-semibold text-white tracking-tight">ShowsUp</span>
        </Link>

        {/* Center links — desktop */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            onClick={() => scrollOrLink("product")}
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            Product
          </button>
          <button
            onClick={() => scrollOrLink("cli")}
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            CLI
          </button>
          <button
            onClick={() => scrollOrLink("pricing")}
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            Pricing
          </button>
          <Link href="#" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
            Docs
          </Link>
        </nav>

        {/* Right — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-white border border-[#1F2937] hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            {stars !== null ? (
              <span className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 text-[#F59E0B]" />
                {stars.toLocaleString()}
              </span>
            ) : (
              <span>GitHub</span>
            )}
          </a>

          {loggedIn ? (
            <Link
              href="/app/dashboard"
              className="text-sm text-[#10B981] hover:text-[#059669] font-medium transition-colors"
            >
              Dashboard →
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
              Sign in
            </Link>
          )}

          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg px-4 py-2 transition-all"
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile: GitHub visible + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#9CA3AF] hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[#9CA3AF] hover:text-white transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0A0E17] border-t border-[#1F2937] px-6 py-5 space-y-1">
          {[
            { label: "Product",  action: () => { scrollOrLink("product"); setMenuOpen(false); } },
            { label: "CLI",      action: () => { scrollOrLink("cli");     setMenuOpen(false); } },
            { label: "Pricing",  action: () => { scrollOrLink("pricing"); setMenuOpen(false); } },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="block w-full text-left text-sm text-[#9CA3AF] hover:text-white py-2 transition-colors"
            >
              {label}
            </button>
          ))}
          <Link href="#" className="block text-sm text-[#9CA3AF] hover:text-white py-2 transition-colors">
            Docs
          </Link>
          <div className="pt-4 border-t border-[#1F2937] space-y-3">
            {loggedIn ? (
              <Link href="/app/dashboard" className="block text-sm text-[#10B981] font-medium py-1">
                Dashboard →
              </Link>
            ) : (
              <Link href="/login" className="block text-sm text-[#9CA3AF] hover:text-white py-1">
                Sign in
              </Link>
            )}
            <Link
              href="/signup"
              className="block text-center text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg px-4 py-2.5 transition-colors"
            >
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
