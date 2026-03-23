import type { ScanInput, ScanOutput } from "../../lib/engine/types";
import type { FixInput, FixOutput } from "../../lib/fixes/types";

export class CloudClient {
  constructor(
    private readonly token: string,
    private readonly baseUrl: string = "https://showsup.co"
  ) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "x-api-token":   this.token,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as T & { error?: string };
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? `API error ${res.status}`);
    }
    return data;
  }

  async scan(input: ScanInput): Promise<ScanOutput> {
    return this.post<ScanOutput>("/scan", input);
  }

  async fix(input: FixInput): Promise<FixOutput> {
    return this.post<FixOutput>("/fix", input);
  }
}
