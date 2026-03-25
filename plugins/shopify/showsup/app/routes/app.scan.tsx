import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import {
  Page, Layout, Card, Text, Badge, Button, BlockStack, InlineStack,
  ProgressBar, Banner, Spinner, Box, Divider, List,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { canScan, getStorePlan } from "../lib/billing.server";
import { fetchShopData, buildScanQueries } from "../lib/shopify-data.server";
import { createApiClient } from "../lib/showsup-api.server";
import { buildLlmsTxt } from "../lib/llmstxt.server";
import { useEffect, useRef } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [store, scans] = await Promise.all([
    prisma.store.findUnique({ where: { id: shop } }),
    prisma.scan.findMany({
      where:   { shop },
      orderBy: { createdAt: "desc" },
      take:    10,
      select: {
        id: true, status: true, overallScore: true,
        chatgptScore: true, claudeScore: true, geminiScore: true, perplexityScore: true,
        queriesWon: true, queryCount: true, createdAt: true, completedAt: true,
        errorMessage: true,
      },
    }),
  ]);

  const plan            = store?.planName || "free";
  const canScanResult   = await canScan(shop);
  const activeApiToken  = store?.apiToken || process.env.SHOWSUP_API_TOKEN || "";

  return json({
    shop,
    store,
    plan,
    canScan:        canScanResult.allowed,
    cantScanReason: canScanResult.reason,
    scans,
    apiConfigured:  Boolean(activeApiToken),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop    = session.shop;
  const formData = await request.formData();
  const intent  = String(formData.get("intent") || "");

  if (intent === "start_scan") {
    const check = await canScan(shop);
    if (!check.allowed) return json({ error: check.reason }, 403);

    const store = await prisma.store.findUnique({ where: { id: shop } });
    const token = store?.apiToken || process.env.SHOWSUP_API_TOKEN || "";
    if (!token) return json({ error: "No API token configured. Add one in Settings." }, 400);

    // Create pending scan record
    const scan = await prisma.scan.create({
      data: { shop, status: "scanning" },
    });

    // Fetch store data for targeted queries
    let shopData;
    try {
      shopData = await fetchShopData(admin);
    } catch {
      await prisma.scan.update({ where: { id: scan.id }, data: { status: "error", errorMessage: "Failed to fetch store data." } });
      return json({ error: "Failed to fetch store data." }, 500);
    }

    // Update store info
    await prisma.store.update({
      where: { id: shop },
      data: {
        name:          shopData.shop.name,
        email:         shopData.shop.email,
        domain:        shopData.shop.domain,
        currency:      shopData.shop.currency,
      },
    });

    const queries = buildScanQueries(shopData);
    const client  = createApiClient(token, store?.cloudUrl || undefined);
    const regions = JSON.parse(store?.regions || '["global"]');

    const result = await client.scan({
      brand:    store?.category === "E-commerce" ? shopData.shop.name : (store?.category || shopData.shop.name),
      url:      shopData.shop.domain,
      category: store?.category || "E-commerce",
      regions,
      depth:    store?.scanDepth || "standard",
      queries,
    });

    if (!result.ok) {
      await prisma.scan.update({
        where: { id: scan.id },
        data: { status: "error", errorMessage: result.error },
      });
      return json({ error: result.error, scanId: scan.id }, 400);
    }

    const d = result.data as any;

    // Save scan results
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status:           "complete",
        overallScore:     d.overall_score,
        chatgptScore:     d.chatgpt_score,
        claudeScore:      d.claude_score,
        geminiScore:      d.gemini_score,
        perplexityScore:  d.perplexity_score,
        shareOfVoice:     d.share_of_voice,
        queryCount:       d.query_count,
        queriesWon:       d.queries_won,
        queriesMissed:    d.queries_missed,
        rawResults:       JSON.stringify(d),
        completedAt:      new Date(),
      },
    });

    // Update product-level scores if returned
    if (d.product_scores && Array.isArray(d.product_scores)) {
      for (const ps of d.product_scores) {
        if (!ps.product_id) continue;
        await prisma.productScore.upsert({
          where:  { shop_productId: { shop, productId: ps.product_id } },
          update: {
            score:        ps.score,
            queriesWon:   ps.queries_won,
            queriesMissed: ps.queries_missed,
            topQuery:     ps.top_query,
          },
          create: {
            shop,
            productId:    ps.product_id,
            productTitle: ps.product_title || "",
            productType:  ps.product_type || "",
            handle:       ps.handle || "",
            score:        ps.score,
            queriesWon:   ps.queries_won,
            queriesMissed: ps.queries_missed,
            topQuery:     ps.top_query,
          },
        });
      }
    }

    // Auto-generate llms.txt after successful scan
    const llmstxtContent = buildLlmsTxt(shopData, d);
    await prisma.store.update({
      where: { id: shop },
      data: {
        llmstxtContent,
        llmstxtDeployed:   true,
        llmstxtDeployedAt: new Date(),
      },
    });

    return json({ ok: true, scanId: scan.id, score: d.overall_score });
  }

  if (intent === "poll_scan") {
    const scanId = String(formData.get("scan_id") || "");
    const scan   = await prisma.scan.findUnique({ where: { id: scanId } });
    if (!scan || scan.shop !== shop) return json({ error: "Not found" }, 404);
    return json({ status: scan.status, score: scan.overallScore, error: scan.errorMessage });
  }

  return json({ error: "Unknown intent" }, 400);
}

// ── Score badge ────────────────────────────────────────────────────────────────
function scoreTone(s: number | null) {
  if (s === null) return "info";
  return s >= 70 ? "success" : s >= 40 ? "caution" : "critical";
}

