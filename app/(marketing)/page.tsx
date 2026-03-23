"use client";

import { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MarketingNav } from "@/components/marketing-nav";
import {
  Search,
  Wrench,
  CheckCircle2,
  Cloud,
  Terminal,
  Server,
  Github,
  Copy,
  Check,
  Star,
  ArrowRight,
  FileText,
  Code2,
  BookOpen,
  Users,
  GitFork,
} from "lucide-react";
import { posthog } from "@/lib/posthog";

const GITHUB_URL = "https://github.com/rahulnambiar/showsup";

// ── Fade-in on scroll ─────────────────────────────────────────────────────────

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 400ms ease ${delay}ms, transform 400ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── URL Input ─────────────────────────────────────────────────────────────────

function UrlInput({ size = "default" }: { size?: "default" | "lg" }) {
  const [url, setUrl] = useState("");
  const router = useRouter();
  const id = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    const { data: { session } } = await createClient().auth.getSession();
    if (session) {
      router.push(`/app/report-builder?url=${encodeURIComponent(trimmed)}`);
    } else {
      localStorage.setItem("pendingUrl", trimmed);
      router.push("/signup");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-2">
      <input
        id={id}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://yoursite.com"
        className={cn(
          "flex-1 rounded-lg bg-[#111827] border border-[#1F2937] text-white placeholder:text-gray-600 outline-none transition-colors",
          "focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/25",
          size === "lg" ? "px-4 py-3 text-base" : "px-4 py-2.5 text-sm"
        )}
      />
      <button
        type="submit"
        className={cn(
          "flex-shrink-0 bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg transition-colors whitespace-nowrap",
          size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2.5 text-sm"
        )}
      >
        Check visibility →
      </button>
    </form>
  );
}

// ── Terminal Block ────────────────────────────────────────────────────────────

const TERMINAL_TEXT = `$ npx showsup scan https://yoursite.com

  ShowsUp Score: 64/100 — Good presence
  ChatGPT: 71  Claude: 58
  Top gap: "best HR tools" (~5K AI searches/mo)

$ npx showsup fix https://yoursite.com --output ./fixes/

  ✓ Generated llms.txt
  ✓ Generated FAQ schema (5 questions)
  ✓ Generated 3 content briefs
  ✓ Generated citation playbook`;

function TerminalBlock() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(TERMINAL_TEXT).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl overflow-hidden text-left">
      {/* Chrome bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#0D1117]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/50" />
        </div>
        <span className="text-[11px] text-gray-600 font-mono">terminal</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-[#10B981]" /><span className="text-[#10B981]">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" />Copy</>
          )}
        </button>
      </div>
      {/* Lines */}
      <div className="p-6 font-mono text-sm leading-[1.8] overflow-x-auto">
        <p>
          <span className="text-gray-500">$</span>{" "}
          <span className="text-white">npx showsup scan</span>{" "}
          <span className="text-[#10B981]">https://yoursite.com</span>
        </p>
        <p className="mt-3 pl-2 text-gray-300">
          ShowsUp Score:{" "}
          <span className="text-[#10B981] font-semibold">64/100</span>{" "}
          — Good presence
        </p>
        <p className="pl-2 text-gray-400">
          ChatGPT: <span className="text-white">71</span>
          {"  "}Claude: <span className="text-white">58</span>
        </p>
        <p className="pl-2 text-gray-500">
          Top gap:{" "}
          <span className="text-[#F59E0B]">&quot;best HR tools&quot;</span>{" "}
          (~5K AI searches/mo)
        </p>
        <p className="mt-4">
          <span className="text-gray-500">$</span>{" "}
          <span className="text-white">npx showsup fix</span>{" "}
          <span className="text-[#10B981]">https://yoursite.com</span>{" "}
          <span className="text-gray-500">--output ./fixes/</span>
        </p>
        <p className="mt-3 pl-2">
          <span className="text-[#10B981]">✓</span>{" "}
          <span className="text-gray-300">Generated llms.txt</span>
        </p>
        <p className="pl-2">
          <span className="text-[#10B981]">✓</span>{" "}
          <span className="text-gray-300">Generated FAQ schema (5 questions)</span>
        </p>
        <p className="pl-2">
          <span className="text-[#10B981]">✓</span>{" "}
          <span className="text-gray-300">Generated 3 content briefs</span>
        </p>
        <p className="pl-2">
          <span className="text-[#10B981]">✓</span>{" "}
          <span className="text-gray-300">Generated citation playbook</span>
        </p>
      </div>
    </div>
  );
}

