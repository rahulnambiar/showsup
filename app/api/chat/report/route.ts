/**
 * POST /api/chat/report
 *
 * Streams a Claude response for the in-app report chat panel.
 * Authentication: session cookie (web app only).
 *
 * Body:    { scanId: string; messages: ChatMessage[] }
 * Returns: plain-text stream
 *          Header X-Free-Remaining: number
 */

import Anthropic        from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import {
  buildAnalystPrompt,
  FREE_CHAT_MESSAGES,
  CHAT_TOKEN_COST,
  type ChatMessage,
} from "@/lib/chat/prompt";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function jsonError(msg: string, status: number, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: msg, ...extra }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { scanId, messages } = await request.json() as {
      scanId:   string;
      messages: ChatMessage[];
    };
    if (!scanId || !Array.isArray(messages)) {
      return jsonError("scanId and messages required", 400);
    }

    const admin = getAdmin();

    // ── Token / free-message check ────────────────────────────────────────────
    const { data: chatRecord } = await admin
      .from("report_chats")
      .select("id, free_messages_used")
      .eq("user_id", user.id)
      .eq("scan_id", scanId)
      .maybeSingle();

    const freeUsed   = (chatRecord?.free_messages_used as number) ?? 0;
    const isFree     = freeUsed < FREE_CHAT_MESSAGES;
    const isSelfHost = process.env.SELF_HOST === "true";

    if (!isFree && !isSelfHost) {
      const { data: tok } = await admin
        .from("user_tokens")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      const balance = (tok?.balance as number) ?? 0;
      if (balance < CHAT_TOKEN_COST) {
        return jsonError("Insufficient tokens", 402, { balance, required: CHAT_TOKEN_COST });
      }

      await admin.from("user_tokens")
        .update({ balance: balance - CHAT_TOKEN_COST })
        .eq("user_id", user.id);
      await admin.from("token_transactions").insert({
        user_id:     user.id,
        amount:      -CHAT_TOKEN_COST,
        type:        "deduction",
        description: "AI chat message",
        scan_id:     scanId,
      });
    }

    // ── Fetch scan data ───────────────────────────────────────────────────────
    const [{ data: scan }, { data: results }] = await Promise.all([
      admin.from("scans")
        .select("*")
        .eq("id", scanId)
        .eq("user_id", user.id)
        .single(),
      admin.from("scan_results")
        .select("model, prompt, response, brand_mentioned, score, sentiment, key_context")
        .eq("scan_id", scanId),
    ]);

    if (!scan) return jsonError("Scan not found", 404);

    const fixes = scan.generated_fixes as Array<{ type?: string; description?: string; estimated_impact?: string }> | null;
    const systemPrompt = buildAnalystPrompt(
      scan as Record<string, unknown>,
      results ?? [],
      fixes,
    );

    // ── Stream Claude ─────────────────────────────────────────────────────────
    const anthropic      = new Anthropic();
    const freeRemaining  = Math.max(0, FREE_CHAT_MESSAGES - freeUsed - 1);

    const readable = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let fullText  = "";

        const stream = anthropic.messages.stream({
          model:      "claude-sonnet-4-6",
          max_tokens: 2000,
          system:     systemPrompt,
          messages:   messages.slice(-20),
        });

        stream.on("text", (text) => {
          fullText += text;
          controller.enqueue(encoder.encode(text));
        });

        stream.finalMessage().then(async () => {
          // ── Persist chat record ─────────────────────────────────────────
          const allMessages: ChatMessage[] = [
            ...messages,
            { role: "assistant", content: fullText },
          ];
          const newFreeUsed = isFree ? freeUsed + 1 : freeUsed;

          if (chatRecord) {
            await admin.from("report_chats").update({
              messages:           allMessages,
              free_messages_used: newFreeUsed,
              updated_at:         new Date().toISOString(),
            }).eq("id", chatRecord.id as string);
          } else {
            await admin.from("report_chats").insert({
              user_id:            user.id,
              scan_id:            scanId,
              messages:           allMessages,
              free_messages_used: newFreeUsed,
            });
          }
          controller.close();
        }).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
          controller.close();
        });
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type":     "text/plain; charset=utf-8",
        "X-Free-Remaining": String(freeRemaining),
        "Cache-Control":    "no-cache",
      },
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Internal error", 500);
  }
}

// ── DELETE — clear chat history ───────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { scanId } = await request.json() as { scanId: string };
    if (!scanId) return jsonError("scanId required", 400);

    const admin = getAdmin();
    await admin.from("report_chats")
      .delete()
      .eq("user_id", user.id)
      .eq("scan_id", scanId);

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Internal error", 500);
  }
}
