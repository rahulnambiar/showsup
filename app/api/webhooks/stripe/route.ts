import { NextResponse } from "next/server";
import { stripe, STRIPE_PACKAGES } from "@/lib/stripe";
import { addTokens } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body      = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId    = session.metadata?.user_id;
    const packageId = session.metadata?.package_id;
    const tokens    = Number(session.metadata?.tokens);

    if (!userId || !packageId || !tokens) {
      console.error("[stripe-webhook] missing metadata:", session.metadata);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const pkg = STRIPE_PACKAGES.find((p) => p.id === packageId);
    const label = pkg?.label ?? packageId;

    try {
      await addTokens(
        userId,
        tokens,
        "purchase",
        `${label} pack — ${tokens.toLocaleString()} tokens ($${pkg?.priceUsd ?? "?"} USD) — session ${session.id}`
      );
      console.log(`[stripe-webhook] credited ${tokens} tokens to user ${userId}`);
    } catch (err) {
      console.error("[stripe-webhook] failed to credit tokens:", err);
      return NextResponse.json({ error: "Token credit failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
