import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "AEO Methodology — How ShowsUp Measures AI Brand Visibility",
  description:
    "The research-backed framework for measuring and improving brand visibility across ChatGPT, Claude, and Gemini. 10 dimensions, 680M+ citations analysed.",
  keywords: ["AEO methodology", "AI visibility framework", "how to improve AI brand visibility", "how LLMs choose brands", "answer engine optimisation"],
  openGraph: {
    title: "The ShowsUp AEO Framework — 10 Dimensions of AI Visibility",
    description: "Based on 680M+ AI citations and peer-reviewed research. The open source methodology for measuring how AI platforms recommend brands.",
    url: "https://showsup.co/methodology",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The ShowsUp AEO Framework — 10 Dimensions of AI Visibility",
    description: "Based on 680M+ AI citations. The research-backed methodology for measuring how ChatGPT, Claude, and Gemini choose which brands to recommend.",
  },
};

export default function MethodologyPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Mobile anchor pills */}
      <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-[#E5E7EB] px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {[
            { href: "#overview",      label: "Overview" },
            { href: "#how-ai-chooses", label: "How AI Chooses" },
            { href: "#dimensions",    label: "10 Dimensions" },
            { href: "#scoring",       label: "Scoring" },
            { href: "#fixes",         label: "Fix Generation" },
            { href: "#verification",  label: "Verification" },
            { href: "#research",      label: "Research" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex-shrink-0 text-[12px] font-medium text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-3 py-1 hover:border-[#10B981] hover:text-[#111827] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

    <div className="max-w-[1100px] mx-auto px-6 pt-28 pb-16">
      <div className="flex gap-16">
        {/* Sidebar */}
        <aside className="hidden lg:block w-48 flex-shrink-0 sticky top-28 self-start">
          <nav className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              On this page
            </p>
            {[
              { href: "#overview", label: "Overview" },
              { href: "#how-ai-chooses", label: "How AI Chooses Brands" },
              { href: "#dimensions", label: "The 10 Dimensions" },
              { href: "#scoring", label: "Scoring Methodology" },
              { href: "#fixes", label: "Fix Generation" },
              { href: "#verification", label: "Verification" },
              { href: "#research", label: "Research Sources" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-sm text-gray-500 hover:text-gray-900 py-1 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Hero */}
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">
            The ShowsUp AEO Framework
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-3">
            A research-backed methodology for measuring and improving your
            brand&apos;s visibility across AI platforms.
          </p>
          <p className="text-sm text-gray-400 italic mb-12">
            Based on analysis of 680M+ AI citations, 23K+ brand queries, and
            peer-reviewed research on how LLMs select sources.
          </p>

          {/* Funnel Diagram */}
          <div className="flex items-center gap-2 flex-wrap mb-16">
            {[
              { num: "1", label: "Diagnose" },
              { num: "2", label: "Fix" },
              { num: "3", label: "Verify" },
              { num: "4", label: "Correlate" },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex items-center gap-2">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-gray-300 text-lg font-light">→</span>
                )}
              </div>
            ))}
          </div>

          {/* Section 1: Overview */}
          <section id="overview" className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Overview
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Answer Engine Optimization (AEO) is the discipline of making your
              brand consistently visible when AI platforms answer questions in
              your category. Unlike traditional SEO — which optimizes for clicks
              from search results — AEO targets the moments when ChatGPT, Claude,
              Gemini, and Perplexity synthesize recommendations directly inside a
              conversation.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              The challenge is that AI platforms don&apos;t follow the same rules as
              search engines. They draw on parametric knowledge (learned in
              training), real-time retrieval (live web search), and structured
              entity graphs — each of which rewards different optimization
              strategies.
            </p>
            <p className="text-gray-600 leading-relaxed">
              ShowsUp measures your brand across{" "}
              <strong className="text-gray-900">10 dimensions</strong> that
              collectively determine whether AI platforms recognize, trust, and
              recommend your brand. Each dimension is scored 0–10 based on
              verifiable signals. Together they form your AEO Readiness Score.
            </p>
          </section>

          {/* Section 2: How AI Chooses Brands */}
          <section id="how-ai-chooses" className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              How AI Chooses Brands
            </h2>

            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Parametric Knowledge
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Large language models are trained on internet-scale text corpora
              — Wikipedia, Reddit, industry publications, review platforms, and
              licensed web crawls. Brands that appear frequently and consistently
              in these sources become part of the model&apos;s parametric memory:
              baked-in knowledge that persists even without live search.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              The key signals in training data are: Wikipedia entries, high-karma
              Reddit discussions, analyst reports, G2 and Capterra profiles, and
              coverage in industry publications. Brands that appear across
              multiple independent sources with a consistent description are
              treated as authoritative entities.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg my-4">
              <p className="text-sm text-blue-800">
                📊 Brand search volume is the strongest predictor of AI citations
                (0.334 correlation with citation frequency).
              </p>
              <p className="text-xs text-blue-600 mt-1">
                — Omniscient Digital, 23K+ Citation Study, 2025
              </p>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-3 mt-8">
              Real-Time Retrieval (RAG)
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Many AI platforms now supplement parametric knowledge with live web
              search via Retrieval-Augmented Generation (RAG). Each platform
              uses a different underlying index, which means citation visibility
              is platform-specific:
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-gray-600 text-sm flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                <span>
                  <strong className="text-gray-800">ChatGPT / Copilot:</strong>{" "}
                  Powered by Bing — 87% correlation between Bing top 10 and
                  ChatGPT citations
                </span>
              </li>
              <li className="text-gray-600 text-sm flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                <span>
                  <strong className="text-gray-800">Perplexity:</strong>{" "}
                  Proprietary index of 200B+ URLs with its own crawl priority
                </span>
              </li>
              <li className="text-gray-600 text-sm flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                <span>
                  <strong className="text-gray-800">Google AI Overviews:</strong>{" "}
                  76.1% of citations match Google&apos;s own top 10 organic results
                </span>
              </li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg my-4">
              <p className="text-sm text-blue-800">
                📊 Only 11% of domains are cited by both ChatGPT and Perplexity
                — platform-specific citation strategies are essential.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                — Seer Interactive, 500+ Citation Analysis, 2025
              </p>
            </div>
          </section>

          {/* Section 3: The 10 Dimensions */}
          <section id="dimensions" className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              The 10 Dimensions
            </h2>

            {/* Dimension 1: Entity Strength */}
            <div id="entity-strength" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🏛️</span>
                <h3 className="text-xl font-bold text-gray-900">
                  1. Entity Strength
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                How well do LLMs recognize your brand as a distinct entity?
                Brands with consistent descriptions across Wikipedia, review
                sites, and social platforms are treated as authoritative entities
                by AI knowledge graphs.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 Brands with consistent entity descriptions across 4+
                  platforms are 2.8x more likely to be cited by ChatGPT.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — Digital Bloom, 2025
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "Consistency of brand description across website, AI responses, and third-party sources",
                    "Wikipedia/Wikidata entry existence",
                    "Brand name uniqueness vs competing with generic terms",
                    "AI-assigned brand role (market leader, budget option, innovator)",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Clear entity, Wikipedia present, consistent across platforms
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Recognized but description varies or partially confused
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Weak entity signal, AI frequently confuses or skips brand
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 2: Training Data Footprint */}
            <div id="training-data-footprint" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📚</span>
                <h3 className="text-xl font-bold text-gray-900">
                  2. Training Data Footprint
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Where does this brand exist in LLM training data? AI platforms
                were trained on internet snapshots; brands that appear in
                high-tier sources (Wikipedia, licensed publications, popular
                Reddit threads) have stronger parametric memory.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 Reddit mentions (3+ upvotes) and industry publication
                  coverage significantly improve LLM brand recall.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — AirOps, LLM Citation Analysis
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "Reddit presence in relevant category subreddits",
                    "Coverage in industry publications and analyst reports",
                    "Review platform presence (G2, Capterra, Trustpilot, etc.)",
                    "Domain age and historical authority",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Present in Wikipedia, Reddit, industry press, multiple review
                    platforms
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Some third-party presence, inconsistent coverage
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Primarily self-published; minimal third-party training data
                    presence
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 3: Content Citability */}
            <div id="content-citability" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📝</span>
                <h3 className="text-xl font-bold text-gray-900">
                  3. Content Citability
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Does website content follow the patterns LLMs prefer for
                citation? AI platforms extract and cite &ldquo;chunks&rdquo; — self-contained
                passages that answer questions without requiring surrounding
                context.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 44.2% of LLM citations come from the first 30% of content.
                  Self-contained 50–150 word chunks get 2.3x more citations than
                  unstructured prose.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — Kevin Indig, 1.2M ChatGPT Answer Analysis
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "Answer-first format (key claim in opening sentence)",
                    "Chunk structure — self-contained 50–150 word answers",
                    "Data density — statistics and specific numbers per page",
                    "Expert quotes and testimonials with specific results",
                    "Reading level alignment (Flesch-Kincaid grade ~16)",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Answer-first, rich with statistics, expert quotes,
                    well-structured FAQ
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Some structured content, inconsistent answer-first format
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Long unstructured prose, buried key information, no FAQ
                    content
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 4: Citation Source Ecosystem */}
            <div id="citation-source-ecosystem" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🌐</span>
                <h3 className="text-xl font-bold text-gray-900">
                  4. Citation Source Ecosystem
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Which third-party platforms do AI models use as citation sources?
                Different platforms trust different sources, requiring
                platform-specific visibility strategies.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 Only 11% of domains are cited by both ChatGPT and
                  Perplexity — platform-specific citation strategies are
                  essential.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — Seer Interactive, 500+ Citation Analysis
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "Bing search ranking (primary predictor of ChatGPT/Copilot citations)",
                    "Google ranking (predicts AI Overview citations)",
                    "Earned media and press coverage volume",
                    "Comparison and review platform presence",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Present in top-3 results on both Bing and Google; regular
                    earned media
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Visible on some platforms; gaps on others
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Low search visibility on citation-critical platforms
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 5: Competitive Narrative */}
            <div id="competitive-narrative" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⚔️</span>
                <h3 className="text-xl font-bold text-gray-900">
                  5. Competitive Narrative
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                What story does AI tell about this brand vs competitors? LLMs
                develop &ldquo;narratives&rdquo; about brands — the adjectives, use cases, and
                comparisons that appear consistently in their training data.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 Brands in positions 1–2 receive 5x more consideration than
                  position 3+. Brand search volume has a 0.334 correlation with
                  citation frequency.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — Omniscient Digital, 23K+ Citation Study
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "AI-assigned descriptors vs competitor descriptors",
                    "Query types where competitors are consistently preferred",
                    "Narrative gap vs desired brand positioning",
                    "Share of voice in category discussions",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Owns clear positioning, first-mentioned in category,
                    consistent narrative
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Recognized but not differentiated; shares narrative with
                    competitors
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Undefined narrative; easily confused with competitors
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 6: Content Freshness */}
            <div id="content-freshness" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📅</span>
                <h3 className="text-xl font-bold text-gray-900">
                  6. Content Freshness
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                How current is the website content? AI platforms — especially
                those with real-time search — heavily weight recently updated
                content, and even parametric knowledge deprioritizes stale
                information.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 65% of AI bot traffic targets content from the past year;
                  79% targets content within 2 years.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — Digital Bloom, 2025 AI Visibility Report
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "Last-modified dates on key pages (home, pricing, about, blog)",
                    "Blog/news publication frequency",
                    "Presence of current-year references in key content",
                    "Product/feature page update recency",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Key pages updated within 6 months; active blog; current-year
                    references
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Some pages fresh; others stale; inconsistent update cadence
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Key pages not updated in 12+ months; no blog activity;
                    outdated content
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 7: Multi-Platform Presence */}
            <div id="multi-platform-presence" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🌍</span>
                <h3 className="text-xl font-bold text-gray-900">
                  7. Multi-Platform Presence
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                How many platform types does the brand appear on? AI platforms
                aggregate signals from many sources; brands present across
                diverse platform types signal legitimacy and authority.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 Brands on 4+ platform types are 2.8x more likely to be
                  cited. Average cited domain age is 17 years.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — Digital Bloom, 2025
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "Own website, Wikipedia, review platforms, social media, Reddit, press, comparison sites, developer platforms, video channels, community forums",
                    "Description consistency across platforms",
                    "Review volume and recency",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Present on 7+ platform types with consistent brand
                    description
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Present on 4–6 platform types; some inconsistency
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Present on 1–3 platform types; primarily owned channels
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 8: Intent Alignment */}
            <div id="intent-alignment" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🎯</span>
                <h3 className="text-xl font-bold text-gray-900">
                  8. Intent Alignment
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Is the brand visible across all query intent types? Different AI
                platforms have different strengths by intent type —
                informational, commercial, transactional, and navigational.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 ChatGPT is 87% accurate on informational queries but only
                  54% on transactional. Google AI Overviews dominates commercial
                  intent (91%).
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — AirOps, Cross-Platform Intent Analysis
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "Visibility breakdown by intent type (informational/commercial/transactional)",
                    "Platform-specific gaps by intent",
                    "Content coverage for each intent type",
                    "Conversion-focused content presence (pricing, comparison, FAQ)",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Visible across all intent types; strong on both informational
                    and transactional
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Strong on some intent types; weak on others
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Primarily visible on one intent type; major gaps in others
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 9: Mention Positioning */}
            <div id="mention-positioning" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📍</span>
                <h3 className="text-xl font-bold text-gray-900">
                  9. Mention Positioning
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                When AI mentions the brand, where in the response? The first
                brand mentioned in an AI response receives disproportionate
                attention from both the model and the reader.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 First-mentioned brands receive 5x more consideration than
                  third-mentioned. 44.2% of citations come from the first 30% of
                  source content.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — Omniscient Digital / Kevin Indig, 2025
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "Average mention position across all queries",
                    "Percentage of queries with first-mention",
                    "Competitor content patterns that earn first position",
                    "Query types with consistent 2nd or 3rd position",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    Frequently mentioned first; strong in high-volume category
                    queries
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Mixed positioning; first in some queries, later in others
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Consistently mentioned late or not at all in category queries
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 10: Crawler Readiness */}
            <div id="crawler-readiness" className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🤖</span>
                <h3 className="text-xl font-bold text-gray-900">
                  10. Crawler Readiness
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Can AI crawlers properly access and parse the website? Technical
                barriers can make excellent content completely invisible to AI
                platforms.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg mb-4">
                <p className="text-sm text-blue-800">
                  📊 87% of ChatGPT SearchGPT citations match Bing&apos;s top 10.
                  IndexNow enables instant Bing/Copilot indexing — dramatically
                  reducing time-to-citation.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  — WebSpero Solutions, 2026
                </p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What ShowsUp Measures
                </p>
                <ul className="space-y-1">
                  {[
                    "/robots.txt rules for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, GoogleOther)",
                    "/llms.txt existence and quality",
                    "Server-side vs client-side rendering (CSR pages are invisible to crawlers)",
                    "Page load speed",
                    "Sitemap freshness and URL coverage",
                  ].map((m) => (
                    <li
                      key={m}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    8–10: Strong
                  </p>
                  <p className="text-green-600">
                    All AI crawlers allowed, /llms.txt present, SSR, fast load,
                    fresh sitemap
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="font-semibold text-amber-700 mb-1">
                    5–7: Moderate
                  </p>
                  <p className="text-amber-600">
                    Some crawlers allowed; minor technical barriers
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-700 mb-1">0–4: Weak</p>
                  <p className="text-red-600">
                    Key crawlers blocked, CSR-only, no /llms.txt, slow load times
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Scoring Methodology */}
          <section id="scoring" className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Scoring Methodology
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The ShowsUp Score is derived from structured brand queries sent to
              each enabled AI platform. We run{" "}
              <strong className="text-gray-900">6 query categories</strong>{" "}
              mapped to purchase-funnel intent stages:
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                "Awareness",
                "Discovery",
                "Competitive",
                "Purchase Intent",
                "Alternatives",
                "Reputation",
              ].map((cat) => (
                <span
                  key={cat}
                  className="text-xs font-medium bg-gray-100 text-gray-700 rounded-full px-3 py-1"
                >
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              Each query is sent to all enabled AI platforms (ChatGPT, Claude,
              Gemini). Each response is analyzed for four signals: whether the
              brand is mentioned, its position in the response, whether it is
              actively recommended, and the sentiment of the mention.
            </p>

            {/* Score bar chart */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-5">
                ShowsUp Score Components
              </p>
              <div className="space-y-4">
                {[
                  { label: "Mention Rate", pct: 30, bars: 8 },
                  { label: "Position", pct: 25, bars: 7 },
                  { label: "Recommendation", pct: 25, bars: 7 },
                  { label: "Sentiment", pct: 20, bars: 5 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-36 flex-shrink-0">
                      {row.label}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-5 h-4 rounded-sm ${
                            i < row.bars
                              ? "bg-emerald-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-10 flex-shrink-0">
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed">
              The{" "}
              <strong className="text-gray-900">AEO Readiness Score</strong> is
              computed separately as the average of all 10 dimension scores
              (each scored 0–10). This gives an overall AEO health number
              distinct from the query-based visibility score, allowing brands to
              see both their current AI footprint and the structural readiness
              that drives long-term visibility.
            </p>
          </section>

          {/* Section 5: Fix Generation */}
          <section id="fixes" className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Fix Generation
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              After scoring, ShowsUp generates targeted fixes based on your
              specific dimension gaps. Every fix is customized to your brand,
              category, and competitive position — not generic templates. There
              are 7 fix types:
            </p>
            <div className="space-y-4">
              {[
                {
                  num: "1",
                  name: "llms.txt",
                  desc: "Generated from your specific visibility gaps and category. Tells AI crawlers exactly how to represent your brand.",
                },
                {
                  num: "2",
                  name: "FAQ Schema",
                  desc: "JSON-LD generated from your actual missing queries. Structured data that directly feeds AI citation engines.",
                },
                {
                  num: "3",
                  name: "Content Briefs",
                  desc: "Targeting your highest-opportunity query gaps. Detailed briefs with recommended chunk structures and stat targets.",
                },
                {
                  num: "4",
                  name: "Comparison Pages",
                  desc: "For competitors outranking you in head-to-head queries. Page blueprints optimized for commercial intent citations.",
                },
                {
                  num: "5",
                  name: "Citation Playbook",
                  desc: "Platform-specific action plan. Different tactics for ChatGPT (Bing SEO), Perplexity (indexing), and AI Overviews (Google SEO).",
                },
                {
                  num: "6",
                  name: "Crawlability Audit",
                  desc: "Technical readiness check covering robots.txt rules, rendering method, load speed, and sitemap coverage.",
                },
                {
                  num: "7",
                  name: "Brand Narrative",
                  desc: "AI-optimized copy using category positioning language. Ensures consistent entity description across all touchpoints.",
                },
              ].map((fix) => (
                <div
                  key={fix.num}
                  className="flex gap-4 bg-gray-50 rounded-xl p-4"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                    {fix.num}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {fix.name}
                    </p>
                    <p className="text-sm text-gray-600">{fix.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: Verification */}
          <section id="verification" className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Verification
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              ShowsUp verifies fix implementation automatically where possible.
              Verification methods vary by fix type:
            </p>
            <div className="space-y-3 mb-6">
              {[
                {
                  type: "Technical fixes",
                  examples: "robots.txt, llms.txt, schema markup, meta tags",
                  method: "Automated HTTP checks against live URLs",
                },
                {
                  type: "Content fixes",
                  examples: "FAQ sections, answer-first format, chunk structure",
                  method:
                    "Pattern matching for FAQ presence and content structure signals",
                },
                {
                  type: "Authority fixes",
                  examples: "G2 profile, Wikipedia entry, press mentions",
                  method: "External URL existence and content checks",
                },
              ].map((row) => (
                <div
                  key={row.type}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {row.type}{" "}
                        <span className="font-normal text-gray-500">
                          ({row.examples})
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {row.method}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-400 pl-4 py-3 rounded-r-lg">
              <p className="text-sm text-amber-800">
                Full impact measurement requires a new ShowsUp scan after
                implementing fixes. AI models update their parametric knowledge
                at training intervals, and real-time search indexes update
                continuously — allow 2–4 weeks for measurable citation changes.
              </p>
            </div>
          </section>

          {/* Section 7: Research Sources */}
          <section id="research" className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Research Sources
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              The ShowsUp methodology is grounded in publicly available research
              on LLM citation behavior, AI retrieval systems, and brand
              visibility signals.
            </p>
            <div className="space-y-3">
              {[
                {
                  title:
                    "2025 AI Visibility Report: How LLMs Choose What Sources to Mention",
                  authors: "Digital Bloom",
                  year: "2025",
                },
                {
                  title:
                    "Tracking LLM Brand Citations: A Complete Guide",
                  authors: "AirOps",
                  year: "2025",
                },
                {
                  title: "How AI Systems Choose Which Brands to Cite",
                  authors: "Evertune",
                  year: "2025",
                },
                {
                  title:
                    "How LLMs Source Brand Information: 23,000+ AI Citations",
                  authors: "Omniscient Digital",
                  year: "2025",
                },
                {
                  title: "Analysis of 1.2M ChatGPT Answers",
                  authors: "Kevin Indig",
                  year: "2025",
                },
                {
                  title: "Cross-Platform Citation Study",
                  authors: "WebSpero Solutions",
                  year: "2026",
                },
                {
                  title: "Content Strategy Tips for AI Visibility",
                  authors: "iPullRank",
                  year: "2025",
                },
                {
                  title: "500+ Citation Analysis",
                  authors: "Seer Interactive",
                  year: "2025",
                },
                {
                  title:
                    "SourceCheckup: Citation Accuracy in Large Language Models",
                  authors: "Wu et al.",
                  year: "Nature Communications, 2025",
                },
              ].map((s) => (
                <div
                  key={s.title}
                  className="border-l-2 border-gray-200 pl-4 py-1"
                >
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-500">
                    {s.authors} · {s.year}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <div className="mt-16 rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              See how your brand scores
            </h3>
            <p className="text-gray-600 mb-6">
              Get your free AI Visibility Report — we&apos;ll analyze your brand
              across all 10 dimensions and generate a personalized improvement
              plan.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-8 py-3 transition-colors"
            >
              Check your AI visibility — Free →
            </a>
          </div>
        </main>
      </div>
    </div>
    <MarketingFooter />
    </div>
  );
}
