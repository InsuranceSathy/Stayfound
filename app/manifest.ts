import type { MetadataRoute } from "next";

/**
 * Web app manifest — lets StayFound be installed to a phone home screen and
 * open without browser chrome. `start_url` points at the dashboard because
 * that's what an installed copy is for; the marketing site is still reachable.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StayFound — AI search visibility",
    short_name: "StayFound",
    description:
      "Track how ChatGPT, Gemini, Perplexity and Claude answer your buyers' questions — and what to fix next.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08070d",
    theme_color: "#08070d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Maskable: the art is full-bleed, so a platform mask can't clip the pin.
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
