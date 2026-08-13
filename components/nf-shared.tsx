"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Shared plumbing for the NF marketing design (ported from the /design lab).
 * Everything here is deliberately small: the motion system is one observer
 * per section that flips a class and disconnects, and the rest is data.
 */

export const ENGINES = [
  "ChatGPT",
  "Gemini",
  "Perplexity",
  "Claude",
  "Grok",
  "Copilot",
  "AI Overviews",
];

export const NAV_LINKS = [
  { href: "/#inside", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}

/**
 * Hands the typed domain to the check section without a page load.
 * visibility-check.tsx listens for `sf:brand` — this contract predates the
 * redesign and is kept verbatim.
 */
export function handoff(value: string) {
  const name = value.trim();
  if (!name) return;
  window.dispatchEvent(new CustomEvent("sf:brand", { detail: name }));
  document
    .getElementById("report")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Scroll reveal within a strict lightness budget: one observer per section
 * root, class-flip only, disconnects after firing. All motion lives in CSS
 * keyed off `.is-in`, transform/opacity only.
 */
export function Reveal({
  as: Tag = "section",
  className = "",
  children,
  ...rest
}: {
  as?: "section" | "div" | "footer";
  className?: string;
  children: React.ReactNode;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.22 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const shown = reduced || inView;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`${className} ${shown ? "is-in" : ""}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Counts to `target` once `started` flips true. Eases out; reduced motion gets the final value. */
export function useCountUp(target: number, started: boolean, ms = 900) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (reduced || !started) return;
    const t0 = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms, reduced, started]);

  if (reduced) return target;
  return started ? n : 0;
}

export function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
