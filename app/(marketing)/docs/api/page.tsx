import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "API Reference — ShowsUp",
  description: "Public REST API for AI visibility data. Pull ShowsUp scores, scan history, and fix artifacts into any workflow.",
};

// ── Small helpers ─────────────────────────────────────────────────────────

function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: "green" | "blue" | "amber" | "purple" | "gray" }) {
  const cls = {
    green:  "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25",
    blue:   "bg-blue-500/15  text-blue-400  border-blue-500/25",
    amber:  "bg-amber-500/15 text-amber-400 border-amber-500/25",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    gray:   "bg-white/8 text-gray-400 border-white/10",
  }[color];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold font-mono ${cls}`}>
      {children}
    </span>
  );
}

function Method({ m }: { m: "GET" | "POST" | "DELETE" | "PATCH" }) {
  const c = { GET: "green", POST: "blue", DELETE: "amber", PATCH: "purple" }[m] as "green" | "blue" | "amber" | "purple";
  return <Badge color={c}>{m}</Badge>;
}

function Code({ children, lang = "" }: { children: string; lang?: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-white/8">
      {lang && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white/4 border-b border-white/8">
          <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">{lang}</span>
        </div>
      )}
      <pre className="text-[13px] text-gray-300 leading-relaxed p-4 overflow-x-auto font-mono bg-[#0D111A]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      {children}
    </section>
  );
}

function Endpoint({ method, path, desc, cost, children }: {
  method: "GET" | "POST" | "DELETE" | "PATCH";
  path: string;
  desc: string;
  cost?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#111827] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Method m={method} />
          <code className="text-sm font-mono text-white">{path}</code>
        </div>
        <div className="flex items-center gap-3">
          {cost && <span className="text-xs text-gray-500">{cost}</span>}
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      {children && <div className="px-5 py-4 space-y-4">{children}</div>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#0A0E17] text-white">
      <MarketingNav />

      <div className="max-w-6xl mx-auto px-6 py-12 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        {/* ── Sidebar nav ── */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm">
            {[
              { href: "#overview",     label: "Overview" },
              { href: "#auth",         label: "Authentication" },
              { href: "#rate-limits",  label: "Rate Limits" },
              { href: "#token-costs",  label: "Token Costs" },
              { href: "#endpoints",    label: "Endpoints" },
              { href: "#score",        label: "  GET /score" },
              { href: "#scan",         label: "  POST /scan" },
              { href: "#scan-get",     label: "  GET /scan/:id" },
              { href: "#fixes",        label: "  GET /scan/:id/fixes" },
              { href: "#gen-fixes",    label: "  POST /generate-fixes" },
              { href: "#history",      label: "  GET /history" },
              { href: "#webhooks",     label: "Webhooks" },
              { href: "#examples",     label: "Code Examples" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`block rounded-lg px-3 py-1.5 transition-colors ${
                  label.startsWith("  ")
                    ? "text-gray-500 hover:text-gray-300 pl-5 text-xs"
                    : "text-gray-400 hover:text-white font-medium"
                }`}
              >
                {label.trim()}
              </a>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="space-y-16 min-w-0">

          {/* Overview */}
          <Section id="overview">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/25 bg-[#10B981]/10 px-3 py-1 text-xs text-[#10B981] font-medium">
                v1 — stable
              </div>
              <h1 className="text-4xl font-bold tracking-tight">API Reference</h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
                Pull AI visibility scores, scan history, and fix artifacts into any workflow.
                Zapier, n8n, custom dashboards, CI/CD pipelines — if it can make HTTP requests, it can use ShowsUp.
              </p>
            </div>
            <Code lang="Base URL">{"https://showsup.co/api/v1"}</Code>
          </Section>

          {/* Auth */}
          <Section id="auth">
            <h2 className="text-xl font-bold text-white">Authentication</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Every request requires a Bearer token. Get yours from{" "}
              <Link href="/app/settings" className="text-[#10B981] hover:underline">Settings → API Token</Link>.
            </p>
            <Code lang="Header">{`Authorization: Bearer su_live_xxxxxxxxxxxx`}</Code>
            <p className="text-xs text-gray-500">The token also accepts <code className="text-gray-300">X-Api-Token</code> for legacy compatibility.</p>

            <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3">
              <p className="text-sm text-gray-300">
                <span className="text-[#EF4444] font-semibold">Never expose your token</span>{" "}
                in client-side code, GitHub, or logs. Rotate it immediately if compromised.
              </p>
            </div>
          </Section>

          {/* Rate limits */}
          <Section id="rate-limits">
            <h2 className="text-xl font-bold text-white">Rate Limits</h2>
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-sm">
                <thead className="border-b border-white/8 bg-white/3">
                  <tr>
                    {["Plan", "Requests/hr", "Scans/day", "Notes"].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 font-semibold px-4 py-3 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Free",       "100",    "5",   "Token-gated per scan depth"],
                    ["Growth",     "500",    "25",  "Bulk discount on tokens"],
                    ["Pro",        "1,000",  "100", "Priority queue + webhooks"],
                    ["Self-hosted","Unlimited","Unlimited","No rate limits"],
                  ].map(([plan, rph, spd, note]) => (
                    <tr key={plan} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 text-white font-medium">{plan}</td>
                      <td className="px-4 py-3 text-gray-300 tabular-nums">{rph}</td>
                      <td className="px-4 py-3 text-gray-300 tabular-nums">{spd}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">Rate limit headers: <code className="text-gray-300">X-RateLimit-Limit</code>, <code className="text-gray-300">X-RateLimit-Remaining</code>, <code className="text-gray-300">X-RateLimit-Reset</code></p>
          </Section>

          {/* Token costs */}
          <Section id="token-costs">
            <h2 className="text-xl font-bold text-white">Token Costs</h2>
            <p className="text-gray-400 text-sm">Tokens reflect actual AI compute. Read-only endpoints are always free.</p>
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-sm">
                <thead className="border-b border-white/8 bg-white/3">
                  <tr>
                    {["Endpoint", "Cost", "Notes"].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 font-semibold px-4 py-3 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["GET /score (cached)",     "0 🪙",    "Returns most recent stored result"],
                    ["POST /scan (quick)",       "40 🪙",   "8 queries per model"],
                    ["POST /scan (standard)",    "140 🪙",  "20 queries, competitor benchmark"],
                    ["POST /scan (deep)",        "335 🪙",  "50 queries, full analysis"],
                    ["GET /scan/:id",            "0 🪙",    "Retrieve stored results"],
                    ["GET /scan/:id/fixes",      "0 🪙",    "Retrieve stored fix artifacts"],
                    ["POST /generate-fixes",     "80 🪙",   "7 fix types generated via AI"],
                    ["GET /history",             "0 🪙",    "Score time series, no compute"],
                    ["Webhooks",                 "0 🪙",    "Delivery is always free"],
                  ].map(([ep, cost, note]) => (
                    <tr key={ep} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-gray-300">{ep}</td>
                      <td className="px-4 py-3 text-[#10B981] font-semibold tabular-nums whitespace-nowrap">{cost}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Endpoints */}
          <Section id="endpoints">
            <h2 className="text-xl font-bold text-white">Endpoints</h2>
          </Section>

          {/* GET /score */}
          <Section id="score">
            <Endpoint method="GET" path="/score?domain=example.com" desc="Latest cached score for a domain" cost="0 🪙">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Parameters</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex gap-2"><code className="text-gray-300 w-20">domain</code><span className="text-gray-500">required — e.g. <code>example.com</code></span></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Response 200</p>
                  <Code>{`{
  "domain": "example.com",
  "brand": "Example Corp",
  "scan_id": "a1b2c3...",
  "score": 64,
  "category_scores": {
    "awareness": 71,
    "discovery": 58
  },
  "platforms": {
    "chatgpt": 71,
    "claude": 58
  },
  "scanned_at": "2026-03-24T10:00:00Z"
}`}</Code>
                </div>
              </div>
            </Endpoint>
          </Section>

          {/* POST /scan */}
          <Section id="scan">
            <Endpoint method="POST" path="/scan" desc="Trigger a brand scan" cost="40–335 🪙">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Request Body</p>
                  <Code lang="json">{`{
  "url": "https://example.com",
  "brand": "Example",     // optional
  "category": "SaaS",     // optional
  "depth": "standard",    // quick|standard|deep
  "regions": ["global","sg"],  // optional
  "competitors": ["Rival A"]   // optional
}`}</Code>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Response 200</p>
                  <Code lang="json">{`{
  "scan_id": "a1b2c3...",
  "status": "completed",
  "brand": "Example",
  "overall_score": 64,
  "platforms": {
    "chatgpt": 71,
    "claude": 58
  },
  "category_scores": { ... },
  "competitors_data": { ... },
  "scanned_at": "2026-03-24T10:00:00Z",
  "tokens_used": 140
}`}</Code>
                </div>
              </div>
            </Endpoint>
          </Section>

          {/* GET /scan/:id */}
          <Section id="scan-get">
            <Endpoint method="GET" path="/scan/:scan_id" desc="Full results for a stored scan" cost="0 🪙">
              <p className="text-xs text-gray-500">Returns the complete scan including all prompts/responses. Use the <code className="text-gray-300">scan_id</code> returned by POST /scan.</p>
            </Endpoint>
          </Section>

          {/* GET fixes */}
          <Section id="fixes">
            <Endpoint method="GET" path="/scan/:scan_id/fixes" desc="Retrieve stored fix artifacts" cost="0 🪙">
              <p className="text-xs text-gray-500">Returns fix artifacts previously generated via POST /generate-fixes. Returns 404 if fixes have not been generated yet.</p>
              <Code lang="Response">{`{
  "scan_id": "a1b2c3...",
  "brand": "Example",
  "fixes_generated_at": "2026-03-24T11:00:00Z",
  "fixes": [
    {
      "filename": "llms.txt",
      "content": "# Example Corp\n> ...",
      "description": "AI-readable brand overview",
      "sizeBytes": 1240
    },
    {
      "filename": "schema-organization.json",
      "content": "{ \"@context\": ... }",
      "description": "JSON-LD Organization schema",
      "sizeBytes": 840
    }
  ]
}`}</Code>
            </Endpoint>
          </Section>

          {/* POST generate-fixes */}
          <Section id="gen-fixes">
            <Endpoint method="POST" path="/scan/:scan_id/generate-fixes" desc="Generate fix artifacts for a scan" cost="80 🪙">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Request Body (optional)</p>
                  <Code lang="json">{`{
  "types": [
    "llms-txt",
    "schema",
    "content-briefs",
    "comparison-pages",
    "citation-playbook",
    "crawlability-audit",
    "brand-narrative"
  ]
}`}</Code>
                  <p className="text-xs text-gray-600 mt-2">Omit to generate all 7 fix types.</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Response 200</p>
                  <Code lang="json">{`{
  "scan_id": "a1b2c3...",
  "estimated_impact": "+12-22 pts",
  "fixes": [ ... ],
  "tokens_used": 80
}`}</Code>
                </div>
              </div>
            </Endpoint>
          </Section>

          {/* GET /history */}
          <Section id="history">
            <Endpoint method="GET" path="/history?domain=example.com&from=2026-01-01&to=2026-03-20" desc="Score time series" cost="0 🪙">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Parameters</p>
                  <div className="space-y-1.5 text-xs">
                    {[
                      ["domain",  "required"],
                      ["from",    "optional ISO date"],
                      ["to",      "optional ISO date"],
                      ["limit",   "optional, max 500"],
                    ].map(([p, d]) => (
                      <div key={p} className="flex gap-2">
                        <code className="text-gray-300 w-16">{p}</code>
                        <span className="text-gray-500">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Response 200</p>
                  <Code lang="json">{`{
  "domain": "example.com",
  "brand": "Example Corp",
  "data_points": 12,
  "average_score": 61,
  "trend": "rising",
  "series": [
    {
      "scan_id": "...",
      "score": 55,
      "scanned_at": "2026-01-15T..."
    },
    ...
  ]
}`}</Code>
                </div>
              </div>
            </Endpoint>
          </Section>

          {/* Webhooks */}
          <Section id="webhooks">
            <h2 className="text-xl font-bold text-white">Webhooks</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Register an endpoint to receive real-time events when scans complete or scores change.
              Requests are signed with HMAC-SHA256 — verify the <code className="text-gray-300">X-ShowsUp-Signature</code> header.
            </p>

            <div className="space-y-3">
              <Endpoint method="POST" path="/webhooks" desc="Register a webhook" cost="0 🪙">
                <Code lang="Request">{`{
  "url": "https://your-app.com/webhook",
  "events": ["scan.completed", "fixes.generated"]
}`}</Code>
                <Code lang="Response 201">{`{
  "id": "wh_xxx",
  "url": "https://your-app.com/webhook",
  "events": ["scan.completed"],
  "active": true,
  "secret": "abc123...",  // shown once — use to verify signatures
  "created_at": "..."
}`}</Code>
              </Endpoint>

              <Endpoint method="GET"    path="/webhooks"    desc="List all webhooks"  cost="0 🪙" />
              <Endpoint method="PATCH"  path="/webhooks/:id" desc="Update a webhook"   cost="0 🪙" />
              <Endpoint method="DELETE" path="/webhooks/:id" desc="Delete a webhook"   cost="0 🪙" />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Available Events</p>
              <div className="space-y-2">
                {[
                  ["scan.completed",  "Fired when any scan finishes"],
                  ["fixes.generated", "Fired when fix artifacts are generated"],
                  ["score.changed",   "Fired when a rescan shows a score delta ≥5"],
                  ["*",               "Subscribe to all events"],
                ].map(([ev, desc]) => (
                  <div key={ev} className="flex items-center gap-3">
                    <code className="text-[#10B981] text-xs font-mono bg-[#10B981]/10 px-2 py-0.5 rounded">{ev}</code>
                    <span className="text-xs text-gray-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Signature Verification</p>
              <Code lang="python">{`import hmac, hashlib

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`}</Code>
            </div>
          </Section>

          {/* Code examples */}
          <Section id="examples">
            <h2 className="text-xl font-bold text-white">Code Examples</h2>

            <div className="space-y-4">
              <Code lang="curl">{`# Get latest score
curl -H "Authorization: Bearer su_live_xxx" \\
  "https://showsup.co/api/v1/score?domain=example.com"

# Trigger a scan
curl -X POST \\
  -H "Authorization: Bearer su_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","depth":"standard"}' \\
  "https://showsup.co/api/v1/scan"

