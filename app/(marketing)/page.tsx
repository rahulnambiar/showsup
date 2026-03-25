"use client";

import { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MarketingNav } from "@/components/marketing-nav";
import {
  Search, Wrench, CheckCircle2, BarChart3, Sparkles, MessageSquare,
  FileText, Code2, BookOpen, Shield, ShoppingBag, Monitor, Terminal,
  Globe, ArrowRight, Github, Copy, Check, Star, ChevronDown, Upload,
  Scale, X,
} from "lucide-react";
import { posthog } from "@/lib/posthog";

const GITHUB_URL = "https://github.com/rahulnambiar/showsup";

// ── Fade-in on scroll ──────────────────────────────────────────────────────────

function FadeIn({
  children, className, delay = 0,
}: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.07 }
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
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 500ms ease ${delay}ms, transform 500ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Chrome Banner ──────────────────────────────────────────────────────────────

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
    <div
      className="w-full bg-[#F0FDF4] border-b border-[#E5E7EB] flex items-center justify-center gap-3 px-4"
      style={{
        height: 44,
        transform: show ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 300ms ease",
      }}
    >
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

// ── URL Input ─────────────────────────────────────────────────────────────────

function UrlInput({ variant = "dark" }: { variant?: "dark" | "light" }) {
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
          "flex-1 rounded-lg border outline-none transition-all duration-200 px-4 py-3 text-base",
          variant === "dark"
            ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/60"
            : "bg-white border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20"
        )}
      />
      <button
        type="submit"
        className={cn(
          "flex-shrink-0 font-medium rounded-lg px-6 py-3 text-base transition-all duration-200 hover:scale-[1.02] whitespace-nowrap",
          variant === "dark"
            ? "bg-white text-[#10B981] hover:bg-[#F9FAFB] shadow-sm"
            : "bg-[#10B981] hover:bg-[#059669] text-white shadow-sm"
        )}
      >
        Check visibility →
      </button>
    </form>
  );
}

// ── Terminal Block (dark — intentional contrast) ────────────────────────────

function TerminalBlock() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(
      "$ npx showsup scan yoursite.com\n$ npx showsup fix yoursite.com"
    ).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden text-left w-full max-w-[520px] mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/60" />
        </div>
        <span className="text-[11px] text-gray-600" style={{ fontFamily: "var(--font-jb-mono, monospace)" }}>terminal</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors duration-200"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-[#10B981]" /><span className="text-[#10B981]">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" />Copy</>
          )}
        </button>
      </div>
      <div
        className="p-5 text-[13px] leading-[1.9] overflow-x-auto"
        style={{ fontFamily: "var(--font-jb-mono, 'JetBrains Mono', monospace)" }}
      >
        <p>
          <span className="text-gray-500">$</span>{" "}
          <span className="text-white">npx showsup scan</span>{" "}
          <span className="text-[#10B981]">yoursite.com</span>
        </p>
        <p className="mt-3 pl-2 text-gray-300">
          ShowsUp Score:{" "}
          <span className="text-[#10B981] font-medium">64/100</span>{" "}
          — Good presence
        </p>
        <p className="pl-2 text-gray-400">
          ChatGPT: <span className="text-white">71</span>{"  "}
          Claude: <span className="text-white">58</span>
        </p>
        <p className="pl-2 text-gray-500">
          Top gap:{" "}
          <span className="text-[#F59E0B]">&quot;best HR tools&quot;</span>{" "}
          (~5K AI searches/mo)
        </p>
        <p className="mt-4">
          <span className="text-gray-500">$</span>{" "}
          <span className="text-white">npx showsup fix</span>{" "}
          <span className="text-[#10B981]">yoursite.com</span>
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
      </div>
    </div>
  );
}

// ── Python Code Block (dark) ────────────────────────────────────────────────

