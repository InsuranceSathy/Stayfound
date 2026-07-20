// Surfaced scoring service — pure Node HTTP server (no dependencies).
// Run on your Mac; expose via Cloudflare Tunnel; Surfaced calls it and falls
// back to its cloud pipeline whenever this is unreachable.

import { createServer } from "node:http";
import { measureVisibility, ollamaReachable } from "./measure.mjs";

const PORT = Number(process.env.PORT || 8787);
const SECRET = process.env.SCORING_SECRET || "";

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1e6) reject(new Error("body too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") return send(res, 204, {});

  if (req.method === "GET" && url.pathname === "/health") {
    const ollama = await ollamaReachable();
    return send(res, 200, { ok: true, ollama, ts: new Date().toISOString() });
  }

  if (req.method === "POST" && url.pathname === "/score") {
    if (SECRET) {
      const auth = req.headers["authorization"] || "";
      if (auth !== `Bearer ${SECRET}`) return send(res, 401, { error: "unauthorized" });
    }
    let body;
    try {
      body = JSON.parse((await readBody(req)) || "{}");
    } catch {
      return send(res, 400, { error: "invalid json" });
    }
    const brand = String(body.brand ?? "").trim().slice(0, 80);
    const category = String(body.category ?? "").trim().slice(0, 120);
    if (!brand || !category)
      return send(res, 400, { error: "brand and category required" });

    try {
      const { live, result } = await measureVisibility(brand, category);
      return send(res, 200, { live, result, source: "self-hosted" });
    } catch (err) {
      console.error("score error:", err);
      return send(res, 500, { error: "scoring failed" });
    }
  }

  return send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Surfaced scoring service listening on http://localhost:${PORT}`);
  console.log(`  auth: ${SECRET ? "on" : "OFF (set SCORING_SECRET)"}`);
});
