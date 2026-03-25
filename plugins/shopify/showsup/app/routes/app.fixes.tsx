import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import {
  Page, Layout, Card, Text, Badge, Button, BlockStack, InlineStack,
  Banner, EmptyState, Box, Divider, Collapsible, List,
  CalloutCard,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { fetchShopData } from "../lib/shopify-data.server";
import { buildLlmsTxt } from "../lib/llmstxt.server";
import { createApiClient } from "../lib/showsup-api.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [store, latestScan] = await Promise.all([
    prisma.store.findUnique({ where: { id: shop } }),
    prisma.scan.findFirst({
      where:   { shop, status: "complete" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results     = latestScan?.rawResults ? JSON.parse(latestScan.rawResults) : null;
  const plan        = store?.planName || "free";
  const apiToken    = store?.apiToken || process.env.SHOWSUP_API_TOKEN || "";

  return json({
    shop,
    store,
    plan,
    latestScan,
    results,
    llmstxtContent:  store?.llmstxtContent || "",
    llmstxtDeployed: store?.llmstxtDeployed || false,
    llmstxtDeployedAt: store?.llmstxtDeployedAt,
    schemaEnabled:   store?.schemaEnabled ?? true,
    apiConfigured:   Boolean(apiToken),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop     = session.shop;
  const formData = await request.formData();
  const intent   = String(formData.get("intent") || "");

  if (intent === "regenerate_llmstxt") {
    const store = await prisma.store.findUnique({ where: { id: shop } });
    let shopData;
    try {
      shopData = await fetchShopData(admin);
    } catch {
      return json({ error: "Failed to fetch store data." }, 500);
    }

    const scan = await prisma.scan.findFirst({
      where: { shop, status: "complete" }, orderBy: { createdAt: "desc" },
    });
    const scanResult = scan?.rawResults ? JSON.parse(scan.rawResults) : undefined;
    const content    = buildLlmsTxt(shopData, scanResult);

    await prisma.store.update({
      where: { id: shop },
      data: { llmstxtContent: content, llmstxtDeployed: true, llmstxtDeployedAt: new Date() },
    });

    return json({ ok: true, intent: "regenerate_llmstxt", content });
  }

  if (intent === "toggle_schema") {
    const store   = await prisma.store.findUnique({ where: { id: shop } });
    const enabled = !(store?.schemaEnabled ?? true);
    await prisma.store.update({ where: { id: shop }, data: { schemaEnabled: enabled } });
    return json({ ok: true, schemaEnabled: enabled });
  }

  if (intent === "get_ai_fixes") {
    const store = await prisma.store.findUnique({ where: { id: shop } });
    const token = store?.apiToken || process.env.SHOWSUP_API_TOKEN || "";
    if (!token) return json({ error: "No API token configured." }, 400);

    const scan = await prisma.scan.findFirst({
      where: { shop, status: "complete" }, orderBy: { createdAt: "desc" },
    });
    if (!scan) return json({ error: "No scan results yet." }, 400);

    const client = createApiClient(token, store?.cloudUrl || undefined);
    const result = await client.generateFixes({
      brand:    store?.name || shop,
      url:      store?.domain || `https://${shop}`,
      category: store?.category || "E-commerce",
    });

    if (!result.ok) return json({ error: result.error }, 400);
    return json({ ok: true, fixes: result.data });
  }

  return json({ error: "Unknown intent" }, 400);
}

// ── Fix Card ───────────────────────────────────────────────────────────────────

function FixCard({
  title,
  description,
  badge,
  badgeTone,
  action,
  onAction,
  loading,
  success,
  children,
}: {
  title:       string;
  description: string;
  badge?:      string;
  badgeTone?:  "success" | "attention" | "info" | "warning";
  action?:     string;
  onAction?:   () => void;
  loading?:    boolean;
  success?:    boolean;
  children?:   React.ReactNode;
}) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="start">
          <BlockStack gap="100">
            <Text variant="headingMd" as="h3">{title}</Text>
            <Text variant="bodySm" as="p" tone="subdued">{description}</Text>
          </BlockStack>
          {badge && (
            <Badge tone={badgeTone}>{badge}</Badge>
          )}
        </InlineStack>
        {children}
        {action && onAction && (
          <Box>
            <Button
              variant={success ? "secondary" : "primary"}
              loading={loading}
              disabled={loading || success}
              onClick={onAction}
            >
              {success ? "Done ✓" : action}
            </Button>
          </Box>
        )}
      </BlockStack>
    </Card>
  );
}

// ── Collection Gap Warning ─────────────────────────────────────────────────────

function CollectionGapWarning({ results }: { results: any }) {
  const gaps = results?.collection_gaps as Array<{ title: string; issue: string }> | undefined;
  if (!gaps?.length) return null;
  return (
    <Banner tone="warning" title="Collection description gaps found">
      <List type="bullet">
        {gaps.slice(0, 5).map((g, i) => (
          <List.Item key={i}>
            <strong>"{g.title}"</strong> — {g.issue || "No description. AI can't cite what doesn't exist."}
          </List.Item>
        ))}
      </List>
    </Banner>
  );
}

export default function FixesPage() {
  const {
    shop, store, plan, latestScan, results,
    llmstxtContent, llmstxtDeployed, llmstxtDeployedAt,
    schemaEnabled, apiConfigured,
  } = useLoaderData<typeof loader>();

  const navigate = useNavigate();
  const fetcher  = useFetcher<typeof action>();

  const pendingIntent = fetcher.state !== "idle"
    ? fetcher.formData?.get("intent")
    : null;

  const lastData = fetcher.data as any;

  function submit(intent: string) {
    const fd = new FormData();
    fd.append("intent", intent);
    fetcher.submit(fd, { method: "POST" });
  }

  if (!latestScan) {
    return (
      <Page
        backAction={{ content: "Dashboard", url: "/app" }}
        title="AI Fixes"
      >
        <EmptyState
          heading="Run a scan first"
          action={{ content: "Go to Scan", onAction: () => navigate("/app/scan") }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Scan your store to generate personalised AI fixes and improvement recommendations.</p>
        </EmptyState>
      </Page>
    );
  }

  const llmstxtSuccess = lastData?.intent === "regenerate_llmstxt" && lastData?.ok;
  const schemaSuccess  = lastData?.ok && "schemaEnabled" in lastData;

  return (
    <Page
      backAction={{ content: "Dashboard", url: "/app" }}
      title="AI Fixes"
      subtitle="Auto-deploy improvements that make AI models recommend your store"
    >
      <Layout>

        {/* Collection gaps */}
        {results?.collection_gaps?.length > 0 && (
          <Layout.Section>
            <CollectionGapWarning results={results} />
          </Layout.Section>
        )}

        {/* Quick Wins */}
        <Layout.Section>
          <BlockStack gap="400">
            <Text variant="headingLg" as="h2">Quick Deploy</Text>

            {/* llms.txt */}
            <FixCard
              title="llms.txt"
              description="Auto-generated index file that tells AI crawlers exactly what products, collections, and policies your store has. Deployed via App Proxy at /a/showsup/llms.txt."
              badge={llmstxtDeployed ? "Active" : "Not deployed"}
              badgeTone={llmstxtDeployed ? "success" : "attention"}
              action={llmstxtDeployed ? "Regenerate" : "Deploy llms.txt"}
              onAction={() => submit("regenerate_llmstxt")}
              loading={pendingIntent === "regenerate_llmstxt"}
              success={llmstxtSuccess}
            >
              {llmstxtDeployedAt && (
                <Text variant="bodySm" as="p" tone="subdued">
                  Last deployed: {new Date(llmstxtDeployedAt).toLocaleString()}
                </Text>
              )}
              {(llmstxtContent || lastData?.content) && (
                <Collapsible id="llmstxt-preview" open={false}>
                  <Box
                    background="bg-surface-secondary"
                    padding="300"
                    borderRadius="200"
                  >
                    <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                      {(lastData?.content || llmstxtContent).slice(0, 800)}
                      {(lastData?.content || llmstxtContent).length > 800 ? "\n…" : ""}
                    </pre>
                  </Box>
                </Collapsible>
              )}
            </FixCard>

            {/* Schema Injection */}
            <FixCard
              title="Schema Markup"
              description="Injects Organization, Product, and FAQ JSON-LD schema into your store pages via the theme app extension. Helps AI models understand your brand, products, and policies."
              badge={schemaEnabled ? "Enabled" : "Disabled"}
              badgeTone={schemaEnabled ? "success" : "attention"}
              action={schemaEnabled ? "Disable Schema" : "Enable Schema"}
              onAction={() => submit("toggle_schema")}
              loading={pendingIntent === "toggle_schema"}
            >
              <List type="bullet">
                <List.Item>Organization schema — brand, contact, social links, shipping destinations</List.Item>
                <List.Item>Product schema — price, availability, reviews, images on every product page</List.Item>
                <List.Item>FAQ schema — generated from AI gap queries found in your scan</List.Item>
              </List>
            </FixCard>
          </BlockStack>
        </Layout.Section>

        {/* AI-Generated Fixes */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingLg" as="h2">AI-Generated Recommendations</Text>
                <Button
                  variant="secondary"
                  loading={pendingIntent === "get_ai_fixes"}
                  disabled={!apiConfigured || pendingIntent === "get_ai_fixes"}
                  onClick={() => submit("get_ai_fixes")}
                >
                  Refresh AI Fixes
                </Button>
              </InlineStack>

              {!apiConfigured && (
                <Banner tone="info">
                  <p>Add your ShowsUp API token in Settings to generate AI fixes.</p>
                </Banner>
              )}

              {lastData?.error && (
                <Banner tone="critical"><p>{lastData.error}</p></Banner>
              )}

              {results?.recommendations?.length > 0 && (
                <BlockStack gap="300">
                  {results.recommendations.map((rec: any, i: number) => (
                    <Box key={i} padding="300" background="bg-surface-secondary" borderRadius="200">
                      <InlineStack gap="300" blockAlign="start">
                        <Badge
                          tone={
                            rec.impact === "high"   ? "critical" :
                            rec.impact === "medium" ? "caution" : "info"
                          }
                        >
                          {rec.impact || "low"}
                        </Badge>
                        <BlockStack gap="100">
                          <Text variant="bodyMd" as="p" fontWeight="semibold">
                            {rec.title || rec.query || ""}
                          </Text>
                          {rec.description && (
                            <Text variant="bodySm" as="p" tone="subdued">
                              {rec.description}
                            </Text>
                          )}
                          {rec.fix && (
                            <Text variant="bodySm" as="p">
                              <strong>Fix:</strong> {rec.fix}
                            </Text>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </Box>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Content Briefs for gap queries */}
        {results?.queries_missed?.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">Blog Content Briefs</Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  These queries are asked by shoppers but AI doesn't cite your store. Creating content targeting
                  these queries increases your AI share of voice.
                </Text>
                <BlockStack gap="200">
                  {(results.queries_missed as string[]).slice(0, 8).map((q, i) => (
                    <InlineStack key={i} gap="200" blockAlign="center">
                      <Badge tone="critical">Miss</Badge>
                      <Text variant="bodyMd" as="p">{typeof q === "string" ? q : (q as any).query || ""}</Text>
                    </InlineStack>
                  ))}
                </BlockStack>
                {plan === "free" && (
                  <CalloutCard
                    title="Get AI-written blog briefs for each gap query"
                    illustration="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    primaryAction={{ content: "Upgrade to Pro", onAction: () => navigate("/app/settings?upgrade=1") }}
                  >
                    <p>Pro plan generates SEO-ready blog post briefs targeting every query you're missing.</p>
                  </CalloutCard>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

      </Layout>
    </Page>
  );
}
