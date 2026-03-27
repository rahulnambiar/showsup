import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "We Scanned 100 SaaS Brands on Claude — Here's What We Found",
  description:
    "We ran the ShowsUp scanner on 100 SaaS companies across 10 categories. The results were surprising — the brands you'd expect to dominate often didn't.",
  keywords: [
    "SaaS AI visibility",
    "AEO study",
    "Claude brand recommendations",
    "AI brand visibility research",
    "SaaS brand scoring",
    "answer engine optimisation data",
  ],
  openGraph: {
    title: "We Scanned 100 SaaS Brands on Claude — Here's What We Found",
    description:
      "We ran the ShowsUp scanner on 100 SaaS companies across 10 categories. The results were surprising — the brands you'd expect to dominate often didn't.",
    url: "https://www.showsup.co/blog/we-scanned-100-saas-brands-on-claude",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "We Scanned 100 SaaS Brands on Claude — Here's What We Found",
    description:
      "Size doesn't predict AI visibility. Here's what we learned from scanning 100 SaaS brands across 10 categories.",
  },
};

export default function PostSaaSScan() {
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
            Research
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            We Scanned 100 SaaS Brands on Claude: Here&apos;s What We Found
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed mb-6">
            We ran the ShowsUp scanner on 100 SaaS companies across 10 categories. The results were surprising: the brands you&apos;d expect to dominate often didn&apos;t.
          </p>
          <p className="text-sm text-[#9CA3AF]">February 20, 2026 · 14 min read</p>
        </div>
      </section>

      {/* Article Body */}
      <article className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12 text-[#374151] leading-relaxed">

          {/* Methodology */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Methodology</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              Between January and February 2026, we ran 100 SaaS brands through the ShowsUp scanner, selecting 10 companies from each of 10 categories: CRM, HR software, project management, email marketing, customer support, accounting software, sales intelligence, business intelligence, video conferencing, and cybersecurity.
            </p>
            <p className="mb-4">
              For each brand, we measured all 10 dimensions of our{" "}
              <Link href="/methodology" style={{ color: "#10B981" }} className="font-medium">
                AEO scoring methodology
              </Link>
              : Prominence, Sentiment, Coverage, Structured Data, llms.txt, Schema Markup, Citation Quality, Topical Authority, Brand Consistency, and Recency. We queried Claude using a standard set of 20 category-relevant prompts per brand and combined the model response analysis with a technical audit of each brand&apos;s web presence.
            </p>
            <p className="mb-4">
              We selected brands across a range of sizes: from bootstrapped companies with under 50 employees to publicly listed category leaders with tens of thousands of customers. Company size, funding status, and Google search ranking were tracked as independent variables so we could test correlation.
            </p>
            <p>
              One important caveat: AI model outputs are probabilistic and vary by prompt phrasing, context, and model version. Our scores represent an averaged signal across multiple prompt variants, not a single-query result. Still, the patterns that emerged were consistent enough to be meaningful.
            </p>
          </section>

          {/* Finding 1 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Key Finding 1: Brand Size Does Not Predict AI Visibility</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              This was the finding that surprised us most, even though in retrospect it makes sense. We expected category leaders (the brands with the highest ARR, most customers, and biggest marketing budgets) to dominate their AI visibility scores. They did not.
            </p>
            <p className="mb-4">
              In the CRM category, for example, a mid-sized specialist CRM focused exclusively on real estate agencies outscored two of the three dominant general-purpose CRM platforms on Topical Authority, Citation Quality, and Brand Consistency — despite having a fraction of the brand recognition and web traffic.
            </p>
            <p className="mb-4">
              The pattern repeated across categories. In project management, a 40-person company that had published a well-regarded annual report on remote team productivity consistently appeared in Claude&apos;s responses for remote-work-related queries, often ahead of tools with significantly larger customer bases.
            </p>
            <p className="mb-4">
              The explanation is not that small brands are inherently better at AEO. It is that large brands have typically relied on their scale and marketing spend to dominate SEO, and those advantages do not translate directly to AI visibility. An LLM does not know or care how much you spend on Google Ads.
            </p>
            <p>
              What matters is the quality of your signal: how clearly you are positioned, how consistently that positioning appears across independent sources, and whether you are genuinely associated with expertise in your domain. Those are things a focused specialist brand can do at least as well as an enterprise platform.
            </p>
          </section>

          {/* Finding 2 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Key Finding 2: Structured Data Had the Highest Correlation with Good Scores</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              Of all the technical signals we measured, structured data (specifically the presence and quality of schema.org markup) showed the highest correlation with overall AEO scores. Brands with comprehensive schema implementation scored, on average, 31 points higher out of 100 than brands with no schema or only partial implementation.
            </p>
            <p className="mb-4">
              This makes intuitive sense. AI systems that use live retrieval need to extract and interpret information about your brand quickly and accurately. Structured data removes ambiguity: it tells the retrieval system exactly what kind of entity you are, what you do, what your key products are, and how to describe you. Brands that provide this structured context are dramatically easier for AI to represent accurately.
            </p>
            <p className="mb-4">
              The most impactful schema types, in order of correlation with AEO score:
            </p>
            <ol className="space-y-2 list-none">
              {[
                ["Organisation", "Establishing your entity: name, description, founding date, logo, contact, and social profiles."],
                ["FAQPage", "Directly answering the questions your buyers ask, in a machine-readable format that AI retrieval systems can extract verbatim."],
                ["Product / Service", "Describing your core offerings with precise, structured attributes."],
                ["BreadcrumbList", "Helping AI systems understand your site structure and content hierarchy."],
                ["Review / AggregateRating", "Providing a structured signal of customer sentiment."],
              ].map(([type, desc], i) => (
                <li key={type} className="flex gap-3">
                  <span className="font-semibold text-[#111827] w-5 flex-shrink-0">{i + 1}.</span>
                  <span><strong className="text-[#111827]">{type}:</strong> {desc}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Finding 3 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Key Finding 3: Consistent Positioning Scored 40% Higher on Average</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              We assessed brand consistency by comparing each brand&apos;s self-description across their website, LinkedIn company page, Crunchbase profile, G2 or Capterra listing, and any Wikipedia page (where present). We looked at category label, one-liner description, and the three key differentiators claimed.
            </p>
            <p className="mb-4">
              The results were stark. Brands whose descriptions were substantively consistent across all five surfaces scored an average of 40% higher on Brand Consistency than brands with significant variation. More importantly, Brand Consistency showed strong positive correlation with Prominence — brands that were consistently described tended to also be more frequently and accurately mentioned in Claude&apos;s responses.
            </p>
            <p className="mb-4">
              The most common failure mode was not deliberate inconsistency but neglect. The LinkedIn page had not been updated since a rebrand. The Crunchbase description still reflected a product direction abandoned two years ago. The G2 profile used a category label the company had moved away from.
            </p>
            <p>
              These inconsistencies create genuine problems for AI models. When a model encounters conflicting descriptions of the same brand across multiple sources, it cannot form a confident, coherent representation, and uncertain models tend to either omit the brand or hedge with vague language. Neither outcome serves you.
            </p>
          </section>

          {/* Finding 4 */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Key Finding 4: Recent Coverage Mattered More Than Old High-Authority Links</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              In traditional SEO, a link from a high-authority domain acquired years ago retains its value indefinitely. In AEO, particularly for AI systems that use live retrieval, recency is a first-class signal.
            </p>
            <p className="mb-4">
              We found that brands with consistent recent coverage (at least 4–6 editorial mentions in authoritative publications in the past 12 months) outscored brands with older, higher-authority coverage on Recency and Prominence dimensions, even when the older coverage was objectively more impressive in domain authority terms.
            </p>
            <p className="mb-4">
              One accounting software brand in our study had been featured in a Forbes article in 2021 and a Wall Street Journal piece in 2022, genuinely high-authority coverage. But they had generated almost no press in 2024 or 2025. Their Recency score was near zero, and their Prominence score in Claude&apos;s responses reflected it: the model consistently recommended more recently active competitors when accounting software questions came up.
            </p>
            <p>
              This has a practical implication: your PR and content strategy needs to be a consistent, ongoing commitment, not a burst campaign before a product launch. Brands that publish original research quarterly, issue regular product updates, and maintain an active media relations program are better positioned than those who only invest in PR around major milestones.
            </p>
          </section>

          {/* Category Winners */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">Category Winners and Losers</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-6">
              Here is a summary of performance patterns across the 10 categories in our study (brand names anonymised where requested):
            </p>
            <div className="space-y-4">
              {[
                {
                  category: "CRM",
                  winner: "A vertical CRM for real estate agencies: near-perfect schema implementation, very consistent positioning.",
                  loser: "A general-purpose enterprise CRM: strong brand recognition but near-zero schema markup and major consistency issues across profiles.",
                },
                {
                  category: "HR Software",
                  winner: "A mid-market HRIS with a strong annual HR trends report that earned consistent editorial citations.",
                  loser: "A large enterprise HR platform: minimal structured data, outdated external profiles, no content strategy.",
                },
                {
                  category: "Project Management",
                  winner: "A remote-work-focused tool with a practitioner blog that had earned genuine links from Hacker News and industry newsletters.",
                  loser: "A well-funded platform with high brand awareness but almost no editorial coverage in the past 18 months.",
                },
                {
                  category: "Email Marketing",
                  winner: "A small deliverability-focused ESP that had published original research on inbox placement rates, heavily cited.",
                  loser: "A market leader that relied on brand volume but had inconsistent category labelling across external profiles.",
                },
                {
                  category: "Customer Support",
                  winner: "A mid-sized helpdesk platform with comprehensive FAQ schema, consistent positioning, and a strong G2 review presence.",
                  loser: "A newly rebranded platform: the rebrand had created significant inconsistency across web properties that had not yet resolved.",
                },
              ].map(({ category, winner, loser }) => (
                <div key={category} className="rounded-xl border border-[#E5E7EB] p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">{category}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="w-16 flex-shrink-0 font-medium" style={{ color: "#10B981" }}>Top scorer</span>
                      <span>{winner}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-16 flex-shrink-0 font-medium text-[#EF4444]">Underperformer</span>
                      <span>{loser}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5 traits */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">What the Top-Scoring Brands Had in Common</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">Across all 10 categories, the brands that scored highest shared five traits:</p>
            <ul className="space-y-3">
              {[
                "A single, precise, consistently used category label and one-line description that appeared verbatim across all major web properties.",
                "Comprehensive schema.org markup on their website, at minimum Organisation, Product/Service, and FAQ schema.",
                "A content strategy that generated original, data-driven content at least quarterly, earning genuine editorial citations.",
                "An active and authentic review presence on at least one category-relevant review platform (G2, Capterra, Trustpilot, etc.).",
                "An llms.txt file, which while not yet universal showed strong correlation with higher Prominence scores, likely because it reduces model uncertainty about how to describe the brand.",
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

          {/* What to do */}
          <section>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">What to Do If Your Brand Scored Low</h2>
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: "#10B981" }} />
            <p className="mb-4">
              A low AEO score is not a life sentence. Every dimension is improvable, and some of the highest-impact changes are also the quickest to implement.
            </p>
            <p className="mb-4">
              Start with the lowest-hanging fruit: audit your external profiles for consistency, add schema markup to your homepage, and create your llms.txt file. These are one-time tasks that can meaningfully move your score within a few weeks.
            </p>
            <p className="mb-4">
              For Coverage, Citation Quality, and Recency, you are looking at a longer-term content and PR programme. Focus on quality over quantity: two editorial placements in authoritative publications per quarter will do more for your AI visibility than weekly press releases on low-authority wire services.
            </p>
            <p>
              For Topical Authority, invest in original research. Survey your customers, analyse your platform data, or partner with an academic institution. Original data earns citations, and citations are the fundamental currency of AI visibility.
            </p>
          </section>

        </div>
      </article>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            How does your brand compare?
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Run a free ShowsUp scan to get your AEO score across all 10 dimensions, along with a prioritised improvement plan.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: "#10B981" }}
          >
            Scan your brand free →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
