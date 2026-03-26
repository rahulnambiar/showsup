import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "Terms of Service — ShowsUp",
  description: "Terms of Service for ShowsUp, a product of FVG Capital Pte. Ltd.",
};

export default function TermsPage() {
  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: 26 March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of ShowsUp
              (&ldquo;Service&rdquo;), operated by <strong>FVG Capital Pte. Ltd.</strong>, a company
              registered in Singapore (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or
              &ldquo;us&rdquo;).
            </p>
            <p className="mt-3">
              By creating an account or using the Service, you agree to be bound by these Terms.
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              ShowsUp is a software-as-a-service platform that analyses brand visibility across
              AI language models (including ChatGPT, Claude, and Gemini), provides scoring,
              improvement recommendations, and related tools. The Service is accessed via{" "}
              <a href="https://www.showsup.co" className="text-emerald-600 hover:underline">
                www.showsup.co
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Accounts</h2>
            <p>
              You must be at least 16 years old to create an account. You are responsible for
              maintaining the confidentiality of your login credentials and for all activity under
              your account. You agree to notify us immediately at{" "}
              <a href="mailto:hello@showsup.co" className="text-emerald-600 hover:underline">
                hello@showsup.co
              </a>{" "}
              if you suspect unauthorised access.
            </p>
            <p className="mt-3">
              You may not share your account with others or create multiple accounts to circumvent
              usage limits. We reserve the right to suspend or terminate accounts that violate
              these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Tokens and Payments</h2>
            <h3 className="font-semibold text-gray-800 mb-2">4.1 Token system</h3>
            <p>
              The Service operates on a token-based consumption model. Certain actions (e.g.,
              running brand scans, generating reports) consume tokens from your balance. Token
              packages are purchased in advance.
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.2 Purchases</h3>
            <p>
              All purchases are processed securely by Stripe. Prices are displayed in USD and are
              exclusive of any applicable taxes, which are your responsibility. By completing a
              purchase, you authorise us to charge the stated amount to your chosen payment method.
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.3 No refunds</h3>
            <p>
              Token purchases are non-refundable except where required by applicable law. Unused
              tokens do not expire. If you believe there has been a billing error, contact us
              within 30 days of the charge at{" "}
              <a href="mailto:hello@showsup.co" className="text-emerald-600 hover:underline">
                hello@showsup.co
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the Service at scale</li>
              <li>Use the Service to analyse brands you do not own or have no legitimate interest in</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its systems</li>
              <li>Resell or sublicense access to the Service without our written permission</li>
              <li>Submit false, misleading, or fraudulent information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain
              the exclusive property of FVG Capital Pte. Ltd. Our trademarks, logos, and brand
              elements may not be used without prior written consent.
            </p>
            <p className="mt-3">
              You retain ownership of any brand data or content you submit. By submitting content,
              you grant us a limited licence to process it solely to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Third-Party Services</h2>
            <p>
              The Service integrates with third-party AI providers (OpenAI, Anthropic, Google),
              payment processors (Stripe), and infrastructure providers. We are not responsible for
              the performance, availability, or policies of these third parties. Your use of
              third-party services is subject to their respective terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY
              KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="mt-3">
              AI-generated scores, recommendations, and reports are provided for informational
              purposes only. We do not guarantee that implementing recommendations will improve
              your brand&apos;s visibility in any AI platform. Results may vary and are not a
              substitute for professional marketing or SEO advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW, FVG CAPITAL PTE. LTD. AND ITS DIRECTORS,
              EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL,
              ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
            </p>
            <p className="mt-3">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT
              YOU PAID TO US IN THE 3 MONTHS PRECEDING THE CLAIM, OR (B) USD $50.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless FVG Capital Pte. Ltd. and its officers,
              directors, employees, and agents from any claims, liabilities, damages, losses, and
              expenses (including reasonable legal fees) arising out of your use of the Service or
              violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at our sole discretion, with
              or without notice, for conduct that we determine violates these Terms or is harmful
              to other users, us, or third parties.
            </p>
            <p className="mt-3">
              You may terminate your account at any time by contacting us at{" "}
              <a href="mailto:hello@showsup.co" className="text-emerald-600 hover:underline">
                hello@showsup.co
              </a>
              . Upon termination, your right to use the Service ceases immediately. Unused tokens
              are non-refundable upon voluntary termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              Singapore, without regard to its conflict of law provisions. Any disputes arising
              from these Terms or the Service shall be subject to the exclusive jurisdiction of
              the courts of Singapore.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of
              material changes by posting the updated Terms on this page and updating the
              &ldquo;Last updated&rdquo; date. Continued use of the Service after changes are posted
              constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
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

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} FVG Capital Pte. Ltd. All rights reserved.
      </footer>
    </div>
  );
}
