/**
 * Webhook delivery helper.
 * Fires fire-and-forget POST requests to registered webhook URLs.
 */

import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type WebhookEvent = "scan.completed" | "score.changed" | "fixes.generated";

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
}

function sign(payload: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

/** Deliver an event to all matching webhooks for a user. Fire-and-forget. */
export async function deliverWebhook(
  userId: string,
  event:  WebhookEvent,
  data:   Record<string, unknown>,
): Promise<void> {
  try {
    const admin = getAdmin();
    const { data: hooks } = await admin
      .from("webhooks")
      .select("id, url, events, secret")
      .eq("user_id", userId)
      .eq("active", true);

    if (!hooks || hooks.length === 0) return;

    const payload = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data,
    });

    await Promise.allSettled(
      (hooks as WebhookRow[])
        .filter((h) => h.events.includes(event) || h.events.includes("*"))
        .map(async (hook) => {
          const headers: Record<string, string> = {
            "Content-Type":    "application/json",
            "User-Agent":      "ShowsUp-Webhook/1.0",
            "X-ShowsUp-Event": event,
          };
          if (hook.secret) headers["X-ShowsUp-Signature"] = sign(payload, hook.secret);

          const res = await fetch(hook.url, {
            method: "POST",
            headers,
            body: payload,
            signal: AbortSignal.timeout(10_000),
          });

          // Log delivery status
          await admin.from("webhook_deliveries").insert({
            webhook_id:  hook.id,
            event,
            status_code: res.status,
            delivered_at: new Date().toISOString(),
          });
        })
    );
  } catch { /* Never throw from webhook delivery */ }
}