export default function ScanPage() {
  const {
    shop, store, plan, canScan: canScanNow, cantScanReason,
    scans, apiConfigured,
  } = useLoaderData<typeof loader>();

  const navigate  = useNavigate();
  const fetcher   = useFetcher<typeof action>();
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const isScanning = fetcher.data && "scanId" in fetcher.data && fetcher.state === "idle" &&
    !("score" in fetcher.data);

  const scanInFlight = fetcher.state === "submitting" &&
    fetcher.formData?.get("intent") === "start_scan";

  const latestScan = scans[0];

  // Poll while scan is running
  useEffect(() => {
    const running = scans.find((s) => s.status === "scanning");
    if (!running) return;

    pollRef.current = setInterval(() => {
      const fd = new FormData();
      fd.append("intent", "poll_scan");
      fd.append("scan_id", running.id);
      fetcher.submit(fd, { method: "POST" });
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [scans]);

  // Redirect to dashboard when scan completes
  useEffect(() => {
    if (fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      if (pollRef.current) clearInterval(pollRef.current);
      setTimeout(() => navigate("/app"), 1500);
    }
  }, [fetcher.data]);

  const scanningRow = scans.find((s) => s.status === "scanning");

  return (
    <Page
      backAction={{ content: "Dashboard", url: "/app" }}
      title="Run AI Visibility Scan"
      subtitle="Test how ChatGPT, Claude, Gemini & Perplexity describe your store"
    >
      <Layout>

        {!apiConfigured && (
          <Layout.Section>
            <Banner
              title="API token required"
              tone="warning"
              action={{ content: "Go to Settings", onAction: () => navigate("/app/settings") }}
            >
              <p>Add your ShowsUp API token in Settings to start scanning.</p>
            </Banner>
          </Layout.Section>
        )}

        {!canScanNow && cantScanReason && (
          <Layout.Section>
            <Banner
              title="Scan limit reached"
              tone="warning"
              action={{ content: "Upgrade to Pro", onAction: () => navigate("/app/settings?upgrade=1") }}
            >
              <p>{cantScanReason}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Scan Card */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd" as="h2">What We'll Test</Text>
              <List type="bullet">
                <List.Item>Purchase queries: "best [category] to buy online"</List.Item>
                <List.Item>Store trust: "[store] reviews — is it legit?"</List.Item>
                <List.Item>Shipping coverage: "does [store] ship to [region]?"</List.Item>
                <List.Item>Product comparisons and alternatives</List.Item>
                <List.Item>Category leadership queries</List.Item>
              </List>
              <Divider />
              {scanningRow ? (
                <InlineStack gap="300" blockAlign="center">
                  <Spinner size="small" />
                  <Text as="p">Scan in progress — this takes 2–5 minutes…</Text>
                </InlineStack>
              ) : (
                <fetcher.Form method="POST">
                  <input type="hidden" name="intent" value="start_scan" />
                  <Button
                    variant="primary"
                    size="large"
                    loading={scanInFlight}
                    disabled={!canScanNow || !apiConfigured || scanInFlight}
                    submit
                  >
                    {scanInFlight ? "Starting scan…" : "Start Scan"}
                  </Button>
                </fetcher.Form>
              )}
              {fetcher.data && "error" in fetcher.data && (
                <Banner tone="critical">
                  <p>{fetcher.data.error}</p>
                </Banner>
              )}
              {fetcher.data && "ok" in fetcher.data && fetcher.data.ok && (
                <Banner tone="success">
                  <p>Scan complete! Score: {fetcher.data.score}/100 — redirecting…</p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Plan info */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Scan Coverage</Text>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p">AI platforms</Text>
                  <Text as="p" fontWeight="semibold">ChatGPT, Claude, Gemini, Perplexity</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p">Store queries</Text>
                  <Text as="p" fontWeight="semibold">Up to 50 targeted queries</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p">Regions</Text>
                  <Text as="p" fontWeight="semibold">
                    {plan === "pro"
                      ? JSON.parse(store?.regions || '["global"]').join(", ")
                      : "Global (Pro: multi-region)"}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p">Per-product scores</Text>
                  <Badge tone={plan === "pro" ? "success" : "info"}>
                    {plan === "pro" ? "Included" : "Pro only"}
                  </Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p">Auto llms.txt update</Text>
                  <Badge tone="success">Always included</Badge>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Scan History */}
        {scans.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Scan History</Text>
                {scans.map((scan) => (
                  <Box key={scan.id} paddingBlockEnd="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Badge
                            tone={
                              scan.status === "complete" ? "success" :
                              scan.status === "scanning" ? "info" :
                              scan.status === "error"    ? "critical" : "attention"
                            }
                          >
                            {scan.status}
                          </Badge>
                          {scan.overallScore !== null && (
                            <Text variant="bodyMd" as="span" fontWeight="semibold" tone={scoreTone(scan.overallScore) as any}>
                              {scan.overallScore}/100
                            </Text>
                          )}
                        </InlineStack>
                        <Text variant="bodySm" as="p" tone="subdued">
                          {new Date(scan.createdAt).toLocaleString()}
                        </Text>
                        {scan.errorMessage && (
                          <Text variant="bodySm" as="p" tone="critical">{scan.errorMessage}</Text>
                        )}
                      </BlockStack>
                      {scan.status === "complete" && scan.overallScore !== null && (
                        <InlineStack gap="400">
                          <BlockStack gap="0" inlineAlign="end">
                            <Text variant="bodySm" as="p" tone="subdued">Queries won</Text>
                            <Text as="p">{scan.queriesWon}/{scan.queryCount}</Text>
                          </BlockStack>
                        </InlineStack>
                      )}
                    </InlineStack>
                    <Divider />
                  </Box>
                ))}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

      </Layout>
    </Page>
  );
}
