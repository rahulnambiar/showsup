import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import {
  Page, Layout, Card, Text, Badge, Button, BlockStack, InlineStack,
  TextField, Select, Checkbox, Banner, CalloutCard, Divider, Box,
} from "@shopify/polaris";
import { authenticate, BILLING_CONFIG, PLANS } from "../shopify.server";
import { prisma } from "../db.server";
import { requireBilling, requestUpgrade } from "../lib/billing.server";
import { useState, useCallback } from "react";

const CATEGORIES = [
  "E-commerce", "Fashion & Apparel", "Electronics", "Home & Garden",
  "Beauty & Health", "Sports & Outdoors", "Toys & Games", "Food & Beverage",
  "Jewelry & Accessories", "Books & Media", "Other",
];

const REGIONS = [
  { label: "Global",         value: "global" },
  { label: "United States",  value: "us" },
  { label: "United Kingdom", value: "uk" },
  { label: "Europe",         value: "eu" },
  { label: "Australia",      value: "au" },
  { label: "Canada",         value: "ca" },
  { label: "India",          value: "in" },
  { label: "Singapore",      value: "sg" },
];

const DEPTHS = [
  { label: "Quick (faster, ~30 queries)",   value: "quick" },
  { label: "Standard (recommended, 50)",    value: "standard" },
  { label: "Deep (slower, 80+ queries)",    value: "deep" },
];

