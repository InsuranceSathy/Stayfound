// Contrast audit: every visible text node on every marketing page, colour vs
// effective background. Flags ratio < 2.2 (unreadable or near-invisible).
import { chromium } from "playwright";

const PAGES = ["/", "/pricing", "/about", "/blog", "/demo", "/sign-in", "/privacy", "/terms"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// collect blog post URLs from the index
await page.goto("http://localhost:3000/blog", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const posts = await page.evaluate(() =>
  [...document.querySelectorAll("a[href^='/blog/']")]
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && !h.includes("/tag/"))
);
const targets = [...PAGES, ...[...new Set(posts)].slice(0, 5)];

const issues = new Map();
for (const path of targets) {
  await page.goto("http://localhost:3000" + path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  // force reveals so hidden-until-scroll text is evaluated in final state
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);

  const found = await page.evaluate(() => {
    function parse(c) {
      const m = c.match(/rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/);
      return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
    }
    function lum({ r, g, b }) {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }
    function contrast(a, b) {
      const l1 = lum(a), l2 = lum(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    function effBg(el) {
      let n = el;
      while (n && n !== document.documentElement) {
        const bg = parse(getComputedStyle(n).backgroundColor);
        if (bg && bg.a > 0.5) return bg;
        n = n.parentElement;
      }
      return { r: 251, g: 251, b: 249, a: 1 };
    }
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
      if (!text || text.length < 3) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const col = parse(cs.color);
      if (!col) continue;
      const ratio = contrast(col, effBg(el));
      if (ratio < 2.2) {
        const sig = el.tagName + "." + (el.className?.toString?.().split(" ")[0] ?? "");
        out.push({ sig, ratio: Math.round(ratio * 100) / 100, text: text.slice(0, 50) });
      }
    }
    return out;
  });
  for (const f of found) {
    const key = f.sig;
    if (!issues.has(key)) issues.set(key, { ...f, pages: new Set() });
    issues.get(key).pages.add(path);
  }
}

for (const [sig, v] of [...issues.entries()].sort((a, b) => a[1].ratio - b[1].ratio)) {
  console.log(`${v.ratio}  ${sig}  [${[...v.pages].join(", ")}]  "${v.text}"`);
}
console.log(issues.size === 0 ? "NO CONTRAST ISSUES" : `${issues.size} unique offenders`);
await browser.close();
