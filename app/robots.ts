import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Every crawler is already covered by the `*` rule below. These vendor groups
// are listed explicitly because some agents (Google-Extended, Applebot-Extended)
// treat a named group as an opt-in signal rather than a plain access grant.
const AI_AGENTS = [
  // OpenAI — training, search index, and live ChatGPT browsing
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Google — Gemini grounding + AI Overviews
  "Googlebot",
  "Google-Extended",
  "GoogleOther",
  // Anthropic
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Microsoft Bing / Copilot
  "bingbot",
  "msnbot",
  // Apple Intelligence / Siri
  "Applebot",
  "Applebot-Extended",
  // Meta AI
  "meta-externalagent",
  "meta-externalfetcher",
  "FacebookBot",
  // Others
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
  "YouBot",
  "CCBot",
  "AI2Bot",
  "Bytespider",
  "cohere-ai",
  "Diffbot",
  "Timpibot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_AGENTS, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
