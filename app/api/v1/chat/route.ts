/**
 * POST /api/v1/chat
 *
 * CLI / external API endpoint for conversational scan analysis.
 * Authentication: Bearer token or X-Api-Token header.
 *
 * Body:
 *   { domain?: string; scanId?: string; messages: ChatMessage[]; stream?: boolean }
 *
 * Returns: plain-text stream (stream=true, default) or JSON (stream=false)
 */

import Anthropic        from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { authenticateApiToken, getAdmin } from "@/lib/api/auth";
import { buildAnalystPrompt, type ChatMessage } from "@/lib/chat/prompt";

export async function POST(request: Request) {
  try {
    const user = await authenticateApiToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Pass Authorization: Bearer <api_token>" }, { status: 401 });
    }

    const body = await request.json() as {
      domain?:   string;
      scanId?:   string;
      messages:  ChatMessage[];
      stream?:   boolean;
    };

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }
    if (!body.domain && !body.scanId) {
      return NextResponse.json({ error: "Provide domain or scanId" }, { status: 400 });
    }

    const admin = getAdmin();

    // ── Resolve scan ──────────────────────────────────────────────────────────
    let scan: Record<string, unknown> | null = null;

    if (body.scanId) {
      const { data } = await admin
        .from("scans")
        .select("*")
        .eq("id", body.scanId)
        .eq("user_id", user.userId)
        .single();
      scan = data as Record<string, unknown> | null;
    } else if (body.domain) {
      const domain = body.domain.replace(/^https?:\/\//, "").split("/")[0];
      const { data } = await admin
        .from("scans")
        .select("*")
        .eq("user_id", user.userId)
        .ilike("website", `%${domain}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      scan = data as Record<string, unknown> | null;
    }

    if (!scan) {
      return NextResponse.json({ error: "No scan found for the given domain or scanId" }, { status: 404 });
    }

    const { data: results } = await admin
      .from("scan_results")
      .select("model, prompt, response, brand_mentioned, score, sentiment, key_context")
      .eq("scan_id", scan.id as string);

    const fixes = scan.generated_fixes as Array<{ type?: string; description?: string; estimated_impact?: string }> | null;
    const systemPrompt = buildAnalystPrompt(scan, results ?? [], fixes);

    // ── Non-streaming (JSON) ──────────────────────────────────────────────────
    if (body.stream === false) {
      const anthropic = new Anthropic();
      const response  = await anthropic.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 2000,
        system:     systemPrompt,
        messages:   body.messages.slice(-20),
      });

      const text = response.content.find(b => b.type === "text")?.text ?? "";
      return NextResponse.json({ content: text });
    }

    // ── Streaming ─────────────────────────────────────────────────────────────
    const anthropic = new Anthropic();
    const readable  = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const stream  = anthropic.messages.stream({
          model:      "claude-sonnet-4-6",
          max_tokens: 2000,
          system:     systemPrompt,
          messages:   body.messages.slice(-20),
        });

        stream.on("text", (text) => {
          controller.enqueue(encoder.encode(text));
        });

        stream.finalMessage().then(() => {
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
        "Content-Type":  "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
