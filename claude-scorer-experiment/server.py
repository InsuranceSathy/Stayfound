# StayFound scorer — v2.
#
# WHAT CHANGED AND WHY
#
# v1 made one `claude -p` call and asked it to report a visibility score for
# ChatGPT, Gemini, Perplexity *and* Claude. Those four numbers were therefore
# one model's estimate of three other models' behaviour, not measurements of
# them. That is survivable while the output is a single headline score; it stops
# being survivable the moment the product asks this service for `answers[]`,
# because a model asked to "return the answers ChatGPT gave" will write
# plausible ones. Fabricated transcripts attributed to a named assistant, inside
# a PDF a customer sends their client, is not a bug you recover from.
#
# So v2 inverts the design:
#
#   * The assistant is ASKED THE BUYER'S QUESTION, once per prompt, and its real
#     answer is kept verbatim. That is a genuine measurement of one assistant.
#   * Mentions, positions and cited URLs are extracted FROM THAT TEXT in Python.
#     The model is never asked "did you mention them" — that is a string search,
#     and asking a model to grade itself invites it to be generous.
#   * The model is used once more, at the end, only to interpret transcripts it
#     can actually see.
#   * Engines that were not queried are still reported, because the product
#     shows them, but every entry now carries `measured: true|false` so the
#     difference is in the payload rather than in someone's memory.
import hmac
import json
import os
import re
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI(title="StayFound scorer v2")

# The engine this container actually runs. Claude Code with web search is a real
# assistant answering a real question, so it is a real reading — of one engine.
MEASURED_ENGINE = os.environ.get("MEASURED_ENGINE", "Claude")
MEASURED_MODEL = os.environ.get("MEASURED_MODEL", "claude-code")
ESTIMATED_ENGINES = ["ChatGPT", "Gemini", "Perplexity"]

# Buyer-intent prompts, weighted by how close they sit to a purchase. Kept in
# step with lib/measure.ts so a reading means the same thing on both paths.
PROMPTS = [
    ("p1", "What are the best {c}?", 1.0, "Discovery", "commercial"),
    ("p2", "What is the best {c} for a startup, and why?", 1.3, "Segment fit", "commercial"),
    ("p3", "Which {c} should I buy in {year}?", 1.3, "Buying intent", "transactional"),
    ("p4", "What are the top alternatives for {c}?", 1.1, "Alternatives", "comparison"),
    ("p5", "Can you recommend a good {c}?", 1.0, "Discovery", "commercial"),
    ("p6", "Which {c} do experts recommend?", 0.9, "Authority", "informational"),
]
# v2 asks for eight web-grounded agent calls where v1 asked for one, and the
# first deploy proved that does not fit in an HTTP request: Railway cut it off
# at exactly 300s with `upstream error`, and StayFound's own client gives up at
# 240s before that. So the work is now sized to the caller's patience.
PROMPT_COUNT = int(os.environ.get("SCORING_PROMPTS", "3"))
CONCURRENCY = int(os.environ.get("SCORING_CONCURRENCY", "3"))
TIMEOUT_S = int(os.environ.get("SCORING_TIMEOUT", "70"))
DISCOVER_TIMEOUT_S = int(os.environ.get("SCORING_DISCOVER_TIMEOUT", "60"))
INTERPRET_TIMEOUT_S = int(os.environ.get("SCORING_INTERPRET_TIMEOUT", "80"))
# Total wall clock to stay under. Below the client's 240s so the answer arrives
# rather than the connection dropping.
BUDGET_S = int(os.environ.get("SCORING_BUDGET", "210"))

URL_RE = re.compile(r"https?://[^\s)\]}>\"']+")


