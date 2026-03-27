import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Blog: AI Visibility Insights | ShowsUp",
  description:
    "Practical guides, research, and strategy for brands navigating the AI visibility era. Covering AEO, answer engine optimisation, ChatGPT brand recommendations, and more.",
  keywords: [
    "AEO blog",
    "AI visibility insights",
    "answer engine optimisation guide",
    "ChatGPT brand recommendations",
    "AI SEO 2026",
  ],
  openGraph: {
    title: "Blog: AI Visibility Insights | ShowsUp",
    description:
      "Practical guides and research for brands navigating the AI visibility era.",
    url: "https://showsup.co/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog: AI Visibility Insights | ShowsUp",
    description:
      "Practical guides and research for brands navigating the AI visibility era.",
  },
};

const articles = [
  {
    title: "What is AEO? The Complete Guide to Answer Engine Optimisation in 2026",
    slug: "what-is-aeo-answer-engine-optimisation-guide-2026",
    date: "March 18, 2026",
    description:
      "Answer Engine Optimisation (AEO) is the practice of making your brand more likely to be cited and recommended by AI assistants like ChatGPT, Claude, and Gemini. This guide covers what it is, why it matters, and how to get started.",
    readTime: "12 min read",
  },
  {
    title: "How ChatGPT Decides Which Brands to Recommend (And How to Be One of Them)",
    slug: "how-chatgpt-decides-which-brands-to-recommend",
    date: "March 5, 2026",
    description:
      "ChatGPT doesn't rank results. It makes recommendations. Understanding the signals that influence those recommendations is the first step to improving your brand's AI visibility. Here's what the evidence shows.",
    readTime: "9 min read",
  },
  {
    title: "We Scanned 100 SaaS Brands on Claude: Here's What We Found",
    slug: "we-scanned-100-saas-brands-on-claude",
    date: "February 20, 2026",
    description:
      "We ran the ShowsUp scanner on 100 SaaS companies across 10 categories and scored them across all 10 AEO dimensions. The results were surprising: the brands you'd expect to dominate often didn't.",
    readTime: "14 min read",
  },
  {
    title: "llms.txt: The New robots.txt That Every Brand Needs in 2026",
    slug: "llms-txt-the-new-robots-txt-for-ai",
    date: "February 4, 2026",
    description:
      "Just as robots.txt tells search engine crawlers what to index, llms.txt tells AI models how to represent your brand. Here's what it is, how to write one, and why it's already a meaningful AEO signal.",
    readTime: "7 min read",
  },
  {
    title: "Google SGE vs ChatGPT vs Claude: Where Should You Focus Your AI Visibility Efforts?",
    slug: "google-sge-vs-chatgpt-vs-claude-where-to-focus",
    date: "January 22, 2026",
    description:
      "There are now multiple AI surfaces where your brand can show up or not. Google's AI Overviews, ChatGPT, Claude, Perplexity. Each works differently. Here's how to prioritise where to invest your AEO efforts.",
    readTime: "10 min read",
  },
];

export default function BlogPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            Blog
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            AI Visibility Insights
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl">
            Practical guides, original research, and strategic thinking for
            brands and marketers navigating the shift from search to AI
            discovery.
          </p>
        </div>
      </section>

      {/* Article list */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="divide-y divide-[#E5E7EB]">
            {articles.map((article) => (
              <article key={article.slug} className="py-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-[#9CA3AF]">{article.date}</span>
                  <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
                  <span className="text-sm text-[#9CA3AF]">{article.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-[#111827] mb-3 leading-snug">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="hover:text-[#10B981] transition-colors"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="text-[#6B7280] leading-relaxed mb-5 max-w-2xl">
                  {article.description}
                </p>
                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "#10B981" }}
                >
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            See how your brand shows up in AI
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Don&apos;t just read about AEO. Measure it. Run a free brand visibility
            scan and get your score in minutes.
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
