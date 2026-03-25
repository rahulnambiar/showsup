import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { prisma } from "./db.server";

export const PLANS = {
  FREE: "free",
  PRO: "pro",
} as const;

export const BILLING_CONFIG = {
  [PLANS.PRO]: {
    amount:        19,
    currencyCode:  "USD" as const,
    interval:      BillingInterval.Every30Days,
    trialDays:     7,
  },
} satisfies Parameters<typeof shopifyApp>[0]["billing"];

const shopify = shopifyApp({
  apiKey:         process.env.SHOPIFY_API_KEY!,
  apiSecretKey:   process.env.SHOPIFY_API_SECRET!,
  apiVersion:     ApiVersion.January25,
  scopes:         process.env.SCOPES?.split(","),
  appUrl:         process.env.SHOPIFY_APP_URL!,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution:   AppDistribution.AppStore,
  billing:        BILLING_CONFIG,
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
      // Upsert store record on install
      await prisma.store.upsert({
        where:  { id: session.shop },
        update: {},
        create: { id: session.shop },
      });
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion    = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate              = shopify.authenticate;
export const unauthenticated           = shopify.unauthenticated;
export const login                     = shopify.login;
export const registerWebhooks          = shopify.registerWebhooks;
export const sessionStorage            = shopify.sessionStorage;
