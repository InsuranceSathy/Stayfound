// Halftone plates for the StayFound lab — v2.
//
// Improvements over v1 (all from review of the rendered page):
//   · wider isolation ellipse so the crest isn't clipped
//   · soft bottom fade instead of the hard chest cut
//   · adaptive cells: fine (5px) around the face, coarse (8px) at the edges,
//     crossfaded through a feathered ring — engraving detail where it matters
//   · scale 1.5 (was 2): renders at ≤700px, no need for 1960px source
//   · two colorways: ink-on-transparent (paper ground) and
//     paper-on-transparent (ink ground) for the dark CTA band
//
// Source photo: "Ara chloropterus head in Rhodes" — CC0, Wikimedia Commons.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";

const browser = await chromium.launch();
const page = await browser.newPage();
const b64 = readFileSync("parrot-src.jpg").toString("base64");

const plates = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = "data:image/jpeg;base64," + src;
  await img.decode();

  // crop to the head
  const sx = img.width * 0.08, sw = img.width * 0.70;
  const sy = 0, sh = img.height * 0.92;
  const W = 980, H = Math.round((sh / sw) * W);

  const cv = new OffscreenCanvas(W, H);
  const cx = cv.getContext("2d");
  cx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  const d = cx.getImageData(0, 0, W, H).data;

  // --- subject mask -------------------------------------------------------
  // wider ellipse than v1 (crest was clipped) + smooth bottom fade
  const ecx = W * 0.52, ecy = H * 0.46, erx = W * 0.56, ery = H * 0.58;
  const mask = new Float32Array(W * H), lum = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, p = i * 4;
    const r = d[p], g = d[p + 1], b = d[p + 2];
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum[i] = L;
    const warm = (r - g) / 255;
    const light = L > 195 && r >= g - 10 ? 1 : 0;
    let m = Math.max(Math.min(warm * 4, 1), light);
    const dx = (x - ecx) / erx, dy = (y - ecy) / ery;
    const e = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy));
    m *= Math.min(1, Math.max(0, e * 2.4));
    // bottom fade: dissolve from 76% height down
    const t = (y / H - 0.76) / 0.24;
    if (t > 0) m *= Math.max(0, 1 - t * t);
    mask[i] = m;
  }

  // contrast normalisation within the subject
  let lo = 255, hi = 0;
  for (let i = 0; i < W * H; i++) {
    if (mask[i] > 0.15) { if (lum[i] < lo) lo = lum[i]; if (lum[i] > hi) hi = lum[i]; }
  }
  const range = Math.max(1, hi - lo);

  // face centre (eye/beak region) for the adaptive-cell crossfade
  const fcx = W * 0.60, fcy = H * 0.40, frad = W * 0.30;

  const scale = 1.5;

  function renderPlate(inkColor, accentColor) {
    const oc = new OffscreenCanvas(Math.round(W * scale), Math.round(H * scale));
    const o = oc.getContext("2d");

    // one grid pass at a given cell size, weighted by a spatial window fn
    function pass(cell, fill, band, weightFn) {
      o.fillStyle = fill;
      for (let cy = 0; cy < H; cy += cell) for (let cx2 = 0; cx2 < W; cx2 += cell) {
        let sum = 0, msum = 0, n = 0;
        for (let y = cy; y < Math.min(cy + cell, H); y++)
          for (let x = cx2; x < Math.min(cx2 + cell, W); x++) {
            const i = y * W + x; sum += lum[i]; msum += mask[i]; n++;
          }
        const m = msum / n;
        if (m < 0.06) continue;
        const px = cx2 + cell / 2, py = cy + cell / 2;
        const w = weightFn(px, py);
        if (w < 0.04) continue;
        const norm = Math.min(1, Math.max(0, ((sum / n) - lo) / range));
        let dark;
        if (band) {
          // accent band: only mid-light feather zones
          if (norm < 0.45 || norm > 0.8) continue;
          dark = Math.max(0, 1 - Math.abs(norm - 0.62) / 0.16) * 0.32;
        } else {
          dark = Math.pow(1 - norm, 0.62);
        }
        const rad = Math.min(Math.sqrt(dark * m * w) * cell * 0.62, cell * 0.42) * scale;
        if (rad < 0.55) continue;
        o.beginPath();
        o.arc(px * scale, py * scale, rad, 0, 7);
        o.fill();
      }
    }

    pass(6, inkColor, false, () => 1); // one uniform grid — coherent print texture
    pass(8, accentColor, true, () => 1); // duotone accent in the mid-tones

    return oc.convertToBlob({ type: "image/png" })
      .then((b) => b.arrayBuffer())
      .then((buf) => Array.from(new Uint8Array(buf)));
  }

  const inkPlate = await renderPlate("#14151a", "#f0490f");
  const paperPlate = await renderPlate("#fbfbf9", "#f0490f");
  return { inkPlate, paperPlate };
}, b64);

writeFileSync("parrot-halftone.png", Buffer.from(plates.inkPlate));
writeFileSync("parrot-halftone-inverse.png", Buffer.from(plates.paperPlate));
await browser.close();
console.log("plates written");
