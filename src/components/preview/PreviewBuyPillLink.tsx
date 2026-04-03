"use client";

import { useEffect, useRef } from "react";
import { CHROME_HEADER_FONT, CHROME_TOP_PILL_BASE } from "@/lib/chromeUi";

type Props = { href: string };

interface RainbowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  size: number;
  hue: number;
}

const LINK_CLASS = `${CHROME_TOP_PILL_BASE} relative w-[120px] shrink-0 overflow-hidden tabular-nums lowercase select-none !bg-[#2a2c2d] !text-[#ffffff] hover:!bg-[#ffffff] hover:!text-[#2a2c2d] active:!bg-[#ffffff] active:!text-[#2a2c2d] transition-[color,background-color] duration-150`;

export default function PreviewBuyPillLink({ href }: Props) {
  const wrapRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<RainbowParticle[]>([]);
  const rafRef = useRef(0);
  const hoverRef = useRef(false);
  const tickRef = useRef(0);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  function frame() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      rafRef.current = 0;
      return;
    }

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = 0;
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    tickRef.current += 1;
    if (hoverRef.current && tickRef.current % 2 === 0) {
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: h + 3,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -1.1 - Math.random() * 1.6,
          a: 0.5 + Math.random() * 0.4,
          size: 0.9 + Math.random() * 2.4,
          hue: (Math.random() * 360 + tickRef.current * 4) % 360,
        });
      }
    }

    const ps = particlesRef.current;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.a -= hoverRef.current ? 0.007 : 0.022;
      if (p.a <= 0 || p.y < -8) {
        ps.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.min(1, p.a);
      ctx.fillStyle = `hsl(${p.hue}, 88%, 58%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (hoverRef.current || ps.length > 0) {
      rafRef.current = requestAnimationFrame(frame);
    } else {
      rafRef.current = 0;
    }
  }

  function ensureAnim() {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(frame);
  }

  return (
    <a
      ref={wrapRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
      style={{ ...CHROME_HEADER_FONT, boxShadow: "none", textDecoration: "none" }}
      onPointerEnter={() => {
        hoverRef.current = true;
        ensureAnim();
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
        ensureAnim();
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 block h-full w-full"
      />
      <span className="relative z-[1]">buy</span>
    </a>
  );
}