const FREQUENCIES = [
  { label: "Off",     value: "off" },
  { label: "Weekly",  value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Check if returning from billing flow
  const url    = new URL(request.url);
  const charge = url.searchParams.get("charge_id");
  if (charge) {
    await requireBilling(request, shop);
    return redirect("/app/settings?upgraded=1");
  }

  const store = await prisma.store.findUnique({ where: { id: shop } });
  const plan  = store?.planName || "free";

  return json({
    shop,
    store,
    plan,
    proPrice: BILLING_CONFIG[PLANS.PRO].amount,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop     = session.shop;
  const formData = await request.formData();
  const intent   = String(formData.get("intent") || "");

  if (intent === "save_settings") {
    const apiToken           = String(formData.get("api_token")            || "").trim();
    const cloudUrl           = String(formData.get("cloud_url")            || "").trim();
    const category           = String(formData.get("category")             || "E-commerce");
    const scanDepth          = String(formData.get("scan_depth")           || "standard");
    const autoScanFreq       = String(formData.get("auto_scan_freq")       || "off");
    const emailNotifications = formData.get("email_notifications") === "on";
    const schemaEnabled      = formData.get("schema_enabled")    === "on";
    const regionsRaw         = formData.getAll("regions");
    const regions            = regionsRaw.length > 0 ? regionsRaw as string[] : ["global"];

    // Social links
    const twitterUrl   = String(formData.get("twitter_url")   || "").trim();
    const linkedinUrl  = String(formData.get("linkedin_url")  || "").trim();
    const facebookUrl  = String(formData.get("facebook_url")  || "").trim();
    const instagramUrl = String(formData.get("instagram_url") || "").trim();

    await prisma.store.upsert({
      where: { id: shop },
      update: {
        apiToken, cloudUrl: cloudUrl || null, category, scanDepth,
        regions:            JSON.stringify(regions),
        autoScanEnabled:    autoScanFreq !== "off",
        emailNotifications, schemaEnabled,
      },
      create: {
        id: shop, apiToken, cloudUrl: cloudUrl || null, category, scanDepth,
        regions: JSON.stringify(regions),
        autoScanEnabled: autoScanFreq !== "off",
        emailNotifications, schemaEnabled,
      },
    });

    return json({ ok: true, message: "Settings saved." });
  }

  if (intent === "upgrade") {
    const upgradeUrl = await requestUpgrade(request);
    return redirect(upgradeUrl);
  }

  return json({ error: "Unknown intent" }, 400);
}

export default function SettingsPage() {
  const { shop, store, plan, proPrice } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<typeof action>();

  const isUpgraded = searchParams.get("upgraded") === "1";
  const wantsUpgrade = searchParams.get("upgrade") === "1";

  const [apiToken,    setApiToken]    = useState(store?.apiToken    || "");
  const [cloudUrl,    setCloudUrl]    = useState(store?.cloudUrl    || "");
  const [category,    setCategory]    = useState(store?.category    || "E-commerce");
  const [scanDepth,   setScanDepth]   = useState(store?.scanDepth   || "standard");
  const [autoFreq,    setAutoFreq]    = useState("off");
  const [emailNotifs, setEmailNotifs] = useState(store?.emailNotifications ?? true);
  const [schemaOn,    setSchemaOn]    = useState(store?.schemaEnabled      ?? true);
  const [regions,     setRegions]     = useState<string[]>(
    JSON.parse(store?.regions || '["global"]')
  );

  const [twitterUrl,   setTwitterUrl]   = useState("");
  const [linkedinUrl,  setLinkedinUrl]  = useState("");
  const [facebookUrl,  setFacebookUrl]  = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const saving = fetcher.state === "submitting" &&
    fetcher.formData?.get("intent") === "save_settings";

  const upgrading = fetcher.state === "submitting" &&
    fetcher.formData?.get("intent") === "upgrade";

  const saved = fetcher.data && "ok" in fetcher.data && fetcher.data.ok;

  function toggleRegion(value: string) {
    setRegions((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  }

  return (
    <Page
      backAction={{ content: "Dashboard", url: "/app" }}
      title="Settings"
    >
      <Layout>

        {isUpgraded && (
          <Layout.Section>
            <Banner title="Welcome to Pro!" tone="success">
              <p>Your store is now on the Pro plan. Unlimited scans, all fixes, and multi-region analysis are unlocked.</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Billing */}
        <Layout.Section>
          {plan === "pro" ? (
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" as="h2">Plan</Text>
                  <Badge tone="success">Pro</Badge>
                </InlineStack>
                <Text as="p">$19/month — Unlimited scans · All fixes · Multi-region · Per-product scores · Auto-deploy</Text>
              </BlockStack>
            </Card>
          ) : (
            <CalloutCard
              title="Upgrade to ShowsUp Pro — $19/month"
              illustration="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              primaryAction={{
                content:  "Start 7-day free trial",
                loading:  upgrading,
                onAction: () => {
                  const fd = new FormData();
                  fd.append("intent", "upgrade");
                  fetcher.submit(fd, { method: "POST" });
                },
              }}
            >
              <List>
                <List.Item>Unlimited scans (Free: 1/month)</List.Item>
                <List.Item>Per-product AI visibility scores</List.Item>
                <List.Item>Multi-region analysis</List.Item>
                <List.Item>All AI fixes + auto-deploy</List.Item>
                <List.Item>Blog content briefs for gap queries</List.Item>
                <List.Item>7-day free trial, cancel anytime</List.Item>
              </List>
            </CalloutCard>
          )}
        </Layout.Section>

        {/* Main Settings Form */}
        <Layout.Section>
          <fetcher.Form method="POST">
            <input type="hidden" name="intent" value="save_settings" />

            <BlockStack gap="400">

              {/* API Connection */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">API Connection</Text>
                  <TextField
                    label="ShowsUp API Token"
                    name="api_token"
                    value={apiToken}
                    onChange={setApiToken}
                    type="password"
                    autoComplete="off"
                    helpText={
                      <>
                        Get your token at{" "}
                        <a href="https://showsup.co" target="_blank" rel="noopener noreferrer">
                          showsup.co
                        </a>
                      </>
                    }
                  />
                  <TextField
                    label="Cloud URL (optional)"
                    name="cloud_url"
                    value={cloudUrl}
                    onChange={setCloudUrl}
                    placeholder="https://showsup.co"
                    helpText="Leave blank unless you self-host ShowsUp."
                    autoComplete="off"
                  />
                </BlockStack>
              </Card>

              {/* Brand & Scanning */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Brand & Scanning</Text>
                  <Select
                    label="Store Category"
                    name="category"
                    options={CATEGORIES.map((c) => ({ label: c, value: c }))}
                    value={category}
                    onChange={setCategory}
                  />
                  <Select
                    label="Scan Depth"
                    name="scan_depth"
                    options={DEPTHS}
                    value={scanDepth}
                    onChange={setScanDepth}
                  />

                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="medium">Regions</Text>
                    <InlineStack gap="300" wrap>
                      {REGIONS.map((r) => (
                        <Box key={r.value}>
                          <input
                            type="checkbox"
                            name="regions"
                            value={r.value}
                            id={`region-${r.value}`}
                            checked={regions.includes(r.value)}
                            onChange={() => toggleRegion(r.value)}
                            disabled={plan === "free" && r.value !== "global"}
                          />
                          <label htmlFor={`region-${r.value}`} style={{ marginLeft: 6, fontSize: 14 }}>
                            {r.label}
                            {plan === "free" && r.value !== "global" && " (Pro)"}
                          </label>
                        </Box>
                      ))}
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Automation */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Automation</Text>
                  <Select
                    label="Auto-Scan Frequency"
                    name="auto_scan_freq"
                    options={FREQUENCIES}
                    value={autoFreq}
                    onChange={setAutoFreq}
                    disabled={plan === "free"}
                    helpText={plan === "free" ? "Auto-scan requires Pro plan." : undefined}
                  />
                  <Checkbox
                    label="Email scan results to store owner"
                    name="email_notifications"
                    checked={emailNotifs}
                    onChange={setEmailNotifs}
                  />
                  <Checkbox
                    label="Enable schema markup injection"
                    name="schema_enabled"
                    checked={schemaOn}
                    onChange={setSchemaOn}
                    helpText="Injects Organization, Product, and FAQ JSON-LD via theme extension."
                  />
                </BlockStack>
              </Card>

              {/* Social Links */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Social Profiles</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Used in Organization schema sameAs for AI model context.
                  </Text>
                  {[
                    { label: "Twitter / X", name: "twitter_url",   value: twitterUrl,   set: setTwitterUrl },
                    { label: "LinkedIn",    name: "linkedin_url",  value: linkedinUrl,  set: setLinkedinUrl },
                    { label: "Facebook",    name: "facebook_url",  value: facebookUrl,  set: setFacebookUrl },
                    { label: "Instagram",   name: "instagram_url", value: instagramUrl, set: setInstagramUrl },
                  ].map(({ label, name, value, set }) => (
                    <TextField
                      key={name}
                      label={label}
                      name={name}
                      value={value}
                      onChange={set}
                      type="url"
                      placeholder="https://"
                      autoComplete="off"
                    />
                  ))}
                </BlockStack>
              </Card>

              {/* Save */}
              <InlineStack align="end" gap="300">
                {saved && <Text as="p" tone="success">Settings saved!</Text>}
                {fetcher.data && "error" in fetcher.data && (
                  <Text as="p" tone="critical">{fetcher.data.error}</Text>
                )}
                <Button variant="primary" loading={saving} submit>
                  Save Settings
                </Button>
              </InlineStack>

            </BlockStack>
          </fetcher.Form>
        </Layout.Section>

      </Layout>
    </Page>
  );
}
