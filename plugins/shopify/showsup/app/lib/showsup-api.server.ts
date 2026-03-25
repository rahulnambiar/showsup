/**
 * ShowsUp Cloud API client for Shopify.
 */

const DEFAULT_CLOUD_URL = "https://showsup.co";

export interface ScanArgs {
  brand:    string;
  url:      string;
  category: string;
  regions:  string[];
  depth:    string;
  queries?: string[];
}

export interface ApiResult {
  ok:    true;
  data:  Record<string, unknown>;
} | {
  ok:    false;
  error: string;
}

async function request(
  method: "GET" | "POST",
  path: string,
  token: string,
  cloudUrl: string,
  body?: Record<string, unknown>
): Promise<ApiResult> {
  const base = cloudUrl.replace(/\/$/, "");
  const url  = `${base}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent":   `ShowsUp-Shopify/1.0.0`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120_000),
  });

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) return { ok: false, error: "Invalid API token." };
  if (res.status === 402) return { ok: false, error: "Insufficient tokens. Top up at showsup.co." };
  if (!res.ok)            return { ok: false, error: (json as any)?.error || `API error ${res.status}` };

  return { ok: true, data: json as Record<string, unknown> };
}

export function createApiClient(token: string, cloudUrl = DEFAULT_CLOUD_URL) {
  return {
    isConfigured: () => Boolean(token),

    async scan(args: ScanArgs): Promise<ApiResult> {
      return request("POST", "/api/v1/scan", token, cloudUrl, args as unknown as Record<string, unknown>);
    },

    async getScore(domain: string): Promise<ApiResult> {
      const url = `/api/v1/score?domain=${encodeURIComponent(domain)}`;
      return request("GET", url, token, cloudUrl);
    },

    async generateFixes(args: Record<string, unknown>): Promise<ApiResult> {
      return request("POST", "/api/v1/fix", token, cloudUrl, args);
    },
  };
}
