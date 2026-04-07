import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const revalidate = false; // static

type Topic = "what-is-aeo" | "llms-txt" | "ai-visibility";

interface ArticleMeta {
  title: string;
  headline: string;
  description: string;
  keywords: string[];
  publishDate: string;
  readTime: string;
}

const META: Record<Topic, ArticleMeta> = {
  "what-is-aeo": {
    title:       "What is AEO (Answer Engine Optimisation)? The Complete Guide",
    headline:    "What is AEO? Answer Engine Optimisation Explained",
    description: "Answer Engine Optimisation (AEO) is how brands get recommended by ChatGPT, Claude, and Gemini. Learn what AEO is, how it differs from SEO, and how to improve your score.",
    keywords:    ["what is AEO", "answer engine optimization", "AEO guide", "AI brand visibility", "ChatGPT brand recommendations"],
    publishDate: "2026-04-01",
    readTime:    "10 min read",
  },
  "llms-txt": {
    title:       "What is llms.txt and Why Your Website Needs One in 2026",
    headline:    "What is llms.txt?",
    description: "llms.txt is a plain-text file that tells AI language models how to represent your brand. Learn what it is, how to write one, and why it is a meaningful AEO signal.",
    keywords:    ["llms.txt", "what is llms.txt", "llms txt file", "AI crawlers", "AEO signals"],
    publishDate: "2026-04-01",
    readTime:    "7 min read",
  },
  "ai-visibility": {
    title:       "AI Brand Visibility: The Complete Guide to Appearing in ChatGPT, Claude & Gemini",
    headline:    "AI Brand Visibility: The Complete Guide",
    description: "Learn what AI brand visibility is, how AI models decide which brands to recommend, and the proven signals that determine whether your brand shows up in ChatGPT, Claude, and Gemini.",
    keywords:    ["AI brand visibility", "how to appear in ChatGPT", "AI visibility score", "brand visibility AI", "LLM brand recommendations"],
    publishDate: "2026-04-01",
    readTime:    "12 min read",
  },
};

