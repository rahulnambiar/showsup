import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import {
  Page, Layout, Card, Text, Badge, Button, ButtonGroup,
  BlockStack, InlineStack, ProgressBar, Banner,
  DataTable, EmptyState, Spinner, Divider, Box, Icon,
  Tooltip,
} from "@shopify/polaris";
import { TrendingUpIcon, AlertTriangleIcon, CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { canScan, getStorePlan, PLAN_LIMITS } from "../lib/billing.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [store, latestScan, productScores, scansThisMonth] = await Promise.all([
    prisma.store.findUnique({ where: { id: shop } }),
    prisma.scan.findFirst({
      where:   { shop, status: "complete" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productScore.findMany({
      where:   { shop },
      orderBy: { score: "desc" },
      take:    10,
    }),
    prisma.scan.count({
      where: {
        shop, status: "complete",
        createdAt: { gte: new Date(new Date().setDate(1)) },
      },
    }),
  ]);

  const plan    = store?.planName || "free";
  const canScanResult = await canScan(shop);
  const results = latestScan?.rawResults ? JSON.parse(latestScan.rawResults) : null;

  return json({
    shop,
    store,
    plan,
    canScan:     canScanResult.allowed,
    cantScanReason: canScanResult.reason,
    scansThisMonth,
    latestScan,
    results,
    productScores,
    llmstxtDeployed: store?.llmstxtDeployed || false,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent   = formData.get("intent");

  if (intent === "quick_scan") {
    const check = await canScan(session.shop);
    if (!check.allowed) return json({ error: check.reason }, 403);

    // Mark scan as pending and redirect to scan page
    const scan = await prisma.scan.create({
      data: { shop: session.shop, status: "pending" },
    });
    return json({ scanId: scan.id });
  }

  return json({ error: "Unknown intent" }, 400);
}

// ── Components ─────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "success" : score >= 40 ? "caution" : "critical";
  return (
    <BlockStack gap="200">
      <InlineStack gap="200" align="center">
        <Text variant="heading3xl" as="p" tone={color}>
          {score}
        </Text>
        <Text variant="headingXl" as="p" tone="subdued">/100</Text>
      </InlineStack>
      <ProgressBar progress={score} size="small" tone={color} />
    </BlockStack>
  );
}

function PlatformRow({ name, score }: { name: string; score: number }) {
  const tone = score >= 70 ? "success" : score >= 40 ? "caution" : "critical";
  return (
    <InlineStack align="space-between" blockAlign="center">
      <Text variant="bodyMd" as="span">{name}</Text>
      <InlineStack gap="200" blockAlign="center">
        <Box width="120px">
          <ProgressBar progress={score} size="small" tone={tone} />
        </Box>
        <Text variant="bodyMd" as="span" tone={tone} fontWeight="semibold">
          {score}/100
        </Text>
      </InlineStack>
    </InlineStack>
  );
}

export default function Dashboard() {
  const {
    shop, store, plan, canScan: canScanNow, cantScanReason,
    scansThisMonth, latestScan, results, productScores, llmstxtDeployed,
  } = useLoaderData<typeof loader>();

  const navigate = useNavigate();
  const fetcher  = useFetcher<typeof action>();
  const scanning = fetcher.state !== "idle";

  const platforms = results
    ? [
        { name: "ChatGPT",    score: results.chatgpt_score    || results.chatgptScore    || 0 },
        { name: "Claude",     score: results.claude_score     || results.claudeScore     || 0 },
        { name: "Gemini",     score: results.gemini_score     || results.geminiScore     || 0 },
        { name: "Perplexity", score: results.perplexity_score || results.perplexityScore || 0 },
      ].filter((p) => p.score > 0)
    : [];

  const shareOfVoice = results?.share_of_voice ?? results?.shareOfVoice ?? null;
  const queriesWon   = results?.queries_won    ?? latestScan?.queriesWon    ?? 0;
  const queryCount   = results?.query_count    ?? latestScan?.queryCount    ?? 0;
  const winRate      = queryCount > 0 ? Math.round((queriesWon / queryCount) * 100) : 0;

  const productRows = productScores.map((ps) => [
    ps.productTitle,
    ps.score !== null ? `${ps.score}/100` : "—",
    ps.queriesWon !== null ? `${ps.queriesWon}/${(ps.queriesWon ?? 0) + (ps.queriesMissed ?? 0)}` : "—",
    ps.topQuery || "—",
  ]);

  return (
    <Page
      title="AI Visibility Dashboard"
      subtitle={store?.name || shop}
      primaryAction={{
        content:  canScanNow ? "Scan Now" : "Upgrade to Scan",
        loading:  scanning,
        disabled: scanning,
        onAction: canScanNow
          ? () => navigate("/app/scan")
          : () => navigate("/app/settings?upgrade=1"),
      }}
      secondaryActions={[
        {
          content:  "Generate Fixes",
          disabled: !latestScan,
          onAction: () => navigate("/app/fixes"),
        },
      ]}
    >
      <Layout>

        {/* Upgrade banner for free plan */}
        {plan === "free" && (
          <Layout.Section>
            <Banner
              title="Free plan: 1 scan/month"
              tone="info"
              action={{ content: "Upgrade to Pro — $19/mo", onAction: () => navigate("/app/settings?upgrade=1") }}
            >
              <p>Pro unlocks unlimited scans, all fixes, per-product scores, regional analysis, and auto-deploy.</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Scan limit warning */}
        {!canScanNow && cantScanReason && (
          <Layout.Section>
            <Banner title="Scan limit reached" tone="warning">
              <p>{cantScanReason}</p>
            </Banner>
          </Layout.Section>
        )}

        {!results ? (
          <Layout.Section>
            <EmptyState
              heading="Run your first AI visibility scan"
              action={{ content: "Run Scan", onAction: () => navigate("/app/scan") }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                Discover how ChatGPT, Claude, Gemini, and Perplexity describe your store when
                customers ask purchase questions. Get your AI Visibility Score in minutes.
              </p>
            </EmptyState>
          </Layout.Section>
        ) : (
          <>
            {/* Score + Platform Breakdown */}
            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">AI Visibility Score</Text>
                  <ScoreGauge score={latestScan?.overallScore ?? 0} />
                  <Text variant="bodySm" as="p" tone="subdued">
                    Last scanned:{" "}
                    {latestScan?.completedAt
                      ? new Date(latestScan.completedAt).toLocaleDateString()
                      : "—"}
                  </Text>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Platform Breakdown</Text>
                  <BlockStack gap="300">
                    {platforms.map((p) => (
                      <PlatformRow key={p.name} name={p.name} score={p.score} />
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Commerce Metrics */}
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h2">Purchase Query Win Rate</Text>
                  <InlineStack gap="100" blockAlign="baseline">
                    <Text variant="heading2xl" as="p">{winRate}%</Text>
                  </InlineStack>
                  <Text variant="bodySm" as="p" tone="subdued">
                    AI recommends your products in {winRate}% of purchase queries
                  </Text>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h2">Share of Voice</Text>
                  <InlineStack gap="100" blockAlign="baseline">
                    <Text variant="heading2xl" as="p">
                      {shareOfVoice !== null ? `${Math.round(shareOfVoice)}%` : "—"}
                    </Text>
                  </InlineStack>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Mentions vs competitors in AI responses
                  </Text>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h2">llms.txt</Text>
                  <Badge tone={llmstxtDeployed ? "success" : "attention"}>
                    {llmstxtDeployed ? "Deployed" : "Not deployed"}
                  </Badge>
                  <Text variant="bodySm" as="p" tone="subdued">
                    {llmstxtDeployed
                      ? "AI crawlers can read your store structure."
                      : "Deploy to help AI crawlers understand your store."}
                  </Text>
                  {!llmstxtDeployed && (
                    <Button variant="plain" onClick={() => navigate("/app/fixes")}>
                      Deploy now →
                    </Button>
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Competitor Comparison */}
            {results.competitors && Array.isArray(results.competitors) && results.competitors.length > 0 && (
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">Competitor Comparison</Text>
                    <DataTable
                      columnContentTypes={["text", "numeric", "numeric", "text"]}
                      headings={["Store", "AI Score", "Share of Voice", "Top Strength"]}
                      rows={[
                        [
                          `${store?.name || shop} (You)`,
                          latestScan?.overallScore ?? 0,
                          shareOfVoice !== null ? `${Math.round(shareOfVoice)}%` : "—",
                          results.top_strength || "—",
                        ],
                        ...results.competitors.map((c: any) => [
                          c.name || c.domain || "—",
                          c.score ?? c.ai_score ?? "—",
                          c.share_of_voice ? `${Math.round(c.share_of_voice)}%` : "—",
                          c.top_strength || "—",
                        ]),
                      ]}
                    />
                  </BlockStack>
                </Card>
              </Layout.Section>
            )}

            {/* Per-Product Visibility */}
            {productScores.length > 0 && (
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text variant="headingMd" as="h2">Product Visibility</Text>
                      {plan === "free" && (
                        <Badge tone="info">Pro feature</Badge>
                      )}
                    </InlineStack>
                    <DataTable
                      columnContentTypes={["text", "numeric", "text", "text"]}
                      headings={["Product", "AI Score", "Queries Won", "Top Query"]}
                      rows={productRows}
                    />
                  </BlockStack>
                </Card>
              </Layout.Section>
            )}

            {/* Top Recommendations Preview */}
            {results.recommendations?.length > 0 && (
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text variant="headingMd" as="h2">Top Improvements</Text>
                      <Button variant="plain" onClick={() => navigate("/app/fixes")}>
                        See all fixes →
                      </Button>
                    </InlineStack>
                    <BlockStack gap="300">
                      {results.recommendations.slice(0, 4).map((rec: any, i: number) => (
                        <InlineStack key={i} gap="300" blockAlign="start">
                          <Box>
                            <Badge
                              tone={
                                rec.impact === "high"   ? "critical" :
                                rec.impact === "medium" ? "caution" : "info"
                              }
                            >
                              {rec.impact || "low"}
                            </Badge>
                          </Box>
                          <BlockStack gap="100">
                            <Text variant="bodyMd" as="p" fontWeight="semibold">
                              {rec.title || rec.query || ""}
                            </Text>
                            {rec.description && (
                              <Text variant="bodySm" as="p" tone="subdued">
                                {rec.description}
                              </Text>
                            )}
                          </BlockStack>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Layout.Section>
            )}
          </>
        )}
      </Layout>
    </Page>
  );
}
