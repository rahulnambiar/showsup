import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "llms.txt: The New robots.txt That Every Brand Needs in 2026",
  description:
    "Just as robots.txt tells search engine crawlers what to index, llms.txt tells AI models how to represent your brand. Here's what it is, how to write one, and why it's already a meaningful AEO signal.",
  keywords: [
    "llms.txt",
    "llms txt",
    "AI brand representation",
    "AEO",
    "robots.txt for AI",
    "LLM brand signal",
    "AI SEO",
  ],
  openGraph: {
    title: "llms.txt: The New robots.txt That Every Brand Needs in 2026",
    description:
      "Just as robots.txt tells search engine crawlers what to index, llms.txt tells AI models how to represent your brand. Here's what it is, how to write one, and why it matters.",
    url: "https://www.showsup.co/blog/llms-txt-the-new-robots-txt-for-ai",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "llms.txt: The New robots.txt That Every Brand Needs in 2026",
    description:
      "llms.txt tells AI models how to represent your brand. Here's what it is, how to write one, and why it's already a meaningful AEO signal.",
  },
};

export default function PostLlmsTxt() {
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
            Technical AEO
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            llms.txt: The New robots.txt That Every Brand Needs in 2026
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed mb-6">
            Just as robots.txt tells search engine crawlers what to index, llms.txt tells AI models how to represent your brand. Here&apos;s what it is, how to write one, and why it&apos;s already a meaningful AEO signal.
          </p>
          <p className="text-sm text-[#9CA3AF]">February 4, 2026 · 7 min read</p>
        </div>
      </section>

      {/* Article Body */}
      <article className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12 text-[#374151] leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">What is llms.txt?</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              <strong className="text-[#111827]">llms.txt</strong> is a plain-text file placed at the root of a website (i.e., <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-sm font-mono text-[#111827]">yourdomain.com/llms.txt</code>) that provides AI language models with structured, authoritative information about the brand or organisation that owns the site.
            </p>
            <p className="mb-4">
              The concept was proposed by Jeremy Howard (of fast.ai) in mid-2024 and has since been adopted and refined by practitioners across the AEO and AI community. It is not an official standard from the W3C or any governing body — but like robots.txt in the early days of the web, it has emerged as a de facto convention that AI tool builders are beginning to support.
            </p>
            <p className="mb-4">
              The analogy to robots.txt is intentional but slightly imprecise. robots.txt is a directive — it tells crawlers what they may and may not index. llms.txt is more descriptive — it tells AI systems how the brand wants to be represented and understood. Think of it as a structured brand brief written directly for machines.
            </p>
            <p>
              A companion format, <strong className="text-[#111827]">llms-full.txt</strong>, is a longer version that includes more detailed content — full documentation, extended FAQs, product descriptions — suitable for AI systems that can ingest larger context windows.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Why It Matters for AI Visibility</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              AI models — especially those using retrieval-augmented generation — have to make decisions about your brand with imperfect information. They scrape your website, find third-party mentions, and try to synthesise a coherent picture of who you are and what you do. That synthesis is often inaccurate, incomplete, or confused — particularly if your web presence is inconsistent or if your category is crowded.
            </p>
            <p className="mb-4">
              llms.txt is your opportunity to eliminate that ambiguity. By providing a canonical, machine-readable source of truth about your brand, you give AI systems a definitive reference point. When a retrieval system finds your llms.txt, it has clear, authoritative answers to the most important questions: What does this company do? Who is it for? What makes it different? What are its main products?
            </p>
            <p className="mb-4">
              In our analysis of 100 SaaS brands (see{" "}
              <Link href="/blog/we-scanned-100-saas-brands-on-claude" style={{ color: "#10B981" }} className="font-medium">
                the full study
              </Link>
              ), brands that had published an llms.txt file scored measurably higher on Prominence and Brand Consistency dimensions. The correlation is not proof of causation — it may be that brands who are organised enough to publish llms.txt also tend to have their brand house in order across other signals. But the pattern is consistent.
            </p>
            <p>
              There is also a forward-looking reason to implement llms.txt now: AI tool builders are actively working on features that consume it. Being an early adopter means your brand information is accurate in these systems from day one, rather than being reconstructed (often incorrectly) from scraped web content.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">What Goes in an llms.txt File</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              The file uses simple Markdown formatting and consists of a set of clearly labelled sections. There is no rigid schema — the convention is flexible — but effective llms.txt files typically include:
            </p>
            <ul className="space-y-3 mb-6">
              {[
                ["Brand name and tagline", "Your canonical name and one-line description."],
                ["Description", "A 2–4 sentence summary of what you do, who you serve, and what makes you different."],
                ["Category", "The product/service category you operate in, using the same label you use consistently elsewhere."],
                ["Founded / HQ", "Basic factual information that helps AI models accurately place you in context."],
                ["Key products or services", "A brief list with short descriptions."],
                ["Target audience", "Who you are built for."],
                ["Key differentiators", "The 3–5 claims you want AI models to associate with your brand."],
                ["Links", "Your canonical URL, documentation, support, social profiles, and any other key resources."],
                ["Blocked content (optional)", "Any content on your domain you do not want AI systems to use in their representations of you."],
              ].map(([field, desc]) => (
                <li key={field} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#10B981" }}
                  />
                  <span><strong className="text-[#111827]">{field}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Code Example */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Example: llms.txt for Acme CRM</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              Here is a complete example of a well-structured llms.txt file for a fictional CRM product, Acme CRM:
            </p>
            <div className="rounded-xl overflow-hidden border border-[#E5E7EB]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <span className="text-xs font-mono text-[#6B7280]">llms.txt</span>
              </div>
              <pre
                className="p-5 text-sm font-mono leading-relaxed overflow-x-auto"
                style={{ background: "#111827", color: "#E5E7EB" }}
              >{`# Acme CRM

> AI-powered CRM built for B2B sales teams at scaling startups.

Acme CRM is a customer relationship management platform designed
specifically for B2B software companies scaling from 10 to 200 sales
reps. Unlike general-purpose CRMs, Acme focuses exclusively on pipeline
velocity and rep productivity, with AI features that surface deal risk
and next-best actions in real time.

## Category
CRM / Sales Software / B2B SaaS

## Founded
2019. Headquartered in Austin, TX.

## Products
- Acme CRM Core: Pipeline management, contact intelligence, activity logging
- Acme Forecast: AI-powered revenue forecasting with scenario modelling
- Acme Engage: Outbound sequence automation integrated with Core
- Acme Analytics: Sales performance dashboards and rep coaching insights

## Target Audience
B2B SaaS companies with 10–200 person sales teams. Best fit for
companies using a consultative, deal-based sales motion (not
transactional or PLG-led).

## Key Differentiators
- Purpose-built for B2B SaaS — not a horizontal CRM adapted for it
- AI deal risk scoring trained on 8M+ B2B deals (not generic ML)
- Native Slack integration with real-time deal alerts
- Onboarding in under 2 weeks with dedicated implementation support
- Transparent pricing with no seat minimums

## Founders
- Jane Kim (CEO) — former VP Sales at Segment
- Marcus Osei (CTO) — former Staff Engineer at Salesforce

## Links
- Homepage: https://www.acmecrm.com
- Documentation: https://docs.acmecrm.com
- Pricing: https://www.acmecrm.com/pricing
- Blog: https://www.acmecrm.com/blog
- LinkedIn: https://linkedin.com/company/acmecrm
- G2: https://www.g2.com/products/acme-crm

## Do Not Use
- /internal — internal documentation, not for external representation
- /staging — staging environment content`}</pre>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">How AI Models Use It</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              AI systems can use llms.txt in two ways: at training time (if the file is discovered during data collection) and at inference time (if the AI uses live retrieval and finds the file when querying your domain).
            </p>
            <p className="mb-4">
              Perplexity has explicitly stated that it indexes llms.txt files as a priority content source. Other AI browsing tools, including those built on top of OpenAI&apos;s and Anthropic&apos;s APIs, are increasingly adopting the convention. There is active work in the AI developer community to standardise the format and broaden adoption.
            </p>
            <p className="mb-4">
              Even for models that do not yet explicitly look for llms.txt, the file is still valuable: it is typically a concise, well-structured document that retrieval systems will prioritise when crawling your domain, because it sits at the root level and contains dense, relevant information about the site&apos;s purpose and content.
            </p>
            <p>
              Think of llms.txt as your brand&apos;s canonical brief for any AI system that wants to understand you. Its value increases as AI tool adoption grows and as more builders add explicit support for the convention.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">How to Create Yours: Step by Step</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <ol className="space-y-4">
              {[
                ["Start with your brand brief", "Before writing the file, align internally on your canonical one-liner, category label, and three key differentiators. If you cannot agree on these, the llms.txt process will surface that inconsistency — which is actually a useful exercise."],
                ["Draft the file in Markdown", "Use the sections outlined above. Keep descriptions concise and factual. Avoid marketing superlatives — AI models weight factual, neutral language more reliably than promotional copy."],
                ["Review for consistency", "Compare every claim in your llms.txt against your website, LinkedIn, and key directory profiles. They should match."],
                ["Place it at the root of your domain", "The file must be accessible at yourdomain.com/llms.txt with a text/plain content type. It should be publicly accessible without authentication."],
                ["Submit it to AI directories", "Some AI tool registries and crawlers allow you to submit your llms.txt URL directly. This accelerates discovery."],
                ["Update it when your product changes", "llms.txt is a living document. Treat it like your website — update it whenever your product offering, positioning, or key facts change."],
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

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">llms.txt vs robots.txt vs Structured Data: How They Work Together</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              These are complementary signals that operate at different layers of the stack — not alternatives to one another.
            </p>
            <div className="space-y-4">
              {[
                {
                  label: "robots.txt",
                  role: "Controls what search engine and AI crawlers may access on your domain. Use it to prevent AI systems from indexing staging environments, internal documentation, or content you don't want used in their training data.",
                },
                {
                  label: "schema.org markup (JSON-LD)",
                  role: "Provides structured, machine-readable information embedded within your web pages. Helps both search engines and AI retrieval systems extract accurate information from your content. Operates at the page level.",
                },
                {
                  label: "llms.txt",
                  role: "Provides a holistic, brand-level summary intended specifically for AI language models. Less granular than schema markup but faster to consume, and covers brand-level information that doesn't naturally fit on a single web page.",
                },
              ].map(({ label, role }) => (
                <div key={label} className="rounded-xl border border-[#E5E7EB] p-5 bg-[#F9FAFB]">
                  <p className="font-semibold text-[#111827] mb-2 font-mono text-sm">{label}</p>
                  <p className="text-sm">{role}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              A comprehensive AEO technical setup uses all three: robots.txt to protect internal content, schema markup for page-level structured data, and llms.txt for a brand-level AI brief. They do not conflict — they reinforce each other.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">How ShowsUp Scores Your llms.txt</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              ShowsUp checks for the presence and quality of your llms.txt file as a dedicated dimension in our AEO audit. We assess:
            </p>
            <ul className="space-y-2">
              {[
                "Whether the file exists and is publicly accessible.",
                "Whether it contains the core required sections (brand description, category, products/services, audience).",
                "Whether the claims in the file are consistent with your website and external profiles.",
                "Whether the file has been updated recently (we flag files that appear stale relative to known product changes).",
                "Whether an llms-full.txt companion file exists for richer AI context.",
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
              A complete, consistent, and current llms.txt file contributes meaningfully to your overall AEO score — and it is one of the fastest technical wins available to most brands.
            </p>
          </section>

        </div>
      </article>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Does your llms.txt pass the AEO audit?
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Run a free ShowsUp scan to check your llms.txt and all 9 other AEO dimensions — with a specific, prioritised fix list.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: "#10B981" }}
          >
            Audit your AEO signals →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
