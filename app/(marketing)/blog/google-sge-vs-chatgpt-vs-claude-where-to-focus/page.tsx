import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "Google AI Overviews vs ChatGPT vs Claude: Where Should You Focus Your AI Visibility Efforts?",
  description:
    "There are now multiple AI surfaces where your brand can show up — or not. Google AI Overviews, ChatGPT, Claude, Perplexity. Each works differently. Here's how to prioritise.",
  keywords: [
    "Google AI Overviews",
    "ChatGPT vs Claude",
    "AI visibility strategy",
    "AEO",
    "Perplexity brand visibility",
    "AI surfaces for brands",
    "where to focus AI SEO",
  ],
  openGraph: {
    title: "Google AI Overviews vs ChatGPT vs Claude: Where Should You Focus Your AI Visibility Efforts?",
    description:
      "There are now multiple AI surfaces where your brand can show up — or not. Google AI Overviews, ChatGPT, Claude, Perplexity. Each works differently. Here's how to prioritise.",
    url: "https://www.showsup.co/blog/google-sge-vs-chatgpt-vs-claude-where-to-focus",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google AI Overviews vs ChatGPT vs Claude: Where Should You Focus?",
    description:
      "Multiple AI surfaces, each with different recommendation logic. Here's how to prioritise your AEO efforts based on your industry.",
  },
};

