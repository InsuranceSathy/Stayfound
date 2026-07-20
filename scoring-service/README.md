# Surfaced scoring service

Self-hosted visibility scoring — runs on your Mac, uses local **Ollama** for
free inference, and is called by the Vercel app. When this service is off,
Surfaced automatically falls back to its cloud pipeline, so the product never
breaks.

**Zero dependencies** — pure Node (v18+). No `npm install` needed.

## Run

```bash
# 1. Make sure Ollama is running with a model
ollama pull qwen2.5:14b-instruct

# 2. Configure
cp .env.example .env        # set SCORING_SECRET to a random string

# 3. Start (loads .env automatically on Node 20.6+)
SCORING_SECRET=your-secret node --env-file=.env server.mjs
# or: npm start   (with env vars exported)
```

Health check:

```bash
curl localhost:8787/health
curl -X POST localhost:8787/score -H "authorization: Bearer your-secret" \
  -H "content-type: application/json" \
  -d '{"brand":"Linear","category":"project management software"}'
```

## Expose to the Vercel app (Cloudflare Tunnel)

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:8787
# copy the https://<random>.trycloudflare.com URL it prints
```

Then in the **main app's** environment set:

```
SCORING_BACKEND_URL=https://<your-tunnel>.trycloudflare.com
SCORING_SECRET=your-secret       # same secret
```

For a stable URL, create a named tunnel bound to a subdomain of your domain.

## How it works

- **Auxiliary reasoning** (competitor discovery) → local Ollama, free.
- **Engine queries** → the local Ollama model as a perspective, plus any cloud
  engines you add a key for (e.g. Gemini's free tier for the real signal).
- **Scoring** → position-weighted presence across prompts × engines, share of
  voice ranking, and data-driven recommended actions.
- If no engine is reachable, returns a clearly-labeled sample so callers still
  get a valid response.
