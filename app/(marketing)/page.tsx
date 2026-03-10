"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { WaitlistModal } from "@/components/waitlist-modal";
import {
  BarChart3,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  Globe,
  Zap,
  TrendingUp,
} from "lucide-react";

// ─── Smooth scroll helper ────────────────────────────────────────────────────

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0A0E17]/90 backdrop-blur-md border-b border-white/8"
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
            onClick={() => scrollToId("how-it-works")}
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToId("pricing")}
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            Pricing
          </button>
          <Link href="/blog" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
            Blog
          </Link>
          <Link href="/login" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
            Login
          </Link>
        </nav>

        {/* CTA — scrolls to hero URL input */}
        <button
          onClick={() => scrollToId("hero")}
          className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-[#10B981] border border-[#10B981]/60 hover:border-[#10B981] hover:bg-[#10B981]/8 rounded-lg px-4 py-2 transition-all"
        >
          Check your brand <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}

// ─── URL Input ────────────────────────────────────────────────────────────────

function UrlInput({ size = "default" }: { size?: "default" | "lg" }) {
  const [url, setUrl] = useState("");
  const router = useRouter();
  const id = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      router.push(`/app/scan?url=${encodeURIComponent(trimmed)}`);
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
        placeholder="Enter your website URL..."
        className={cn(
          "flex-1 rounded-lg bg-[#111827] border border-white/12 text-white placeholder:text-gray-600 outline-none transition-colors",
          "focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/30",
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
        Check if you show up →
      </button>
    </form>
  );
}

// ─── Dashboard Preview ────────────────────────────────────────────────────────

const HEATMAP = [
  { brand: "TravelShield", chatgpt: 82, claude: 91, gemini: 67, perplexity: 78 },
  { brand: "QuickCover",   chatgpt: 54, claude: 41, gemini: 60, perplexity: 33 },
  { brand: "Wanderlux",    chatgpt: 18, claude: 22, gemini: 14, perplexity: 9  },
];

function HeatCell({ score }: { score: number }) {
  const bg =
    score >= 70 ? "bg-[#10B981]/80 text-[#0A0E17]"
    : score >= 40 ? "bg-[#F59E0B]/70 text-[#0A0E17]"
    : "bg-[#EF4444]/50 text-white";
  return (
    <div className={cn("rounded text-xs font-bold flex items-center justify-center h-8 w-full", bg)}>
      {score}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/12 bg-[#0A0E17] shadow-2xl shadow-black/50">
      {/* Browser chrome */}
      <div className="bg-[#111827] border-b border-white/8 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#EF4444]/70" />
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]/70" />
          <div className="w-3 h-3 rounded-full bg-[#10B981]/70" />
        </div>
        <div className="flex-1 bg-[#1F2937] rounded-md px-3 py-1 text-xs text-gray-500 text-center">
          app.showsup.co/dashboard
        </div>
      </div>

      {/* App shell */}
      <div className="flex" style={{ height: 340 }}>
        {/* Mini sidebar */}
        <div className="w-36 bg-[#111827] border-r border-white/6 p-3 flex flex-col gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2 mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-xs font-semibold text-white">ShowsUp</span>
          </div>
          {["Dashboard", "New Scan", "Scores", "Trends", "Settings"].map((item, i) => (
            <div
              key={item}
              className={cn(
                "text-xs px-2 py-1.5 rounded-md",
                i === 0 ? "bg-[#10B981]/15 text-[#10B981]" : "text-gray-500"
              )}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 overflow-hidden">
          <p className="text-xs font-semibold text-white mb-3">Dashboard</p>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Visibility Score", val: "73", color: "text-[#10B981]" },
              { label: "Brands", val: "3", color: "text-white" },
              { label: "Scans Run", val: "12", color: "text-white" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-[#111827] border border-white/8 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">{label}</p>
                <p className={cn("text-xl font-bold", color)}>{val}</p>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="bg-[#111827] border border-white/8 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 mb-2">AI Visibility Heatmap</p>
            <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] gap-1.5 items-center">
              <div />
              {["ChatGPT", "Claude", "Gemini", "Perplexity"].map((m) => (
                <div key={m} className="text-[9px] text-gray-500 text-center">{m}</div>
              ))}
              {HEATMAP.map((row) => (
                <>
                  <div key={row.brand} className="text-[9px] text-gray-400 truncate">{row.brand}</div>
                  <HeatCell key={`${row.brand}-c`} score={row.chatgpt} />
                  <HeatCell key={`${row.brand}-cl`} score={row.claude} />
                  <HeatCell key={`${row.brand}-g`} score={row.gemini} />
                  <HeatCell key={`${row.brand}-p`} score={row.perplexity} />
                </>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Mockup ──────────────────────────────────────────────────────────────

function ChatMockup() {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
      <div className="bg-[#1F2937] border-b border-white/8 px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#10B981]" />
        <span className="text-xs text-gray-400 font-medium">ChatGPT</span>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <div className="flex justify-end">
          <div className="bg-[#1F2937] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-gray-200 text-xs max-w-[80%]">
            What travel insurance should I get for my trip to Japan?
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] text-[#10B981] font-bold">AI</span>
          </div>
          <div className="bg-[#0A0E17] border border-white/6 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-gray-300 leading-relaxed max-w-[90%]">
            For a Japan trip, here are top options to consider:
            <br /><br />
            <span className="bg-[#10B981]/20 text-[#10B981] font-semibold px-1 rounded">
              TravelShield
            </span>{" "}
            — Best overall coverage with 24/7 emergency support and medical evacuation included.
            <br /><br />
            <span className="text-gray-400">World Nomads</span> — Popular with backpackers, flexible extensions.
            <br />
            <span className="text-gray-400">Allianz</span> — Good for families, comprehensive medical.
            <br /><br />
            <span className="text-gray-500">I&apos;d recommend TravelShield for comprehensive coverage…</span>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-[#1F2937] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-gray-200 text-xs max-w-[80%]">
            Tell me more about TravelShield
          </div>
        </div>
        <div className="flex items-center gap-1.5 pl-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "Check your brand once",
    features: [
      { text: "1 brand scan", ok: true },
      { text: "3 AI models", ok: true },
      { text: "Basic score", ok: true },
      { text: "Scan history", ok: false },
      { text: "Trend tracking", ok: false },
      { text: "API access", ok: false },
    ],
    cta: "Check free",
    action: "scroll-hero" as const,
    highlight: false,
  },
  {
    name: "Starter",
    monthly: 29,
    annual: 23,
    desc: "For growing brands",
    features: [
      { text: "5 brands", ok: true },
      { text: "All AI models", ok: true },
      { text: "Full score breakdown", ok: true },
      { text: "30-day history", ok: true },
      { text: "Trend tracking", ok: false },
      { text: "API access", ok: false },
    ],
    cta: "Join Waitlist",
    action: "waitlist-starter" as const,
    highlight: false,
  },
  {
    name: "Growth",
    monthly: 79,
    annual: 63,
    desc: "For serious visibility",
    features: [
      { text: "Unlimited brands", ok: true },
      { text: "All AI models", ok: true },
      { text: "Full score breakdown", ok: true },
      { text: "Unlimited history", ok: true },
      { text: "Trend tracking", ok: true },
      { text: "API access", ok: true },
    ],
    cta: "Join Waitlist",
    action: "waitlist-growth" as const,
    highlight: true,
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How does ShowsUp work?",
    a: "We send targeted prompts to ChatGPT, Claude, Gemini, and Perplexity — then analyse the responses to see if and how your brand is mentioned. Each response is scored based on whether you appear, how prominently, and in what context.",
  },
  {
    q: "Which AI platforms do you scan?",
    a: "We scan ChatGPT (GPT-4o), Claude (Haiku & Sonnet), Gemini (2.0 Flash), and Perplexity. We add new models as they reach mainstream adoption.",
  },
  {
    q: "How often are scans run?",
    a: "Free scans are on-demand. Paid plans include scheduled scans — daily on Growth, weekly on Starter — so you automatically track changes over time.",
  },
  {
    q: "How is the score calculated?",
    a: "Your ShowsUp Score (0–100) is a weighted average across all model responses and prompt types. It factors in whether your brand is mentioned, how early in the response, and how positively it's framed.",
  },
  {
    q: "Why does my score differ between models?",
    a: "Each AI has different training data and ranking biases. That's the point — seeing where you're strong or invisible helps you prioritise where to improve.",
  },
  {
    q: "Is the free scan really free?",
    a: "Yes. Enter your URL, we scan immediately, show you your score — no credit card, no account required for the basic check.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium text-white">{q}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <p className="text-sm text-gray-400 leading-relaxed pb-5">{a}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [annual, setAnnual] = useState(false);
  const [waitlistPlan, setWaitlistPlan] = useState<"starter" | "growth" | null>(null);

  function handlePlanCta(action: typeof PLANS[number]["action"]) {
    if (action === "scroll-hero") {
      scrollToId("hero");
    } else if (action === "waitlist-starter") {
      setWaitlistPlan("starter");
    } else if (action === "waitlist-growth") {
      setWaitlistPlan("growth");
    }
  }

  return (
    <div className="bg-[#0A0E17] text-white">
      <Nav />

      {/* ── HERO ── */}
      <section id="hero" className="pt-36 pb-28 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-7">
          <div className="inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/25 rounded-full px-4 py-1.5 text-xs font-medium text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            AI brand visibility — now measurable
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
            Does your brand{" "}
            <span className="text-[#10B981]">show up</span>
            <br />in AI?
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
            Millions ask ChatGPT, Claude, and Gemini which brands to choose.{" "}
            <span className="text-gray-200">Find out if yours makes the cut.</span>
          </p>

          <div className="flex justify-center">
            <UrlInput size="lg" />
          </div>

          <p className="text-sm text-gray-600">
            Free · No signup · Results in 60 seconds
          </p>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-10 border-y border-white/6">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-5">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Trusted by 500+ brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {["Acme Corp", "TravelShield", "Wanderlux", "QuickCover", "FinServ"].map(
              (brand, i) => (
                <span key={brand} className="flex items-center gap-10">
                  <span className="text-sm font-semibold text-gray-500 hover:text-gray-300 transition-colors cursor-default">
                    {brand}
                  </span>
                  {i < 4 && <span className="text-gray-700">·</span>}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">
              AI is the new search.{" "}
              <span className="text-gray-500">Are you invisible?</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { stat: "4B+", label: "AI queries per day across major platforms" },
              { stat: "12%", label: "of brands actively monitor their AI visibility" },
              { stat: "66%", label: "of AI citations go to just 20 domains" },
            ].map(({ stat, label }) => (
              <div
                key={stat}
                className="bg-[#111827] border border-[#1F2937] rounded-xl p-7 space-y-2"
              >
                <p className="text-4xl font-bold text-[#10B981]">{stat}</p>
                <p className="text-sm text-gray-400 leading-snug">{label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            SEO told you where you rank on Google.{" "}
            <span className="text-white font-medium">
              ShowsUp tells you whether AI even mentions your name.
            </span>
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0D1220]">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="text-gray-400">Three steps. Sixty seconds. Zero setup.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                step: "01",
                title: "Paste your URL",
                desc: "Drop in your website address. We detect your brand name, category, and key products automatically.",
              },
              {
                icon: Zap,
                step: "02",
                title: "We scan every AI",
                desc: "Our engine fires targeted prompts at ChatGPT, Claude, Gemini, and Perplexity simultaneously.",
              },
              {
                icon: TrendingUp,
                step: "03",
                title: "See your ShowsUp Score",
                desc: "Get a 0–100 visibility score per model, a full response breakdown, and actionable recommendations.",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div
                key={step}
                className="bg-[#111827] border border-[#1F2937] rounded-xl p-7 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#10B981]/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <span className="text-3xl font-bold text-white/8">{step}</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1.5">{title}</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">
              See exactly where you stand
            </h2>
            <p className="text-gray-400">
              A live heatmap of your AI visibility — across every model, every query.
            </p>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* ── COMMERCE ── */}
      <section className="py-24 px-6 bg-[#0D1220]">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Critical for brands where{" "}
              <span className="text-[#10B981]">AI drives purchases</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              When a customer asks an AI for a recommendation, the brand it mentions wins the sale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <ChatMockup />

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-lg font-semibold text-white leading-snug">
                  Your customer already asked AI before visiting your site.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  AI-driven recommendations are the new word-of-mouth. If you&apos;re not showing up
                  when people ask about your category, your competitors are getting the referral.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  High-impact categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Insurance", "Travel", "Finance", "E-commerce", "SaaS", "Healthcare"].map(
                    (cat) => (
                      <span
                        key={cat}
                        className="text-xs font-medium bg-[#111827] border border-[#1F2937] text-gray-300 rounded-full px-3 py-1.5"
                      >
                        {cat}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 space-y-1.5">
                <p className="text-2xl font-bold text-[#10B981]">3.2×</p>
                <p className="text-sm text-gray-400">
                  higher conversion when a brand is cited by an AI vs a Google result
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Plans that grow with your brand
            </h2>
            <div className="inline-flex items-center bg-[#111827] border border-white/8 rounded-lg p-1 gap-1">
              {(["Monthly", "Annual"] as const).map((label) => (
                <button
                  key={label}
                  onClick={() => setAnnual(label === "Annual")}
                  className={cn(
                    "text-sm px-4 py-1.5 rounded-md transition-all font-medium",
                    (label === "Annual") === annual
                      ? "bg-[#10B981] text-[#0A0E17]"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {label}
                  {label === "Annual" && (
                    <span className="ml-1.5 text-[10px] font-semibold opacity-80">−20%</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-xl border p-7 flex flex-col gap-6 relative",
                  plan.highlight
                    ? "bg-[#111827] border-[#10B981]/50"
                    : "bg-[#111827] border-[#1F2937]"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#10B981] text-[#0A0E17] text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="font-semibold text-white">{plan.name}</p>
                  <p className="text-gray-500 text-sm">{plan.desc}</p>
                </div>

                <div>
                  <span className="text-4xl font-bold text-white">
                    ${annual ? plan.annual : plan.monthly}
                  </span>
                  {plan.monthly > 0 && (
                    <span className="text-gray-500 text-sm ml-1">/mo</span>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(({ text, ok }) => (
                    <li key={text} className="flex items-center gap-2.5 text-sm">
                      {ok ? (
                        <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      <span className={ok ? "text-gray-200" : "text-gray-600"}>{text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanCta(plan.action)}
                  className={cn(
                    "w-full text-center text-sm font-semibold py-2.5 rounded-lg transition-colors",
                    plan.highlight
                      ? "bg-[#10B981] hover:bg-[#059669] text-[#0A0E17]"
                      : "border border-white/15 text-white hover:bg-white/5"
                  )}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-[#0D1220]">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Frequently asked questions
            </h2>
          </div>
          <div>
            {FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-7">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Check if your brand shows up
          </h2>
          <p className="text-gray-400">
            Free scan. No credit card. Results in under 60 seconds.
          </p>
          <div className="flex justify-center">
            <UrlInput />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/6 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm font-semibold text-white">ShowsUp</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollToId("how-it-works")}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToId("pricing")}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Pricing
            </button>
            <Link href="/blog" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Blog
            </Link>
            <Link href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Terms
            </Link>
          </div>

          <p className="text-xs text-gray-600">© 2026 ShowsUp. All rights reserved.</p>
        </div>
      </footer>

      {/* ── WAITLIST MODAL ── */}
      {waitlistPlan && (
        <WaitlistModal
          plan={waitlistPlan}
          onClose={() => setWaitlistPlan(null)}
        />
      )}
    </div>
  );
}