# Get score history
curl -H "Authorization: Bearer su_live_xxx" \\
  "https://showsup.co/api/v1/history?domain=example.com&from=2026-01-01"`}</Code>

              <Code lang="python">{`import requests

API_KEY = "su_live_xxxxxxxxxxxx"
BASE    = "https://showsup.co/api/v1"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

# Get cached score
score = requests.get(f"{BASE}/score?domain=example.com", headers=HEADERS).json()
print(f"Score: {score['score']}/100 — {score['brand']}")

# Trigger standard scan
scan = requests.post(f"{BASE}/scan", headers=HEADERS, json={
    "url":   "https://example.com",
    "depth": "standard",
}).json()
print(f"Scan ID: {scan['scan_id']}, Score: {scan['overall_score']}")

# Generate fixes
fixes = requests.post(
    f"{BASE}/scan/{scan['scan_id']}/generate-fixes",
    headers=HEADERS,
).json()
for fix in fixes["fixes"]:
    print(f"  {fix['filename']} — {fix['description']}")

# Score history
history = requests.get(
    f"{BASE}/history?domain=example.com&from=2026-01-01",
    headers=HEADERS,
).json()
print(f"Trend: {history['trend']}, Avg score: {history['average_score']}")`}</Code>

              <Code lang="javascript">{`const API_KEY = "su_live_xxxxxxxxxxxx";
