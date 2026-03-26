import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "ShowsUp MCP Server — AI Visibility Data for Your AI Agents",
  description:
    "The ShowsUp MCP server lets Claude Desktop, Cursor, and other MCP-compatible AI tools query your brand's AI visibility data directly. Ask Claude 'What's my brand's AEO score?' and get a live answer.",
  keywords: [
    "ShowsUp MCP server",
    "Model Context Protocol AI visibility",
    "Claude Desktop brand visibility",
    "MCP AEO integration",
    "AI agent brand score",
  ],
  openGraph: {
    title: "ShowsUp MCP Server — AI Visibility Data for Your AI Agents",
    description:
      "Connect your AI tools to ShowsUp via MCP. Ask Claude 'What's my brand's AI visibility score?' and get a live answer.",
    url: "https://showsup.co/mcp",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowsUp MCP Server — AI Visibility Data for Your AI Agents",
    description:
      "Connect your AI tools to ShowsUp via MCP. Ask Claude 'What's my brand's AI visibility score?' and get a live answer.",
  },
};

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#374151]">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1F2937] border-b border-[#374151]">
        <span className="w-3 h-3 rounded-full bg-[#EF4444] opacity-80" />
        <span className="w-3 h-3 rounded-full bg-[#F59E0B] opacity-80" />
        <span className="w-3 h-3 rounded-full bg-[#10B981] opacity-80" />
        <span className="ml-2 text-xs text-[#6B7280] font-mono">{label}</span>
      </div>
      <pre className="bg-[#111827] px-5 py-4 overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed text-[#D1FAE5]">
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function McpPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            MCP Server
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            ShowsUp for Claude,
            <br />
            Cursor, and beyond.
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl mb-8">
            The ShowsUp MCP server exposes your brand&apos;s AI visibility data as a
            tool any MCP-compatible AI assistant can use. Ask Claude Desktop
            &ldquo;What&apos;s our brand&apos;s AEO score this month?&rdquo; and get a live answer
            — no dashboard required.
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

      {/* What is MCP */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            What is MCP?
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="max-w-3xl space-y-5 text-[#374151] leading-relaxed">
            <p>
              <strong className="text-[#111827]">Model Context Protocol (MCP)</strong>{" "}
              is an open standard developed by Anthropic that lets AI assistants
              securely connect to external tools and data sources. Think of it
              as an API layer purpose-built for AI agents: instead of you
              manually pulling data and pasting it into a chat, the AI assistant
              can query the data itself, in real time, as part of a conversation.
            </p>
            <p>
              MCP is supported by Claude Desktop, Cursor, Zed, and a growing
              number of AI-native development environments. Once you configure
              an MCP server, the AI assistant gains access to its tools and can
              call them whenever relevant — without any copy-paste from you.
            </p>
          </div>
        </div>
      </section>

      {/* What the ShowsUp MCP does */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            What the ShowsUp MCP Server Does
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Query your brand score",
                description:
                  'Ask "What\'s my brand\'s current AEO score?" in Claude Desktop and get a live response — overall score, dimension breakdown, and change since last scan.',
              },
              {
                title: "Get improvement recommendations",
                description:
                  'Ask "What should I do to improve my AI visibility?" and Claude will fetch your ShowsUp Improvement Plan and summarise the top-priority actions.',
              },
              {
                title: "Compare with competitors",
                description:
                  'Ask "How does my brand compare to [competitor] on AI visibility?" and the MCP server returns a side-by-side comparison for Claude to analyse and summarise.',
              },
              {
                title: "Trigger scans programmatically",
                description:
                  "AI agents can initiate a new scan via the MCP server — useful for automated pipelines that need fresh data before generating a report.",
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

      {/* Setup */}
      <section className="py-14 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Setup</h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-8 max-w-3xl">
            <div>
              <p className="text-sm font-semibold text-[#374151] mb-3">
                1. Install the MCP server package
              </p>
              <CodeBlock label="terminal">npm install -g @showsup/mcp</CodeBlock>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#374151] mb-3">
                2. Add to your Claude Desktop config (
                <code className="text-xs bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                  ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>
                )
              </p>
              <CodeBlock label="claude_desktop_config.json">{`{
  "mcpServers": {
    "showsup": {
      "command": "showsup-mcp",
      "env": {
        "SHOWSUP_API_KEY": "your_api_key_here"
      }
    }
  }
}`}</CodeBlock>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#374151] mb-3">
                3. Restart Claude Desktop and start asking
              </p>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 text-sm text-[#374151] space-y-3">
                <p className="font-medium text-[#111827]">Example prompts:</p>
                <ul className="space-y-2">
                  {[
                    "What is my brand's current AEO score?",
                    "Which AI models mention my brand most frequently?",
                    "What are my top 3 improvement actions this month?",
                    "Compare my brand's AI visibility to HubSpot.",
                    "Run a new scan for my brand and summarise the results.",
                  ].map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#10B981" }}
                      />
                      <span className="italic text-[#6B7280]">&ldquo;{p}&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Add AI visibility to your AI workflow
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Get your ShowsUp API key, install the MCP server, and start
            querying your brand visibility data from Claude Desktop in minutes.
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

      <MarketingFooter />
    </div>
  );
}
