import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});

export const STRIPE_PACKAGES = [
  {
    id:        "starter",
    label:     "Starter",
    tokens:    2500,
    priceUsd:  9,
    priceId:   process.env.STRIPE_PRICE_STARTER!,
    popular:   false,
    savings:   null,
  },
  {
    id:        "growth",
    label:     "Growth",
    tokens:    10000,
    priceUsd:  29,
    priceId:   process.env.STRIPE_PRICE_GROWTH!,
    popular:   true,
    savings:   "Save 26%",
  },
  {
    id:        "pro",
    label:     "Pro",
    tokens:    35000,
    priceUsd:  79,
    priceId:   process.env.STRIPE_PRICE_PRO!,
    popular:   false,
    savings:   "Save 40%",
  },
  {
    id:        "agency",
    label:     "Agency",
    tokens:    100000,
    priceUsd:  199,
    priceId:   process.env.STRIPE_PRICE_AGENCY!,
    popular:   false,
    savings:   "Best value — Save 49%",
  },
] as const;

export type PackageId = (typeof STRIPE_PACKAGES)[number]["id"];
