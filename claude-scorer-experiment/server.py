# Personal experiment: FastAPI wrapper that asks Claude Code (`claude -p`) to
# score a brand's AI-search visibility. Uses YOUR mounted Claude Code login.
# For experimentation only — not a product backend (see README).
import json
import re
import subprocess

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Claude scorer experiment")


class ScoreRequest(BaseModel):
    brand: str
    category: str


def build_prompt(brand: str, category: str) -> str:
    return (
        f'You are an AI-search visibility analyst. Research how the brand "{brand}" '
        f'appears in AI assistant answers for the category "{category}". '
        f"Use web search to ground everything in REAL data — the actual competitors "
        f"buyers compare, the real websites AI answers tend to cite, and current "
        f"sentiment. Search a few buyer-intent queries (e.g. \"best {category}\", "
        f'"{category} for startups", "{brand} review", "{brand} vs alternatives").\n\n'
        f"Then return ONLY a JSON object as your FINAL message (no prose around it), "
        f"exactly this shape:\n"
        f"{{\n"
        f'  "score": <0-100 overall AI-search visibility for {brand}>,\n'
        f'  "summary": "<2 concise sentences>",\n'
        f'  "engines": [{{"name":"ChatGPT","mentioned":<true|false>,"score":<0-100>}}, '
        f'{{"name":"Gemini",...}}, {{"name":"Perplexity",...}}, {{"name":"Claude",...}}],\n'
        f'  "competitors": [{{"name":"<brand>","share":<0-100>,"you":<true|false>}}], '
        f'// 5-7 ranked by share of voice, include "{brand}" with you:true\n'
        f'  "sentiment": {{"label":"positive|neutral|negative","positivePct":<0-100>,'
        f'"negativePct":<0-100>,"positiveThemes":[{{"theme":"...","quote":"..."}}],'
        f'"negativeThemes":[{{"theme":"...","quote":"..."}}]}},\n'
        f'  "citedSources": [{{"domain":"example.com","note":"why AI answers cite it",'
        f'"isYou":<true|false>}}], // 5-6 REAL domains\n'
        f'  "contentIdeas": [{{"type":"Comparison|Listicle|How-to|Problem Solution|Year Specific",'
        f'"title":"...","description":"..."}}], // 4-5\n'
        f'  "actions": [{{"title":"...","detail":"...","impact":"high|medium|low"}}] // 3\n'
        f"}}"
    )


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/score")
def score(req: ScoreRequest):
    if not req.brand or not req.category:
        raise HTTPException(400, "brand and category are required")

    prompt = build_prompt(req.brand, req.category)
    try:
        proc = subprocess.run(
            [
                "claude", "-p", prompt,
                "--output-format", "json",
                # Pre-approve the web tools so headless runs don't hang on a
                # permission prompt (and don't need --dangerously-skip-permissions).
                "--allowedTools", "WebSearch", "WebFetch",
            ],
            stdin=subprocess.DEVNULL,  # don't wait for stdin (avoids a 3s stall)
            capture_output=True,
            text=True,
            timeout=600,  # web-grounded research takes longer
        )
    except FileNotFoundError:
        raise HTTPException(500, "claude CLI not found in the image")
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "claude timed out")

    if proc.returncode != 0:
        # Most commonly: not logged in (mount ~/.claude) or rate limited.
        raise HTTPException(502, f"claude error: {proc.stderr[:400]}")

    # `--output-format json` returns an envelope; the model's text is in .result
    text = proc.stdout
    try:
        envelope = json.loads(proc.stdout)
        text = envelope.get("result", proc.stdout)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        return {"source": "claude-code", "raw": text[:2000]}
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return {"source": "claude-code", "raw": text[:2000]}

    return {"source": "claude-code", "result": data}
