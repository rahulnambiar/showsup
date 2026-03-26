import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "ShowsUp CLI — Scan AI Brand Visibility from Your Terminal",
  description:
    "Run AI brand visibility scans from your terminal or CI/CD pipeline. Install the ShowsUp CLI with npm and automate brand monitoring at scale.",
  keywords: [
    "ShowsUp CLI",
    "AI visibility CLI",
    "brand visibility terminal",
    "AEO automation",
    "CI/CD brand monitoring",
  ],
  openGraph: {
    title: "ShowsUp CLI — Scan AI Brand Visibility from Your Terminal",
    description:
      "Automate AI brand visibility scans from your terminal or CI/CD pipeline. npm install -g @showsup/cli",
    url: "https://showsup.co/cli",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowsUp CLI — Scan AI Brand Visibility from Your Terminal",
    description:
      "Run AI brand visibility scans from your terminal or CI/CD pipeline. npm install -g @showsup/cli",
  },
};

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#374151]">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1F2937] border-b border-[#374151]">
        <span className="w-3 h-3 rounded-full bg-[#EF4444] opacity-80" />
        <span className="w-3 h-3 rounded-full bg-[#F59E0B] opacity-80" />
        <span className="w-3 h-3 rounded-full bg-[#10B981] opacity-80" />
        <span className="ml-2 text-xs text-[#6B7280] font-mono">terminal</span>
      </div>
      <pre className="bg-[#111827] px-5 py-4 overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed">
          <span className="text-[#6B7280]">$ </span>
          <span className="text-[#10B981]">{children}</span>
        </code>
      </pre>
    </div>
  );
}

export default function CliPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            Developer Tools
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            ShowsUp CLI
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl mb-8">
            Run AI brand visibility scans from your terminal, automate monthly
            reports, and integrate brand monitoring directly into your CI/CD
            pipeline. Everything the dashboard does — available from the command
            line.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: "#10B981" }}
            >
              Get API key →
            </Link>
            <a
              href="https://github.com/rahulnambiar/showsup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-[#374151] font-semibold text-sm border border-[#E5E7EB] hover:border-[#9CA3AF] transition-colors bg-white"
            >
              View on GitHub →
            </a>
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
          <p className="text-[#6B7280] mb-6">
            Install globally via npm or yarn. Node.js 18+ required.
          </p>
          <div className="space-y-4">
            <CodeBlock>npm install -g @showsup/cli</CodeBlock>
            <CodeBlock>showsup auth --api-key YOUR_API_KEY</CodeBlock>
          </div>
          <p className="mt-5 text-sm text-[#9CA3AF]">
            Generate your API key from{" "}
            <Link
              href="/signup"
              className="font-medium"
              style={{ color: "#10B981" }}
            >
              your ShowsUp account
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Quick start */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            Quick Start
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-[#374151] mb-3">
                Run a full visibility scan
              </p>
              <CodeBlock>
                showsup scan --brand &quot;Acme Corp&quot; --website acme.com
              </CodeBlock>
              <p className="mt-3 text-sm text-[#6B7280]">
                Sends 40+ prompts across ChatGPT, Claude, and Gemini and returns
                a composite AEO score with dimension breakdown.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#374151] mb-3">
                Get the latest score without running a new scan
              </p>
              <CodeBlock>showsup score --brand &quot;Acme Corp&quot;</CodeBlock>
              <p className="mt-3 text-sm text-[#6B7280]">
                Fetches the most recent scan result for the brand and prints the
                overall score and dimension scores to stdout.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#374151] mb-3">
                Export a full report as JSON
              </p>
              <CodeBlock>
                showsup report --brand &quot;Acme Corp&quot; --output report.json
              </CodeBlock>
              <p className="mt-3 text-sm text-[#6B7280]">
                Exports the full structured report — scores, prompt responses,
                improvement plan, and competitor comparison — as a JSON file.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            Use Cases
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Automated monthly reports",
                description:
                  "Schedule a cron job to run a brand scan every month and email the report automatically. Track score trends over time without logging into the dashboard.",
              },
              {
                title: "CI/CD integration",
                description:
                  "Add an AI visibility check to your deployment pipeline. Get alerted if a product launch or content change causes your brand's AI score to drop.",
              },
              {
                title: "Agency bulk scanning",
                description:
                  "Agencies managing 50+ clients can script bulk scans across all brands and aggregate results into a single dashboard or spreadsheet.",
              },
              {
                title: "Competitor benchmarking",
                description:
                  "Build a simple script that scans your brand and 3–5 competitors weekly and produces a comparison table — useful for client reporting.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#E5E7EB] p-6 bg-[#F9FAFB]"
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

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Start scanning from your terminal
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Create a free account to get your API key, then install the CLI and
            run your first scan in under 5 minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
              style={{ background: "#10B981" }}
            >
              Get API key →
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
