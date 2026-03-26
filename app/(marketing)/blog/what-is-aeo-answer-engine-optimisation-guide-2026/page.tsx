import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "What is AEO? The Complete Guide to Answer Engine Optimisation in 2026",
  description:
    "Answer Engine Optimisation (AEO) is the practice of making your brand more likely to be cited and recommended by AI assistants. This guide covers what it is, why it matters, and how to get started.",
  keywords: [
    "AEO",
    "answer engine optimisation",
    "AI visibility",
    "AI SEO",
    "ChatGPT brand visibility",
    "AI brand recommendations",
    "LLM optimisation",
  ],
  openGraph: {
    title: "What is AEO? The Complete Guide to Answer Engine Optimisation in 2026",
    description:
      "Answer Engine Optimisation (AEO) is the practice of making your brand more likely to be cited and recommended by AI assistants. This guide covers what it is, why it matters, and how to get started.",
    url: "https://www.showsup.co/blog/what-is-aeo-answer-engine-optimisation-guide-2026",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "What is AEO? The Complete Guide to Answer Engine Optimisation in 2026",
    description:
      "Answer Engine Optimisation (AEO) is the practice of making your brand more likely to be cited and recommended by AI assistants.",
  },
};

export default function PostAEOGuide() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm mb-8 transition-colors"
            style={{ color: "#10B981" }}
          >
            ← Back to Blog
          </Link>

          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#10B981" }}>
            AEO Fundamentals
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            What is AEO? The Complete Guide to Answer Engine Optimisation in 2026
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed mb-6">
            Answer Engine Optimisation (AEO) is the practice of making your brand more likely to be cited and recommended by AI assistants. This guide covers what it is, why it matters, and how to get started.
          </p>
          <p className="text-sm text-[#9CA3AF]">March 18, 2026 · 12 min read</p>
        </div>
      </section>

      {/* Article Body */}
      <article className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12 text-[#374151] leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">What is AEO?</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              <strong className="text-[#111827]">Answer Engine Optimisation (AEO)</strong> is the discipline of improving how your brand is represented, cited, and recommended by AI-powered answer engines — platforms like ChatGPT, Claude, Gemini, and Perplexity that respond to queries with direct, synthesised answers rather than a list of links.
            </p>
            <p className="mb-4">
              The term deliberately echoes <strong className="text-[#111827]">Search Engine Optimisation (SEO)</strong>, and the comparison is instructive. SEO is about getting your pages to rank well in a results list. AEO is about getting your brand to be <em>mentioned</em> — recommended by name — inside a conversational answer.
            </p>
            <p className="mb-4">
              The core difference: with SEO, a user still has to choose to click your link. With AEO, the AI is making the recommendation on your behalf. If ChatGPT says &ldquo;for small business accounting, most people use QuickBooks or FreshBooks,&rdquo; QuickBooks and FreshBooks have effectively won a customer recommendation — without the customer ever performing a traditional search.
            </p>
            <p>
              AEO is not a replacement for SEO. In 2026, you still need both. But AEO addresses a growing and largely unmeasured slice of how consumers discover and evaluate products — and most brands are flying completely blind on it.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Why AEO Matters Now</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              AI assistants have crossed the threshold from novelty to utility. ChatGPT alone surpassed 200 million weekly active users in late 2024, and that number has continued to grow. More importantly, the <em>nature</em> of usage has matured: people are no longer just asking AI to write their emails. They are asking it to help them make decisions.
            </p>
            <p className="mb-4">
              Studies and surveys across 2025 consistently show that <strong className="text-[#111827]">roughly 40–50% of consumers now use an AI assistant at least occasionally for product research or recommendations</strong> — and in younger demographics (18–34), that figure exceeds 60%. For B2B software purchasing, the influence is even higher: procurement teams and individual buyers routinely ask AI tools which vendors to evaluate.
            </p>
            <p className="mb-4">
              The stakes are significant. When an AI recommends your brand, the user encounters your name in a context of trust and authority — the AI has, in effect, pre-validated you. When an AI omits your brand from a relevant recommendation, that is a missed commercial opportunity that leaves no trace in your analytics.
            </p>
            <p>
              Unlike a Google ranking, there is no AI leaderboard, no rank tracker, no impression report. That invisibility is exactly the problem AEO exists to solve.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">How AI Engines Decide What to Recommend</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              AI assistants are not search engines with a different interface. Their recommendation logic is fundamentally different. Understanding this is the prerequisite for doing AEO well.
            </p>
            <p className="mb-4">
              <strong className="text-[#111827]">Training data and pre-training exposure.</strong> Large language models learn about the world — including brands — from vast corpora of text collected from the web, books, and other sources. A brand that appears frequently, positively, and authoritatively in that training data becomes part of the model&apos;s &ldquo;knowledge.&rdquo; A brand with sparse or negative coverage may not register at all.
            </p>
            <p className="mb-4">
              <strong className="text-[#111827]">Real-time retrieval (RAG).</strong> Increasingly, AI tools like Perplexity and ChatGPT with web browsing enabled use retrieval-augmented generation (RAG) — they pull live information from the web at query time and synthesise it into an answer. This means your current web presence, not just historical training data, matters.
            </p>
            <p className="mb-4">
              <strong className="text-[#111827]">Authority signals.</strong> AI models have learned — from their training data — which sources are trustworthy. Being cited by Wikipedia, major publications, industry analysts, and respected domain-specific sites increases the weight the model places on information about your brand.
            </p>
            <p>
              <strong className="text-[#111827]">Structured data.</strong> Machine-readable signals like schema markup, llms.txt files, and well-structured FAQs make it easier for both AI models and their retrieval systems to extract accurate, specific information about your brand. Ambiguity is the enemy of being recommended.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">The 10 Dimensions of AEO</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              At ShowsUp, we measure AI brand visibility across 10 distinct dimensions. Each captures a different facet of what makes a brand recommendable by AI. You can read the full methodology at{" "}
              <Link href="/methodology" style={{ color: "#10B981" }} className="font-medium">
                showsup.co/methodology
              </Link>
              , but here is a summary:
            </p>
            <ol className="space-y-4 list-none">
              {[
                ["Prominence", "How frequently and centrally your brand is mentioned when AI discusses your category. Are you a footnote or the lead recommendation?"],
                ["Sentiment", "The overall tone of AI-generated content about your brand. Positive framing correlates strongly with recommendation likelihood."],
                ["Coverage", "The breadth of sources that mention your brand — reviews, articles, forums, analyst reports. A wider citation footprint is harder for AI to ignore."],
                ["Structured Data", "The presence and quality of schema.org markup on your website — Organisation, Product, FAQ, BreadcrumbList, and others."],
                ["llms.txt", "Whether you have published an llms.txt file that explicitly tells AI systems how to represent your brand. An emerging but already meaningful signal."],
                ["Schema Markup", "Assessed separately from broader structured data — specifically looking at the depth and accuracy of your JSON-LD implementation."],
                ["Citation Quality", "Not just how many sources mention you, but how authoritative those sources are. A citation from Harvard Business Review carries more weight than a low-DA blog post."],
                ["Topical Authority", "Whether AI models associate your brand with genuine expertise in your domain — evidenced by educational content, original research, and expert commentary."],
                ["Brand Consistency", "How consistently your name, description, category, and key claims appear across web properties. Inconsistency creates model confusion."],
                ["Recency", "Whether your brand has generated positive, relevant coverage in the past 12 months. AI systems that use live retrieval weight fresh signals heavily."],
              ].map(([dim, desc], i) => (
                <li key={dim} className="flex gap-4">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                    style={{ background: "#10B981" }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <strong className="text-[#111827]">{dim}.</strong>{" "}
                    {desc}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">A Practical AEO Checklist</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              You do not need to tackle all 10 dimensions at once. Start with the actions that have the highest signal-to-effort ratio:
            </p>
            <ul className="space-y-3">
              {[
                "Add schema.org Organisation markup to your homepage with accurate name, description, founding date, logo, and contact point.",
                "Create and publish an llms.txt file at yourdomain.com/llms.txt that describes who you are, what you do, and your key differentiators in plain language.",
                "Audit your brand description for consistency. Your tagline, one-liner, and category label should be identical (or near-identical) across your website, LinkedIn, Crunchbase, G2, Capterra, and any other profile pages.",
                "Publish at least one piece of original research, analysis, or data per quarter. AI models weight original data sources highly for topical authority.",
                "Pursue coverage in at least 2–3 domain-relevant, high-authority publications per year. A single article in a respected industry outlet does more for your AI visibility than ten press releases.",
                "Add FAQ schema to your key landing pages, answering the questions your buyers actually ask.",
                "Monitor your AI presence quarterly. Ask ChatGPT, Claude, and Perplexity who they recommend in your category, and track whether your brand is named.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#10B981" }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">How to Measure Your AEO Score</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              The challenge with AEO is that there is no native reporting surface. You cannot log into ChatGPT and see how often it mentions your brand, any more than you could log into a customer&apos;s brain and see how they think of you.
            </p>
            <p className="mb-4">
              ShowsUp was built to fill this gap. Our scanner queries multiple AI models with category-relevant prompts, analyses the outputs, audits your technical signals (schema, llms.txt, structured data), and assesses your citation footprint — then produces a composite AEO score across all 10 dimensions.
            </p>
            <p>
              The scan takes under two minutes and gives you a baseline score you can track over time as you make improvements. It is the only way to know, with any rigour, where you actually stand.
            </p>
          </section>

        </div>
      </article>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Find out your AEO score in under 2 minutes
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Run a free AI visibility scan and see exactly where your brand stands across ChatGPT, Claude, and Gemini.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: "#10B981" }}
          >
            Get your free AEO score →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#9CA3AF]">
          <p>© 2026 FVG Capital Pte. Ltd.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#111827] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#111827] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
