/**
 * Ready-to-paste snippets attached to a recommendation.
 *
 * These are templates, not measurements: each one is chosen by what the
 * recommendation itself asks for (schema, llms.txt, crawler access, directory
 * listings) and filled in with the brand and category on file. Anything we
 * can't know from the scan stays an obvious <placeholder>, so nothing here
 * ever pretends to be a fact about the brand.
 */

export type Snippet = { label: string; lang: string; code: string };

/** Directories AI answers treat as the category roster, with claim URLs. */
const DIRECTORIES: { match: RegExp; name: string; url: string }[] = [
  { match: /product ?hunt/i, name: "Product Hunt", url: "https://www.producthunt.com/posts/new" },
  { match: /\bg2\b/i, name: "G2", url: "https://www.g2.com/products/new" },
  { match: /capterra/i, name: "Capterra", url: "https://www.capterra.com/vendors/sign-up" },
  { match: /alternativeto/i, name: "AlternativeTo", url: "https://alternativeto.net/manage/add-app/" },
  { match: /saashub/i, name: "SaaSHub", url: "https://www.saashub.com/submit" },
  { match: /opentools/i, name: "OpenTools", url: "https://opentools.ai/submit" },
  { match: /awesome\.tools/i, name: "awesome.tools", url: "https://awesome.tools/submit" },
  { match: /crunchbase/i, name: "Crunchbase", url: "https://www.crunchbase.com/register" },
  { match: /wikidata/i, name: "Wikidata", url: "https://www.wikidata.org/wiki/Special:NewItem" },
  { match: /trustpilot/i, name: "Trustpilot", url: "https://business.trustpilot.com/signup" },
  { match: /\blinkedin\b/i, name: "LinkedIn", url: "https://www.linkedin.com/company/setup/new/" },
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Google-Extended",
  "ClaudeBot",
  "Claude-User",
  "Applebot-Extended",
];

function domainOf(brandName: string): string | null {
  const n = brandName.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/.test(n) ? n : null;
}

function displayName(brandName: string): string {
  const d = domainOf(brandName);
  if (!d) return brandName;
  const bare = d.replace(/^www\./, "").split(".")[0];
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

export function snippetsFor(
  action: { title: string; detail: string },
  brand: { name: string; category: string },
): Snippet[] {
  const text = `${action.title} ${action.detail}`;
  const out: Snippet[] = [];
  const domain = domainOf(brand.name);
  const site = domain ? `https://${domain}` : "https://<your-domain>";
  const name = displayName(brand.name);

  // Structured data — the most common "AI can't tell what you are" fix.
  if (/schema|json-?ld|structured data|organi[sz]ation|softwareapplication|entity/i.test(text)) {
    out.push({
      label: "JSON-LD — paste inside <head>",
      lang: "html",
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "${name}",
  "url": "${site}",
  "applicationCategory": "${brand.category}",
  "description": "<one sentence that names the category: e.g. ${name} is a ${brand.category.toLowerCase()} for ...>",
  "sameAs": [
    "https://www.linkedin.com/company/<handle>",
    "https://www.crunchbase.com/organization/<handle>"
  ]
}
</script>`,
    });
  }

  // Crawler access — pointless to publish content the assistants can't read.
  if (/robots\.txt|crawler|crawl|gptbot|index(ing)?\b/i.test(text)) {
    out.push({
      label: "robots.txt — allow the AI crawlers",
      lang: "bash",
      code: `# public/robots.txt
${AI_CRAWLERS.map((ua) => `User-agent: ${ua}\nAllow: /`).join("\n\n")}

Sitemap: ${site}/sitemap.xml`,
    });
  }

  // llms.txt — a plain-text map of what you are, for assistants.
  if (/llms?\.txt/i.test(text)) {
    out.push({
      label: "llms.txt — save at /llms.txt",
      lang: "markdown",
      code: `# ${name}
> ${brand.category} — <one line on who it's for and what it does>

## Pages
- [Overview](${site}/): what ${name} does
- [Pricing](${site}/pricing): plans and limits
- [Docs](${site}/docs): setup and integrations

## Comparisons
- [${name} vs <competitor>](${site}/vs/<competitor>)`,
    });
  }

  // Directory listings — turn the named sites into a checklist with links.
  const hits = DIRECTORIES.filter((d) => d.match.test(text));
  if (hits.length >= 2) {
    out.push({
      label: "Listing checklist — the sites named above",
      lang: "markdown",
      code: hits
        .map((d) => `- [ ] ${d.name} — ${d.url}`)
        .join("\n"),
    });
  }

  return out;
}
