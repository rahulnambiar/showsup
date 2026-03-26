import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — ShowsUp",
  description: "Privacy Policy for ShowsUp, a product of FVG Capital Pte. Ltd.",
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: 26 March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              ShowsUp (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is a product operated by{" "}
              <strong>FVG Capital Pte. Ltd.</strong>, a company registered in Singapore. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you
              use our website at{" "}
              <a href="https://www.showsup.co" className="text-emerald-600 hover:underline">
                www.showsup.co
              </a>{" "}
              and our associated services (collectively, the &ldquo;Service&rdquo;).
            </p>
            <p className="mt-3">
              By accessing or using the Service, you agree to the collection and use of information
              in accordance with this policy. If you do not agree, please discontinue use of the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <h3 className="font-semibold text-gray-800 mb-2">2.1 Information you provide</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account registration details (name, email address, password)</li>
              <li>Brand and website information you submit for analysis</li>
              <li>Payment information processed via Stripe (we do not store card details)</li>
              <li>Communications you send us (support requests, feedback)</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Information collected automatically</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Log data: IP address, browser type, pages visited, time and date of access</li>
              <li>Device information: hardware model, operating system, unique device identifiers</li>
              <li>Usage data: features used, scan history, token consumption</li>
              <li>Cookies and similar tracking technologies (see Section 6)</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Third-party sign-in</h3>
            <p>
              If you sign in via Google OAuth, we receive your name, email address, and profile
              picture from Google. We do not receive your Google password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process transactions and manage token balances</li>
              <li>Send transactional emails (account confirmation, purchase receipts)</li>
              <li>Respond to support requests</li>
              <li>Monitor and analyse usage to improve the Service</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with applicable legal obligations</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties. We do not use your data to
              train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Sharing of Information</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Service providers</strong> — Supabase (database and authentication),
                Stripe (payment processing), Vercel (hosting), PostHog (product analytics),
                Resend (transactional email). Each provider processes data only as necessary to
                deliver their service.
              </li>
              <li>
                <strong>AI providers</strong> — When you run a brand scan, your brand name and
                website are submitted as prompts to OpenAI, Anthropic, and Google AI APIs. Please
                review their respective privacy policies.
              </li>
              <li>
                <strong>Legal requirements</strong> — We may disclose information where required by
                law, court order, or to protect the rights, property, or safety of FVG Capital
                Pte. Ltd., our users, or others.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to
              provide the Service. You may request deletion of your account and associated data at
              any time by contacting us at{" "}
              <a href="mailto:hello@showsup.co" className="text-emerald-600 hover:underline">
                hello@showsup.co
              </a>
              . Certain data may be retained for a period thereafter to comply with legal obligations
              or resolve disputes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember
              preferences, and analyse usage patterns. You can configure your browser to refuse
              cookies; however, some parts of the Service may not function correctly without them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your
              information against unauthorised access, alteration, disclosure, or destruction.
              These include encrypted connections (TLS), hashed passwords, and role-based access
              controls. No method of transmission over the internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability (receive your data in a machine-readable format)</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:hello@showsup.co" className="text-emerald-600 hover:underline">
                hello@showsup.co
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Transfers</h2>
            <p>
              FVG Capital Pte. Ltd. is based in Singapore. Our service providers may process data
              in other jurisdictions (including the United States and European Economic Area). By
              using the Service, you consent to such transfers. We ensure appropriate safeguards are
              in place in accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to children under the age of 16. We do not knowingly
              collect personal information from children. If you believe a child has provided us
              with personal information, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
              Continued use of the Service after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <address className="not-italic mt-3 space-y-1 text-gray-700">
              <p><strong>FVG Capital Pte. Ltd.</strong></p>
              <p>Singapore</p>
              <p>
                Email:{" "}
                <a href="mailto:hello@showsup.co" className="text-emerald-600 hover:underline">
                  hello@showsup.co
                </a>
              </p>
            </address>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
