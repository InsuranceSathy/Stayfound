# StayFound

**Win customers in AI search.** The visibility suite that shows how ChatGPT,
Gemini, Perplexity, Claude, and Grok talk about your brand — then takes action
to win the leads.

The product loop:

1. **Monitor** — track which prompts surface your brand across every AI engine.
2. **Optimize** — find the highest-leverage moves (the pages, claims, citations to change).
3. **Autopublish** — ship the fixes automatically and measure the lift.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 · Geist Sans + Geist Mono
- Vercel AI SDK v6 via the Vercel AI Gateway
- Deployed on Vercel

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Environment

Copy `.env.example` to `.env.local`. The free AI visibility check
(`/api/visibility`) runs **live** when `AI_GATEWAY_API_KEY` is set (or via
OIDC on Vercel), and otherwise returns a clearly-labeled **sample** estimate so
the demo always works.

```
AI_GATEWAY_API_KEY=...        # Vercel AI Gateway
# SURFACED_MODEL=anthropic/claude-haiku-4-5   # optional override
```

### Waitlist

The pricing-page waitlist (`/api/waitlist`) writes straight to the
`waitlist_signup` Postgres table — email, business name, domain, competitors.
The table is created on first submission, so `DATABASE_URL` is the only
requirement. Read the signups with:

```sql
SELECT created_at, email, business, domain, competitors
FROM waitlist_signup ORDER BY created_at DESC;
```

## Structure

- `app/page.tsx` — landing page
- `app/api/visibility/route.ts` — AI visibility-check endpoint (live + fallback)
- `components/visibility-chart.tsx` — animated canvas chart
- `components/visibility-check.tsx` — live brand-check widget
- `app/globals.css` — design system (ember accent, monospace data voice)