def credential_env() -> dict:
    """The environment every `claude` call is made with.

    Three credentials can reach this container and the CLI's precedence between
    them is not something we should be inferring from release notes, so the
    choice is made here and the losers are removed from the child's
    environment. "Which credential did that scan actually bill" then has one
    answer, and it is the one /health reports.

      ANTHROPIC_API_KEY        billed API usage. No per-human cap, and the only
                               one whose terms cover serving other people.
      CLAUDE_CODE_OAUTH_TOKEN  a long-lived subscription token from
                               `claude setup-token`. Needs no interactive login
                               and no mounted files, so it is the one that works
                               on a deployed host without a laptop — but it
                               spends a personal subscription's quota.
      /root/.claude            a mounted personal login. Local use only; there
                               is no host home directory to mount on Railway.
    """
    env = os.environ.copy()
    if env.get("ANTHROPIC_API_KEY"):
        env.pop("CLAUDE_CODE_OAUTH_TOKEN", None)
    return env


# The shared secret the app sends. /score spends real quota per call, so it is
# not a public endpoint — and it became a far more attractive one the moment the
# credential moved into an env var, because before that a deployed host had no
# working credential to spend. The app has always sent this header; the server
# simply never read it.
#
# Unset means open, so a local run needs no ceremony. Set means enforced.
SCORING_SECRET = os.environ.get("SCORING_SECRET", "")


def require_secret(authorization: str | None) -> None:
    if not SCORING_SECRET:
        return
    expected = f"Bearer {SCORING_SECRET}"
    # compare_digest, not ==, so a wrong token cannot be guessed a character at
    # a time from how long the rejection took.
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(401, "invalid or missing bearer token")


# Resolved once: the credential is a deploy-time fact, and re-reading os.environ
# per call would let a scan halfway through a batch switch accounts.
CLAUDE_ENV = credential_env()


class ScoreRequest(BaseModel):
    brand: str
    category: str


def claude_error(proc, payload) -> str:
    """The failure text, wherever the CLI put it this time.

    `claude -p --output-format json` reports an auth failure on *stdout*, in the
    JSON body, with `is_error: true` and an empty stderr. Reading stderr alone
    therefore produced the 502 message "claude error:" with nothing after it,
    which made an invalid token indistinguishable from every other backend
    fault — and the whole point of this service reporting its own auth state is
    that credential problems should be the easy ones to see.
    """
    if isinstance(payload, dict):
        msg = payload.get("result") or payload.get("error")
        if msg:
            return str(msg)[:400]
    return (proc.stderr or proc.stdout or "claude produced no output").strip()[:400]


def run_claude(prompt: str, timeout: int = TIMEOUT_S, tools: str = "WebSearch,WebFetch") -> str:
    """One headless Claude Code call. Returns the model's final text.

    Raising on timeout would throw away the answers already collected, so
    callers that can degrade catch it and carry on with less.
    """
    try:
        proc = subprocess.run(
            ["claude", "-p", prompt, "--output-format", "json", "--allowedTools", *tools.split(",")],
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=CLAUDE_ENV,
        )
    except FileNotFoundError:
        raise HTTPException(500, "claude CLI not found in the image")
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "claude timed out")
    payload = None
    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError:
        pass
    failed = proc.returncode != 0 or (
        isinstance(payload, dict) and payload.get("is_error")
    )
    if failed:
        raise HTTPException(502, f"claude error: {claude_error(proc, payload)}")
    if isinstance(payload, dict):
        return payload.get("result", proc.stdout)
    return proc.stdout


def extract_json(text: str):
    """Pull the last JSON object out of a reply that may have prose around it."""
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def stem(name: str) -> str:
    """'Kestrel Supply' and 'kestrelsupply.com' both reduce to 'kestrelsupply',
    so a brand written either way is found in an answer written the other."""
    n = name.lower().strip()
    n = re.sub(r"^https?://", "", n)
    n = re.sub(r"^www\.", "", n)
    n = re.sub(r"\.[a-z.]+$", "", n)
    return re.sub(r"[^a-z0-9]", "", n)


