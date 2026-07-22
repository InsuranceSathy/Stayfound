"use client";

import { useEffect, useRef } from "react";

type Series = {
  name: string;
  you?: boolean;
  color: string;
  data: number[];
};

// Categorical series stepped for the dark surface (#0e0d16) and validated as a
// set: passes the lightness band, chroma floor, CVD separation (worst adjacent
// ΔE 8.4), normal-vision floor (19.8) and 3:1 contrast.
// Endpoints match the share-of-voice table below the chart, so the two panels
// tell the same story.
const SERIES: Series[] = [
  { name: "Your brand", you: true, color: "#9085e9", data: [50, 49, 52, 54, 57, 60, 61.5] },
  { name: "Notion", color: "#d95926", data: [44, 43, 45, 48, 46, 47, 46.3] },
  { name: "Asana", color: "#199e70", data: [50, 48, 46, 44, 47, 46, 45.1] },
  { name: "Linear", color: "#c98500", data: [26, 27, 29, 28, 30, 31, 31.8] },
];

// Answer share is re-measured per sweep of the prompt set, not per calendar day —
// the axis is the 30d window's sweep dates, not days of the week.
const SWEEPS = ["Jun 22", "Jun 27", "Jul 2", "Jul 7", "Jul 12", "Jul 17", "Jul 21"];

export function VisibilityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padL = 34,
      padR = 12,
      padT = 14,
      padB = 24,
      maxY = 72,
      H = 132;
    let W = 0;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mono =
      getComputedStyle(document.body).getPropertyValue("--mono") || "monospace";

    const X = (i: number) => padL + (W - padL - padR) * (i / (SWEEPS.length - 1));
    const Y = (v: number) => padT + (H - padT - padB) * (1 - v / maxY);

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      W = canvas!.clientWidth;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(p: number) {
      ctx!.clearRect(0, 0, W, H);
      ctx!.font = `11px ${mono}`;
      ctx!.textBaseline = "middle";
      [20, 40, 60].forEach((g) => {
        const y = Y(g);
        ctx!.strokeStyle = "rgba(255,255,255,0.07)";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(padL, y);
        ctx!.lineTo(W - padR, y);
        ctx!.stroke();
        ctx!.fillStyle = "#6b6580";
        ctx!.textAlign = "right";
        ctx!.fillText(`${g}%`, padL - 8, y);
      });
      ctx!.textBaseline = "top";
      ctx!.fillStyle = "#6b6580";
      // thin the sweep labels before they collide, and pull the outer two inside
      // the plot so neither is clipped by the panel edge
      const every = W < 560 ? 2 : 1;
      SWEEPS.forEach((d, i) => {
        const end = i === SWEEPS.length - 1;
        if (!end && i % every !== 0) return;
        ctx!.textAlign = i === 0 ? "left" : end ? "right" : "center";
        ctx!.fillText(d, X(i), H - padB + 8);
      });

      const order = SERIES.slice().sort(
        (a, b) => (a.you ? 1 : 0) - (b.you ? 1 : 0),
      );
      order.forEach((s) => {
        const n = s.data.length;
        const seg = (n - 1) * p;
        const last = Math.floor(seg);
        const frac = seg - last;
        const tipX =
          last < n - 1 ? X(last) + (X(last + 1) - X(last)) * frac : X(n - 1);
        const tipY =
          last < n - 1
            ? Y(s.data[last]) + (Y(s.data[last + 1]) - Y(s.data[last])) * frac
            : Y(s.data[n - 1]);

        const trace = () => {
          for (let i = 0; i <= last && i < n; i++) {
            const x = X(i),
              y = Y(s.data[i]);
            if (i === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          }
          if (last < n - 1) ctx!.lineTo(tipX, tipY);
        };

        if (s.you) {
          // soft area under the highlighted series
          const g = ctx!.createLinearGradient(0, padT, 0, H - padB);
          g.addColorStop(0, "rgba(144,133,233,0.3)");
          g.addColorStop(1, "rgba(144,133,233,0)");
          ctx!.beginPath();
          trace();
          ctx!.lineTo(tipX, H - padB);
          ctx!.lineTo(X(0), H - padB);
          ctx!.closePath();
          ctx!.fillStyle = g;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.lineWidth = s.you ? 3 : 1.6;
        if (s.you) {
          const lg = ctx!.createLinearGradient(padL, 0, W - padR, 0);
          lg.addColorStop(0, "#7c6cf5");
          lg.addColorStop(1, "#b07ff0");
          ctx!.strokeStyle = lg;
        } else {
          ctx!.strokeStyle = s.color;
        }
        ctx!.lineJoin = "round";
        trace();
        ctx!.stroke();
        if (s.you && p >= 1) {
          const ex = X(n - 1),
            ey = Y(s.data[n - 1]);
          ctx!.beginPath();
          ctx!.fillStyle = "#b07ff0";
          ctx!.shadowColor = "rgba(176,127,240,0.9)";
          ctx!.shadowBlur = 12;
          ctx!.arc(ex, ey, 4.5, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
          ctx!.beginPath();
          ctx!.strokeStyle = "#0e0d16";
          ctx!.lineWidth = 2;
          ctx!.arc(ex, ey, 4.5, 0, Math.PI * 2);
          ctx!.stroke();
          // direct-label the one series that matters, at its endpoint only
          ctx!.font = `600 12px ${mono}`;
          ctx!.textAlign = "right";
          ctx!.textBaseline = "bottom";
          ctx!.fillStyle = "#e9e4f5";
          ctx!.fillText(`${s.data[n - 1]}%`, ex - 10, ey - 5);
        }
      });
    }

    let raf = 0;
    function animate() {
      const dur = 1200;
      let start: number | null = null;
      function step(ts: number) {
        if (start === null) start = ts;
        const t = Math.min(1, (ts - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        draw(e);
        if (t < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }

    function onResize() {
      resize();
      draw(1);
    }

    resize();
    if (reduce) draw(1);
    else animate();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="chart-wrap">
        <canvas
          ref={canvasRef}
          height={132}
          role="img"
          aria-label="Share of AI answers across the tracked prompt set, measured every five days from Jun 22 to Jul 21: your brand rises from 50% to 61.5%, moving ahead of Asana at 45.1% and Notion at 46.3%, with Linear at 31.8%"
        />
      </div>
      <div className="legend">
        {SERIES.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </>
  );
}
