"use client";

import { useEffect, useRef } from "react";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
  shape: "rect" | "circle";
};

const COLORS = ["#e96d65", "#4f4274", "#10b981", "#f59e0b", "#6b5ca8", "#f5aba5"];

export default function OrderConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const canvasEl = canvas;
    const context = ctx;

    let frame = 0;
    let animation = 0;
    const startedAt = performance.now();
    const duration = 3400;
    const pieces: Piece[] = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvasEl.width = Math.floor(window.innerWidth * dpr);
      canvasEl.height = Math.floor(window.innerHeight * dpr);
      canvasEl.style.width = `${window.innerWidth}px`;
      canvasEl.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function burst(originX: number, originY: number, count: number) {
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const speed = 5 + Math.random() * 8;
        pieces.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 3,
          size: 5 + Math.random() * 8,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.24,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: Math.random() > 0.22 ? "rect" : "circle",
        });
      }
    }

    function draw(now: number) {
      const elapsed = now - startedAt;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (frame === 0) {
        burst(window.innerWidth * 0.5, Math.min(window.innerHeight * 0.28, 220), 110);
        burst(window.innerWidth * 0.18, Math.min(window.innerHeight * 0.32, 260), 36);
        burst(window.innerWidth * 0.82, Math.min(window.innerHeight * 0.32, 260), 36);
      }

      for (let i = pieces.length - 1; i >= 0; i -= 1) {
        const piece = pieces[i];
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.18;
        piece.vx *= 0.992;
        piece.rotation += piece.spin;

        const alpha = Math.max(0, 1 - elapsed / duration);
        context.save();
        context.globalAlpha = alpha;
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        if (piece.shape === "circle") {
          context.beginPath();
          context.arc(0, 0, piece.size * 0.45, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * 0.62);
        }
        context.restore();

        if (piece.y > window.innerHeight + 30 || alpha <= 0) pieces.splice(i, 1);
      }

      frame += 1;
      if (elapsed < duration && pieces.length) {
        animation = requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    animation = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" aria-hidden />;
}
