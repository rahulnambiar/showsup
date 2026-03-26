import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "ShowsUp WordPress Plugin — Monitor AI Visibility from Your Dashboard",
  description:
    "The ShowsUp WordPress plugin adds AI visibility monitoring directly to your WP admin. Dashboard widget, weekly scan scheduling, score history, and improvement recommendations — no separate tool needed.",
  keywords: [
    "ShowsUp WordPress plugin",
    "AI visibility WordPress",
    "AEO WordPress plugin",
    "brand visibility WP dashboard",
    "WordPress AI SEO plugin",
  ],
  openGraph: {
    title: "ShowsUp WordPress Plugin — Monitor AI Visibility from Your Dashboard",
    description:
      "Monitor your brand's AI visibility without leaving WordPress admin. Dashboard widget, weekly scans, score history.",
    url: "https://showsup.co/wordpress",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowsUp WordPress Plugin — Monitor AI Visibility from Your Dashboard",
    description:
      "Monitor your brand's AI visibility without leaving WordPress admin. Dashboard widget, weekly scans, score history.",
  },
};

export default function WordPressPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            WordPress Plugin
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            AI visibility monitoring
            <br />
            inside WordPress.
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl mb-8">
            The ShowsUp WordPress plugin brings your brand&apos;s AI visibility score
            directly into your WordPress admin dashboard. No new tool to learn,
            no separate login — your AEO data lives right where you manage your
            content.
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

      {/* Features */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            What the Plugin Does
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-10"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Dashboard widget",
                description:
                  "A compact widget appears on your WordPress admin dashboard showing your current AEO score, score change since last scan, and a link to the full report.",
              },
              {
                title: "Weekly scan scheduling",
                description:
                  "Set the plugin to run a full AI visibility scan once a week automatically. Scans run in the background using WordPress cron — no manual action needed.",
              },
              {
                title: "Score history",
                description:
                  "Track your AEO score over time with a built-in history view. See how content changes, new backlinks, or schema updates have impacted your AI visibility.",
              },
              {
                title: "Improvement recommendations",
                description:
                  "The plugin surfaces your top improvement actions from ShowsUp's AI-generated Improvement Plan, directly in the WordPress admin — so you know exactly what content to create or update.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#E5E7EB] p-6"
              >
                <div
                  className="w-2 h-2 rounded-full mb-3"
                  style={{ background: "#10B981" }}
                />
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

      {/* Installation */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            Installation
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-8 max-w-3xl">
            <div>
              <h3 className="font-semibold text-[#111827] mb-3">
                Option 1: WordPress Plugin Directory
              </h3>
              <ol className="space-y-3 text-sm text-[#374151]">
                {[
                  'In your WordPress admin, go to Plugins → Add New.',
                  'Search for "ShowsUp".',
                  "Click Install Now, then Activate.",
                  "Go to Settings → ShowsUp and enter your API key.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "#10B981" }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t border-[#E5E7EB] pt-8">
              <h3 className="font-semibold text-[#111827] mb-3">
                Option 2: Install from GitHub
              </h3>
              <ol className="space-y-3 text-sm text-[#374151]">
                {[
                  "Download the latest release ZIP from GitHub.",
                  "In WordPress admin, go to Plugins → Add New → Upload Plugin.",
                  "Upload the ZIP and activate.",
                  "Go to Settings → ShowsUp and connect your account.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "#10B981" }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <a
                href="https://github.com/rahulnambiar/showsup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-5 text-sm font-medium"
                style={{ color: "#10B981" }}
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Know your AI visibility without leaving WordPress
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Create a free ShowsUp account to get your API key, then install the
            plugin and have your first scan running in minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
              style={{ background: "#10B981" }}
            >
              Get started free →
            </Link>
            <a
              href="https://github.com/rahulnambiar/showsup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-[#374151] font-semibold text-base border border-[#E5E7EB] hover:border-[#9CA3AF] transition-colors"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
