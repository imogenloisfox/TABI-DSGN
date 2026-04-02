"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/** Aligned with `LoopParticleText` / `VanishText` burst feel. */
const SPEED_MULT = 1.5;

const PALETTE = ["#2a2c2d", "#4a4c4d", "#5c5c5c", "#7a7a7a", "#9a9a9a", "#b1b1b1", "#d9d9d9"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

function spawnBurst(px: number, py: number, out: Particle[]) {
  const n = 64 + Math.floor(Math.random() * 24);
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.14 + Math.random() * 0.42;
    out.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 0.22,
      alpha: 0.82 + Math.random() * 0.18,
      size: 0.75 + Math.random() * 1.1,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)]!,
    });
  }
}

interface LobbyClickParticlesProps {
  /** Common ancestor of the WebGL canvas — receives `pointerdown` in capture phase. */
  surfaceRef: RefObject<HTMLDivElement | null>;
  /** When false, detach listener (e.g. customiser / transition). */
  active: boolean;
}

/**
 * Full-bleed 2D particle burst at each pointer down on the lobby surface.
 * Overlay uses `pointer-events: none` so hits reach the WebGL canvas; the listener
 * lives on `surfaceRef` so clicks on the canvas are still observed.
 */
export default function LobbyClickParticles({ surfaceRef, active }: LobbyClickParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);

  const resize = useCallback(() => {
    const surface = surfaceRef.current;
    const canvas = canvasRef.current;
    if (!surface || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = surface.clientWidth;
    const h = surface.clientHeight;
    if (w <= 0 || h <= 0) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }, [surfaceRef]);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = false;
    const next: Particle[] = [];
    const list = particlesRef.current;

    for (const p of list) {
      p.x += p.vx * SPEED_MULT;
      p.y += p.vy * SPEED_MULT;
      p.vx *= Math.pow(0.964, SPEED_MULT);
      p.vy *= Math.pow(0.964, SPEED_MULT);
      p.alpha *= Math.pow(0.982, SPEED_MULT);
      if (p.alpha <= 0.008) continue;
      alive = true;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x * dpr, p.y * dpr, p.size * dpr, p.size * dpr);
      next.push(p);
    }

    ctx.globalAlpha = 1;
    particlesRef.current = next;

    if (alive) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = 0;
    }
  }, []);

  const scheduleTick = useCallback(() => {
    if (rafRef.current === 0 && particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(surface);
    return () => ro.disconnect();
  }, [surfaceRef, resize]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || !active) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = surface.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      spawnBurst(x, y, particlesRef.current);
      scheduleTick();
    };

    surface.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => surface.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, [surfaceRef, active, scheduleTick]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-hidden
      />
    </div>
  );
}
