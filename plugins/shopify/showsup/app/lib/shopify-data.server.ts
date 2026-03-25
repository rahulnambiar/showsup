/**
 * Shopify GraphQL data extraction.
 * Pulls store info, products, collections, articles, pages, and policies
 * to build targeted scan queries and rich llms.txt content.
 */

const PRODUCTS_QUERY = `#graphql
  query GetProducts($cursor: String) {
    products(first: 50, after: $cursor, query: "status:active") {
      edges {
        node {
          id
          title
          handle
          productType
          vendor
          descriptionHtml
          description
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          images(first: 1) { edges { node { url altText } } }
          metafields(first: 10, namespace: "seo") {
            edges { node { key value } }
          }
          totalInventory
          tags
        }
        cursor
      }
      pageInfo { hasNextPage }
    }
  }
`;

const COLLECTIONS_QUERY = `#graphql
  query GetCollections($cursor: String) {
    collections(first: 50, after: $cursor) {
      edges {
        node {
          id
          title
          handle
          description
          productsCount { count }
          image { url altText }
        }
        cursor
      }
      pageInfo { hasNextPage }
    }
  }
`;

const PAGES_QUERY = `#graphql
  query GetPages {
    pages(first: 30) {
      edges {
        node {
          id
          title
          handle
          body
        }
      }
    }
  }
`;

const ARTICLES_QUERY = `#graphql
  query GetArticles($cursor: String) {
    articles(first: 30, after: $cursor, sortKey: PUBLISHED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          excerpt
          blog { handle title }
          publishedAt
        }
        cursor
      }
      pageInfo { hasNextPage }
    }
  }
`;

const SHOP_QUERY = `#graphql
  query GetShop {
    shop {
      id
      name
      email
      myshopifyDomain
      primaryDomain { url }
      description
      currencyCode
      weightUnit
      plan { displayName }
      shipsToCountries
    }
  }
`;

const POLICIES_QUERY = `#graphql
  query GetPolicies {
    shop {
      privacyPolicy   { title body url }
      refundPolicy    { title body url }
      shippingPolicy  { title body url }
      termsOfService  { title body url }
    }
  }
`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShopData {
  shop:        ShopInfo;
  products:    Product[];
  collections: Collection[];
  pages:       Page[];
  articles:    Article[];
  policies:    Policy[];
}

export interface ShopInfo {
  id:          string;
  name:        string;
  email:       string;
  domain:      string;
  description: string;
  currency:    string;
  shipsTo:     string[];
}

export interface Product {
  id:          string;
  title:       string;
  handle:      string;
  type:        string;
  vendor:      string;
  description: string;
  minPrice:    string;
  maxPrice:    string;
  currency:    string;
  imageUrl:    string;
  inStock:     boolean;
  tags:        string[];
}

export interface Collection {
  id:           string;
  title:        string;
  handle:       string;
  description:  string;
  productCount: number;
  imageUrl:     string;
}

export interface Page {
  id:     string;
  title:  string;
  handle: string;
  body:   string;
}

export interface Article {
  id:        string;
  title:     string;
  handle:    string;
  excerpt:   string;
  blog:      string;
  blogHandle:string;
  published: string;
}

