import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Changelog — ShowsUp",
  description:
    "What's new in ShowsUp. A running log of new features, improvements, and fixes — from the initial launch in December 2025 to today.",
  keywords: ["ShowsUp changelog", "AEO tool updates", "ShowsUp new features", "AI visibility tool updates"],
  openGraph: {
    title: "Changelog — ShowsUp",
    description: "What's new in ShowsUp — a running log of features, improvements, and fixes.",
    url: "https://showsup.co/changelog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog — ShowsUp",
    description: "What's new in ShowsUp — a running log of features, improvements, and fixes.",
  },
};

const releases = [
  {
    version: "v0.4",
    date: "March 2026",
    badge: "Latest",
    changes: [
      {
        type: "New",
        items: [
          "Stripe token payments — purchase scan tokens directly from the dashboard; no subscription required.",
          "Google OAuth — sign in with your Google account in addition to email/password.",
          "Custom favicon — ShowsUp now has its own branded favicon across all pages.",
          "Privacy Policy and Terms of Service pages — fully drafted and accessible from all footers.",
        ],
      },
      {
        type: "Improved",
        items: [
          "Report sidebar redesigned — cleaner layout, collapsible sections, and faster navigation between scan dimensions.",
          "Scan results load noticeably faster after backend query optimisations.",
          "Mobile layout improvements across the marketing site.",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Fixed an edge case where Gemini scans would occasionally time out without returning partial results.",
          "Fixed report PDF export producing blank pages on some browsers.",
        ],
      },
    ],
  },
  {
    version: "v0.3",
    date: "February 2026",
    badge: null,
    changes: [
      {
        type: "New",
        items: [
          "Improvement Plan generator — after every scan, ShowsUp now generates a prioritised, AI-written action plan based on your weakest AEO dimensions.",
          "PDF export — download any scan report as a clean, branded PDF. Useful for sharing with clients or stakeholders.",
          "Google Search Console integration — connect your GSC property and overlay organic search data on your AI visibility scores.",
        ],
      },
      {
        type: "Improved",
        items: [
          "Prompt library expanded from 30 to 45 prompts per scan, improving score accuracy for niche industries.",
          "Competitor comparison view now supports up to 5 competitors (previously 3).",
          "Improvement Plan items now include estimated implementation effort (low / medium / high).",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Fixed a bug where brands with special characters in their name would fail the Gemini scan step.",
          "Fixed session timeout causing users to lose unsaved competitor settings.",
        ],
      },
    ],
  },
  {
    version: "v0.2",
    date: "January 2026",
    badge: null,
    changes: [
      {
        type: "New",
        items: [
          "Scores dashboard — a persistent home screen showing all your scanned brands with their latest scores and score trends.",
          "Multi-scan history — view and compare results from all historical scans for a brand, not just the most recent.",
          "Token system — scan credits replace the per-request billing model. Buy tokens in bulk for better value.",
          "API endpoints — programmatic access to scan results, score history, and improvement plans via REST API.",
          "CSV upload — import keyword rankings and search analytics from Ahrefs, SEMrush, or Google Search Console.",
        ],
      },
      {
        type: "Improved",
        items: [
          "Score calculation methodology updated to v1.2 — dimension weights re-calibrated against an expanded citation dataset.",
          "Report UI redesigned with a cleaner sidebar and tabbed dimension view.",
          "Scan speed improved by ~30% through parallel prompt execution.",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Fixed incorrect score display when a brand scored 0 on a dimension (was showing NaN).",
          "Fixed email magic link not working on certain email clients due to URL encoding issue.",
        ],
      },
    ],
  },
  {
    version: "v0.1",
    date: "December 2025",
    badge: "Initial launch",
    changes: [
      {
        type: "New",
        items: [
          "Brand scanner — enter a brand name and website URL to kick off a full AI visibility scan.",
          "Three AI engine coverage — scans run against ChatGPT (GPT-4o), Claude (Sonnet), and Google Gemini Pro.",
          "10-dimension AEO score — composite brand visibility score across Brand Authority, Content Depth, Query Coverage, Schema Markup, Review Coverage, Social Proof, Visual Presence, Recency, Competitor Gap, and Domain Trust.",
          "Scan report — detailed breakdown of each dimension with evidence from AI responses.",
          "Email + password authentication with magic link support.",
          "Free tier — 2 scans per month included with a free account.",
        ],
      },
    ],
  },
];

const badgeColors: Record<string, string> = {
  New: "#D1FAE5",
  Improved: "#DBEAFE",
  Fixed: "#FEF3C7",
};
const badgeText: Record<string, string> = {
  New: "#065F46",
  Improved: "#1E40AF",
  Fixed: "#92400E",
};

export default function ChangelogPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            What&apos;s New
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            Changelog
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl">
            A running log of everything new in ShowsUp — features, improvements,
            and fixes, ordered most recent first.
          </p>
        </div>
      </section>

      {/* Releases */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-16">
            {releases.map((release) => (
              <div key={release.version} className="relative">
                {/* Version header */}
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl font-bold text-[#111827]">
                    {release.version}
                  </h2>
                  <span className="text-sm text-[#9CA3AF]">{release.date}</span>
                  {release.badge && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background:
                          release.badge === "Latest" ? "#D1FAE5" : "#F3F4F6",
                        color:
                          release.badge === "Latest" ? "#065F46" : "#6B7280",
                      }}
                    >
                      {release.badge}
                    </span>
                  )}
                </div>

                {/* Change groups */}
                <div className="space-y-6 pl-4 border-l-2 border-[#E5E7EB]">
                  {release.changes.map((group) => (
                    <div key={group.type}>
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: badgeColors[group.type] ?? "#F3F4F6",
                            color: badgeText[group.type] ?? "#374151",
                          }}
                        >
                          {group.type}
                        </span>
                      </div>
                      <ul className="space-y-2.5">
                        {group.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 text-sm text-[#374151] leading-relaxed"
                          >
                            <span
                              className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: "#10B981" }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Try the latest version
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Create a free account and run your first brand visibility scan in
            under two minutes.
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
