# Contributing to ShowsUp

Thanks for your interest in contributing.

## Development setup

```bash
git clone https://github.com/rahulnambiar/showsup.git
cd showsup
cp .env.example .env.local   # fill in your keys
npm install
npm run db:setup              # applies supabase/schema.sql
npm run dev
```

## What to work on

Check [open issues](https://github.com/rahulnambiar/showsup/issues) — anything labelled `good first issue` is a good place to start.

High-value areas:
- **New LLM providers** — add Gemini, Perplexity, etc. to `app/api/scan/route.ts`
- **Fix generator** — new AEO fix types in the fix pipeline
- **CLI** — `npx showsup scan` via `packages/cli/`
- **Query templates** — improve prompts in `lib/query-generator.ts`
- **UI improvements** — report views, charts, mobile

## Pull requests

1. Fork → branch off `main`
2. Make your change — keep scope tight
3. Test locally against a real Supabase project
4. Open a PR with a clear description of what and why

## Code style

- TypeScript strict mode
- Tailwind for styling — no inline `style=` except where necessary
- No new dependencies without discussion
- Keep API routes thin — logic belongs in `lib/`

## Reporting bugs

Open an issue with:
- What you expected
- What happened
- Steps to reproduce
- Your mode (`selfhost` or `cloud`) and which LLM keys you have set

## Questions

Open a GitHub Discussion or reach out via the issue tracker.
