/**
 * Self-host vs Cloud mode detection.
 *
 * Priority order:
 * 1. NEXT_PUBLIC_MODE env var (explicit override)
 * 2. Auto-detect: STRIPE_SECRET_KEY present → cloud (server-side only)
 * 3. Default: selfhost
 *
 * This module is safe to import from both server components/routes
 * and client components (NEXT_PUBLIC_MODE is available on both).
 */
export function getMode(): "cloud" | "selfhost" {
  if (process.env.NEXT_PUBLIC_MODE === "cloud") return "cloud";
  if (process.env.NEXT_PUBLIC_MODE === "selfhost") return "selfhost";
  // Server-side auto-detect: Stripe key present → cloud setup
  // On the client, STRIPE_SECRET_KEY is always undefined → defaults to selfhost
  if (process.env.STRIPE_SECRET_KEY) return "cloud";
  return "selfhost";
}

export const isSelfHost = getMode() === "selfhost";
export const isCloud = !isSelfHost;