def find_positions(text: str, names: list[str]) -> dict[str, int]:
    """Where each brand first appears in the answer, ranked by that order.

    Deliberately mechanical. The order a model lists options in is the closest
    thing to a ranking an answer gives you, and measuring it with a string
    search means the number cannot drift with the model's mood.
    """
    flat = re.sub(r"[^a-z0-9]", "", text.lower())
    hits = []
    for n in names:
        s = stem(n)
        if not s:
            continue
        idx = flat.find(s)
        if idx >= 0:
            hits.append((idx, n))
    hits.sort()
    return {n: i + 1 for i, (_, n) in enumerate(hits)}



# Domains that are never the vendor being discussed — review sites, forums,
# aggregators, the customer's own docs host. A citation to one of these says
# where the answer came from, not who it recommended.
NON_VENDOR = {
    "g2.com", "capterra.com", "trustpilot.com", "gartner.com", "getapp.com",
    "softwareadvice.com", "trustradius.com", "reddit.com", "quora.com",
    "stackoverflow.com", "news.ycombinator.com", "indiehackers.com",
    "youtube.com", "vimeo.com", "medium.com", "substack.com", "wikipedia.org",
    "github.com", "linkedin.com", "x.com", "twitter.com", "facebook.com",
    "producthunt.com", "alternativeto.net", "crunchbase.com", "saashub.com",
    "forbes.com", "techcrunch.com", "theverge.com", "businessinsider.com",
    "google.com", "bing.com",
}


# Content sites the long tail is full of — devtoolreviews.com, thectoclub.com,
# bestcrmguide.com. Listing them all is impossible; their names give them away.
# Counting one as a competitor puts a blog into the customer's share-of-voice
# table, which is worse than missing a real rival.
CONTENT_SITE = re.compile(
    r"(review|guide|compare|comparison|blog|digest|insight|roundup|club|hub|"
    r"^best|best[a-z]*\.|^top[0-9]*|wiki|magazine|news|report)"
)


def brands_from_citations(answers: list[dict]) -> list[str]:
    """Candidate rivals, taken from what the answers linked to.

    The upfront discovery call is one web-grounded request that can time out,
    and when it does the scan measures a category of one — share of voice comes
    back as 100% by construction and "who beats you" is empty. The answers
    themselves already name the field, so this reads it off them: free,
    deterministic, and it cannot fail separately from the scan.
    """
    seen: dict[str, int] = {}
    for a in answers:
        for c in a.get("citations", []) or []:
            host = c.get("domain", "").lower().replace("www.", "")
            if not host or host in NON_VENDOR:
                continue
            # A blog post on a vendor's site still points at that vendor.
            root = ".".join(host.split(".")[-2:]) if host.count(".") > 1 else host
            if root in NON_VENDOR or CONTENT_SITE.search(root):
                continue
            seen[root] = seen.get(root, 0) + 1
    # Most-cited first; a domain linked once may just be a passing reference.
    return [d for d, _ in sorted(seen.items(), key=lambda kv: -kv[1])][:10]


def discover_competitors(brand: str, category: str) -> list[str]:
    text = run_claude(
        f'Search the web for the brands buyers actually compare in "{category}". '
        f'Return ONLY a JSON array of 5-7 real brand names, most prominent first. '
        f'Include "{brand}" only if it genuinely appears. No prose.',
        timeout=DISCOVER_TIMEOUT_S,
    )
    data = extract_json(text) if text.strip().startswith("{") else None
    if data is None:
        arr = re.search(r"\[.*\]", text, re.S)
        try:
            data = json.loads(arr.group(0)) if arr else []
        except json.JSONDecodeError:
            data = []
    names = [str(x) for x in data if isinstance(x, (str, int))] if isinstance(data, list) else []
    if not any(stem(n) == stem(brand) for n in names):
        names.append(brand)
    return names[:8]


