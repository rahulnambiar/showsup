import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "ShowsUp for Shopify — Track Your Store's AI Visibility",
  description:
    "Millions of consumers ask AI for product recommendations. The ShowsUp Shopify app tells you whether your store shows up — and exactly what to fix so it does.",
  keywords: [
    "ShowsUp Shopify",
    "AI visibility ecommerce",
    "Shopify AEO",
    "AI product recommendations",
    "ecommerce brand visibility AI",
  ],
  openGraph: {
    title: "ShowsUp for Shopify — Track Your Store's AI Visibility",
    description:
      "Millions of consumers ask AI for product recommendations. Is your store mentioned? Find out with ShowsUp.",
    url: "https://showsup.co/shopify",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowsUp for Shopify — Track Your Store's AI Visibility",
    description:
      "Millions of consumers ask AI for product recommendations. Is your store mentioned? Find out with ShowsUp.",
  },
};

export default function ShopifyPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            Shopify App
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            Is your Shopify store
            <br />
            mentioned by AI?
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl mb-8">
            Every day, millions of consumers ask ChatGPT, Claude, and Gemini
            questions like &ldquo;What&apos;s the best running shoe brand for flat feet?&rdquo;
            or &ldquo;Which sustainable skincare brands are worth trying?&rdquo; If your
            store isn&apos;t in those answers, you&apos;re invisible to a massive and
            growing channel. ShowsUp tells you exactly where you stand — and how
            to improve.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: "#10B981" }}
            >
              Get started free →
            </Link>
            <a
              href="https://github.com/rahulnambiar/showsup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-[#374151] font-semibold text-sm border border-[#E5E7EB] hover:border-[#9CA3AF] transition-colors bg-white"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            Why AI Visibility Matters for Ecommerce
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-5 text-[#374151] leading-relaxed max-w-3xl">
            <p>
              Search has always been the lifeblood of ecommerce discovery. But
              the way people search is changing faster than most store owners
              realise. AI chatbots now handle hundreds of millions of
              product-related queries per day — and unlike Google, they give a
              specific answer rather than a list of links to browse.
            </p>
            <p>
              When someone asks ChatGPT for a running shoe recommendation, it
              might name two or three brands. If yours isn&apos;t one of them, you
              don&apos;t just rank lower — you don&apos;t exist in that conversation at
              all. The brands that get recommended build compounding trust and
              traffic. The ones that don&apos;t are slowly losing share of mind without
              knowing it.
            </p>
            <p>
              ShowsUp for Shopify gives you visibility into this new channel —
              measured, tracked, and with a clear action plan to improve it.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Features</h2>
          <div
            className="w-12 h-1 rounded-full mb-10"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Store visibility score",
                description:
                  "A composite AEO score for your Shopify store across 10 dimensions — from brand authority and schema markup to product review coverage and social proof.",
              },
              {
                title: "Product mention tracking",
                description:
                  "See which of your product categories or specific products get mentioned in AI responses. Identify which parts of your catalogue have the strongest AI presence.",
              },
              {
                title: "Competitor comparison",
                description:
                  "Benchmark your store's AI visibility against up to 5 competitors. Understand exactly where the gap is and what they're doing that you're not.",
              },
              {
                title: "Improvement plan",
                description:
                  "Receive a prioritised, Shopify-specific action plan: which product descriptions to rewrite, what schema to add, which review platforms to prioritise, and more.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#E5E7EB] p-6"
              >
                <div
                  className="w-2 h-2 rounded-full mb-3"
                  style={{ background: "#10B981" }}
                />
                <h3 className="font-semibold text-[#111827] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            Installation
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl">
            <div>
              <h3 className="font-semibold text-[#111827] mb-4">
                Shopify App Store
              </h3>
              <ol className="space-y-3 text-sm text-[#374151]">
                {[
                  'Search "ShowsUp" in the Shopify App Store.',
                  "Click Add app and approve permissions.",
                  "Connect your ShowsUp account.",
                  "Run your first scan from the app dashboard.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "#10B981" }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-[#111827] mb-4">GitHub</h3>
              <ol className="space-y-3 text-sm text-[#374151]">
                {[
                  "Clone the repo from GitHub.",
                  "Follow the setup guide in README.",
                  "Deploy to your preferred host.",
                  "Install in Shopify Partners dashboard.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "#10B981" }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <a
                href="https://github.com/rahulnambiar/showsup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-5 text-sm font-medium"
                style={{ color: "#10B981" }}
              >
                GitHub repository →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Find out if your store shows up in AI
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Create a free ShowsUp account and run your first brand scan today.
            No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: "#10B981" }}
          >
            Get started free →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