export interface Policy {
  title: string;
  body:  string;
  url:   string;
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function gql<T>(
  admin: { graphql: (query: string, opts?: { variables?: Record<string, unknown> }) => Promise<{ json: () => Promise<{ data: T }> }> },
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res  = await admin.graphql(query, { variables });
  const json = await res.json();
  return json.data;
}

async function paginateAll<T>(
  admin: Parameters<typeof gql>[0],
  query: string,
  dataKey: string
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;

  while (true) {
    const data: any = await gql(admin, query, cursor ? { cursor } : {});
    const conn = data[dataKey];
    conn.edges.forEach((e: any) => items.push(e.node as T));
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.edges[conn.edges.length - 1].cursor;
  }

  return items;
}

export async function fetchShopData(admin: Parameters<typeof gql>[0]): Promise<ShopData> {
  const [shopData, policiesData, rawProducts, rawCollections, rawPages, rawArticles] =
    await Promise.all([
      gql<{ shop: any }>(admin, SHOP_QUERY),
      gql<{ shop: any }>(admin, POLICIES_QUERY),
      paginateAll<any>(admin, PRODUCTS_QUERY, "products"),
      paginateAll<any>(admin, COLLECTIONS_QUERY, "collections"),
      gql<{ pages: { edges: { node: any }[] } }>(admin, PAGES_QUERY),
      paginateAll<any>(admin, ARTICLES_QUERY, "articles"),
    ]);

  const s = shopData.shop;

  const shop: ShopInfo = {
    id:          s.id,
    name:        s.name,
    email:       s.email,
    domain:      s.primaryDomain?.url || `https://${s.myshopifyDomain}`,
    description: s.description || "",
    currency:    s.currencyCode,
    shipsTo:     s.shipsToCountries || [],
  };

  const products: Product[] = rawProducts.map((p: any) => ({
    id:          p.id,
    title:       p.title,
    handle:      p.handle,
    type:        p.productType || "",
    vendor:      p.vendor || "",
    description: p.description || "",
    minPrice:    p.priceRangeV2?.minVariantPrice?.amount || "0",
    maxPrice:    p.priceRangeV2?.maxVariantPrice?.amount || "0",
    currency:    p.priceRangeV2?.minVariantPrice?.currencyCode || shop.currency,
    imageUrl:    p.images?.edges?.[0]?.node?.url || "",
    inStock:     (p.totalInventory ?? 1) > 0,
    tags:        p.tags || [],
  }));

  const collections: Collection[] = rawCollections.map((c: any) => ({
    id:           c.id,
    title:        c.title,
    handle:       c.handle,
    description:  c.description || "",
    productCount: c.productsCount?.count || 0,
    imageUrl:     c.image?.url || "",
  }));

  const pages: Page[] = rawPages.pages.edges.map((e: any) => ({
    id:     e.node.id,
    title:  e.node.title,
    handle: e.node.handle,
    body:   e.node.body?.replace(/<[^>]+>/g, "") || "",
  }));

  const articles: Article[] = rawArticles.map((a: any) => ({
    id:         a.id,
    title:      a.title,
    handle:     a.handle,
    excerpt:    a.excerpt || "",
    blog:       a.blog?.title || "",
    blogHandle: a.blog?.handle || "",
    published:  a.publishedAt || "",
  }));

  const sp = policiesData.shop;
  const policies: Policy[] = [
    sp.shippingPolicy,
    sp.refundPolicy,
    sp.privacyPolicy,
    sp.termsOfService,
  ]
    .filter(Boolean)
    .map((p: any) => ({
      title: p.title,
      body:  p.body?.replace(/<[^>]+>/g, "").slice(0, 500) || "",
      url:   p.url,
    }));

  return { shop, products, collections, pages, articles, policies };
}

// ── Query Generation ──────────────────────────────────────────────────────────

/**
 * Build commerce-specific scan queries from store data.
 */
export function buildScanQueries(data: ShopData): string[] {
  const { shop, products, collections } = data;
  const queries: string[] = [];

  // Store-level
  queries.push(`${shop.name} reviews — is it legit?`);
  queries.push(`Is ${shop.name} a trustworthy online store?`);

  // Shipping coverage
  const topCountries = ["United States", "UK", "Australia", "Canada", "Germany"];
  topCountries.forEach((c) => {
    queries.push(`Does ${shop.name} ship to ${c}?`);
  });

  // Collection-level
  const seenTypes = new Set<string>();
  collections.slice(0, 10).forEach((col) => {
    queries.push(`Best ${col.title.toLowerCase()} to buy online`);
    queries.push(`Best deals on ${col.title.toLowerCase()} this month`);
    queries.push(`Where to buy ${col.title.toLowerCase()} online`);
  });

  // Product-type queries
  products.forEach((p) => {
    if (p.type && !seenTypes.has(p.type.toLowerCase())) {
      seenTypes.add(p.type.toLowerCase());
      queries.push(`Best ${p.type.toLowerCase()} to buy online`);
      queries.push(`Compare ${p.type.toLowerCase()} options`);
      queries.push(`Where to buy ${p.type.toLowerCase()} in [region]`);
      if (queries.length > 60) return;
    }
  });

  // Specific product queries (top 10 by position)
  products.slice(0, 10).forEach((p) => {
    queries.push(`Best ${p.title.toLowerCase()} alternatives`);
    queries.push(`Is ${p.title} worth buying?`);
  });

  return [...new Set(queries)].slice(0, 50);
}