def ask_one(brand: str, category: str, pid: str, template: str, names: list[str]) -> dict:
    """Ask the buyer's question and keep what came back, verbatim."""
    year = datetime.now(timezone.utc).year
    question = template.format(c=category, year=year)
    try:
        text = run_claude(
            f"{question}\n\nAnswer as you normally would for someone choosing a product. "
            f"Use web search. Name specific products and link your sources.",
        )
    except HTTPException:
        # One assistant call that timed out or errored is a missing reading,
        # not a failed scan. Recorded as unanswered so the denominator stays
        # honest rather than quietly shrinking.
        return {
            "promptId": pid, "engine": MEASURED_ENGINE, "sample": 1,
            "askedAt": datetime.now(timezone.utc).isoformat(),
            "text": None, "mentioned": False, "position": None,
            "brands": [], "citations": [], "failed": True,
        }
    ranks = find_positions(text, names)
    urls, seen = [], set()
    for i, u in enumerate(URL_RE.findall(text)):
        u = u.rstrip(".,;")
        host = re.sub(r"^www\.", "", u.split("/")[2]) if "://" in u else None
        if host and u not in seen:
            seen.add(u)
            urls.append({"url": u, "domain": host, "position": i + 1})
    mine = ranks.get(next((n for n in names if stem(n) == stem(brand)), brand))
    return {
        "promptId": pid,
        "engine": MEASURED_ENGINE,
        "sample": 1,
        "askedAt": datetime.now(timezone.utc).isoformat(),
        "text": text[:4000],
        "mentioned": mine is not None,
        "position": mine,
        "brands": [{"name": n, "position": p} for n, p in sorted(ranks.items(), key=lambda kv: kv[1])],
        "citations": urls,
    }


def interpret(brand: str, category: str, answers: list[dict], timeout: int = INTERPRET_TIMEOUT_S) -> dict:
    """The only call that is allowed to have an opinion — and it is shown the
    real transcripts, so every quote it returns can be checked against them."""
    # Only the answers that actually came back. The caller checks that *some*
    # answer has text; this has to check *each* one, because a prompt whose
    # assistant call failed carries text=None and slicing that is a 500 — which
    # threw away every answer that did succeed.
    usable = [a for a in answers if a.get("text")]
    if not usable:
        return {}
    transcripts = "\n\n---\n\n".join(
        f"PROMPT {a['promptId']}: {a['text'][:1200]}" for a in usable
    )
    text = run_claude(
        f'Below are real AI assistant answers about "{category}", collected just now.\n\n'
        f"{transcripts}\n\n"
        f'Analysing ONLY the text above, return ONLY this JSON:\n'
        f'{{"summary":"<2 sentences on where {brand} stands>",'
        f'"brandsNamed":["<every product or company named in the transcripts above>"],'
        f'"sentiment":{{"label":"positive|neutral|negative","positivePct":<0-100>,'
        f'"negativePct":<0-100>,'
        f'"positiveThemes":[{{"theme":"...","quote":"<verbatim from above>","promptId":"pN"}}],'
        f'"negativeThemes":[{{"theme":"...","quote":"<verbatim from above>","promptId":"pN"}}]}},'
        f'"citedSources":[{{"domain":"x.com","note":"why it is cited","isYou":<bool>,'
        f'"kind":"review-site|forum|video|directory|vendor-blog|news|docs|social|own"}}],'
        f'"actions":[{{"title":"...","detail":"...","impact":"high|medium|low",'
        f'"kind":"entity|listing|content|schema|reviews"}}],'
        f'"contentIdeas":[{{"type":"Comparison|Listicle|How-to|Problem Solution|Year Specific",'
        f'"title":"...","description":"..."}}]}}\n'
        f"Quotes must appear verbatim in the transcripts. Do not invent sources.",
        timeout=timeout,
        tools="WebSearch",
    )
    return extract_json(text) or {}


def auth_mode() -> str:
    """Which credential this container will actually use.

    Reported by /health because the failure it prevents is silent: without
    one, every scan returns "not logged in" and the product falls back to a
    sample, which looks like a working service returning bad numbers.

    Order matches `credential_env`, so this never claims a credential the CLI
    is not the one being handed.
    """
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "api-key"
    if os.environ.get("CLAUDE_CODE_OAUTH_TOKEN"):
        return "oauth-token"
    # The directory alone proves nothing: the CLI creates `/root/.claude` on
    # first run, so an empty one reported "mounted-login" on a host that had
    # never been logged in — the exact false pass this check exists to stop.
    # On Linux the credential itself lives in .credentials.json.
    if os.path.isfile("/root/.claude/.credentials.json"):
        return "mounted-login"
    if os.path.isdir("/root/.claude"):
        return "claude-dir-but-no-credential"
    return "none"


