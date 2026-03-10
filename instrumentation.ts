export async function register() {
  // Only log in Node.js (not in Edge runtime)
  if (process.env.NEXT_RUNTIME === "edge") return;

  const checks = [
    { key: "OPENAI_API_KEY",              label: "OpenAI (ChatGPT)" },
    { key: "ANTHROPIC_API_KEY",           label: "Anthropic (Claude)" },
    { key: "NEXT_PUBLIC_SUPABASE_URL",    label: "Supabase URL" },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase Anon Key" },
    { key: "SUPABASE_SERVICE_ROLE_KEY",   label: "Supabase Service Role" },
  ];

  console.log("\n┌─────────────────────────────────────┐");
  console.log("│     ShowsUp — environment check     │");
  console.log("├─────────────────────────────────────┤");
  for (const { key, label } of checks) {
    const ok = !!process.env[key];
    const status = ok ? "✓ configured  " : "✗ NOT SET     ";
    console.log(`│  ${label.padEnd(24)} ${status}│`);
  }
  console.log("└─────────────────────────────────────┘\n");
}