// ── llms.txt Mockup ───────────────────────────────────────────────────────────

function LlmsTxtMockup() {
  const [copied, setCopied] = useState(false);

  const raw = `# llms.txt — Generated by ShowsUp
# https://yoursite.com

> YourBrand is the leading HR software for SMBs, helping
> teams manage payroll, benefits, and compliance.

## Key Capabilities
- Automated payroll for 1–500 employees
- Benefits administration (health, dental, 401k)
- US labor-law compliance tracking

## Best For
- HR managers at growing companies
- Teams replacing spreadsheet workflows

## Comparisons
- vs BambooHR: more affordable, faster setup
- vs Gusto: better compliance reporting`;

  async function handleCopy() {
    await navigator.clipboard.writeText(raw).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl overflow-hidden text-left">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-xs text-gray-400 font-mono">llms.txt</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-[#10B981]" /><span className="text-[#10B981]">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" />Copy</>
          )}
        </button>
      </div>
      <pre className="p-5 text-xs font-mono leading-relaxed overflow-auto max-h-52 whitespace-pre-wrap">
        <span className="text-gray-600">{`# llms.txt — Generated by ShowsUp\n# https://yoursite.com\n\n`}</span>
        <span className="text-[#10B981]">{`> YourBrand is the leading HR software for SMBs, helping\n> teams manage payroll, benefits, and compliance.\n\n`}</span>
        <span className="text-[#60A5FA]">{`## Key Capabilities\n`}</span>
        <span className="text-gray-300">{`- Automated payroll for 1–500 employees\n- Benefits administration (health, dental, 401k)\n- US labor-law compliance tracking\n\n`}</span>
        <span className="text-[#60A5FA]">{`## Best For\n`}</span>
        <span className="text-gray-300">{`- HR managers at growing companies\n- Teams replacing spreadsheet workflows\n\n`}</span>
        <span className="text-[#60A5FA]">{`## Comparisons\n`}</span>
        <span className="text-gray-300">{`- vs BambooHR: more affordable, faster setup\n- vs Gusto: better compliance reporting`}</span>
      </pre>
    </div>
  );
}

// ── Fix types data ────────────────────────────────────────────────────────────

