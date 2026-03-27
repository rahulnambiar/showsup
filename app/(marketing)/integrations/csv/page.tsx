import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "CSV Upload — Import Your SEO Data into ShowsUp",
  description:
    "Upload keyword rankings, backlink data, and search analytics exports from Google Search Console, Ahrefs, or SEMrush. ShowsUp overlays your SEO data on AI visibility scores to find gaps.",
  keywords: [
    "CSV import ShowsUp",
    "upload SEO data",
    "Ahrefs export ShowsUp",
    "SEMrush integration",
    "keyword rankings AEO",
  ],
  openGraph: {
    title: "CSV Upload — Import Your SEO Data into ShowsUp",
    description:
      "Upload GSC, Ahrefs, or SEMrush exports. ShowsUp overlays your SEO data on AI visibility scores to find the gaps.",
    url: "https://showsup.co/integrations/csv",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CSV Upload — Import Your SEO Data into ShowsUp",
    description:
      "Upload GSC, Ahrefs, or SEMrush exports. ShowsUp overlays your SEO data on AI visibility scores to find the gaps.",
  },
};

export default function CsvPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Breadcrumb */}
      <div className="border-b border-[#E5E7EB] px-6 py-3">
        <div className="max-w-4xl mx-auto text-sm text-[#9CA3AF]">
          <Link href="/integrations" className="hover:text-[#111827] transition-colors">
            Integrations
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#374151]">CSV Upload</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            Integration Guide
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            CSV Upload
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl">
            Already have keyword rankings, backlink data, or search analytics
            exports from tools like Ahrefs, SEMrush, or Google Search Console?
            Upload them directly to ShowsUp. We overlay your existing SEO data
            on top of AI visibility scores to show you exactly where the gaps
            are.
          </p>
        </div>
      </section>

      {/* What you can upload */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            What You Can Upload
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Keyword rankings",
                formats: ["Google Search Console performance export", "Ahrefs organic keywords CSV", "SEMrush position tracking export", "Moz keyword rankings export"],
                description: "Upload your tracked keyword rankings. ShowsUp maps each keyword against the prompts it sends to AI engines and shows you which ranking keywords you're also winning in AI and which you're not.",
              },
              {
                title: "Backlink data",
                formats: ["Ahrefs backlinks CSV", "SEMrush backlinks export", "Majestic link data"],
                description: "Backlink authority is one of ShowsUp's 10 AEO dimensions. Upload your backlink export and we populate that dimension with real data rather than our crawled estimate.",
              },
              {
                title: "Search analytics",
                formats: ["GSC query performance CSV", "Adobe Analytics export", "Custom analytics CSV"],
                description: "Upload query-level impression and click data. ShowsUp uses this to prioritise your AI visibility gaps by actual traffic potential, so you fix the highest-value gaps first.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#E5E7EB] p-6"
              >
                <h3 className="font-semibold text-[#111827] mb-3">
                  {item.title}
                </h3>
                <ul className="space-y-1.5 mb-4">
                  {item.formats.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#6B7280]">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#10B981" }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to upload */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            How to Upload
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-6 max-w-3xl">
            {[
              {
                step: "1",
                title: "Go to Data Sources → Upload CSV",
                description:
                  "From your ShowsUp dashboard, navigate to Settings → Data Sources. Click the Upload CSV card to open the upload interface.",
              },
              {
                step: "2",
                title: "Select your file and data type",
                description:
                  "Choose the CSV file from your computer and select the data type (keyword rankings, backlinks, or search analytics). If you're uploading a standard export from GSC, Ahrefs, or SEMrush, ShowsUp will auto-detect the format.",
              },
              {
                step: "3",
                title: "Map your columns",
                description:
                  "For custom CSV files, ShowsUp shows a column mapping interface. Drag and drop your columns to map them to ShowsUp's expected fields: keyword, position, impressions, clicks, etc.",
              },
              {
                step: "4",
                title: "Review and confirm",
                description:
                  "ShowsUp shows a preview of the data it parsed from your file. Check the row count and sample data looks correct, then click Confirm Import.",
              },
              {
                step: "5",
                title: "Data is applied to your scores",
                description:
                  "Within a few minutes, the uploaded data is overlaid on your AI visibility dashboard. You'll see new data points in the correlation view showing where your SEO performance and AI visibility align and where they diverge.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5"
                  style={{ background: "#10B981" }}
                >
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-[#111827] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What ShowsUp does with it */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            What ShowsUp Does With Your Data
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-5 text-[#374151] leading-relaxed max-w-3xl">
            <p>
              Traditional SEO and AI visibility (AEO) are related but not
              identical. A brand can rank first on Google and be completely
              absent from AI answers, and vice versa. Understanding the
              relationship between the two is the key to a complete visibility
              strategy.
            </p>
            <p>
              ShowsUp takes your uploaded SEO data and builds a correlation
              view: for each keyword or query in your data, it shows the
              corresponding AI visibility signal. Queries where you rank well
              on Google but score poorly in AI are your highest-priority AEO
              opportunities: you clearly have relevance for the topic, but
              haven&apos;t yet earned the AI recommendation.
            </p>
            <p>
              Your data is stored securely, associated only with your account,
              and used exclusively to enrich your ShowsUp reports. We never
              share it with third parties.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Bring your SEO data into ShowsUp
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Create a free account, run your first scan, then enrich it with
            your existing SEO exports for a complete visibility picture.
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
