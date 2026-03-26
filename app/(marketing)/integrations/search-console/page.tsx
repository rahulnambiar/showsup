import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Google Search Console Integration — Connect GSC to ShowsUp",
  description:
    "Connect Google Search Console to ShowsUp to correlate your traditional SEO performance with AI visibility. Overlay organic impressions, clicks, and rankings against your AEO score.",
  keywords: [
    "Google Search Console integration",
    "GSC ShowsUp",
    "SEO AI visibility correlation",
    "search console AEO",
    "organic search AI overlap",
  ],
  openGraph: {
    title: "Google Search Console Integration — Connect GSC to ShowsUp",
    description:
      "Connect Google Search Console to ShowsUp to see how your traditional SEO correlates with AI visibility.",
    url: "https://showsup.co/integrations/search-console",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Search Console Integration — Connect GSC to ShowsUp",
    description:
      "Connect Google Search Console to ShowsUp to see how your traditional SEO correlates with AI visibility.",
  },
};

export default function SearchConsolePage() {
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
          <span className="text-[#374151]">Google Search Console</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            Integration Guide
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            Google Search Console
            <br />
            Integration
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl">
            Connect your Google Search Console property to ShowsUp to correlate
            your traditional organic search performance with your AI visibility
            score. Understand which queries you rank for on Google but miss in
            AI — and vice versa.
          </p>
        </div>
      </section>

      {/* Why connect */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            Why Connect Google Search Console?
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {[
              {
                title: "Find the SEO–AEO gap",
                description:
                  "You might rank on page 1 of Google for a query but never appear in ChatGPT's answer to the same question. The GSC integration surfaces exactly these gaps.",
              },
              {
                title: "Validate your improvements",
                description:
                  "When you implement ShowsUp's improvement recommendations, see whether the resulting content also improves your Google rankings — a double win.",
              },
              {
                title: "Prioritise by traffic potential",
                description:
                  "Use your real GSC impression and click data to prioritise which AI visibility gaps matter most. Fix the ones tied to your highest-traffic queries first.",
              },
              {
                title: "One unified view",
                description:
                  "Instead of switching between GSC and ShowsUp, see both your traditional SEO metrics and AI visibility scores side by side in a single dashboard.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#E5E7EB] p-6"
              >
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

      {/* Step-by-step */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            How to Connect
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-6 max-w-3xl">
            {[
              {
                step: "1",
                title: "Go to Settings → Data Sources",
                description:
                  "From your ShowsUp dashboard, open Settings in the sidebar and click on the Data Sources tab. You will see all available integrations listed here.",
              },
              {
                step: "2",
                title: "Click Connect Google Search Console",
                description:
                  'Find the Google Search Console card and click the "Connect" button. You\'ll be redirected to a Google OAuth consent screen.',
              },
              {
                step: "3",
                title: "Authorise ShowsUp access",
                description:
                  "Select the Google account that has access to your Search Console property and grant ShowsUp read-only permission to your Search Console data. ShowsUp only requests read access — it cannot make changes to your property.",
              },
              {
                step: "4",
                title: "Select your property",
                description:
                  "After authorisation, you'll be returned to ShowsUp and prompted to select which Search Console property to connect. Choose the property matching your brand's domain.",
              },
              {
                step: "5",
                title: "Wait for the initial data sync",
                description:
                  "ShowsUp will import up to 16 months of GSC data in the background. This takes up to 5 minutes. You'll see a progress indicator on the Data Sources page.",
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

      {/* What data it imports */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            What Data ShowsUp Imports
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3 font-semibold text-[#374151]">
                    Data field
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-[#374151]">
                    How ShowsUp uses it
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  ["Top queries", "Mapped against AI visibility prompts to find overlap and gaps"],
                  ["Impressions", "Used to weight the importance of AEO improvements by traffic potential"],
                  ["Clicks", "Identifies high-CTR queries to prioritise for AI coverage"],
                  ["Average position", "Correlates Google ranking position with AI mention frequency"],
                  ["Top pages", "Shows which pages are performing organically and need AI visibility work"],
                ].map(([field, use]) => (
                  <tr key={field}>
                    <td className="px-5 py-3 font-medium text-[#111827]">{field}</td>
                    <td className="px-5 py-3 text-[#6B7280]">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 text-sm text-[#9CA3AF]">
            ShowsUp requests read-only access and never writes data back to your
            Search Console property.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Ready to connect your data?
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Create your ShowsUp account, run your first brand scan, then connect
            Google Search Console from the Data Sources settings.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
              style={{ background: "#10B981" }}
            >
              Create account →
            </Link>
            <Link
              href="/app/data-sources"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-[#374151] font-semibold text-base border border-[#E5E7EB] hover:border-[#9CA3AF] transition-colors"
            >
              Go to Data Sources →
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