function PythonBlock() {
  const [copied, setCopied] = useState(false);
  const code = `import showsup

result = showsup.scan("example.com")
print(result.score)  # 64

fixes = showsup.generate_fixes("example.com")
fixes.save("./fixes/")

answer = showsup.ask("example.com", "What should I fix?")`;

  async function handleCopy() {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden text-left">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-jb-mono, monospace)" }}>example.py</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors duration-200"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-[#10B981]" /><span className="text-[#10B981]">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" />Copy</>
          )}
        </button>
      </div>
      <pre
        className="p-5 text-[13px] leading-relaxed overflow-auto whitespace-pre"
        style={{ fontFamily: "var(--font-jb-mono, 'JetBrains Mono', monospace)" }}
      >
        <span className="text-[#60A5FA]">import </span>
        <span className="text-gray-300">showsup{"\n\n"}</span>
        <span className="text-gray-400">result</span>
        <span className="text-gray-300"> = showsup.</span>
        <span className="text-[#10B981]">scan</span>
        <span className="text-gray-300">(</span>
        <span className="text-[#F59E0B]">&quot;example.com&quot;</span>
        <span className="text-gray-300">){"\n"}</span>
        <span className="text-[#60A5FA]">print</span>
        <span className="text-gray-300">(result.score)  </span>
        <span className="text-gray-600"># 64{"\n\n"}</span>
        <span className="text-gray-400">fixes</span>
        <span className="text-gray-300"> = showsup.</span>
        <span className="text-[#10B981]">generate_fixes</span>
        <span className="text-gray-300">(</span>
        <span className="text-[#F59E0B]">&quot;example.com&quot;</span>
        <span className="text-gray-300">){"\n"}</span>
        <span className="text-gray-300">fixes.</span>
        <span className="text-[#10B981]">save</span>
        <span className="text-gray-300">(</span>
        <span className="text-[#F59E0B]">&quot;./fixes/&quot;</span>
        <span className="text-gray-300">){"\n\n"}</span>
        <span className="text-gray-400">answer</span>
        <span className="text-gray-300"> = showsup.</span>
        <span className="text-[#10B981]">ask</span>
        <span className="text-gray-300">(</span>
        <span className="text-[#F59E0B]">&quot;example.com&quot;</span>
        <span className="text-gray-300">, </span>
        <span className="text-[#F59E0B]">&quot;What should I fix?&quot;</span>
        <span className="text-gray-300">)</span>
      </pre>
    </div>
  );
}

// ── FAQ Accordion ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "What AI platforms does ShowsUp scan?",
    a: "Currently ChatGPT (GPT-4o), Claude (Haiku/Sonnet), and Gemini (Flash/Pro). Perplexity support is coming soon.",
  },
  {
    q: "What are tokens?",
    a: "Tokens are the currency for the cloud version. Each scan and fix generation costs tokens based on actual AI compute used. Self-hosting is free — you bring your own API keys.",
  },
  {
    q: "Can I self-host ShowsUp?",
    a: "Yes. Clone from GitHub, add your API keys, and run with npm. MIT licensed, free forever. The cloud version just saves you the setup.",
  },
  {
    q: "What does the fix generator create?",
    a: "Seven artifact types: llms.txt files, FAQ/Organization schema markup, content briefs, comparison page drafts, citation source playbooks, crawlability audits, and brand narrative optimization.",
  },
  {
    q: "How accurate is the ShowsUp Score?",
    a: "Scores are based on real-time queries to actual AI platforms. Since LLMs are non-deterministic, we run multiple queries and use median scores. Scores are directional — focus on relative improvement over time.",
  },
  {
    q: "What does the Chrome extension do?",
    a: "One-click AI visibility check for any website. It instantly checks for llms.txt, schema markup, and AI crawler access, then runs a quick scan for a full score.",
  },
];

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-[#E5E7EB] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-medium text-[#111827]">{q}</span>
        <ChevronDown
          className="w-4 h-4 text-[#9CA3AF] flex-shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? "300px" : "0px",
          overflow: "hidden",
          transition: "max-height 300ms ease",
        }}
      >
        <div ref={bodyRef} className="pb-5 text-[15px] text-[#4B5563] leading-relaxed">
          {a}
        </div>
      </div>
    </div>
  );
}

// ── Correlation Chart Mockup ───────────────────────────────────────────────────

function CorrelationChart() {
  const W = 400;
  const H = 140;
  const pad = { t: 12, r: 16, b: 28, l: 36 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  // Normalised 0-100 values for each series
  const score   = [38, 44, 51, 58, 64, 71];
  const search  = [42, 48, 53, 60, 65, 70];
  const revenue = [30, 35, 42, 52, 61, 68];

  function toSVG(vals: number[]) {
    return vals
      .map((v, i) => {
        const x = pad.l + (i / (vals.length - 1)) * iW;
        const y = pad.t + iH - (v / 100) * iH;
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        {/* Y gridlines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = pad.t + iH - (v / 100) * iH;
          return (
            <g key={v}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#F3F4F6" strokeWidth={1} />
              <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{v}</text>
            </g>
          );
        })}
        {/* X labels */}
        {months.map((m, i) => {
          const x = pad.l + (i / (months.length - 1)) * iW;
          return (
            <text key={m} x={x} y={H - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF">{m}</text>
          );
        })}
        {/* Lines */}
        <polyline points={toSVG(score)}   fill="none" stroke="#10B981" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={toSVG(search)}  fill="none" stroke="#3B82F6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={toSVG(revenue)} fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {score.map((v, i) => (
          <circle key={i} cx={pad.l + (i / (score.length - 1)) * iW} cy={pad.t + iH - (v / 100) * iH} r={2.5} fill="#10B981" />
        ))}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 px-1">
        {[
          { color: "#10B981", label: "ShowsUp Score" },
          { color: "#3B82F6", label: "Branded Search" },
          { color: "#F59E0B", label: "Monthly Revenue" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded-full" style={{ background: color }} />
            <span className="text-[11px] text-[#9CA3AF]">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#9CA3AF] mt-2 italic px-1">
        Correlation: 0.72 — when AI recommends you more, revenue grows.
      </p>
    </div>
  );
}

// ── Section heading helpers ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-medium uppercase tracking-wider text-[#9CA3AF]">
      {children}
    </p>
  );
}

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn("text-3xl sm:text-4xl font-semibold tracking-tight text-[#111827]", className)}
      style={{ fontFamily: "var(--font-inter, system-ui)", lineHeight: 1.2 }}
    >
      {children}
    </h2>
  );
}

