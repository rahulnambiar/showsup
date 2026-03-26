import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "About ShowsUp — Digital Marketing Entrepreneur Building in AI",
  description:
    "ShowsUp was built by Rahul Nambiar — digital marketing entrepreneur, Valuklik co-founder, Dentsu exit, former board member, and now building in AI. A passion project to help brands get found by AI.",
  keywords: [
    "about ShowsUp",
    "Rahul Nambiar",
    "Valuklik Dentsu",
    "AI brand visibility",
    "AEO tool",
    "digital marketing entrepreneur",
  ],
  openGraph: {
    title: "About ShowsUp — Built by a Career Marketer Who Got Excited About AI",
    description:
      "Rahul Nambiar spent 20 years in digital marketing, exited Valuklik to Dentsu, served on global agency boards — and then AI got him excited enough to build again.",
    url: "https://www.showsup.co/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About ShowsUp",
    description:
      "Built by Rahul Nambiar — Valuklik founder, Dentsu exit, board member, now AI builder. A passion project to help every brand show up in AI.",
  },
};

export default function AboutPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#10B981] mb-4">
            About
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-6">
            Digital marketing entrepreneur. Now building in AI.
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl">
            ShowsUp isn&apos;t a VC-backed startup chasing the next trend. It&apos;s a
            passion project built by someone who has spent their entire career in
            digital marketing — and who sees AI as the most important shift in
            brand discovery since Google was invented.
          </p>
        </div>
      </section>

      {/* The Founder */}
      <section className="py-16 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            The Founder
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-5 text-[#374151] leading-relaxed">
              <p>
                <strong className="text-[#111827]">Rahul Nambiar</strong> started his career as a software developer — which, as it turns out, was the perfect foundation for everything that came after. About 20 years ago he made a deliberate pivot into digital marketing, drawn by the intersection of data, technology, and brand-building that the early internet made possible.
              </p>
              <p>
                From 2008 onwards he worked with large local and international agency groups across Asia — based across India, Singapore, and Jakarta — developing a deep, hands-on understanding of performance marketing, analytics, and what it actually takes to make brands visible at scale.
              </p>
              <p>
                In 2014 he joined{" "}
                <strong className="text-[#111827]">Valuklik</strong> as Co-founder and Managing Director, and over the following years scaled the company to over 120 people, building one of the most respected performance marketing, analytics, and data-driven advertising practices in the region. In a landmark moment for the independent agency world, Valuklik was acquired by{" "}
                <strong className="text-[#111827]">Dentsu</strong> — one of the largest advertising holding groups in the world.
              </p>
              <p>
                Post-acquisition, Rahul continued to shape the industry from the top, eventually serving as a{" "}
                <strong className="text-[#111827]">Board Member</strong> at Dentsu — his last chapter in advertising before stepping back from the industry in 2023 after 15 years at the front lines.
              </p>
              <p>
                Since then he has been an investor and advisor to startups, watching the AI revolution unfold from the sidelines. Then Claude Code happened — and something clicked. Here was a way for someone like him (an engineer-turned-marketer, not a full-time developer) to actually build something real, fast, and useful.
              </p>
              <p>
                ShowsUp is the result: a tool built entirely with Claude Code, designed to solve a problem Rahul knows intimately — brands having no idea whether AI is recommending them or ignoring them. He&apos;ll be the first to admit he&apos;s a newcomer to the world of open source and AI product development, and you&apos;ll find plenty of rough edges. He&apos;s genuinely happy to hear about all of them.
              </p>
              <p className="italic text-[#6B7280]">
                &ldquo;I&apos;ve spent my whole life in this industry. ShowsUp is my attempt to contribute something back — and to keep branding in the AI world a little more democratic. I&apos;ll always keep it open source, because I want more people to build on top of it.&rdquo;
              </p>
              <p>
                <a
                  href="https://linkedin.com/in/rahulnambiar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium"
                  style={{ color: "#10B981" }}
                >
                  Connect on LinkedIn →
                </a>
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] p-5 bg-[#F9FAFB]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
                  Career highlights
                </p>
                <ul className="space-y-3 text-sm text-[#374151]">
                  {[
                    "Started career as software developer",
                    "Pivoted to digital marketing ~2005",
                    "Agency experience across India, Singapore, Jakarta",
                    "Co-founder & MD, Valuklik (2014)",
                    "Scaled Valuklik to 120+ people",
                    "Exited Valuklik to Dentsu",
                    "Board Member, Dentsu (left 2023)",
                    "Investor & advisor to startups",
                    "Building ShowsUp with Claude Code",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#10B981" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Mission */}
      <section className="py-16 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            The Mission
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="space-y-6 text-[#374151] leading-relaxed max-w-3xl">
            <p className="text-xl text-[#111827] font-medium">
              AI is changing how brands get discovered. Most brands don&apos;t even
              know if they show up.
            </p>
            <p>
              Billions of people now turn to ChatGPT, Claude, Gemini, and
              Perplexity with questions that used to go to Google. &ldquo;What&apos;s the
              best CRM for a small business?&rdquo; &ldquo;Which running shoe brand has the
              best cushioning?&rdquo; &ldquo;Who are the top cybersecurity firms in
              Singapore?&rdquo;
            </p>
            <p>
              These AI engines give confident, specific answers — and those
              answers shape purchase decisions. A brand that gets recommended by
              ChatGPT has an enormous edge over one that doesn&apos;t. But unlike
              Google, there&apos;s no rank tracker. There&apos;s no keyword report. There
              is no &ldquo;position 1.&rdquo; Until now, brands had no systematic way to
              measure their presence in AI-generated answers at all.
            </p>
            <p>
              ShowsUp was built to fix that. We give brands a clear,
              research-backed score for their AI visibility, explain exactly
              why they rank the way they do, and provide an actionable
              improvement plan grounded in the same signals AI engines actually
              use.
            </p>
            <p>
              The methodology is open source. The goal is to help every brand —
              regardless of size or budget — understand and improve their
              standing in the AI era.
            </p>
          </div>
        </div>
      </section>

      {/* Want to contribute */}
      <section className="py-16 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">
            Want to Contribute?
          </h2>
          <div
            className="w-12 h-1 rounded-full mb-8"
            style={{ background: "#10B981" }}
          />

          <div className="max-w-3xl space-y-5 text-[#374151] leading-relaxed">
            <p>
              Rahul is a self-confessed newcomer to open source and AI product development — and he&apos;s completely fine with that. ShowsUp will have rough edges, missing features, and the occasional embarrassing bug. That&apos;s the point of building in the open.
            </p>
            <p>
              He genuinely wants to hear from you — whether you&apos;ve found a bug, have a feature you&apos;d love to see, want to contribute code or research, or just have thoughts on how the methodology could be better. Developers, SEO practitioners, LLM researchers, brand managers — all welcome.
            </p>
            <p>
              The plan is to always keep this open source, so anyone can build on top of it and make brand visibility in the AI world a little more democratic.
            </p>
            <p>
              Reach Rahul directly at{" "}
              <a
                href="mailto:rahul@showsup.co"
                className="font-medium"
                style={{ color: "#10B981" }}
              >
                rahul@showsup.co
              </a>
              , connect on{" "}
              <a
                href="https://linkedin.com/in/rahulnambiar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium"
                style={{ color: "#10B981" }}
              >
                LinkedIn
              </a>
              , or open an issue on{" "}
              <a
                href="https://github.com/rahulnambiar/showsup"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium"
                style={{ color: "#10B981" }}
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            Ready to see if your brand shows up?
          </h2>
          <p className="text-[#6B7280] mb-8 max-w-xl mx-auto">
            Run your first AI visibility scan in under two minutes. No credit
            card required.
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
