# Claude scorer — personal experiment

A one-endpoint FastAPI service that runs **Claude Code headless** (`claude -p`)
inside a container to score a brand's AI-search visibility. It uses **your**
Claude Code login, mounted from the host.

> **Scope:** this is for your own experimentation. It is **not** a product
> backend — using a personal Claude subscription to serve StayFound's users
> violates Anthropic's terms, and it won't scale (an agent spawns per request,
> and subscription rate limits are sized for one person). For the real product,
> use the Anthropic API (with an API key), GLM, or Gemini.

## Prerequisites
1. Docker Desktop running.
2. You're logged into Claude Code on this Mac (so `~/.claude` has your creds):
   ```bash
   claude          # then run /login  (or: claude login)
   ```

## Run
```bash
cd claude-scorer-experiment
docker compose up --build
```

## Try it
```bash
curl -s -X POST localhost:8000/score \
  -H 'content-type: application/json' \
  -d '{"brand":"Notion","category":"note taking apps"}' | jq
```

Health check: `curl localhost:8000/health`

## What to expect
- **Slow.** Each call cold-starts a full agent — several seconds to a minute.
- **`claude error: ... not logged in`** → your `~/.claude` didn't mount or the
  session expired. Re-run `claude` on the host and log in, then retry.
- **Rate limits** kick in quickly under repeated calls (one-human quota).
- Output quality depends on the model's own knowledge, same as any LLM estimate.
