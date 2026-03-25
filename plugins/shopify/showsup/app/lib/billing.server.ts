/**
 * Billing helpers: plan checks, feature gating.
 */

import { authenticate, PLANS, BILLING_CONFIG } from "../shopify.server";
import { prisma } from "../db.server";

export const PLAN_LIMITS = {
  [PLANS.FREE]: {
    scansPerMonth: 1,
    regions:       false,
    autoFixes:     false,
    autoScan:      false,
    productScores: false,
  },
  [PLANS.PRO]: {
    scansPerMonth: Infinity,
    regions:       true,
    autoFixes:     true,
    autoScan:      true,
    productScores: true,
  },
};

export async function getStorePlan(shop: string): Promise<typeof PLANS[keyof typeof PLANS]> {
  const store = await prisma.store.findUnique({
    where:  { id: shop },
    select: { planName: true },
  });
  return (store?.planName as typeof PLANS[keyof typeof PLANS]) || PLANS.FREE;
}

export async function getScansThisMonth(shop: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  return prisma.scan.count({
    where: {
      shop,
      status:    "complete",
      createdAt: { gte: start },
    },
  });
}

export async function canScan(shop: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan  = await getStorePlan(shop);
  const limit = PLAN_LIMITS[plan].scansPerMonth;
  if (limit === Infinity) return { allowed: true };

  const used = await getScansThisMonth(shop);
  if (used >= limit) {
    return {
      allowed: false,
      reason:  `Free plan includes ${limit} scan/month. Upgrade to Pro for unlimited scans.`,
    };
  }
  return { allowed: true };
}

export async function requireBilling(request: Request, shop: string) {
  const { billing } = await authenticate.admin(request);

  try {
    const { hasActivePayment, appSubscriptions } = await billing.check({
      plans:               [PLANS.PRO],
      isTest:              process.env.NODE_ENV !== "production",
    });

    if (hasActivePayment) {
      await prisma.store.update({
        where: { id: shop },
        data:  {
          planName:  PLANS.PRO,
          billingId: appSubscriptions[0]?.id,
        },
      });
    }

    return hasActivePayment;
  } catch {
    return false;
  }
}

export async function requestUpgrade(request: Request) {
  const { billing } = await authenticate.admin(request);
  const url = await billing.request({
    plan:    PLANS.PRO,
    isTest:  process.env.NODE_ENV !== "production",
    return_url: `${process.env.SHOPIFY_APP_URL}/app/settings`,
  });
  return url;
}