const BASE = "https://showsup.co/api/v1";
const headers = { "Authorization": \`Bearer \${API_KEY}\`, "Content-Type": "application/json" };

// Get cached score
const { score, brand } = await fetch(\`\${BASE}/score?domain=example.com\`, { headers })
  .then(r => r.json());
console.log(\`\${brand}: \${score}/100\`);

// Trigger a scan
const scan = await fetch(\`\${BASE}/scan\`, {
  method: "POST",
  headers,
  body: JSON.stringify({ url: "https://example.com", depth: "standard" }),
}).then(r => r.json());

// Generate fix artifacts
const { fixes, estimated_impact } = await fetch(
  \`\${BASE}/scan/\${scan.scan_id}/generate-fixes\`,
  { method: "POST", headers }
).then(r => r.json());
console.log(\`\${fixes.length} fixes generated — \${estimated_impact}\`);`}</Code>
            </div>
          </Section>

          {/* Error codes */}
          <Section id="errors">
            <h2 className="text-xl font-bold text-white">Error Codes</h2>
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-sm">
                <thead className="border-b border-white/8 bg-white/3">
                  <tr>
                    {["Status", "Code", "Meaning"].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 font-semibold px-4 py-3 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["401", "Unauthorized",  "Missing or invalid API token"],
                    ["402", "Payment",       "Insufficient tokens for this operation"],
                    ["400", "Bad Request",   "Missing required parameters"],
                    ["404", "Not Found",     "Scan or resource not found"],
                    ["429", "Rate Limited",  "Slow down — see Retry-After header"],
                    ["503", "Unavailable",   "Scan engine temporarily unavailable"],
                    ["500", "Server Error",  "Unexpected error — contact support"],
                  ].map(([status, code, meaning]) => (
                    <tr key={status} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5"><Badge color={status === "401" || status === "402" ? "amber" : "gray"}>{status}</Badge></td>
                      <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">{code}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <MarketingFooter />

        </main>
      </div>
    </div>
  );
}
