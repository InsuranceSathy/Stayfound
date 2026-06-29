"use client";

import { useEffect, useRef } from "react";

type Series = {
  name: string;
  you?: boolean;
  color: string;
  data: number[];
};

const SERIES: Series[] = [
  { name: "Your brand", you: true, color: "#FB4D17", data: [52, 50, 51, 57, 63, 66, 64] },
  { name: "Notion", color: "#A89F8E", data: [44, 43, 45, 49, 46, 52, 55] },
  { name: "Asana", color: "#C2B9A7", data: [50, 48, 46, 44, 50, 49, 45] },
  { name: "Linear", color: "#CFC8B8", data: [33, 31, 30, 34, 32, 38, 40] },
  { name: "Monday", color: "#DCD6C7", data: [28, 27, 29, 31, 28, 30, 33] },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
      padB = 26,
      maxY = 72,
      H = 280;
    let W = 0;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mono =
      getComputedStyle(document.body).getPropertyValue("--mono") || "monospace";

    const X = (i: number) => padL + (W - padL - padR) * (i / (DAYS.length - 1));
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
      [0, 20, 40, 60].forEach((g) => {
        const y = Y(g);
        ctx!.strokeStyle = "#EBE6DB";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(padL, y);
        ctx!.lineTo(W - padR, y);
        ctx!.stroke();
        ctx!.fillStyle = "#B6AE9E";
        ctx!.textAlign = "right";
        ctx!.fillText(`${g}%`, padL - 8, y);
      });
      ctx!.textAlign = "center";
      ctx!.textBaseline = "top";
      ctx!.fillStyle = "#B6AE9E";
      DAYS.forEach((d, i) => ctx!.fillText(d, X(i), H - padB + 8));

      const order = SERIES.slice().sort(
        (a, b) => (a.you ? 1 : 0) - (b.you ? 1 : 0),
      );
      order.forEach((s) => {
        const n = s.data.length;
        const seg = (n - 1) * p;
        const last = Math.floor(seg);
        const frac = seg - last;
        ctx!.beginPath();
        ctx!.lineWidth = s.you ? 3 : 1.6;
        ctx!.strokeStyle = s.color;
        ctx!.lineJoin = "round";
        for (let i = 0; i <= last && i < n; i++) {
          const x = X(i),
            y = Y(s.data[i]);
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        if (last < n - 1) {
          const x0 = X(last),
            y0 = Y(s.data[last]),
            x1 = X(last + 1),
            y1 = Y(s.data[last + 1]);
          ctx!.lineTo(x0 + (x1 - x0) * frac, y0 + (y1 - y0) * frac);
        }
        ctx!.stroke();
        if (s.you && p >= 1) {
          const ex = X(n - 1),
            ey = Y(s.data[n - 1]);
          ctx!.beginPath();
          ctx!.fillStyle = s.color;
          ctx!.arc(ex, ey, 4.5, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.beginPath();
          ctx!.strokeStyle = "#fff";
          ctx!.lineWidth = 2;
          ctx!.arc(ex, ey, 4.5, 0, Math.PI * 2);
          ctx!.stroke();
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
          height={280}
          role="img"
          aria-label="Weekly AI visibility: your brand rising above five competitors"
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