export async function generateStaticParams() {
  return (Object.keys(META) as Topic[]).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: { topic: string } }): Promise<Metadata> {
  const meta = META[params.topic as Topic];
  if (!meta) return { title: "Not Found" };

  return {
    title:       meta.title,
    description: meta.description,
    keywords:    meta.keywords,
    openGraph: {
      title:       meta.title,
      description: meta.description,
      url:         `https://showsup.co/learn/${params.topic}`,
      type:        "article",
      publishedTime: meta.publishDate,
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
    alternates: { canonical: `https://showsup.co/learn/${params.topic}` },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Article content components
// ─────────────────────────────────────────────────────────────────────────────

function AeoArticle() {
  return (
    <article className="prose-article">
      <p className="lead">
        Answer Engine Optimisation (AEO) is the discipline of making your brand more likely to be cited, recommended, and described accurately by AI assistants like ChatGPT, Claude, Gemini, and others. As more people ask AI instead of searching Google, AEO is becoming as important as SEO for brand discovery.
      </p>

      <h2>AEO vs SEO: What&apos;s the Difference?</h2>
      <p>
        SEO (Search Engine Optimisation) focuses on getting your pages ranked in Google&apos;s blue-link results. AEO focuses on getting your brand <em>cited</em> and <em>recommended</em> in AI-generated answers. The mechanisms are different:
      </p>
      <ul>
        <li><strong>SEO:</strong> rank pages by keywords, backlinks, and technical site health</li>
        <li><strong>AEO:</strong> build brand authority across training data, structured information, citation sources, and real-time crawlability</li>
      </ul>
      <p>
        A brand can rank #1 on Google and still score poorly in AI visibility, and vice versa. The signals that drive AI recommendations are meaningfully different from traditional search ranking factors.
      </p>

      <h2>Why AEO Matters in 2026</h2>
      <p>
        ChatGPT processes over 100 million queries per day. Claude and Gemini are embedded into Google Search, Microsoft Copilot, Apple Intelligence, and dozens of enterprise tools. For product categories like software, consumer electronics, financial services, and healthcare, a significant share of purchase intent now flows through AI assistants rather than traditional search.
      </p>
      <p>
        Brands that score well in AI visibility are recommended more often, described more favourably, and perceived as category leaders, even when competing with brands that have larger traditional SEO footprints.
      </p>

      <h2>How AI Engines Choose Which Brands to Cite</h2>
      <p>
        AI language models don&apos;t rank brands the way Google does. They form associations during training and augment them at inference time using web search (for real-time models). The factors that influence brand selection fall into six layers:
      </p>
      <ol>
        <li>
          <strong>LLM Probing:</strong> how often does the model mention your brand when asked about your category? This measures raw brand salience across different query types: awareness, recommendation, comparison, and commerce intent.
        </li>
        <li>
          <strong>Structured Data:</strong> does your site have JSON-LD schemas (Organization, FAQPage, Product), llms.txt, and properly configured crawler permissions? Structured signals help AI models understand what your brand does and how to categorise it.
        </li>
        <li>
          <strong>Training Data:</strong> is your brand well-represented in the sources used to train LLMs? Wikipedia articles, quality web content, academic citations, and credible press coverage all contribute to training-time brand associations.
        </li>
        <li>
          <strong>Citation Sources:</strong> do AI models cite sources that mention your brand? Review platforms (G2, Trustpilot), industry publications, and structured product databases all serve as citation anchors for AI recommendations.
        </li>
        <li>
          <strong>Search Correlation:</strong> does your brand appear prominently when AI uses real-time web search to augment answers? Brands with strong organic search presence tend to benefit here.
        </li>
        <li>
          <strong>Crawler Readiness:</strong> have you explicitly allowed AI crawlers (GPTBot, ClaudeBot, PerplexityBot) in your robots.txt? Blocking these crawlers reduces your real-time AI visibility even if your training-time signals are strong.
        </li>
      </ol>

      <h2>The AEO Signals That Matter Most</h2>
      <p>
        Based on data from scanning 100+ global brands monthly, the three highest-impact AEO signals are:
      </p>
      <ul>
        <li><strong>LLM Probing score</strong> accounts for 30% of the ShowsUp composite score. This is the most direct measure of how well AI models know your brand.</li>
        <li><strong>Structured Data</strong> carries a 20% weight. Brands with llms.txt, FAQ schema, and explicit AI crawler permissions score significantly higher.</li>
        <li><strong>Training Data</strong> carries a 15% weight. Wikipedia presence and quality Reddit/community discussion are strong proxies for LLM training-time representation.</li>
      </ul>

      <h2>Getting Started with AEO</h2>
      <p>The fastest wins for most brands are:</p>
      <ul>
        <li><strong>Create an llms.txt file.</strong> A simple plain-text file at yourdomain.com/llms.txt that describes your brand, products, and key claims for AI models to reference.</li>
        <li><strong>Allow AI crawlers in robots.txt.</strong> Explicitly allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and OAI-SearchBot.</li>
        <li><strong>Add FAQ schema.</strong> JSON-LD FAQPage markup helps AI models extract structured Q&amp;A pairs about your brand.</li>
        <li><strong>Build or improve your Wikipedia page.</strong> Wikipedia is heavily weighted in LLM training data. An accurate, well-sourced Wikipedia article is one of the strongest AEO signals available.</li>
        <li><strong>Get listed on G2 or Trustpilot.</strong> These are common citation sources that AI models reference when recommending software and services.</li>
      </ul>

      <h2>Measuring Your AEO Progress</h2>
      <p>
        AEO improvement is measurable. ShowsUp scans your brand across ChatGPT, Claude, and Gemini monthly, scoring you on all six signal layers and tracking changes over time. A typical brand that implements the top 3-4 AEO fixes sees score improvements within 1-2 months as AI models update their real-time knowledge.
      </p>
    </article>
  );
}

function LlmsTxtArticle() {
  return (
    <article className="prose-article">
      <p className="lead">
        llms.txt is a plain-text file placed at the root of your website (<code>yourdomain.com/llms.txt</code>) that tells AI language models how to understand and represent your brand. Think of it as robots.txt, but written for AI models rather than search engine crawlers.
      </p>

      <h2>What Problem Does llms.txt Solve?</h2>
      <p>
        AI models trained on web crawls have to infer what your brand does from your homepage copy, blog posts, and whatever appears in their training data. This inference is often imprecise. A SaaS company might be described as a &ldquo;project management tool&rdquo; when it&apos;s actually built for engineering teams. A fintech might be confused with a competitor that has similar product names.
      </p>
      <p>
        llms.txt lets you correct these misrepresentations proactively. You define your brand&apos;s identity, key products, target audience, and positioning in a format built for AI ingestion, with no ambiguity and no noise.
      </p>

      <h2>llms.txt vs robots.txt</h2>
      <p>
        They serve parallel purposes but for different systems:
      </p>
      <ul>
        <li><strong>robots.txt</strong> instructs web crawlers (Googlebot, Bingbot) which pages to index or skip.</li>
        <li><strong>llms.txt</strong> provides AI models with a curated, structured description of your brand.</li>
      </ul>
      <p>
        The key difference: robots.txt is a permission system, while llms.txt is an information system. You&apos;re not gating access; you&apos;re providing context.
      </p>

      <h2>What to Put in Your llms.txt</h2>
      <p>
        A well-structured llms.txt typically includes:
      </p>
      <ul>
        <li>Brand name and one-line description</li>
        <li>Products or services offered (with brief descriptions)</li>
        <li>Target audience or customer segments</li>
        <li>Key differentiators and claims</li>
        <li>Pricing model (freemium, subscription, enterprise, etc.)</li>
        <li>Supported platforms, integrations, or standards</li>
        <li>Links to canonical documentation or press coverage</li>
      </ul>
      <p>
        Keep it factual, concise, and in plain English. Avoid marketing language, since AI models respond better to descriptive, specific claims than to superlatives.
      </p>

      <h2>Example llms.txt</h2>
      <pre>{`# Acme Corp

> Project management software for engineering and product teams

## Products

- **Acme Cloud**: web-based project tracker with Jira integration
- **Acme CLI**: command-line interface for developers
- **Acme API**: REST API for custom integrations

## Target customers

Mid-market and enterprise software companies (50-5000 employees)

## Pricing

Freemium. Pro plans from $12/user/month. Enterprise pricing on request.

## Key links

- Documentation: https://docs.acme.com
- Status page: https://status.acme.com
- Changelog: https://acme.com/changelog`}</pre>

      <h2>How AI Models Use llms.txt</h2>
      <p>
        AI models that support real-time web crawling (GPT-4o, Claude with web search, Perplexity) will fetch llms.txt when researching a brand. The file serves as a high-signal, low-noise source that the model can prioritise over noisier homepage content or third-party descriptions.
      </p>
      <p>
        For training-time inclusion, AI labs that crawl the public web will ingest llms.txt during their data collection cycles. Brands with well-structured llms.txt files are more likely to be accurately represented in future model versions.
      </p>

      <h2>The AEO Impact</h2>
      <p>
        In ShowsUp&apos;s monthly Brand Index analysis, brands with a valid llms.txt file score an average of <strong>18 points higher</strong> on the Structured Data signal than those without one. When combined with explicit AI crawler permissions in robots.txt, the impact compounds: AI crawlers can both find and correctly interpret your brand.
      </p>
      <p>
        llms.txt is currently an unofficial convention but is rapidly gaining adoption. Early adopters benefit from cleaner AI representation while the ecosystem matures around the format.
      </p>

      <h2>Creating Your llms.txt: Step by Step</h2>
      <ol>
        <li>Create a plain text file called <code>llms.txt</code> (or <code>llms.md</code>)</li>
        <li>Write a structured description using the sections above</li>
        <li>Place it at the root of your domain: <code>https://yourdomain.com/llms.txt</code></li>
        <li>Verify it&apos;s accessible by checking it in a browser or with <code>curl</code></li>
        <li>Update it when your products or positioning change</li>
      </ol>
      <p>
        The ShowsUp scanner checks for llms.txt presence and quality as part of the Structured Data signal. You can scan your site for free to see where you stand.
      </p>
    </article>
  );
}

function AiVisibilityArticle() {
  return (
    <article className="prose-article">
      <p className="lead">
        AI brand visibility measures how prominently your brand appears in responses from ChatGPT, Claude, Gemini, and other AI assistants. It is distinct from SEO rankings or social following. The core question it answers: when someone asks an AI about your category, does your brand come up?
      </p>

      <h2>Why AI Visibility is a New Kind of Brand Asset</h2>
      <p>
        In traditional search, visibility is measured in impressions, clicks, and ranking positions. In AI search, the model synthesises an answer that may name one brand, three brands, or none. There are no position-1 rankings; there are recommendations. A brand with high AI visibility is one that AI models recommend confidently, describe accurately, and cite as an example of category excellence.
      </p>
      <p>
        This matters because AI-assisted product discovery is growing fast. Users researching enterprise software, consumer electronics, financial services, and healthcare increasingly query an AI assistant before or instead of using Google. Brands that do not appear in those answers are effectively invisible to a growing segment of research-stage buyers.
      </p>

      <h2>How AI Models Select Which Brands to Recommend</h2>
      <p>
        AI language models form brand associations during training and update them using real-time search. Several factors determine whether a brand gets recommended:
      </p>
      <ul>
        <li>
          <strong>Training data representation:</strong> brands discussed frequently in high-quality web content, Wikipedia, academic papers, and industry publications are more deeply embedded in model weights. This is hard to change quickly but benefits from consistent content investment.
        </li>
        <li>
          <strong>Structural clarity:</strong> AI models prefer brands with clear, machine-readable descriptions. JSON-LD schemas, llms.txt files, and well-structured homepage content all help models categorise your brand correctly.
        </li>
        <li>
          <strong>Citation authority:</strong> brands listed on G2, Trustpilot, and cited in industry reports are more likely to appear when a model is asked what tools professionals recommend for a given task.
        </li>
        <li>
          <strong>Real-time crawlability:</strong> for models with web search (ChatGPT with browsing, Perplexity, Claude with search), blocking AI crawlers reduces your ability to appear in current answers. Allowing GPTBot, ClaudeBot, and PerplexityBot is a basic hygiene requirement.
        </li>
        <li>
          <strong>Search correlation:</strong> brands that rank well organically tend to appear in AI search augmentation results. The two visibility channels are correlated, though AI models increasingly surface brands with strong AEO signals even when organic rankings are lower.
        </li>
      </ul>

      <h2>Measuring AI Visibility: The 6-Signal Framework</h2>
      <p>
        ShowsUp measures AI brand visibility across six signals, weighted by their empirical impact on LLM recommendation rates:
      </p>
      <ul>
        <li><strong>LLM Probing (30%):</strong> direct probing of ChatGPT, Claude, and Gemini with category-specific queries, including awareness prompts, recommendation requests, comparison questions, and commerce-intent queries.</li>
        <li><strong>Structured Data (20%):</strong> llms.txt, JSON-LD schemas, AI crawler permissions, sitemap availability, and meta description quality.</li>
        <li><strong>Training Data (15%):</strong> Wikipedia presence and depth, Reddit/community discussion volume, domain age and content history.</li>
        <li><strong>Citation Sources (15%):</strong> G2 and Trustpilot profiles, number of pages cited in AI responses, third-party reference count.</li>
        <li><strong>Search Correlation (10%):</strong> organic search presence in category-relevant queries used as real-time augmentation by AI models.</li>
        <li><strong>Crawler Readiness (10%):</strong> explicit allow rules for AI crawlers in robots.txt (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot).</li>
      </ul>

      <h2>What a Good AI Visibility Score Looks Like</h2>
      <p>
        Across the 100 global brands ShowsUp tracks monthly, scores range from under 20 for brands with minimal AEO investment to over 75 for brands like Google, Apple, and Amazon that dominate all six signal layers. For most brands:
      </p>
      <ul>
        <li><strong>60+</strong> is strong visibility. AI models recommend you confidently in most category queries.</li>
        <li><strong>30 to 59</strong> is moderate visibility. You appear in some contexts but inconsistently or not as a category leader.</li>
        <li><strong>Under 30</strong> is weak visibility. AI models rarely recommend you, may describe you inaccurately, or leave you out of relevant comparisons.</li>
      </ul>

      <h2>Common Mistakes Brands Make</h2>
      <ul>
        <li><strong>Blocking AI crawlers.</strong> Many brands inadvertently block GPTBot and ClaudeBot through overly restrictive robots.txt rules written for Google. Check your robots.txt and add explicit allow rules for AI bots.</li>
        <li><strong>No llms.txt.</strong> Without a llms.txt, AI models must infer your brand identity from noisy homepage content. A 20-line llms.txt file can significantly improve structured data scores.</li>
        <li><strong>Ignoring training data signals.</strong> Brands that neglect Wikipedia, press coverage, and community presence lose ground in training-time associations that are slow to change.</li>
        <li><strong>Not tracking AI visibility separately from SEO.</strong> AI visibility and search rankings are correlated but distinct. A brand can rank well in Google and score poorly in AI recommendations. Both need to be measured.</li>
      </ul>

      <h2>Improving Your AI Visibility: Where to Start</h2>
      <p>
        The fastest-impact improvements, ranked by typical effort vs. reward:
      </p>
      <ol>
        <li><strong>Allow AI crawlers in robots.txt.</strong> Around 30 minutes of work, with immediate impact on real-time models.</li>
        <li><strong>Create an llms.txt file.</strong> 1 to 2 hours of work, improves structured data score and model comprehension.</li>
        <li><strong>Add FAQ schema markup.</strong> 2 to 4 hours, significant structured data boost.</li>
        <li><strong>Create or improve your Wikipedia page.</strong> 1 to 2 days, the highest long-term training data impact available.</li>
        <li><strong>Get a G2 or Trustpilot profile.</strong> 1 to 2 days, improves citation source score and recommendation context.</li>
        <li><strong>Publish consistent high-quality content.</strong> Ongoing investment, builds training data representation over 6 to 12 months.</li>
      </ol>
      <p>
        ShowsUp generates a personalised improvement plan based on your scan results, prioritising the fixes that will have the highest impact on your specific score profile.
      </p>

      <h2>Tracking Progress Over Time</h2>
      <p>
        AI visibility changes more slowly than organic search rankings. After implementing AEO improvements, expect to see score changes over 1 to 3 months as AI crawlers re-index your site and models update their real-time knowledge. Training-time improvements (Wikipedia, long-form content) take longer, typically 3 to 12 months to fully propagate.
      </p>
      <p>
        ShowsUp scans the Brand Index monthly, tracking composite scores, per-signal changes, and website snapshot differences to quantify what&apos;s working.
      </p>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────────────────────

const ARTICLES: Record<Topic, () => React.JSX.Element> = {
  "what-is-aeo":   AeoArticle,
  "llms-txt":      LlmsTxtArticle,
  "ai-visibility": AiVisibilityArticle,
};

export default function LearnPage({ params }: { params: { topic: string } }) {
  const meta    = META[params.topic as Topic];
  const Article = ARTICLES[params.topic as Topic];
  if (!meta || !Article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.headline,
    description: meta.description,
    datePublished: meta.publishDate,
    dateModified:  meta.publishDate,
    author: { "@type": "Organization", name: "ShowsUp", url: "https://showsup.co" },
    publisher: { "@type": "Organization", name: "ShowsUp", url: "https://showsup.co" },
    url: `https://showsup.co/learn/${params.topic}`,
  };

  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingNav />

      <main className="pt-24 pb-20">
        <div className="max-w-[760px] mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="text-[12px] text-[#9CA3AF] flex items-center gap-2 mb-8">
            <Link href="/" className="hover:text-[#111827] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/index" className="hover:text-[#111827] transition-colors">AI Visibility Index</Link>
            <span>/</span>
            <span className="text-[#111827] font-medium">Learn</span>
          </nav>

          {/* Article header */}
          <header className="mb-10">
            <p className="text-[12px] font-semibold text-[#10B981] uppercase tracking-widest mb-3">Educational Guide</p>
            <h1 className="text-[32px] md:text-[44px] font-bold text-[#111827] leading-tight mb-4">{meta.headline}</h1>
            <div className="flex items-center gap-4 text-[13px] text-[#9CA3AF]">
              <span>ShowsUp Research</span>
              <span>·</span>
              <time dateTime={meta.publishDate}>
                {new Date(meta.publishDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </time>
              <span>·</span>
              <span>{meta.readTime}</span>
            </div>
          </header>

          {/* Article body */}
          <style>{`
            .prose-article { font-size: 17px; line-height: 1.75; color: #1F2937; }
            .prose-article p { margin: 0 0 1.25rem; }
            .prose-article p.lead { font-size: 19px; color: #374151; margin-bottom: 1.75rem; line-height: 1.7; }
            .prose-article h2 { font-size: 22px; font-weight: 700; color: #111827; margin: 2.25rem 0 0.75rem; }
            .prose-article h3 { font-size: 18px; font-weight: 600; color: #111827; margin: 1.75rem 0 0.5rem; }
            .prose-article ul, .prose-article ol { padding-left: 1.5rem; margin: 0 0 1.25rem; }
            .prose-article li { margin-bottom: 0.5rem; }
            .prose-article strong { font-weight: 600; color: #111827; }
            .prose-article em { font-style: italic; }
            .prose-article code { font-family: var(--font-mono, monospace); font-size: 13px; background: #F3F4F6; padding: 2px 6px; border-radius: 4px; color: #1F2937; }
            .prose-article pre { background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 12px; padding: 1.25rem 1.5rem; overflow-x: auto; font-size: 13px; line-height: 1.65; margin: 0 0 1.5rem; font-family: var(--font-mono, monospace); color: #1F2937; }
            .prose-article a { color: #059669; text-decoration: underline; text-underline-offset: 2px; }
          `}</style>
          <Article />

          {/* Related learn articles */}
          <div className="border-t border-[#E5E7EB] mt-12 pt-8">
            <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wider mb-4">Related Guides</p>
            <div className="grid md:grid-cols-2 gap-3">
              {(Object.entries(META) as [Topic, ArticleMeta][])
                .filter(([t]) => t !== params.topic)
                .map(([t, m]) => (
                  <Link key={t} href={`/learn/${t}`}
                    className="group flex items-center justify-between border border-[#E5E7EB] rounded-xl px-4 py-3 hover:border-[#10B981] hover:text-[#10B981] transition-all text-[13px] text-[#4B5563]">
                    <span>{m.headline}</span>
                    <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#10B981] flex-shrink-0" />
                  </Link>
                ))}
            </div>
          </div>

          {/* Methodology link */}
          <div className="mt-4">
            <Link href="/methodology"
              className="group flex items-center justify-between border border-[#E5E7EB] rounded-xl px-4 py-3 hover:border-[#10B981] hover:text-[#10B981] transition-all text-[13px] text-[#4B5563]">
              <span>The ShowsUp AEO Methodology</span>
              <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#10B981]" />
            </Link>
          </div>

          {/* CTA */}
          <div className="mt-10 bg-gradient-to-br from-[#F0FDF4] to-white border border-[#D1FAE5] rounded-2xl p-8 text-center">
            <p className="text-[22px] font-bold text-[#111827] mb-2">Check your AI visibility score</p>
            <p className="text-[15px] text-[#4B5563] mb-6">
              See how your brand appears in ChatGPT, Claude, and Gemini. Get a 6-signal breakdown, monthly tracking, and a personalised improvement plan.
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-6 py-3 rounded-xl text-[15px] transition-colors">
              Scan your brand for free <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[12px] text-[#9CA3AF] mt-3">No credit card required · Results in under 60 seconds</p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
