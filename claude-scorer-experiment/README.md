# Claude scorer

A one-endpoint FastAPI service that runs **Claude Code headless** (`claude -p`)
inside a container to measure a brand's AI-search visibility. It asks the
assistant the questions a buyer would ask, keeps the real answers, and extracts
mentions, positions and cited sources from that text in Python.

## Authentication

No interactive login, and nothing mounted from a laptop. Pick one variable:

| Variable | What it is | Quota |
|---|---|---|
| `ANTHROPIC_API_KEY` | A real API key | Billed per use, no per-person cap. The only option whose terms cover serving other people. |
| `CLAUDE_CODE_OAUTH_TOKEN` | A long-lived token from `claude setup-token` | Spends **one person's** subscription, which is sized for one person. |

The key wins when both are set, and the loser is stripped from the CLI's
environment so precedence is ours rather than the CLI's — see
`credential_env()` in `server.py`. `/health` reports which one is live.

### Getting a token

```bash
claude setup-token          # opens a browser once, prints sk-ant-oat01-…
```

Then set it wherever the service runs — Railway variables, or locally:

```bash
export CLAUDE_CODE_OAUTH_TOKEN='sk-ant-oat01-…'
docker compose up --build
```

Paste the value bare. A token with quotes or whitespace still attached fails
authentication in a way that reads like "not logged in", so `/health` checks its
shape and says so up front instead of letting each scan discover it 90 seconds
at a time.

## Locking the endpoint

`/score` spends the credential above on every call, so it is not something to
leave open once the credential is an env var rather than a mounted file.

Set `SCORING_SECRET` to the same value the app uses and `/score` requires
`Authorization: Bearer <it>`. Unset, it stays open — fine locally, not on a
public host. `/health` is always open so liveness probes work.

## Try it

```bash
curl -s localhost:8000/health | jq
curl -s -X POST localhost:8000/score \
  -H 'content-type: application/json' \
  -d '{"brand":"Notion","category":"note taking apps"}' | jq
```

A healthy response looks like:

```json
{ "ok": true, "version": 2, "measures": "Claude",
  "auth": "oauth-token", "quota": "personal-subscription" }
```

## What to expect

- **Slow.** Every prompt cold-starts a web-grounded agent. Sized to finish
  inside the caller's patience: 3 prompts, 210s budget. Raising
  `SCORING_PROMPTS` past 3 ran past Railway's 300s request cut-off.
- **Degrades rather than fails.** A prompt that times out is dropped and the
  reading is returned as `partial` with `answersFailed` set, so the app can tell
  a thin measurement from a complete one.
- **Rate limits.** On a subscription credential — `quota:
  "personal-subscription"` — repeated scans get progressively worse: first one
  prompt fails, then two. That is the one-human quota tightening, not a bug, and
  it is why anything serving real users needs the API key.