export default function PostAISurfaces() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm mb-8 transition-colors"
            style={{ color: "#10B981" }}
          >
            ← Back to Blog
          </Link>

          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#10B981" }}>
            AEO Strategy
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            Google AI Overviews vs ChatGPT vs Claude: Where Should You Focus Your AI Visibility Efforts?
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed mb-6">
            There are now multiple AI surfaces where your brand can show up — or not. Google AI Overviews, ChatGPT, Claude, Perplexity. Each works differently. Here&apos;s how to prioritise.
          </p>
          <p className="text-sm text-[#9CA3AF]">January 22, 2026 · 10 min read</p>
        </div>
      </section>

      {/* Article Body */}
      <article className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12 text-[#374151] leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">The 4 Main AI Surfaces</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-6">
              Brand discovery has fragmented. In 2024, you mostly had to worry about Google. In 2026, there are four distinct AI surfaces that matter for most brands — and each has its own logic, user base, and recommendation mechanism.
            </p>
            <div className="space-y-6">
              {[
                {
                  name: "Google AI Overviews",
                  desc: "Formerly known as Search Generative Experience (SGE), Google AI Overviews now appears at the top of search results for a large proportion of informational and commercial queries. It generates a synthesised answer using Gemini, drawing primarily from pages that Google has already indexed and ranked. The key distinction: Google AI Overviews is deeply integrated with the existing search index, meaning traditional SEO signals — page authority, backlink quality, content depth — carry significant weight here.",
                },
                {
                  name: "ChatGPT",
                  desc: "The most widely used AI assistant globally, with over 200 million weekly active users as of early 2026. ChatGPT uses GPT-4o as its base model and can operate in two modes: pure language model (drawing on training data with a knowledge cutoff) and browsing mode (using live web retrieval via Bing). The browsing mode is increasingly the default for commercial queries. ChatGPT users tend to have high commercial intent — they are often looking for specific recommendations, not just information.",
                },
                {
                  name: "Claude",
                  desc: "Anthropic's AI assistant, built on the Claude model family. Claude is particularly popular in enterprise and B2B contexts, and among users who prioritise nuanced, thoughtful answers. Claude's web-browsing capability (where enabled) uses a similar retrieval mechanism to ChatGPT's. Claude tends to be more cautious about making definitive recommendations without caveats, which means brands that appear with consistent, authoritative signals across multiple sources are more likely to be named confidently.",
                },
                {
                  name: "Perplexity",
                  desc: "A dedicated AI search engine that always uses live retrieval — there is no pure language model mode. Every query triggers a real-time web search, with results synthesised and cited. Perplexity is particularly popular with researchers, analysts, and technically sophisticated users. It shows its sources, which means citation quality and domain authority are especially important here. Perplexity has also been explicit about supporting structured signals like llms.txt.",
                },
              ].map(({ name, desc }) => (
                <div key={name} className="rounded-xl border border-[#E5E7EB] p-6">
                  <h3 className="font-bold text-[#111827] mb-3 text-lg">{name}</h3>
                  <p className="text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">How Each Surface Decides What to Recommend</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              The recommendation mechanisms differ in ways that have real strategic implications:
            </p>
            <div className="space-y-5">
              {[
                {
                  surface: "Google AI Overviews",
                  mechanism: "Pulls from Google's indexed web, weighted by existing PageRank-like signals. Your traditional SEO — backlinks, page authority, structured data, E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) — translates directly here. If you rank well in organic search, you are better positioned in AI Overviews.",
                },
                {
                  surface: "ChatGPT",
                  mechanism: "In browsing mode, retrieves from Bing's index. In non-browsing mode, draws on training data (cutoff: early 2025 for current GPT-4o). Brand signals in training data — the volume, sentiment, and authority of mentions — matter enormously. For real-time retrieval, Bing authority and citation quality are the key levers.",
                },
                {
                  surface: "Claude",
                  mechanism: "Similar to ChatGPT in its two-mode structure (training data vs. live retrieval). Anthropic has emphasised safety and accuracy in Claude's training, which means Claude tends to prefer brands with consistent, corroborated signals over brands with high volume but contradictory information. Consistency and citation authority are particularly important.",
                },
                {
                  surface: "Perplexity",
                  mechanism: "Always live retrieval. Sources are always shown. Perplexity's ranking of which sources to cite is influenced by domain authority, content quality, and relevance. Because Perplexity shows citations, being cited here drives direct referral traffic — making it the most measurable of the four surfaces.",
                },
              ].map(({ surface, mechanism }) => (
                <div key={surface}>
                  <h3 className="font-semibold text-[#111827] mb-1">{surface}</h3>
                  <p className="text-sm">{mechanism}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison Table */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Comparison at a Glance</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <th className="text-left px-4 py-3 font-semibold text-[#111827]">Surface</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#111827]">Traffic volume</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#111827]">Recommendation style</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#111827]">Update frequency</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#111827]">Key signal for brands</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {[
                    ["Google AI Overviews", "Very high", "Synthesised summary with source links", "Real-time", "E-E-A-T, page authority, structured data"],
                    ["ChatGPT", "High", "Conversational, confident, few caveats", "Training cutoff + live retrieval", "Training data volume, sentiment, Bing authority"],
                    ["Claude", "Medium–high", "Careful, nuanced, often caveated", "Training cutoff + live retrieval", "Citation consistency, authority, brand clarity"],
                    ["Perplexity", "Medium", "Search-style with visible citations", "Always real-time", "Domain authority, content quality, llms.txt"],
                  ].map(([surface, traffic, style, freq, signal]) => (
                    <tr key={surface} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#111827]">{surface}</td>
                      <td className="px-4 py-3">{traffic}</td>
                      <td className="px-4 py-3">{style}</td>
                      <td className="px-4 py-3">{freq}</td>
                      <td className="px-4 py-3">{signal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Which Surface to Prioritise by Industry</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-6">
              The right prioritisation depends on where your buyers actually spend their time and what kind of queries they are asking AI to help with.
            </p>
            <div className="space-y-5">
              {[
                {
                  industry: "B2B SaaS",
                  priority: "ChatGPT and Claude",
                  rationale: "Enterprise buyers and individual practitioners use ChatGPT and Claude heavily for vendor research and shortlist creation. These are high-intent, high-stakes queries. Perplexity is also relevant for technically sophisticated buyers. Google AI Overviews matters but is less decisive in B2B purchase journeys.",
                },
                {
                  industry: "E-commerce and consumer brands",
                  priority: "Google AI Overviews",
                  rationale: "Consumer product discovery still happens predominantly on Google, and AI Overviews is rapidly capturing the top of the SERP for product and comparison queries. If your buyers start with a Google search, Google AI Overviews is the most important surface to optimise for. ChatGPT is growing in this space but has not yet reached the same commercial intent volume.",
                },
                {
                  industry: "Local services (professional services, restaurants, healthcare, etc.)",
                  priority: "Google AI Overviews",
                  rationale: "Local intent queries are heavily concentrated in Google's ecosystem. AI Overviews for 'best dentist in [city]' or 'top accounting firms in [area]' are now common. Traditional local SEO signals — Google Business Profile, reviews, citations — translate directly into AI Overview presence.",
                },
                {
                  industry: "Media, publishing, and content brands",
                  priority: "Perplexity, then Google AI Overviews",
                  rationale: "Perplexity shows its sources. A media brand cited in a Perplexity answer gets a visible link and attribution — a direct traffic driver that the other surfaces don't provide. Google AI Overviews is also important for informational queries. ChatGPT is less relevant for media brands unless the goal is to be recognised as an authoritative source the model draws on.",
                },
              ].map(({ industry, priority, rationale }) => (
                <div key={industry} className="rounded-xl border border-[#E5E7EB] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-[#111827]">{industry}</h3>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                      style={{ background: "#10B981" }}
                    >
                      Prioritise: {priority}
                    </span>
                  </div>
                  <p className="text-sm">{rationale}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">The Good News: Most AEO Improvements Help Across All Surfaces</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              Despite the differences between surfaces, the foundational AEO signals are remarkably consistent. You do not need a different strategy for each surface. The following improvements raise your score across all of them:
            </p>
            <ul className="space-y-3">
              {[
                "Publishing comprehensive, accurate schema.org markup on your website benefits Google AI Overviews, ChatGPT's retrieval, Claude's retrieval, and Perplexity equally.",
                "Earning editorial mentions in high-authority publications improves your training data signal (ChatGPT, Claude), your PageRank signal (Google AI Overviews), and your citation quality signal (Perplexity).",
                "Maintaining consistent brand positioning across web properties reduces model confusion on every platform that tries to represent you.",
                "Publishing original research earns citations that accumulate across all four surfaces — in training data, in indexed search results, and in real-time retrieval.",
                "Creating an llms.txt file provides a canonical brand brief that any AI retrieval system can consume, regardless of the underlying model.",
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
            <p className="mt-4">
              The strategic implication is that AEO is not a surface-by-surface optimisation exercise. It is a brand hygiene and authority-building exercise that lifts you across the board. Start with the fundamentals, and you benefit everywhere.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">How ShowsUp Covers All Three Major AI Models</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              ShowsUp queries ChatGPT, Claude, and Gemini as part of every brand scan. We use a standardised set of prompts relevant to your declared category, analyse the outputs for brand mentions, and score your Prominence, Sentiment, and Coverage across all three models.
            </p>
            <p className="mb-4">
              This gives you a single, consolidated view of your AI presence across the models that power the surfaces your buyers use — rather than having to manually test each one yourself (which, besides being time-consuming, produces inconsistent results due to the probabilistic nature of model outputs).
            </p>
            <p>
              We also audit your technical signals — schema, llms.txt, structured data, citation footprint — which influence your visibility on Google AI Overviews and Perplexity as well, giving you a comprehensive baseline from which to track improvement.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Recommended Next Steps</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <ol className="space-y-4">
              {[
                ["Run a baseline AEO scan", "Before you prioritise any surface, establish where you actually stand. Use ShowsUp to get a scored baseline across all 10 dimensions and all three major AI models."],
                ["Identify your primary surface", "Based on your industry and buyer behaviour (see the prioritisation guide above), identify the one surface that matters most for your commercial goals right now."],
                ["Fix the technical foundations", "Schema markup, llms.txt, and brand consistency are quick wins that help across all surfaces. Do these first, regardless of which surface you prioritise."],
                ["Build an editorial calendar around authority", "Plan at least 4 editorial touchpoints per quarter — a mix of original research, guest contributions, press releases with news hooks, and curated expert commentary."],
                ["Re-scan quarterly", "AEO scores change as your web presence evolves and as AI models update. Track your progress every 90 days and adjust your efforts based on which dimensions are moving."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-4">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                    style={{ background: "#10B981" }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <strong className="text-[#111827]">{title}. </strong>
                    {body}
                  </div>
                </li>
              ))}
            </ol>
          </section>

        </div>
      </article>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            See where your brand stands across ChatGPT, Claude, and Gemini
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Run a free ShowsUp scan to get your AEO baseline — and know exactly which surfaces and signals to focus on first.
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
