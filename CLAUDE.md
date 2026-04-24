@AGENTS.md

# SupplierCheck — Claude Code Instructions

## What this project is
A supplier verification web app for the Indian B2B market. A user enters a supplier's GST number and gets back a plain-English AI-generated trust report.

## Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (postgres)
- **AI**: Anthropic Claude API (claude-haiku-4-5 — cheapest viable model)
- **Hosting**: Vercel (free tier)
- **GST Data**: Appyflow GST API (paid credits)
- **Company Data**: MCA21 — not integrated, returns null (most small vendors are proprietorships with no MCA records)
- **News**: Bing Search API — not integrated yet, uses mock

## Commands
```bash
npm run dev        # Start local dev server at localhost:3000
npm run build      # Build for production
npm run lint       # Lint the codebase
```

## Key conventions
- All API responses use `{ success: boolean, data: any, error?: string }` shape
- GST numbers are always uppercased and stripped of spaces before processing
- Reports are cached in Supabase — if a GST was checked in last 7 days, return cached report
- Never expose API keys in client-side code — all external API calls go through /api routes
- Environment variables in `.env.local` only, never hardcoded
- All API routes have rate limiting and daily spend caps
- MCA data is optional (null) — Claude prompt handles missing MCA gracefully

## Important rules
- Build one phase at a time, do not jump ahead
- Prefer simple, readable code over clever code
- Keep security tight — rate limit, validate inputs, cap spending
- Use the cheapest Claude model that works
- If something needs a paid API key that isn't set up yet, use a clearly labelled mock response
