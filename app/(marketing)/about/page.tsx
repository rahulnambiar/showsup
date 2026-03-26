import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "About ShowsUp — Built by a Digital Marketing Veteran",
  description:
    "ShowsUp was built by Rahul Nambiar, a digital marketing practitioner since 2008 who founded Valuklik and exited to Dentsu. A passion project to help brands get found by AI.",
  keywords: [
    "about ShowsUp",
    "Rahul Nambiar",
    "AI brand visibility",
    "AEO tool",
    "digital marketing",
  ],
  openGraph: {
    title: "About ShowsUp — Built by a Digital Marketing Veteran",
    description:
      "ShowsUp was built by Rahul Nambiar, a digital marketing practitioner since 2008. A passion project to help brands get found by AI.",
    url: "https://showsup.co/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About ShowsUp — Built by a Digital Marketing Veteran",
    description:
      "ShowsUp was built by Rahul Nambiar, founder of Valuklik (exited to Dentsu). A passion project to help brands get found by AI.",
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
            Built by someone who&apos;s spent a lifetime in digital marketing.
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-3xl">
            ShowsUp isn&apos;t a VC-backed startup chasing the next trend. It&apos;s a
            passion project built by a practitioner, for practitioners — people
            who live and breathe brand visibility and want to stay ahead of the
            biggest shift in search since Google.
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
                <strong className="text-[#111827]">Rahul Nambiar</strong> has
                been a digital marketing practitioner since 2008. Over nearly
                two decades he has run campaigns, built teams, and helped
                hundreds of brands grow their online presence across every major
                platform and channel.
              </p>
              <p>
                In 2010 he founded{" "}
                <strong className="text-[#111827]">Valuklik</strong>, a
                performance marketing agency that he grew into one of the
                leading independent digital agencies in the region. After years
                of sustained growth, he successfully exited Valuklik to{" "}
                <strong className="text-[#111827]">Dentsu</strong> — one of the
                world&apos;s largest advertising agency groups — a milestone that
                validated the rigour and quality of work Valuklik had become
                known for.
              </p>
              <p>
                Post-exit, Rahul transitioned into the role of investor and
                advisor, backing early-stage startups across Southeast Asia and
                beyond. He also served as a{" "}
                <strong className="text-[#111827]">Board Member</strong> at one
                of the largest ad agency groups in the world, helping shape
                strategy at the intersection of technology and marketing.
              </p>
              <p>
                Then came AI — and with it, a completely new way for people to
                discover brands. Rahul got deeply excited about what Claude Code
                made possible for solo builders, and decided to channel that
                energy into building ShowsUp: a tool that helps brands
                understand and improve their visibility in AI-generated answers.
              </p>
              <p>
                &ldquo;Digital marketing has been my life&apos;s work. ShowsUp is my way
                of contributing back to a discipline I love — and making sure
                practitioners aren&apos;t left behind by the AI transition.&rdquo;
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
                    "Digital marketing practitioner since 2008",
                    "Founded & scaled Valuklik",
                    "Exited Valuklik to Dentsu",
                    "Investor & advisor to startups",
                    "Board Member, global ad agency group",
                    "Builder of ShowsUp",
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
              ShowsUp is an open source passion project. The codebase is public
              on GitHub, the methodology is open for scrutiny and improvement,
              and contributions of all kinds are welcome — whether that&apos;s code,
              research, feedback, or ideas.
            </p>
            <p>
              If you&apos;re a developer, an SEO practitioner, a researcher
              interested in LLM citation patterns, or just someone who cares
              about the future of brand discovery, get in touch.
            </p>
            <p>
              Email Rahul directly at{" "}
              <a
                href="mailto:rahul@showsup.co"
                className="font-medium"
                style={{ color: "#10B981" }}
              >
                rahul@showsup.co
              </a>{" "}
              or open an issue / PR on{" "}
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
