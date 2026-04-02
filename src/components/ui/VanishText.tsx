"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x:     number;
  y:     number;
  vx:    number;
  vy:    number;
  alpha: number;
  size:  number;
  color: string;
}

const VANISH_SPEED_MULTIPLIER = 1.5;

export interface VanishTextProps {
  text:       string;
  trigger:    boolean;
  onDone?:    () => void;
  className?: string;
  style?:     React.CSSProperties;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VanishText({ text, trigger, onDone, className, style }: VanishTextProps) {
  const wrapperRef   = useRef<HTMLSpanElement>(null);
  const spanRef      = useRef<HTMLSpanElement>(null);
  const sampleRef    = useRef<HTMLCanvasElement | null>(null);
  const overlayRef   = useRef<HTMLCanvasElement | null>(null);
  const rafRef       = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const activeRef    = useRef(false);
  const doneFiredRef = useRef(false);

  const [vanishing, setVanishing] = useState(false);
  const [fadingIn,  setFadingIn]  = useState(false);

  // ── Canvas lifecycle ────────────────────────────────────────────────────────

  function ensureCanvases() {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!sampleRef.current) {
      const s = document.createElement("canvas");
      s.setAttribute("aria-hidden", "true");
      s.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;opacity:0";
      wrapper.appendChild(s);
      sampleRef.current = s;
    }

    if (!overlayRef.current) {
      const o = document.createElement("canvas");
      o.setAttribute("aria-hidden", "true");
      o.style.cssText = "position:absolute;top:0;left:0;pointer-events:none";
      wrapper.appendChild(o);
      overlayRef.current = o;
    }
  }

  function removeCanvases() {
    sampleRef.current?.remove();  sampleRef.current  = null;
    overlayRef.current?.remove(); overlayRef.current = null;
  }

  // ── Particle spawn ──────────────────────────────────────────────────────────

  function spawnParticles() {
    const span    = spanRef.current;
    const sample  = sampleRef.current;
    const overlay = overlayRef.current;
    if (!span || !sample || !overlay) return;

    const rect = span.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    const w    = Math.ceil(rect.width);
    const h    = Math.ceil(rect.height);
    if (w === 0 || h === 0) return;

    sample.width  = w * dpr;
    sample.height = h * dpr;
    overlay.width  = w * dpr;
    overlay.height = h * dpr;
    overlay.style.width  = `${w}px`;
    overlay.style.height = `${h}px`;

    const ctx = sample.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const computed  = window.getComputedStyle(span);
    const textColor = computed.color || "#000000";

    ctx.font          = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    ctx.letterSpacing = computed.letterSpacing ?? "0px";
    ctx.fillStyle     = textColor;
    ctx.textBaseline  = "top";

    const measuredW = ctx.measureText(text).width;
    const offsetX   = Math.max(0, (w - measuredW) / 2);
    ctx.fillText(text, offsetX, 0);

    const imgData = ctx.getImageData(0, 0, w * dpr, h * dpr);
    const data    = imgData.data;
    const particles: Particle[] = [];

    for (let py = 0; py < h * dpr; py += 2) {
      for (let px = 0; px < w * dpr; px += 2) {
        const idx = (py * w * dpr + px) * 4;
        if (data[idx + 3] < 40) continue;

        const worldX = px / dpr;
        const worldY = py / dpr;
        const angle  = Math.random() * Math.PI * 2;
        const speed  = 0.12 + Math.random() * 0.38; // compact — was 0.3 + 1.1

        particles.push({
          x:     worldX,
          y:     worldY,
          vx:    Math.cos(angle) * speed,
          vy:    Math.sin(angle) * speed - Math.random() * 0.25,
          alpha: 0.9 + Math.random() * 0.1,
          size:  0.7 + Math.random() * 0.6,
          color: textColor,
        });
      }
    }

    particlesRef.current = particles;
  }

  // ── Animation loop ──────────────────────────────────────────────────────────

  function animate() {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);
    const dpr = window.devicePixelRatio || 1;

    let alive    = false;
    let maxAlpha = 0;

    for (const p of particlesRef.current) {
      if (p.alpha <= 0.01) continue;
      alive = true;
      p.x  += p.vx * VANISH_SPEED_MULTIPLIER;
      p.y  += p.vy * VANISH_SPEED_MULTIPLIER;
      p.vx *= Math.pow(0.964, VANISH_SPEED_MULTIPLIER);
      p.vy *= Math.pow(0.964, VANISH_SPEED_MULTIPLIER);
      p.alpha *= Math.pow(0.984, VANISH_SPEED_MULTIPLIER);
      if (p.alpha > maxAlpha) maxAlpha = p.alpha;

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.fillRect(p.x * dpr, p.y * dpr, p.size * dpr, p.size * dpr);
    }

    ctx.globalAlpha = 1;

    // Fire onDone while particles are still faintly visible so text fade-in
    // overlaps with the tail — no blank gap between vanish and reappear.
    if (!doneFiredRef.current && maxAlpha < 0.3) {
      doneFiredRef.current = true;
      onDone?.();
    }

    if (alive) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      activeRef.current = false;
      removeCanvases();
      if (!doneFiredRef.current) {
        doneFiredRef.current = true;
        onDone?.();
      }
    }
  }

  // ── Trigger watch ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (trigger) {
      if (activeRef.current) return;
      activeRef.current    = true;
      doneFiredRef.current = false;
      ensureCanvases();
      setVanishing(true);
      spawnParticles();
      rafRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      activeRef.current = false;
      particlesRef.current = [];
      removeCanvases();
      setVanishing(false);
      setFadingIn(true);
      const id = setTimeout(() => setFadingIn(false), 350);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      removeCanvases();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <span ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      <span
        ref={spanRef}
        className={className}
        style={{
          ...style,
          opacity:    vanishing ? 0 : 1,
          transition: fadingIn  ? "opacity 300ms ease-in" : "none",
        }}
      >
        {text}
      </span>
    </span>
  );
}
