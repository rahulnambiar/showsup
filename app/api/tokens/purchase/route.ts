import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addTokens } from "@/lib/tokens";

const PACKAGES = {
  starter:  { tokens: 2500,  price_sgd: 19,  label: "Starter"  },
  explorer: { tokens: 5000,  price_sgd: 39,  label: "Explorer" },
  growth:   { tokens: 12000, price_sgd: 79,  label: "Growth"   },
  pro:      { tokens: 30000, price_sgd: 149, label: "Pro"       },
} as const;

type PackageId = keyof typeof PACKAGES;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const packageId = body.package_id as PackageId;

  if (!packageId || !(packageId in PACKAGES)) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  const pkg = PACKAGES[packageId];

  // TODO: Wire to Stripe Checkout here — currently adds tokens immediately for testing
  const result = await addTokens(
    user.id,
    pkg.tokens,
    "purchase",
    `${pkg.label} package — ${pkg.tokens.toLocaleString()} tokens (S$${pkg.price_sgd})`
  );

  return NextResponse.json({ success: true, balance: result.balance, tokens_added: pkg.tokens });
}
