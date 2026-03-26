import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPE_PACKAGES } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { package_id } = await request.json() as { package_id: string };

  const pkg = STRIPE_PACKAGES.find((p) => p.id === package_id);
  if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

  if (!pkg.priceId) {
    return NextResponse.json({ error: `Stripe price not configured for ${pkg.label}` }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://showsup.co";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: pkg.priceId, quantity: 1 }],
    success_url: `${baseUrl}/app/tokens?success=1&package=${pkg.id}`,
    cancel_url:  `${baseUrl}/app/tokens?cancelled=1`,
    customer_email: user.email,
    metadata: {
      user_id:   user.id,
      package_id: pkg.id,
      tokens:    String(pkg.tokens),
    },
    payment_intent_data: {
      metadata: {
        user_id:   user.id,
        package_id: pkg.id,
        tokens:    String(pkg.tokens),
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
