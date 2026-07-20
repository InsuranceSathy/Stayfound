// Surfaced scoring service — measurement pipeline (pure Node, no deps).
//
// Uses local Ollama for auxiliary reasoning + as a local "engine", and any
// cloud engines you configure with a key. Falls back to a deterministic
// sample if no engine is reachable, so /score always returns a valid result.

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:14b-instruct";
const PROMPT_COUNT = Number(process.env.SCORING_PROMPTS || 6);
const GEMINI_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
// Include the local Ollama model as an "engine" perspective (default on).
const OLLAMA_ENGINE = process.env.OLLAMA_ENGINE !== "0";

const PROMPT_TEMPLATES = [
  (c) => `What are the best ${c}?`,
  (c) => `Can you recommend a good ${c}?`,
  (c) => `What is the most popular ${c} right now?`,
  (c) => `Best ${c} for a small business?`,
  (c) => `Best ${c} for startups?`,
  (c) => `What are the top alternatives for ${c}?`,
  (c) => `Which ${c} do experts recommend?`,
  (c) => `What ${c} should I use?`,
];

async function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error(`${label} timed out`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(t);
  }
}

export async function ollamaReachable() {
  try {
    const res = await withTimeout(
      fetch(`${OLLAMA_BASE}/api/tags`),
      2000,
      "ollama ping",
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function callOllama(model, prompt, numPredict = 320) {
  const res = await withTimeout(
    fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: { num_predict: numPredict, temperature: 0.7 },
      }),
    }),
    90000,
    "ollama chat",
  );
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const data = await res.json();
  return data.message?.content ?? "";
}

async function callGemini(model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const res = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }),
    60000,
    "gemini",
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? ""
  );
}

function engines() {
  const list = [];
  if (GEMINI_KEY)
    list.push({ name: "Gemini", kind: "gemini", model: GEMINI_MODEL });
  if (OLLAMA_ENGINE)
    list.push({
      name: process.env.OLLAMA_ENGINE_LABEL || "Local (Ollama)",
      kind: "ollama",
      model: OLLAMA_MODEL,
    });
  return list;
}

async function queryEngine(engine, prompt) {
  const full = `${prompt}\n\nName specific products or brands.`;
  if (engine.kind === "gemini") return callGemini(engine.model, full);
  return callOllama(engine.model, full);
}

