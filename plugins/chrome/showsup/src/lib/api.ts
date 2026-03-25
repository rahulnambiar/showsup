import type { ScanResult } from "./types";

const DEFAULT_URL = "https://showsup.co";

export function createClient(token: string, cloudUrl = DEFAULT_URL) {
  const base = cloudUrl.replace(/\/$/, "");

  async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method:  "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent":   "ShowsUp-Chrome/1.0.0",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) throw new Error("Invalid API token. Update it in Settings.");
    if (res.status === 402) throw new Error("Insufficient tokens. Top up at showsup.co.");
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as any)?.error || `API error ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent":   "ShowsUp-Chrome/1.0.0",
      },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json() as Promise<T>;
  }

  return {
    isConfigured: () => Boolean(token),

    async scan(args: {
      brand:    string;
      url:      string;
      category: string;
      regions:  string[];
      depth:    string;
    }): Promise<ScanResult & Record<string, unknown>> {
      return post("/api/v1/scan", args);
    },

    async getScore(domain: string): Promise<{ overall_score: number; scanned_at: number }> {
      return get(`/api/v1/score?domain=${encodeURIComponent(domain)}`);
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function scoreColor(score: number): string {
  if (score >= 70) return "#10B981";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

export function scoreLabel(score: number): string {
  if (score >= 70) return "Strong";
  if (score >= 40) return "Fair";
  return "Weak";
}

export function isStale(scannedAt: number, maxAgeMs = 24 * 60 * 60 * 1000): boolean {
  return Date.now() - scannedAt > maxAgeMs;
}
