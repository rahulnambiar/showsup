import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "ShowsUp Chrome Extension — Check Any Brand's AI Visibility in One Click",
  description:
    "The ShowsUp Chrome Extension lets you check any website's AI visibility score directly from your browser. One click — instant score, model coverage, and quick tips.",
  keywords: [
    "ShowsUp Chrome extension",
    "AI visibility browser extension",
    "brand visibility checker",
    "AEO Chrome extension",
    "AI brand score",
  ],
  openGraph: {
    title: "ShowsUp Chrome Extension — Check Any Brand's AI Visibility in One Click",
    description:
      "Check any website's AI visibility score directly from your browser. One click, instant score.",
    url: "https://showsup.co/chrome-extension",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowsUp Chrome Extension — Check Any Brand's AI Visibility in One Click",
    description:
      "Check any website's AI visibility score directly from your browser. One click, instant score.",
  },
};

export default function ChromeExtensionPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            Browser Extension
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            AI visibility scores,
            <br />
            right in your browser.
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl mb-8">
            The ShowsUp Chrome Extension adds a one-click AI visibility score to
            any website you visit. Research competitors, prospect new clients,
            or check your own brand, without leaving the tab.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://github.com/rahulnambiar/showsup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: "#10B981" }}
            >
              Install from GitHub →
            </a>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-[#374151] font-semibold text-sm border border-[#E5E7EB] hover:border-[#9CA3AF] transition-colors bg-white"
            >
              Create free account →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            How It Works
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-10"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Visit any website",
                description:
                  "Navigate to any brand's website: a competitor, a prospect, or your own domain. The extension icon appears in your browser toolbar.",
              },
              {
                step: "2",
                title: "Click the extension",
                description:
                  "Click the ShowsUp icon. The extension detects the domain and pulls the latest AI visibility scan data from the ShowsUp database.",
              },
              {
                step: "3",
                title: "Get instant insights",
                description:
                  "See the brand's overall AEO score, which AI models mention them, and the top dimensions driving (or hurting) their score, all in a compact popup.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: "#10B981" }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-[#111827]">{item.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            What You See
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-10"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Overall AEO score",
                description:
                  "A 0–100 score reflecting the brand's composite AI visibility across ChatGPT, Claude, and Gemini. Updated every time a scan is run.",
              },
              {
                title: "Model-level coverage",
                description:
                  "See exactly which AI platforms mention the brand and in what percentage of relevant queries, broken down by ChatGPT, Claude, and Gemini.",
              },
              {
                title: "Top dimension scores",
                description:
                  "The 3 strongest and 3 weakest dimensions from ShowsUp's 10-dimension AEO framework, so you know what's working and what to fix.",
              },
              {
                title: "Quick improvement tips",
                description:
                  "For your own brand (when you're signed in), the extension surfaces the top 3 improvement actions from your Improvement Plan.",
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

      {/* Use cases */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            Who Uses It
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-5 max-w-3xl">
            {[
              {
                role: "Agency account managers",
                use: "Check a prospect's AI visibility during a discovery call, then show them how ShowsUp can help. Instant credibility.",
              },
              {
                role: "SEO consultants",
                use: "Add AI visibility as a new line item in client audits. The extension makes it trivial to include a quick AEO snapshot for any domain.",
              },
              {
                role: "Brand managers",
                use: "Quickly spot-check your own brand and your top 3 competitors without running full scans every time.",
              },
              {
                role: "Founders & CMOs",
                use: "Curious about a brand you just read about? One click while browsing their site tells you everything you need to know about their AI visibility.",
              },
            ].map((item) => (
              <div
                key={item.role}
                className="flex gap-4 p-5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]"
              >
                <span
                  className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: "#10B981" }}
                />
                <div>
                  <p className="font-semibold text-sm text-[#111827] mb-1">
                    {item.role}
                  </p>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {item.use}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Add it to Chrome in 60 seconds
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Install from GitHub and connect it to your ShowsUp account for full
            features. A free account is all you need to get started.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://github.com/rahulnambiar/showsup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
              style={{ background: "#10B981" }}
            >
              Install from GitHub →
            </a>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-[#374151] font-semibold text-base border border-[#E5E7EB] hover:border-[#9CA3AF] transition-colors"
            >
              Create free account →
            </Link>
          </div>
          <p className="mt-6 text-sm text-[#9CA3AF]">
            Want the full report?{" "}
            <Link
              href="/signup"
              className="font-medium"
              style={{ color: "#10B981" }}
            >
              Sign up for ShowsUp →
            </Link>
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