function firstIndex(text, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${esc})`, "iu");
    const m = re.exec(text);
    return m ? m.index + m[1].length : -1;
  } catch {
    return text.toLowerCase().indexOf(name.toLowerCase());
  }
}

async function discoverCompetitors(brand, category, useOllama) {
  if (useOllama) {
    try {
      const text = await callOllama(
        OLLAMA_MODEL,
        `List up to 8 well-known brand or product names in the category "${category}" that a buyer would compare. Reply with ONLY a comma-separated list of names, nothing else. Include "${brand}" if relevant.`,
        160,
      );
      const names = text
        .split(/[,\n]/)
        .map((s) => s.replace(/^[\d.\-*\s]+/, "").trim())
        .filter((s) => s && s.length <= 40);
      const clean = [...new Set(names)].slice(0, 8);
      if (clean.length >= 2) return clean;
    } catch {
      /* fall through */
    }
  }
  // heuristic fallback set
  return ["Acme", "Northwind", "Lumen", "Vertex", "Brightline"];
}

// ---- deterministic sample fallback (mirrors the app) ----
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
function sampleResult(brand, category) {
  const h = hash(brand.toLowerCase() + "|" + category.toLowerCase());
  const score = 28 + (h % 46);
  const generic = ["Acme", "Northwind", "Lumen", "Vertex", "Brightline", "Cobalt"];
  const comps = generic
    .map((n, i) => ({ name: n, share: 30 + ((h >> (i * 2)) % 45) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 4);
  const competitors = [{ name: brand, share: score, you: true }, ...comps].sort(
    (a, b) => b.share - a.share,
  );
  return {
    score,
    summary: `${brand} shows partial presence in AI answers for "${category}".`,
    engines: ["ChatGPT", "Gemini", "Claude"].map((name) => ({
      name,
      mentioned: true,
      score,
    })),
    competitors,
    actions: [
      {
        title: "Win the comparison prompts",
        detail: `Publish a clear "${brand} vs alternatives" page.`,
        impact: "high",
      },
      {
        title: "Earn third-party citations",
        detail: "Get listed in the review sites AI answers cite.",
        impact: "high",
      },
      {
        title: "Tighten your category language",
        detail: `Say plainly that you are ${category}.`,
        impact: "medium",
      },
    ],
    meta: { method: "sample" },
  };
}

export async function measureVisibility(brand, category) {
  const eng = engines();
  if (eng.length === 0) {
    return { live: false, result: sampleResult(brand, category) };
  }

  const useOllama = await ollamaReachable();
  const prompts = PROMPT_TEMPLATES.slice(0, PROMPT_COUNT).map((t) => t(category));
  const brandList = await discoverCompetitors(brand, category, useOllama);
  const brandKey = brand.toLowerCase();
  const brands = [...new Set([brand, ...brandList])];
  if (!brands.some((b) => b.toLowerCase() === brandKey)) brands.unshift(brand);

  const cells = [];
  for (const e of eng) {
    const results = await Promise.all(
      prompts.map(async (p) => {
        try {
          const text = await queryEngine(e, p);
          const found = brands
            .map((b) => ({ b, idx: firstIndex(text, b) }))
            .filter((x) => x.idx >= 0)
            .sort((a, b) => a.idx - b.idx);
          const ranks = {};
          found.forEach((f, i) => (ranks[f.b.toLowerCase()] = i + 1));
          return { engine: e.name, prompt: p, text, ranks };
        } catch {
          return { engine: e.name, prompt: p, text: null, ranks: {} };
        }
      }),
    );
    cells.push(...results);
  }

  const valid = cells.filter((c) => c.text !== null);
  if (valid.length === 0) {
    return { live: false, result: sampleResult(brand, category) };
  }

  const w = (rank) => (rank ? 1 / rank : 0);
  const brandWeighted = valid.reduce((s, c) => s + w(c.ranks[brandKey]), 0);
  const visibility = (brandWeighted / valid.length) * 100;
  const appeared = valid.filter((c) => c.ranks[brandKey]).length;

  const engineNames = [...new Set(valid.map((c) => c.engine))];
  const engineStats = engineNames.map((name) => {
    const ec = valid.filter((c) => c.engine === name);
    const score = (ec.reduce((s, c) => s + w(c.ranks[brandKey]), 0) / ec.length) * 100;
    return { name, mentioned: score > 0, score: Math.round(score) };
  });

  const scoreByBrand = new Map(brands.map((b) => [b, 0]));
  for (const c of valid)
    for (const b of brands)
      scoreByBrand.set(b, (scoreByBrand.get(b) || 0) + w(c.ranks[b.toLowerCase()]));
  const total = [...scoreByBrand.values()].reduce((a, b) => a + b, 0) || 1;
  const competitors = brands
    .map((b) => ({
      name: b,
      share: Math.round(((scoreByBrand.get(b) || 0) / total) * 1000) / 10,
      you: b.toLowerCase() === brandKey,
    }))
    .filter((c) => c.share > 0 || c.you)
    .sort((a, b) => b.share - a.share);
  const rank = competitors.findIndex((c) => c.you) + 1;

  const promptStats = prompts.map((p) => {
    const pc = valid.filter((c) => c.prompt === p);
    const hits = pc.filter((c) => c.ranks[brandKey]).length;
    return { prompt: p, hits, total: pc.length };
  });
  const absent = promptStats.filter((p) => p.total > 0 && p.hits === 0);
  const topRival = competitors.find((c) => !c.you);
  const weakest = [...engineStats].sort((a, b) => a.score - b.score)[0];
  const yourShare = competitors.find((c) => c.you)?.share ?? 0;

  const actions = [];
  if (absent.length)
    actions.push({
      title: `You're invisible for ${absent.length} key ${absent.length === 1 ? "prompt" : "prompts"}`,
      detail: `No engine mentioned you for e.g. "${absent[0].prompt}". Publish content that answers it and earn citations in the sources those answers use.`,
      impact: "high",
    });
  if (topRival && topRival.share > yourShare)
    actions.push({
      title: `${topRival.name} is beating you on share of voice`,
      detail: `${topRival.name} holds ${topRival.share}% vs your ${yourShare}%. Study the answers they win and get into the sources cited there.`,
      impact: "high",
    });
  if (weakest && weakest.score < 50)
    actions.push({
      title: `Weakest on ${weakest.name}`,
      detail: `Your visibility on ${weakest.name} is ${weakest.score}%. Structure content that engine favors.`,
      impact: "medium",
    });
  while (actions.length < 3)
    actions.push({
      title: "Tighten your category language",
      detail: `State plainly that you are ${category} in the words buyers use.`,
      impact: "medium",
    });

  return {
    live: true,
    result: {
      score: Math.round(visibility),
      summary: `${brand} appeared in ${appeared} of ${valid.length} AI answers we sampled across ${engineNames.length} engine(s) (${Math.round(
        visibility,
      )}% visibility). You rank #${rank} of ${competitors.length} for share of voice.`,
      engines: engineStats,
      competitors,
      actions: actions.slice(0, 3),
      meta: {
        method: "measured",
        enginesQueried: engineNames,
        promptCount: prompts.length,
        cellsSampled: valid.length,
        cellsTotal: cells.length,
        prompts: promptStats,
      },
    },
  };
}