const FIX_TYPES = [
  { icon: FileText,    title: "llms.txt",           desc: "Tell AI crawlers exactly what your brand does"            },
  { icon: Code2,       title: "Schema Markup",       desc: "FAQ + Organization JSON-LD from your gap queries"        },
  { icon: BookOpen,    title: "Content Briefs",      desc: "Outlines targeting high-volume AI queries you're missing" },
  { icon: Users,       title: "Comparison Pages",    desc: "Draft vs pages for competitors outranking you"           },
  { icon: Search,      title: "Citation Playbook",   desc: "G2, Reddit, Wikipedia — where AI looks for proof"        },
  { icon: Terminal,    title: "Crawlability Audit",  desc: "Is your robots.txt blocking AI bots?"                    },
  { icon: Wrench,      title: "Brand Narrative",     desc: "Optimized copy using the language AI prefers"            },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  useEffect(() => {
    posthog.capture("landing_page_viewed");
    const params = new URLSearchParams(window.location.search);
    const utm = {
      utm_source:   params.get("utm_source"),
      utm_medium:   params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content:  params.get("utm_content"),
    };
    if (utm.utm_source) {
      localStorage.setItem("utm_data", JSON.stringify(utm));
      posthog.capture("utm_visit", utm);
    }
  }, []);

  return (
    <div className="bg-[#0A0E17] text-white">
      <MarketingNav />

      {/* ── HERO ── */}
      <section id="hero" className="pt-40 pb-[120px] px-6 text-center">
        <div className="max-w-[800px] mx-auto space-y-8">
          {/* Open source badge */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#111827] border border-[#1F2937] hover:border-white/20 rounded-full px-4 py-1.5 text-[13px] text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
            Open Source — Star on GitHub
          </a>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-semibold text-white tracking-tight leading-[1.1]">
            Does your brand<br />show up in AI?
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-gray-400 max-w-[600px] mx-auto leading-relaxed">
            Open source AEO agent. Scan your AI visibility, then generate the exact fixes —
            llms.txt, schema markup, content briefs, and more.{" "}
            <span className="text-white">Self-host free or use our cloud.</span>
          </p>

          {/* Terminal */}
          <div className="max-w-[620px] mx-auto">
            <TerminalBlock />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold rounded-lg px-6 py-3 text-base transition-colors"
            >
              Try Cloud Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#1F2937] hover:border-white/25 text-white hover:bg-white/5 font-medium rounded-lg px-6 py-3 text-base transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>

          <p className="text-[13px] text-gray-500 pt-1">
            MIT License • 1,000 free cloud tokens • No credit card
          </p>
        </div>
      </section>

      {/* ── DIAGNOSE → FIX → VERIFY ── */}
      <section id="product" className="py-[120px] px-6 bg-[#0D1117]">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <FadeIn className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Don&apos;t just see the gaps. Fix them.
            </h2>
            <p className="text-gray-400">
              The only AEO tool that generates implementation-ready artifacts
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-4 lg:gap-6 relative items-stretch">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-[3.25rem] left-[33.5%] right-[33.5%] h-px bg-gradient-to-r from-[#1F2937] via-[#10B981]/20 to-[#1F2937] pointer-events-none" />

            {[
              {
                icon: Search,
                step: "01",
                title: "Scan",
                desc1: "Scan across ChatGPT, Claude, Gemini",
                desc2: "Get your ShowsUp Score + competitor benchmark",
                highlight: false,
              },
              {
                icon: Wrench,
                step: "02",
                title: "Fix",
                desc1: "Generate llms.txt, schema, content briefs",
                desc2: "Every fix targets YOUR specific gaps",
                highlight: true,
              },
              {
                icon: CheckCircle2,
                step: "03",
                title: "Verify",
                desc1: "Re-scan to measure improvement",
                desc2: "See before/after for every query",
                highlight: false,
              },
            ].map((step, i) => (
              <FadeIn key={step.step} delay={i * 80}>
                <div
                  className={cn(
                    "rounded-xl border p-7 space-y-5 h-full",
                    step.highlight
                      ? "border-[#10B981]/40 bg-[#10B981]/5"
                      : "border-[#1F2937] bg-[#111827]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        step.highlight ? "bg-[#10B981]/20" : "bg-[#1F2937]"
                      )}
                    >
                      <step.icon
                        className={cn(
                          "w-5 h-5",
                          step.highlight ? "text-[#10B981]" : "text-gray-400"
                        )}
                      />
                    </div>
                    <span className="text-3xl font-bold text-white/[0.05] font-mono select-none">
                      {step.step}
                    </span>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-base font-semibold mb-2",
                        step.highlight ? "text-[#10B981]" : "text-white"
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-300 leading-snug">{step.desc1}</p>
                    <p className="text-sm text-gray-500 mt-1">{step.desc2}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIX GENERATOR ── */}
      <section className="py-[120px] px-6">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <FadeIn className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              7 fixes generated from every scan
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FIX_TYPES.map((fix, i) => (
              <FadeIn key={fix.title} delay={i * 40}>
                <div className="bg-[#111827] border border-[#1F2937] hover:border-[#10B981]/30 rounded-xl p-5 space-y-3 transition-colors h-full">
                  <fix.icon className="w-4 h-4 text-[#10B981]" />
                  <p className="text-sm font-semibold text-white">{fix.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{fix.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* llms.txt mockup */}
          <FadeIn>
            <div className="max-w-2xl mx-auto space-y-3">
              <p className="text-xs text-gray-600 text-center uppercase tracking-widest font-medium">
                Example generated artifact
              </p>
              <LlmsTxtMockup />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── THREE WAYS TO USE ── */}
      <section id="cli" className="py-[120px] px-6 bg-[#0D1117]">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <FadeIn className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Use it your way
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Cloud */}
            <FadeIn delay={0}>
              <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-7 flex flex-col gap-5 h-full">
                <div className="w-10 h-10 rounded-lg bg-[#10B981]/15 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Cloud Platform</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Paste URL, get score + fixes in 60 seconds. 1,000 free tokens.
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#10B981] hover:text-[#059669] transition-colors"
                >
                  Sign up free <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </FadeIn>

            {/* CLI */}
            <FadeIn delay={80}>
              <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-7 flex flex-col gap-5 h-full">
                <div className="w-10 h-10 rounded-lg bg-[#1F2937] flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="font-semibold text-white">CLI Tool</p>
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg px-4 py-3 font-mono text-xs text-gray-300 space-y-1.5">
                    <p>
                      <span className="text-gray-500">$</span>{" "}
                      npx showsup scan example.com
                    </p>
                    <p>
                      <span className="text-gray-500">$</span>{" "}
                      npx showsup fix example.com
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    JSON output. Plug into LangChain, Claude MCP, any agent.
                  </p>
                </div>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  View docs <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </FadeIn>

            {/* Self-host */}
            <FadeIn delay={160}>
              <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-7 flex flex-col gap-5 h-full">
                <div className="w-10 h-10 rounded-lg bg-[#1F2937] flex items-center justify-center">
                  <Server className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="font-semibold text-white">Self-Host</p>
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-lg px-4 py-3 font-mono text-xs text-gray-300 space-y-1.5">
                    <p>
                      <span className="text-gray-500">$</span>{" "}
                      git clone .../showsup
                    </p>
                    <p>
                      <span className="text-gray-500">$</span>{" "}
                      npm run dev
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your API keys. MIT licensed. Free forever.
                  </p>
                </div>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" /> GitHub <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section id="demo" className="py-[120px] px-6">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <FadeIn className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              See it in action
            </h2>
          </FadeIn>

          <FadeIn>
            <div className="flex justify-center">
              <UrlInput size="lg" />
            </div>
          </FadeIn>

          {/* Report + fixes mockup */}
          <FadeIn>
            <div className="rounded-xl overflow-hidden border border-[#1F2937] shadow-2xl shadow-black/60 max-w-3xl mx-auto">
              {/* Browser chrome */}
              <div className="bg-[#111827] border-b border-[#1F2937] px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/50" />
                </div>
                <div className="flex-1 bg-[#1F2937] rounded px-3 py-1 text-xs text-gray-500 text-center">
                  app.showsup.co/report/...
                </div>
              </div>
              {/* Light-mode report preview */}
              <div className="bg-[#F9FAFB] p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest">ShowsUp Score</p>
                    <p className="text-5xl font-bold text-emerald-600 font-mono mt-1 leading-none">73</p>
                    <p className="text-xs text-gray-400 mt-2">Good visibility · ChatGPT + Claude</p>
                  </div>
                  <div className="flex gap-5 flex-shrink-0">
                    {[
                      { label: "ChatGPT", score: 81, color: "text-emerald-600" },
                      { label: "Claude",  score: 64, color: "text-amber-600" },
                    ].map((p) => (
                      <div key={p.label} className="text-center">
                        <p className="text-[11px] text-gray-400 mb-1">{p.label}</p>
                        <p className={cn("text-2xl font-bold font-mono", p.color)}>{p.score}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Fixes ready */}
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">4 fixes ready to generate</p>
                    <p className="text-xs text-emerald-600 mt-0.5">llms.txt · Schema Markup · 2 Content Briefs</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 border border-emerald-300 bg-white rounded-lg px-3 py-1.5 whitespace-nowrap">
                    Generate fixes →
                  </span>
                </div>
                {/* Top gap */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
                  <p className="text-xs font-semibold text-amber-700">Top query gap</p>
                  <p className="text-xs text-amber-600 mt-0.5 font-mono">&quot;best HR tools for small business&quot; — not mentioned in 8/10 responses</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-[120px] px-6 bg-[#0D1117]">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <FadeIn className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Free and open source.<br />Cloud when you need it.
            </h2>
          </FadeIn>

          {/* Two main cards */}
          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <FadeIn>
              <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-7 flex flex-col gap-6 h-full">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Open Source</p>
                  <p className="text-3xl font-bold text-white">
                    $0{" "}
                    <span className="text-sm font-normal text-gray-500">forever</span>
                  </p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {[
                    "Self-host with your API keys",
                    "All features unlocked",
                    "MIT licensed",
                    "CLI + Next.js app included",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-[#10B981] flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-semibold border border-[#1F2937] hover:border-white/20 text-white hover:bg-white/5 rounded-lg py-2.5 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Star on GitHub →
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={80}>
              <div className="bg-[#111827] border border-[#10B981]/40 rounded-xl p-7 flex flex-col gap-6 h-full">
                <div>
                  <p className="text-xs font-semibold text-[#10B981] uppercase tracking-wide mb-3">Cloud</p>
                  <p className="text-3xl font-bold text-white">
                    $0{" "}
                    <span className="text-sm font-normal text-gray-500">to start</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">1,000 free tokens on signup</p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {[
                    "No setup — paste URL and go",
                    "Interactive reports + fix generator",
                    "1,000 free tokens included",
                    "No credit card required",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-[#10B981] flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg py-2.5 transition-colors"
                >
                  Start free →
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* Token packages row */}
          <FadeIn>
            <div className="space-y-5">
              <p className="text-center text-sm text-gray-500">
                Cloud token packages — no subscription, buy when you need more
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                {[
                  { tokens: "2,500",  price: "S$19",  rate: "S$0.008/token",           popular: false },
                  { tokens: "5,000",  price: "S$39",  rate: "S$0.008/token",           popular: true  },
                  { tokens: "12,000", price: "S$79",  rate: "S$0.007/tok — save 14%",  popular: false },
                  { tokens: "30,000", price: "S$149", rate: "S$0.005/tok — save 36%",  popular: false },
                ].map((pkg) => (
                  <div
                    key={pkg.tokens}
                    className={cn(
                      "bg-[#111827] rounded-xl border p-4 text-center space-y-1.5",
                      pkg.popular ? "border-[#10B981]/30" : "border-[#1F2937]"
                    )}
                  >
                    {pkg.popular && (
                      <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-wide">Popular</p>
                    )}
                    <p className="text-xl font-bold text-white font-mono">{pkg.tokens}</p>
                    <p className="text-[11px] text-gray-600">tokens</p>
                    <p className="text-sm font-semibold text-white">{pkg.price}</p>
                    <p className="text-[11px] text-gray-600 leading-snug">{pkg.rate}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section className="py-[120px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <FadeIn>
            <div className="max-w-xl mx-auto text-center space-y-10">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Built in the open
              </h2>

              {/* GitHub stats */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {[
                  { icon: Star,     label: "Stars",   value: "—"   },
                  { icon: GitFork,  label: "Forks",   value: "—"   },
                  { icon: FileText, label: "License", value: "MIT" },
                ].map(({ icon: Icon, label, value }) => (
                  <a
                    key={label}
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] hover:border-white/20 rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium">{value}</span>
                  </a>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-gray-300">Built by a solo developer in Singapore 🇸🇬</p>
                <p className="text-gray-500 text-sm">
                  Contributions welcome. PRs, issues, and feedback appreciated.
                </p>
              </div>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-[#1F2937] hover:border-white/20 text-white hover:bg-white/5 font-medium rounded-lg px-6 py-3 transition-colors"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1F2937] py-14 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10">
            {/* Brand */}
            <div className="space-y-2 flex-shrink-0">
              <p className="text-base font-semibold text-white">ShowsUp</p>
              <p className="text-sm text-gray-500">Open source AEO agent</p>
              <p className="text-sm text-gray-600">Made in Singapore 🇸🇬</p>
            </div>

            {/* Footer links */}
            <div className="flex flex-wrap gap-10 text-sm">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</p>
                <div className="space-y-2">
                  <button
                    onClick={() => document.getElementById("product")?.scrollIntoView({ behavior: "smooth" })}
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Pricing
                  </button>
                  <Link href="/blog" className="block text-gray-400 hover:text-white transition-colors">
                    Blog
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Developers</p>
                <div className="space-y-2">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-white transition-colors">CLI Docs</a>
                  <a href="#" className="block text-gray-400 hover:text-white transition-colors">API Reference</a>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Community</p>
                <div className="space-y-2">
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-white transition-colors">Contribute</a>
                  <a href="#" className="block text-gray-400 hover:text-white transition-colors">Issues</a>
                  <a href="#" className="block text-gray-400 hover:text-white transition-colors">Changelog</a>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Legal</p>
                <div className="space-y-2">
                  <Link href="#" className="block text-gray-400 hover:text-white transition-colors">Privacy</Link>
                  <Link href="#" className="block text-gray-400 hover:text-white transition-colors">Terms</Link>
                  <a href={GITHUB_URL + "/blob/main/LICENSE"} target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-white transition-colors">MIT License</a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1F2937] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">© 2026 ShowsUp. MIT License.</p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
