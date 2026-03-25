/**
 * App Proxy handler — serves /a/showsup/* from within the Shopify storefront.
 *
 * Routes:
 *   GET /a/showsup/llms.txt   → serve llms.txt content
 *   GET /a/showsup/schema.js  → serve schema JS snippet (legacy fallback)
 *
 * Shopify verifies the proxy signature automatically via @shopify/shopify-app-remix.
 */

import { type LoaderFunctionArgs } from "@remix-run/node";
import { unauthenticated } from "../shopify.server";
import { prisma } from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { storefront } = await unauthenticated.storefront(
    // Extract shop from query param Shopify adds to proxy requests
    new URL(request.url).searchParams.get("shop") || ""
  );

  const url      = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith("/llms.txt")) {
    const shop  = url.searchParams.get("shop") || "";
    const store = await prisma.store.findUnique({
      where:  { id: shop },
      select: { llmstxtContent: true, name: true },
    });

    const content = store?.llmstxtContent || `# ${store?.name || shop}\n\n> AI visibility file not yet generated. Run a ShowsUp scan to deploy.\n`;

    return new Response(content, {
      headers: {
        "Content-Type":  "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return new Response("Not found", { status: 404 });
}
