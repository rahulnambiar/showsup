import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    chatgpt: !!process.env.OPENAI_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
  });
}