def auth_ok(mode: str) -> bool:
    return mode in ("api-key", "oauth-token", "mounted-login")


def token_shape_warning() -> str | None:
    """A malformed token fails identically to no token at all — per scan, 90
    seconds at a time. `claude setup-token` emits `sk-ant-oat01-…`; a value that
    does not start that way is almost always a truncated copy or one pasted with
    its quotes still attached, so say so at /health instead of at scan time.
    Advisory only: the prefix is not a contract, so a future format still runs.
    """
    tok = os.environ.get("CLAUDE_CODE_OAUTH_TOKEN", "")
    if not tok or os.environ.get("ANTHROPIC_API_KEY"):
        return None
    if tok != tok.strip() or tok[:1] in "\"'":
        return "CLAUDE_CODE_OAUTH_TOKEN has surrounding whitespace or quotes"
    if not tok.startswith("sk-ant-oat"):
        return "CLAUDE_CODE_OAUTH_TOKEN does not look like a `claude setup-token` value (expected sk-ant-oat…)"
    return None


@app.get("/health")
def health():
    mode = auth_mode()
    detail = {
        "none":
            "no credential. Set CLAUDE_CODE_OAUTH_TOKEN (from `claude "
            "setup-token`) or ANTHROPIC_API_KEY.",
        "claude-dir-but-no-credential":
            "/root/.claude exists but holds no .credentials.json — the CLI will "
            "report 'not logged in'. Set CLAUDE_CODE_OAUTH_TOKEN or "
            "ANTHROPIC_API_KEY.",
    }.get(mode)
    warning = token_shape_warning()
    return {
        "ok": auth_ok(mode),
        "version": 2,
        "measures": MEASURED_ENGINE,
        "auth": mode,
        # Which quota a scan spends. A subscription credential is capped per
        # human, so a service on one degrades under load instead of failing
        # outright — worth being able to read off /health when scans start
        # coming back partial.
        **({"quota": "billed" if mode == "api-key" else "personal-subscription"}
           if auth_ok(mode) else {}),
        **({"error": detail} if detail else {}),
        **({"warning": warning} if warning else {}),
    }