function SectionSub({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[18px] text-[#4B5563]", className)} style={{ lineHeight: 1.7 }}>
      {children}
    </p>
  );
}

// ── Check item ────────────────────────────────────────────────────────────────

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
      <span className="text-[14px] text-[#4B5563]">{children}</span>
    </li>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    posthog.capture("landing_page_viewed");
    const params = new URLSearchParams(window.location.search);
    const utm = {
      utm_source:   params.get("utm_source"),
      utm_medium:   params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    };
    if (utm.utm_source) {
      localStorage.setItem("utm_data", JSON.stringify(utm));
      posthog.capture("utm_visit", utm);
    }
    setIsChrome(/Chrome/.test(navigator.userAgent) && !/Edg|Edge|OPR|Opera/.test(navigator.userAgent));
  }, []);

  const sectionPad = "py-[80px] md:py-[120px]";
  const container  = "max-w-[1200px] mx-auto px-6";

  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <ChromeBanner />
      <MarketingNav />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-28 md:pt-40 pb-[80px] md:pb-[120px] px-6 text-center">
        <div className="max-w-[800px] mx-auto space-y-8">

          {/* Badge */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#F0FDF4] border border-[#D1FAE5] hover:border-[#10B981] rounded-full px-4 py-1.5 transition-colors duration-200"
          >
            <span className="text-[13px] text-[#065F46] font-medium">Open Source • MIT Licensed</span>
          </a>

          {/* Headline */}
          <h1
            className="text-[36px] sm:text-[48px] md:text-[56px] font-semibold text-[#111827] tracking-tight"
            style={{ fontFamily: "var(--font-inter, system-ui)", lineHeight: 1.1 }}
          >
            The open source AEO agent
          </h1>

          {/* Subheadline */}
          <p
            className="text-[18px] text-[#4B5563] max-w-[640px] mx-auto"
            style={{ lineHeight: 1.7 }}
          >
            Scan how your brand appears across ChatGPT, Claude, and Gemini.
            Generate the exact fixes — llms.txt, schema markup, content briefs.
            Correlate with search and revenue data.
          </p>

          {/* Terminal */}
          <TerminalBlock />

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg px-6 h-12 text-base transition-all duration-200 hover:scale-[1.02] shadow-sm"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#111827] font-medium rounded-lg px-6 h-12 text-base transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>

          {isChrome && (
            <p className="text-[13px] text-[#10B981]">
              Also available as a{" "}
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#059669] transition-colors duration-200">
                Chrome extension →
              </a>
            </p>
          )}

          <p className="text-[13px] text-[#9CA3AF]">
            1,000 free tokens &nbsp;•&nbsp; No credit card &nbsp;•&nbsp; MIT Licensed
          </p>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-[#F9FAFB] border-y border-[#E5E7EB]">
        <div className={cn(container, "py-7")}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              "7 fix types", "10 regions", "3 AI platforms",
              "REST API", "AI Analyst Chat",
              "WordPress plugin", "Shopify app", "Chrome extension",
            ].map((stat, i) => (
              <span key={stat} className="flex items-center gap-6">
                <span
                  className="text-[14px] text-[#9CA3AF]"
                  style={{ fontFamily: "var(--font-jb-mono, monospace)" }}
                >
                  {stat}
                </span>
                {i < 7 && <span className="text-[#D1D5DB]">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="product" className={cn(sectionPad, "px-6 bg-white")}>
        <div className={cn(container, "space-y-14")}>
          <FadeIn className="text-center space-y-4">
            <SectionLabel>The workflow</SectionLabel>
            <SectionHeading>From score to strategy in four steps</SectionHeading>
            <SectionSub className="max-w-[520px] mx-auto">
              Not just a dashboard. A complete AEO workflow.
            </SectionSub>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector */}
            <div className="hidden lg:block absolute top-[2.75rem] left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent pointer-events-none" />

            {[
              {
                icon: Search,  step: "01", title: "Diagnose",        highlight: false,
                sub: "Scan AI Platforms",
                desc: "Query ChatGPT, Claude, and Gemini with category-specific prompts across 10 regions.",
              },
              {
                icon: Wrench,  step: "02", title: "Fix",             highlight: true,
                sub: "Generate Fixes",
                desc: "Get llms.txt, schema markup, content briefs, comparison pages — all from your scan data.",
              },
              {
                icon: CheckCircle2, step: "03", title: "Verify",     highlight: false,
                sub: "Measure Impact",
                desc: "Re-scan targeted queries to see exactly what improved after implementing fixes.",
              },
              {
                icon: BarChart3, step: "04", title: "Correlate",     highlight: false,
                sub: "Connect Business Data",
                desc: "Link Search Console, upload sales data, and see how AI visibility impacts revenue.",
              },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 80}>
                <div
                  className={cn(
                    "rounded-2xl border p-7 space-y-4 h-full transition-all duration-200 hover:-translate-y-0.5",
                    s.highlight
                      ? "border-[#10B981]/30 bg-[#F0FDF4] shadow-[0_4px_16px_rgba(16,185,129,0.1)]"
                      : "border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      s.highlight ? "bg-[#10B981]" : "bg-[#F0FDF4]"
                    )}
                  >
                    <s.icon className={cn("w-5 h-5", s.highlight ? "text-white" : "text-[#10B981]")} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">
                      Step {s.step} — {s.title}
                    </p>
                    <p className="text-[17px] font-semibold text-[#111827] mb-2">{s.sub}</p>
                    <p className="text-[14px] text-[#4B5563] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IT GENERATES ─────────────────────────────────────────────── */}
      <section className={cn(sectionPad, "px-6 bg-[#F9FAFB]")}>
        <div className={cn(container, "space-y-12")}>
          <FadeIn className="text-center space-y-4">
            <SectionLabel>Fix generator</SectionLabel>
            <SectionHeading>7 fixes generated from every scan</SectionHeading>
            <SectionSub className="max-w-[520px] mx-auto">
              Implementation-ready artifacts, not generic recommendations.
            </SectionSub>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileText,     title: "llms.txt",          desc: "Tell AI crawlers exactly what your brand does. Generated from your specific visibility gaps." },
              { icon: Code2,        title: "Schema Markup",     desc: "FAQ and Organization JSON-LD targeting the exact queries where you're invisible." },
              { icon: BookOpen,     title: "Content Briefs",    desc: "Full outlines with titles, structure, and AI optimization tips for high-volume gaps." },
              { icon: Scale,        title: "Comparison Pages",  desc: "Draft vs-pages for every competitor outranking you. Balanced, factual, AI-friendly." },
              { icon: Star,         title: "Citation Playbook", desc: "G2, Reddit, Wikipedia — which sources AI cites in your category and how to get listed." },
              { icon: Shield,       title: "Crawlability Audit",desc: "Is your robots.txt blocking AI? Is your content JavaScript-rendered? Instant diagnosis." },
              { icon: Sparkles,     title: "Brand Narrative",   desc: "Optimized meta descriptions and page copy using the language AI prefers for your category." },
              { icon: MessageSquare,title: "AI Analyst Chat",   desc: "Ask anything about your report. Get strategic analysis and draft action plans with your data." },
            ].map((fix, i) => (
              <FadeIn key={fix.title} delay={i * 30}>
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-3 h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                    <fix.icon className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#111827]">{fix.title}</p>
                  <p className="text-[13px] text-[#4B5563] leading-relaxed">{fix.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI ANALYST ────────────────────────────────────────────────────── */}
      <section className={cn(sectionPad, "px-6 bg-white")}>
        <div className={cn(container)}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <FadeIn className="space-y-8">
              <div className="space-y-4">
                <SectionLabel>AI Analyst</SectionLabel>
                <SectionHeading>Don&apos;t just read the report.<br />Interrogate it.</SectionHeading>
                <SectionSub>
                  Your AI analyst has read every query, every response, every gap.
                </SectionSub>
              </div>
              <ul className="space-y-4">
                <CheckItem>Ask why your score is low — get answers citing your actual scan data</CheckItem>
                <CheckItem>Request competitor deep-dives with real numbers</CheckItem>
                <CheckItem>Draft 30-day action plans, CMO emails, content calendars</CheckItem>
                <CheckItem>5 free questions per report, then 2 tokens each</CheckItem>
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg px-6 h-11 text-[14px] transition-all duration-200 hover:scale-[1.02] shadow-sm"
              >
                Try AI Analyst free <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </FadeIn>

            {/* Right — chat mockup */}
            <FadeIn delay={120} className="w-full">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5E7EB]">
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111827]">AI Analyst</p>
                    <p className="text-[11px] text-[#9CA3AF]">Based on your scan data</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] text-[#9CA3AF]">Live</span>
                  </div>
                </div>
                {/* Messages */}
                <div className="p-5 space-y-4" style={{ minHeight: 280 }}>
                  {/* User */}
                  <div className="flex justify-end">
                    <div className="bg-[#F0FDF4] rounded-xl rounded-br-sm px-4 py-3 max-w-[80%]">
                      <p className="text-[13px] text-[#065F46]">&quot;Why does Deel outrank us?&quot;</p>
                    </div>
                  </div>
                  {/* AI */}
                  <div className="flex justify-start">
                    <div className="bg-[#F9FAFB] rounded-xl rounded-bl-sm px-4 py-3 max-w-[90%]">
                      <p className="text-[13px] text-[#4B5563] leading-relaxed">
                        Deel outranks you for 3 reasons based on your scan: they&apos;re mentioned in{" "}
                        <span className="font-medium text-[#111827]">83%</span> of category queries vs your{" "}
                        <span className="font-medium text-[#111827]">40%</span>. The biggest gap is{" "}
                        <span className="font-medium text-[#10B981]">&quot;best HR platform&quot;</span> — Deel appears first
                        on both ChatGPT and Claude while you don&apos;t appear at all. This query has{" "}
                        ~5K estimated AI searches/month.
                      </p>
                    </div>
                  </div>
                  {/* User */}
                  <div className="flex justify-end">
                    <div className="bg-[#F0FDF4] rounded-xl rounded-br-sm px-4 py-3 max-w-[80%]">
                      <p className="text-[13px] text-[#065F46]">&quot;Draft a 30-day action plan&quot;</p>
                    </div>
                  </div>
                  {/* AI */}
                  <div className="flex justify-start">
                    <div className="bg-[#F9FAFB] rounded-xl rounded-bl-sm px-4 py-3 max-w-[90%]">
                      <p className="text-[13px] text-[#4B5563] leading-relaxed">
                        <span className="font-medium text-[#111827]">Week 1:</span> Publish comparison page targeting &quot;You vs Deel&quot;...<br />
                        <span className="font-medium text-[#111827]">Week 2:</span> Deploy llms.txt and FAQ schema...<br />
                        <span className="font-medium text-[#111827]">Week 3:</span> Get listed on G2, Capterra...
                      </p>
                    </div>
                  </div>
                </div>
                {/* Input */}
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3">
                    <p className="text-[13px] text-[#9CA3AF] flex-1">Type your question...</p>
                    <ArrowRight className="w-4 h-4 text-[#D1D5DB]" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── GO GLOBAL ─────────────────────────────────────────────────────── */}
      <section className={cn(sectionPad, "px-6 bg-[#F9FAFB]")}>
        <div className={cn(container, "space-y-12")}>
          <FadeIn className="text-center space-y-4">
            <SectionLabel>Global coverage</SectionLabel>
            <SectionHeading>Your brand looks different in every market</SectionHeading>
            <SectionSub className="max-w-[560px] mx-auto">
              AI recommends different brands in different regions.
              See where you&apos;re strong and where you&apos;re invisible.
            </SectionSub>
          </FadeIn>

          <FadeIn>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-x-auto max-w-3xl mx-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#F3F4F6]">
                    <th className="text-left px-5 py-4 font-medium text-[#9CA3AF] w-28" />
                    {[
                      { flag: "🇺🇸", label: "US" },
                      { flag: "🇬🇧", label: "UK" },
                      { flag: "🇸🇬", label: "SG" },
                      { flag: "🇮🇳", label: "India" },
                      { flag: "🇦🇺", label: "AU" },
                    ].map(({ flag, label }) => (
                      <th key={label} className="text-center px-4 py-4 font-medium text-[#4B5563]">
                        {flag} {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#F9FAFB]">
                    <td className="px-5 py-3.5 font-medium text-[#4B5563]">Score</td>
                    {[
                      { val: 72, color: "#10B981" },
                      { val: 58, color: "#F59E0B" },
                      { val: 34, color: "#F59E0B" },
                      { val: 21, color: "#EF4444" },
                      { val: 48, color: "#F59E0B" },
                    ].map(({ val, color }, i) => (
                      <td key={i} className="text-center px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color }}>
                          {val}
                          <span className="text-[10px]">●</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#F9FAFB]">
                    <td className="px-5 py-3.5 font-medium text-[#4B5563]">Mention</td>
                    {["75%", "55%", "25%", "15%", "40%"].map((v, i) => (
                      <td key={i} className="text-center px-4 py-3.5 text-[#4B5563]">{v}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-medium text-[#4B5563]">Rank</td>
                    {["#2", "#3", "—", "—", "#4"].map((v, i) => (
                      <td key={i} className="text-center px-4 py-3.5 text-[#4B5563]">{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-center text-[13px] text-[#9CA3AF] mt-5">
              10 regions: US, UK, Europe, Singapore, Southeast Asia, Australia, India, Middle East, Latin America, Global
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── AVAILABLE EVERYWHERE ──────────────────────────────────────────── */}
      <section className={cn(sectionPad, "px-6 bg-white")}>
        <div className={cn(container, "space-y-12")}>
          <FadeIn className="text-center space-y-4">
            <SectionLabel>Platforms</SectionLabel>
            <SectionHeading>Works where you work</SectionHeading>
            <SectionSub className="max-w-[480px] mx-auto">
              Web app, CLI, and plugins for your favorite platforms.
            </SectionSub>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                icon: Monitor, title: "Web App",
                desc: "Full dashboard, reports, fix generator",
                cta: "Try free →", href: "/signup", primary: false,
              },
              {
                icon: Terminal, title: "CLI",
                desc: <><span style={{ fontFamily: "var(--font-jb-mono, monospace)" }} className="text-[12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded px-1.5 py-0.5">npx showsup scan</span></>,
                cta: "View docs →", href: GITHUB_URL, primary: false,
              },
              {
                icon: Globe, title: "Chrome Extension",
                badge: "NEW",
                desc: "One-click check for any site",
                cta: isChrome ? "Add to Chrome →" : "Learn more →",
                href: GITHUB_URL, primary: isChrome,
              },
              {
                icon: Code2, title: "WordPress",
                desc: "Auto-deploy llms.txt + schema",
                cta: "Install →", href: GITHUB_URL, primary: false,
              },
              {
                icon: ShoppingBag, title: "Shopify",
                desc: "Product-level AI visibility",
                cta: "Install →", href: GITHUB_URL, primary: false,
              },
            ].map((card, i) => (
              <FadeIn key={card.title} delay={i * 50}>
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3 h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                      <card.icon className="w-4 h-4 text-[#10B981]" />
                    </div>
                    {card.badge && (
                      <span className="text-[10px] font-semibold text-[#065F46] bg-[#F0FDF4] border border-[#D1FAE5] rounded-full px-2 py-0.5">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#111827] mb-1">{card.title}</p>
                    <div className="text-[12px] text-[#4B5563] leading-relaxed">{card.desc}</div>
                  </div>
                  <a
                    href={card.href}
                    target={card.href.startsWith("http") ? "_blank" : undefined}
                    rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className={cn(
                      "text-[12px] font-medium rounded-lg px-3 py-1.5 text-center transition-all duration-200",
                      card.primary
                        ? "bg-[#10B981] hover:bg-[#059669] text-white shadow-sm"
                        : "text-[#10B981] hover:text-[#059669] hover:underline"
                    )}
                  >
                    {card.cta}
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <p className="text-center text-[13px] text-[#9CA3AF]">
              More: REST API · LangChain · Claude MCP · Zapier (coming soon)
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── CONNECT YOUR DATA ─────────────────────────────────────────────── */}
      <section id="integrations" className={cn(sectionPad, "px-6 bg-[#F9FAFB]")}>
        <div className={cn(container)}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left */}
            <FadeIn className="space-y-8">
              <div className="space-y-4">
                <SectionLabel>Integrations</SectionLabel>
                <SectionHeading>Correlate AI visibility<br />with business impact</SectionHeading>
                <SectionSub>
                  AI visibility alone is a number. Connected to your data, it&apos;s a strategy.
                </SectionSub>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Search,      title: "Google Search Console",
                    desc: "Branded queries vs AI visibility. Detect AI-origin traffic.",
                    status: "Available", avail: true,
                  },
                  {
                    icon: Upload,      title: "CSV Upload",
                    desc: "Ahrefs, Semrush, Nielsen, Brandwatch, Shopify — any CSV.",
                    status: "Available", avail: true,
                  },
                  {
                    icon: BarChart3,   title: "Google Analytics",
                    desc: "Track AI-referred traffic and conversions.",
                    status: "Coming soon", avail: false,
                  },
                  {
                    icon: ShoppingBag, title: "Shopify Revenue",
                    desc: "Product visibility → sales correlation.",
                    status: "Via plugin", avail: true,
                  },
                ].map((integ) => (
                  <div
                    key={integ.title}
                    className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <integ.icon className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                      <span
                        className={cn(
                          "text-[10px] font-medium rounded-full px-2 py-0.5 flex-shrink-0",
                          integ.avail
                            ? "bg-[#F0FDF4] text-[#065F46]"
                            : "bg-[#F9FAFB] text-[#9CA3AF]"
                        )}
                      >
                        {integ.avail ? "✅" : "🔜"} {integ.status}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-[#111827]">{integ.title}</p>
                    <p className="text-[12px] text-[#4B5563] leading-relaxed">{integ.desc}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Right — chart */}
            <FadeIn delay={120} className="space-y-4">
              <p className="text-[12px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                Example correlation
              </p>
              <CorrelationChart />
              <p className="text-[13px] text-[#4B5563]">
                When AI mentions you more, people search for you by name — and that search converts.
                Track the full chain from AI recommendation to revenue.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── BUILT FOR DEVELOPERS ──────────────────────────────────────────── */}
      <section className={cn(sectionPad, "px-6 bg-white")}>
        <div className={cn(container, "space-y-12")}>
          <FadeIn className="text-center space-y-4">
            <SectionLabel>API-first</SectionLabel>
            <SectionHeading>Built for developers</SectionHeading>
            <SectionSub className="max-w-[480px] mx-auto">
              Integrate AI visibility data into any workflow.
            </SectionSub>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <FadeIn>
              <PythonBlock />
            </FadeIn>
            <FadeIn delay={120} className="space-y-6">
              <div className="space-y-3">
                <p className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Integrates with
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Looker Studio", "Tableau", "Zapier", "n8n",
                    "LangChain", "Claude MCP", "CrewAI",
                  ].map((tool) => (
                    <span
                      key={tool}
                      className="text-[13px] text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[13px] text-[#9CA3AF]">
                REST API · Webhooks · Structured JSON · CLI · MIT Licensed
              </p>
              <ul className="space-y-3">
                <CheckItem>Full REST API with JSON responses</CheckItem>
                <CheckItem>Webhooks for scan completion events</CheckItem>
                <CheckItem>Claude MCP server for AI agents</CheckItem>
                <CheckItem>LangChain tool integration</CheckItem>
                <CheckItem>Self-host with your own API keys</CheckItem>
              </ul>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[14px] font-medium text-[#10B981] hover:text-[#059669] transition-colors duration-200"
              >
                <Github className="w-4 h-4" /> View API docs on GitHub →
              </a>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM ─────────────────────────────────────────────────────── */}
      <section className={cn(sectionPad, "px-6 bg-[#F9FAFB]")}>
        <div className={cn(container, "space-y-12")}>
          <FadeIn className="text-center space-y-4">
            <SectionLabel>For every team</SectionLabel>
            <SectionHeading>Built for every team</SectionHeading>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "For Marketers",
                items: [
                  "Google Search Console integration",
                  "CSV import (Ahrefs, Semrush, Nielsen)",
                  "Revenue correlation",
                  "PDF reports for stakeholders",
                  "AI Analyst Chat for strategy",
                ],
              },
              {
                title: "For Developers",
                items: [
                  "REST API + webhooks",
                  "CLI: npx showsup scan",
                  "Claude MCP server",
                  "LangChain / CrewAI tool",
                  "MIT licensed, self-host free",
                ],
              },
              {
                title: "For Website Owners",
                items: [
                  "WordPress plugin",
                  "Shopify app",
                  "Chrome extension",
                  "llms.txt auto-generator",
                  "Schema markup deployment",
                ],
              },
            ].map((col, i) => (
              <FadeIn key={col.title} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-7 space-y-5 h-full">
                  <p className="text-[16px] font-semibold text-[#111827]">{col.title}</p>
                  <ul className="space-y-3">
                    {col.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className={cn(sectionPad, "px-6 bg-white")}>
        <div className={cn(container, "space-y-14")}>
          <FadeIn className="text-center space-y-4">
            <SectionLabel>Pricing</SectionLabel>
            <SectionHeading>Free and open source.<br />Cloud when you need it.</SectionHeading>
          </FadeIn>

          {/* Main cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <FadeIn>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 flex flex-col gap-6 h-full shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div>
                  <p className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Open Source</p>
                  <p className="text-[36px] font-semibold text-[#111827]">
                    $0{" "}
                    <span className="text-[16px] font-normal text-[#9CA3AF]">forever</span>
                  </p>
                  <p className="text-[14px] text-[#4B5563] mt-1">Self-host with your own API keys</p>
                </div>
                <ul className="space-y-3 flex-1">
                  {["All features", "CLI", "MIT license", "Community support"].map((f) => (
                    <CheckItem key={f}>{f}</CheckItem>
                  ))}
                </ul>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#111827] font-medium rounded-lg h-11 text-[14px] transition-all duration-200"
                >
                  <Star className="w-3.5 h-3.5 text-[#F59E0B]" fill="#F59E0B" />
                  Star on GitHub →
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={80}>
              <div className="bg-white border-2 border-[#10B981] rounded-2xl p-8 flex flex-col gap-6 h-full shadow-[0_4px_16px_rgba(16,185,129,0.1)] relative">
                <div className="absolute top-4 right-4">
                  <span className="text-[11px] font-semibold text-[#065F46] bg-[#F0FDF4] border border-[#D1FAE5] rounded-full px-2.5 py-1">
                    RECOMMENDED
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[#10B981] uppercase tracking-wider mb-3">Cloud</p>
                  <p className="text-[36px] font-semibold text-[#111827]">
                    From $0{" "}
                    <span className="text-[16px] font-normal text-[#9CA3AF]">to start</span>
                  </p>
                  <p className="text-[14px] text-[#4B5563] mt-1">1,000 free tokens — no setup needed</p>
                </div>
                <ul className="space-y-3 flex-1">
                  {[
                    "No API keys needed",
                    "Interactive reports",
                    "AI Analyst Chat",
                    "Fix generator",
                    "All integrations",
                  ].map((f) => <CheckItem key={f}>{f}</CheckItem>)}
                </ul>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg h-11 text-[14px] transition-all duration-200 hover:scale-[1.01] shadow-sm"
                >
                  Start Free →
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* Token packages */}
          <FadeIn className="space-y-5">
            <p className="text-center text-[14px] text-[#9CA3AF]">
              Need more tokens? Buy once, no subscription.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { tokens: "2,500",  price: "S$19",  rate: "S$0.008/token",          popular: false },
                { tokens: "5,000",  price: "S$39",  rate: "S$0.008/token",          popular: true  },
                { tokens: "12,000", price: "S$79",  rate: "S$0.007/tok — save 14%", popular: false },
                { tokens: "30,000", price: "S$149", rate: "S$0.005/tok — save 36%", popular: false },
              ].map((pkg) => (
                <div
                  key={pkg.tokens}
                  className={cn(
                    "bg-[#F9FAFB] rounded-xl border px-4 py-4 text-center space-y-1.5 transition-all duration-200 hover:shadow-sm",
                    pkg.popular ? "border-[#10B981]/40" : "border-[#E5E7EB]"
                  )}
                >
                  {pkg.popular && (
                    <p className="text-[10px] font-semibold text-[#10B981] uppercase tracking-wide">Popular</p>
                  )}
                  <p
                    className="text-[20px] font-semibold text-[#111827]"
                    style={{ fontFamily: "var(--font-jb-mono, monospace)" }}
                  >
                    {pkg.tokens}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">tokens</p>
                  <p className="text-[14px] font-semibold text-[#111827]">{pkg.price}</p>
                  <p className="text-[11px] text-[#9CA3AF] leading-snug">{pkg.rate}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-[13px] text-[#9CA3AF]">
              All plans include: REST API · CLI · Chrome extension · All fix types · AI Analyst · 10 regions
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className={cn(sectionPad, "px-6 bg-[#F9FAFB]")}>
        <div className={cn(container, "max-w-[720px]")}>
          <FadeIn className="text-center space-y-4 mb-12">
            <SectionHeading>Questions</SectionHeading>
          </FadeIn>
          <FadeIn>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-6">
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem
                  key={i}
                  q={item.q}
                  a={item.a}
                  open={faqOpen === i}
                  onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
                />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="bg-[#10B981] py-[64px] md:py-[80px] px-6 text-center">
        <div className="max-w-[720px] mx-auto space-y-6">
          <h2
            className="text-[28px] sm:text-[32px] font-semibold text-white"
            style={{ fontFamily: "var(--font-inter, system-ui)" }}
          >
            Check your brand&apos;s AI visibility
          </h2>
          <p className="text-[16px] text-white/80">
            1,000 free tokens. Results in 60 seconds. Open source.
          </p>
          <div className="flex justify-center">
            <UrlInput variant="dark" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F9FAFB] text-[#10B981] font-medium rounded-lg px-6 h-11 text-[14px] transition-all duration-200 shadow-sm"
            >
              Start Free →
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-transparent border border-white/40 hover:border-white text-white font-medium rounded-lg px-6 h-11 text-[14px] transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#E5E7EB] py-14 px-6">
        <div className={container}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1 space-y-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[16px] font-semibold text-[#111827]"
                  style={{ fontFamily: "var(--font-inter, system-ui)" }}
                >
                  ShowsUp
                </span>
                <span className="text-[#10B981]">●</span>
              </div>
              <p className="text-[13px] text-[#4B5563]">Open source AEO agent</p>
              <p className="text-[13px] text-[#9CA3AF]">Made in Singapore 🇸🇬</p>
            </div>

            {/* Link columns */}
            {[
              {
                label: "Product",
                links: [
                  { label: "Cloud",            href: "/signup"    },
                  { label: "CLI",              href: GITHUB_URL   },
                  { label: "Chrome Extension", href: GITHUB_URL   },
                  { label: "WordPress",        href: GITHUB_URL   },
                  { label: "Shopify",          href: GITHUB_URL   },
                ],
              },
              {
                label: "Developers",
                links: [
                  { label: "Documentation",  href: "#"          },
                  { label: "API Reference",  href: "#"          },
                  { label: "GitHub",         href: GITHUB_URL   },
                  { label: "CLI Docs",       href: GITHUB_URL   },
                  { label: "MCP Server",     href: GITHUB_URL   },
                ],
              },
              {
                label: "Integrations",
                links: [
                  { label: "Search Console", href: "#"          },
                  { label: "CSV Upload",     href: "#"          },
                  { label: "Shopify",        href: GITHUB_URL   },
                  { label: "REST API",       href: "#"          },
                ],
              },
              {
                label: "Community",
                links: [
                  { label: "Blog",             href: "/blog"      },
                  { label: "Changelog",        href: "#"          },
                  { label: "Discussions",      href: GITHUB_URL + "/discussions" },
                  { label: "Contributing",     href: GITHUB_URL   },
                ],
              },
            ].map((col) => (
              <div key={col.label} className="space-y-3">
                <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                  {col.label}
                </p>
                <div className="space-y-2.5">
                  {col.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="block text-[14px] text-[#4B5563] hover:text-[#111827] transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E5E7EB] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-[#9CA3AF]">© 2026 ShowsUp. MIT Licensed.</p>
            <div className="flex items-center gap-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors duration-200"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
