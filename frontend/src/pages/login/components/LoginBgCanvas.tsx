import { useEffect, useRef } from "react";

// Equilateral triangles: center (cx, cy), radius r, rotation offset. All sides equal.
const SLABS = [
  {
    ca: [172, 188, 238],
    cb: [205, 155, 230],
    op: 0.78,
    cx: 0.15,
    cy: 0.12,
    r: 0.35,
    rot: 0,
    spd: 0.000008,
  },
  {
    ca: [215, 135, 215],
    cb: [255, 80, 148],
    op: 0.68,
    cx: 0.22,
    cy: 0.18,
    r: 0.32,
    rot: 0.4,
    spd: 0.00001,
  },
  {
    ca: [255, 165, 55],
    cb: [255, 215, 75],
    op: 0.72,
    cx: 0.12,
    cy: 0.25,
    r: 0.38,
    rot: 0.8,
    spd: 0.000012,
  },
  {
    ca: [255, 72, 138],
    cb: [255, 128, 72],
    op: 0.62,
    cx: 0.28,
    cy: 0.08,
    r: 0.3,
    rot: 1.2,
    spd: 0.000009,
  },
  {
    ca: [155, 175, 248],
    cb: [125, 205, 255],
    op: 0.52,
    cx: 0.08,
    cy: 0.15,
    r: 0.33,
    rot: 1.6,
    spd: 0.000007,
  },
];

const TAU = Math.PI * 2;
const SCALE = 1.45;
const OX = 54;
const OY = 64;

export default function LoginBgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const c = canvas;
    const ctx2 = ctx;
    let W = 0;
    let H = 0;
    let rafId: number;

    function resize() {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
    }

    function vertex(slab: (typeof SLABS)[0], ts: number, angleOffset: number) {
      const T = ts * slab.spd * TAU + slab.rot * TAU;
      const angle = T + angleOffset;
      const ux = slab.cx + slab.r * Math.cos(angle);
      const uy = slab.cy + slab.r * Math.sin(angle);
      const size = Math.min(W, H) * SCALE;
      return {
        x: W - OX - ux * size,
        y: H - OY - uy * size,
      };
    }

    function drawSlab(slab: (typeof SLABS)[0], ts: number) {
      const A = vertex(slab, ts, 0); // apex (top)
      const B = vertex(slab, ts, TAU / 3); // bottom-right
      const C = vertex(slab, ts, (TAU * 2) / 3); // bottom-left

      const midX = (B.x + C.x) / 2;
      const midY = (B.y + C.y) / 2;

      // ── Fill gradient ──
      const grd = ctx2.createLinearGradient(A.x, A.y, midX, midY);
      const [r0, g0, b0] = slab.ca;
      const [r1, g1, b1] = slab.cb;
      grd.addColorStop(0, `rgba(${r0},${g0},${b0},0)`);
      grd.addColorStop(0.12, `rgba(${r0},${g0},${b0},${slab.op * 0.55})`);
      grd.addColorStop(
        0.5,
        `rgba(${Math.round((r0 + r1) / 2)},${Math.round((g0 + g1) / 2)},${Math.round((b0 + b1) / 2)},${slab.op})`,
      );
      grd.addColorStop(1, `rgba(${r1},${g1},${b1},${slab.op * 0.45})`);

      ctx2.save();
      ctx2.beginPath();
      ctx2.moveTo(A.x, A.y);
      ctx2.lineTo(B.x, B.y);
      ctx2.lineTo(C.x, C.y);
      ctx2.closePath();
      ctx2.fillStyle = grd;
      ctx2.fill();

      // ── Edge highlights ──
      const [re, ge, be] = slab.cb;
      ctx2.beginPath();
      ctx2.moveTo(A.x, A.y);
      ctx2.lineTo(B.x, B.y);
      ctx2.strokeStyle = `rgba(${re},${ge},${be},0.28)`;
      ctx2.lineWidth = 1.5;
      ctx2.stroke();

      ctx2.beginPath();
      ctx2.moveTo(A.x, A.y);
      ctx2.lineTo(C.x, C.y);
      ctx2.strokeStyle = `rgba(${re},${ge},${be},0.16)`;
      ctx2.lineWidth = 0.8;
      ctx2.stroke();

      // ── Alert ! symbol ──
      // Centroid of the triangle
      const centroidX = (A.x + B.x + C.x) / 3;
      const centroidY = (A.y + B.y + C.y) / 3;

      // The visual "center of gravity" in a warning triangle is below centroid.
      // We shift the whole symbol down toward the base midpoint.
      const symbolCX = centroidX;
      const symbolCY = centroidY;

      // Triangle height and base width for sizing the symbol
      const triH = Math.sqrt(Math.pow(midX - A.x, 2) + Math.pow(midY - A.y, 2));
      const baseW = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));

      // Derive the "up" direction of this triangle from apex to base-midpoint
      const T = ts * slab.spd * TAU + slab.rot * TAU;
      const apexToCenterAngle = Math.atan2(midY - A.y, midX - A.x);

      // Symbol dimensions relative to triangle size — kept small
      const exclamH = triH * 0.18; // bar height
      const exclamW = baseW * 0.045; // bar width
      const dotSize = exclamW * 1.1; // triangle dot
      const gap = exclamH * 0.13; // gap between bar and dot

      ctx2.save();
      ctx2.translate(symbolCX, symbolCY);
      // Rotate so ! is upright within the (rotating) triangle
      ctx2.rotate(apexToCenterAngle - Math.PI / 2);

      const dr = Math.max(0, re - 60);
      const dg = Math.max(0, ge - 60);
      const db = Math.max(0, be - 60);
      const iconColor = `rgba(${dr},${dg},${db},0.28)`;

      // Total height of ! glyph (bar + gap + dot)
      const totalH = exclamH + gap + dotSize;

      // Draw bar — centered horizontally, upper portion
      const barX = -exclamW / 2;
      const barY = -totalH / 2;
      ctx2.fillStyle = iconColor;
      ctx2.beginPath();
      // Rounded top on the bar
      const br = exclamW * 0.35;
      ctx2.roundRect(barX, barY, exclamW, exclamH, [
        br,
        br,
        br * 0.4,
        br * 0.4,
      ]);
      ctx2.fill();

      // Draw dot — triangle (apex up, base down), below the bar
      const dotX = -dotSize / 2;
      const dotY = barY + exclamH + gap;
      ctx2.beginPath();
      ctx2.moveTo(dotX + dotSize / 2, dotY);
      ctx2.lineTo(dotX + dotSize, dotY + dotSize);
      ctx2.lineTo(dotX, dotY + dotSize);
      ctx2.closePath();
      ctx2.fill();

      ctx2.restore();
    }

    function frame(ts: number) {
      ctx2.clearRect(0, 0, W, H);
      ctx2.fillStyle = "#ffffff";
      ctx2.fillRect(0, 0, W, H);

      for (const slab of SLABS) drawSlab(slab, ts);

      // Radial fade from the anchor corner
      const cornerSize = Math.min(W, H) * SCALE * 1.4;
      const cx = W - OX;
      const cy = H - OY;
      const fadeCorner = ctx2.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        cornerSize,
      );
      fadeCorner.addColorStop(0, "rgba(255,255,255,0)");
      fadeCorner.addColorStop(0.6, "rgba(255,255,255,0.3)");
      fadeCorner.addColorStop(1, "rgba(255,255,255,0.85)");
      ctx2.fillStyle = fadeCorner;
      ctx2.fillRect(0, 0, W, H);

      rafId = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bgCanvas"
      className="fixed inset-0 z-0 w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