@app.post("/score")
def score(req: ScoreRequest, authorization: str | None = Header(default=None)):
    require_secret(authorization)
    if not req.brand or not req.category:
        raise HTTPException(400, "brand and category are required")

    started = datetime.now(timezone.utc)
    deadline = time.monotonic() + BUDGET_S

    try:
        names = discover_competitors(req.brand, req.category)
    except HTTPException:
        # Without a competitor set the scan can still measure the brand itself.
        names = [req.brand]

    chosen = PROMPTS[:PROMPT_COUNT]

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        answers = list(
            pool.map(
                lambda p: ask_one(req.brand, req.category, p[0], p[1], names),
                chosen,
            )
        )

    # Interpretation is the one step worth dropping under pressure: the numbers
    # above are already measured, and a reading without prose is far better than
    # a 502 that returns nothing at all.
    remaining = deadline - time.monotonic()
    insight = {}
    if remaining > 25 and any(a.get("text") for a in answers):
        try:
            insight = interpret(req.brand, req.category, answers, int(min(remaining, INTERPRET_TIMEOUT_S)))
        except HTTPException:
            insight = {}

    # Every name we now know about: what discovery found, what the answers
    # linked to, and what the interpretation pass could read in them. Recomputed
    # here rather than at ask time because two of those three only exist now.
    named = insight.get("brandsNamed") or []
    all_names: list[str] = []
    for n in [*names, *brands_from_citations(answers), *[str(x) for x in named]]:
        n = str(n).strip()
        if n and not any(stem(n) == stem(e) for e in all_names):
            all_names.append(n)
    names = all_names[:12]

    # Positions were found against the smaller list, so find them again.
    for a in answers:
        if not a.get("text"):
            continue
        ranks = find_positions(a["text"], names)
        a["brands"] = [
            {"name": n, "position": p}
            for n, p in sorted(ranks.items(), key=lambda kv: kv[1])
        ]
        mine = next((p for n, p in ranks.items() if stem(n) == stem(req.brand)), None)
        a["mentioned"] = mine is not None
        a["position"] = mine

    # ---- everything below is arithmetic over the real answers ----------------
    weights = {p[0]: p[2] for p in chosen}
    total_w = sum(weights[a["promptId"]] for a in answers) or 1

    def weighted(name: str) -> float:
        s = 0.0
        for a in answers:
            pos = next((b["position"] for b in a["brands"] if stem(b["name"]) == stem(name)), None)
            if pos:
                s += weights[a["promptId"]] * (1 / pos)
        return s

    scores = {n: weighted(n) for n in names}
    grand = sum(scores.values()) or 1
    competitors = sorted(
        (
            {
                "name": n,
                "share": round(scores[n] / grand * 1000) / 10,
                "you": stem(n) == stem(req.brand),
                "mentions": sum(
                    1 for a in answers if any(stem(b["name"]) == stem(n) for b in a["brands"])
                ),
            }
            for n in names
        ),
        key=lambda c: -c["share"],
    )

    hits = [a for a in answers if a["mentioned"]]
    positions = [a["position"] for a in hits if a["position"]]
    visibility = round(weighted(req.brand) / total_w * 100)

    measured = {
        "name": MEASURED_ENGINE,
        "model": MEASURED_MODEL,
        "measured": True,
        "mentioned": bool(hits),
        "score": visibility,
        "answers": len(answers),
        "mentionRate": round(len(hits) / max(1, len(answers)) * 1000) / 10,
        "avgPosition": round(sum(positions) / len(positions), 2) if positions else None,
    }
    # Reported because the product shows them, flagged because we did not ask
    # them. The UI can then say "estimated" instead of implying a reading.
    estimated = [
        {"name": n, "measured": False, "mentioned": bool(hits), "score": visibility}
        for n in ESTIMATED_ENGINES
    ]

    topics, seen_t = [], set()
    for pid, _t, _w, topic, _i in chosen:
        tid = "t_" + re.sub(r"[^a-z0-9]+", "_", topic.lower())
        if tid not in seen_t:
            seen_t.add(tid)
            topics.append({"id": tid, "name": topic})

    year = started.year
    result = {
        "version": 2,
        "score": visibility,
        "summary": insight.get("summary", ""),
        "topics": topics,
        "prompts": [
            {
                "id": pid,
                "text": tpl.format(c=req.category, year=year),
                "topicId": "t_" + re.sub(r"[^a-z0-9]+", "_", topic.lower()),
                "intent": intent,
                "weight": w,
            }
            for pid, tpl, w, topic, intent in chosen
        ],
        "answers": answers,
        "engines": [measured, *estimated],
        "competitors": competitors,
        "actions": insight.get("actions", []),
        "sentiment": insight.get("sentiment"),
        "citedSources": insight.get("citedSources", []),
        "contentIdeas": insight.get("contentIdeas", []),
        "meta": {
            "measuredAt": started.isoformat(),
            "durationMs": int((datetime.now(timezone.utc) - started).total_seconds() * 1000),
            "samplesPerPrompt": 1,
            "answersCollected": len(answers),
            "answersFailed": sum(1 for a in answers if a.get("failed")),
            # True when the scan ran out of time or an assistant call failed.
            # The product should label a partial reading rather than present it
            # as a complete one.
            "partial": any(a.get("failed") for a in answers) or not insight,
            "budgetSeconds": BUDGET_S,
            "enginesQueried": [
                {"name": MEASURED_ENGINE, "model": MEASURED_MODEL, "grounded": True}
            ],
        },
    }
    return {"source": "claude-code", "result": result}
