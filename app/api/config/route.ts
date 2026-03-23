import { NextResponse } from "next/server";
import { getMode } from "@/lib/mode";

export function GET() {
  const mode = getMode();
  return NextResponse.json({
    chatgpt: !!process.env.OPENAI_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GOOGLE_AI_API_KEY,
    mode,
    selfHost: mode === "selfhost",
  });
}
