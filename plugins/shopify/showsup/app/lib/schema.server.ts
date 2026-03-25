/**
 * Generates JSON-LD schema for Shopify stores.
 * Organization + FAQPage (from scan gap queries) injected sitewide.
 * Product schema injected on product pages via liquid block.
 */

import type { ShopData } from "./shopify-data.server";

export interface SchemaConfig {
  shop:         ShopData["shop"];
  scanResult?:  Record<string, unknown>;
  socialLinks?: Record<string, string>;
}

export function buildOrganizationSchema(config: SchemaConfig): object {
  const { shop, socialLinks = {}, scanResult } = config;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type":    "Organization",
    name:       shop.name,
    url:        shop.domain,
    description: shop.description || undefined,
  };

  // sameAs social links
  const sameAs = Object.values(socialLinks).filter(Boolean);
  if (sameAs.length) schema.sameAs = sameAs;

  // Shipping to
  if (shop.shipsTo.length > 0) {
    schema.areaServed = shop.shipsTo.map((c) => ({
      "@type": "Country",
      name:    c,
    }));
  }

  return schema;
}

export function buildFaqSchema(scanResult?: Record<string, unknown>): object | null {
  if (!scanResult) return null;
  const recs = (scanResult as any)?.recommendations as Array<{
    query?: string;
    title?: string;
    description?: string;
    fix?: string;
  }> | undefined;
  if (!recs?.length) return null;

  const entities = recs
    .slice(0, 8)
    .map((r) => {
      const q = r.query || r.title || "";
      const a = r.description || r.fix || "";
      if (!q || !a) return null;
      return {
        "@type":          "Question",
        name:             q,
        acceptedAnswer: { "@type": "Answer", text: a },
      };
    })
    .filter(Boolean);

  if (!entities.length) return null;

  return {
    "@context":   "https://schema.org",
    "@type":      "FAQPage",
    mainEntity:   entities,
  };
}

export function buildProductSchemaLiquid(): string {
  // This generates the Liquid template that runs on product pages.
  // The actual data is injected from Liquid variables.
  return `
{%- assign product = product -%}
{%- assign shop_url = shop.url -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": {{ product.title | json }},
  "description": {{ product.description | strip_html | truncate: 500 | json }},
  "url": "{{ shop_url }}{{ product.url }}",
  "sku": {{ product.selected_or_first_available_variant.sku | json }},
  "brand": {
    "@type": "Brand",
    "name": {{ product.vendor | json }}
  },
  {%- if product.featured_image -%}
  "image": {{ product.featured_image | image_url: width: 1200 | prepend: 'https:' | json }},
  {%- endif -%}
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": {{ cart.currency.iso_code | json }},
    "lowPrice": {{ product.price_min | money_without_currency }},
    "highPrice": {{ product.price_max | money_without_currency }},
    "offerCount": {{ product.variants.size }},
    "availability": "{% if product.available %}https://schema.org/InStock{% else %}https://schema.org/OutOfStock{% endif %}",
    "seller": {
      "@type": "Organization",
      "name": {{ shop.name | json }}
    }
  }
  {%- if product.metafields.reviews.rating.value -%}
  ,"aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": {{ product.metafields.reviews.rating.value }},
    "reviewCount": {{ product.metafields.reviews.rating_count.value | default: 0 }}
  }
  {%- endif -%}
}
</script>`.trim();
}
