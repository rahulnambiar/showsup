# ShowsUp

Open source AEO agent. Scan your brand's AI visibility across ChatGPT, Claude, Gemini — then generate the fixes.

## What it does

- **Scan**: Enter any URL → queries AI platforms with category-relevant prompts
- **Score**: ShowsUp Score (0–100) with competitor benchmarking
- **Fix**: Generates llms.txt, schema markup, content briefs, comparison pages, citation playbooks
- **Verify**: Re-scan to measure improvement after implementing fixes

## Quick Start

### CLI
```bash
npx showsup scan https://yoursite.com
npx showsup fix https://yoursite.com --output ./fixes/
```

### Self-host
```bash
git clone https://github.com/rahulnambiar/showsup.git
cd showsup
cp .env.example .env.local
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Cloud
[showsup.co](https://showsup.co) — 1,000 free tokens.

---

## Configuration

### API Keys

Need **at least one** LLM provider:

| Provider | Key | Where to get it |
|---|---|---|
| Anthropic (Claude) | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| OpenAI (ChatGPT) | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| Google (Gemini) | `GOOGLE_AI_API_KEY` | [ai.google.dev](https://ai.google.dev) |

Missing a key? ShowsUp logs a warning and skips that provider. Everything still works with one key.

### Required

| Key | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API settings (keep secret) |

### Optional

| Key | Purpose |
|---|---|
| `RESEND_API_KEY` | Transactional email (signup confirmation) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics — silently disabled if unset |
| `STRIPE_*` | Payments — cloud mode only |

---

## Modes

### Self-host mode (default)
All features unlocked, no token system, no payments. Automatically active when no Stripe keys are present.

```env
NEXT_PUBLIC_MODE=selfhost
```

### Cloud mode
Token system active. Requires Stripe keys.

```env
NEXT_PUBLIC_MODE=cloud
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Database Setup

After creating a Supabase project:

```bash
npm run db:setup
```

This tries to apply `supabase/schema.sql` via psql (using `SUPABASE_DB_URL`) or the Supabase CLI. If neither is available, it prints the SQL for manual paste.

You can also apply it manually:
1. Open your Supabase project → SQL Editor
2. Paste the contents of `supabase/schema.sql`
3. Run

---

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) (Postgres + Auth)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Recharts](https://recharts.org)
- TypeScript

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
