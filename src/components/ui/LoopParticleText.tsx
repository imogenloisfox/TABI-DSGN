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

/** Shared with `VanishText` (button click) — burst speed, drag, fade. */
const VANISH_SPEED_MULTIPLIER = 1.5;

interface LoopParticleTextProps {
  words:             string[];
  className?:        string;
  style?:            React.CSSProperties;
  wrapperClassName?: string;
}

// Gap between the end of one burst and the start of the next (ms)
const PAUSE_MS      = 150;
/** Same as `VanishText` text fade-in after click. */
const FADE_DURATION = 300;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoopParticleText({
  words,
  className,
  style,
  wrapperClassName,
}: LoopParticleTextProps) {
  const wrapperRef   = useRef<HTMLSpanElement>(null);
  const spanRef      = useRef<HTMLSpanElement>(null);
  const sampleRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef<number>(0);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const doneFiredRef = useRef(false);
  const wordIndexRef = useRef(0);

  const [displayIndex, setDisplayIndex] = useState(0);
  const [vanishing,    setVanishing]    = useState(false);
  const [fadingIn,     setFadingIn]     = useState(false);

  // ── Measure text width ───────────────────────────────────────────────────────

  function measureWord(word: string): number {
    const span = spanRef.current;
    if (!span) return 0;
    const computed = window.getComputedStyle(span);
    const c = document.createElement("canvas").getContext("2d");
    if (!c) return 0;
    c.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    const ls = parseFloat(computed.letterSpacing) || 0;
    return Math.ceil(c.measureText(word).width + ls * word.length);
  }

  function setWrapperWidth(word: string, animated: boolean) {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const computed = window.getComputedStyle(wrapper);
    const padX = (parseFloat(computed.paddingLeft) || 0)
               + (parseFloat(computed.paddingRight) || 0);
    const total = measureWord(word) + padX;
    wrapper.style.transition = animated ? `width ${FADE_DURATION}ms ease-in-out` : "none";
    wrapper.style.width = `${total}px`;
  }

  // ── Particle spawn ───────────────────────────────────────────────────────────

  function spawnParticles(word: string) {
    const span    = spanRef.current;
    const sample  = sampleRef.current;
    const overlay = overlayRef.current;
    if (!span || !sample || !overlay) return;

    const rect = span.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    const w    = Math.ceil(rect.width);
    const h    = Math.ceil(rect.height);
    if (w === 0 || h === 0) return;

    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    const topOffset   = wrapperRect ? rect.top  - wrapperRect.top  : 0;
    const leftOffset  = wrapperRect ? rect.left - wrapperRect.left : 0;

    sample.width  = w * dpr;
    sample.height = h * dpr;

    // Same footprint as `VanishText` — no padded overlay (that read as a bigger burst).
    overlay.width        = w * dpr;
    overlay.height       = h * dpr;
    overlay.style.width  = `${w}px`;
    overlay.style.height = `${h}px`;
    overlay.style.top    = `${topOffset}px`;
    overlay.style.left   = `${leftOffset}px`;

    const ctx = sample.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const computed  = window.getComputedStyle(span);
    const textColor = computed.color || "#000000";

    ctx.font          = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    ctx.letterSpacing = computed.letterSpacing ?? "0px";
    ctx.fillStyle     = textColor;
    ctx.textBaseline  = "top";

    const measuredW = ctx.measureText(word).width;
    const offsetX   = Math.max(0, (w - measuredW) / 2);
    ctx.fillText(word, offsetX, 0);

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
        const speed  = 0.12 + Math.random() * 0.38;

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
    doneFiredRef.current = false;
    setVanishing(true);
    setFadingIn(false);
  }

  // ── Animation loop ───────────────────────────────────────────────────────────

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

    if (!doneFiredRef.current && maxAlpha < 0.3) {
      doneFiredRef.current = true;
      const nextIndex      = (wordIndexRef.current + 1) % words.length;
      wordIndexRef.current = nextIndex;
      setDisplayIndex(nextIndex);
      setVanishing(false);
      setFadingIn(true);
      setWrapperWidth(words[nextIndex], true);
    }

    if (alive) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      rafRef.current = 0;
      particlesRef.current = [];
      setFadingIn(false);
      timerRef.current = setTimeout(() => {
        spawnParticles(words[wordIndexRef.current]);
        rafRef.current = requestAnimationFrame(animate);
      }, PAUSE_MS);
    }
  }

  // ── Mount ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setWrapperWidth(words[wordIndexRef.current], false);
    });

    timerRef.current = setTimeout(() => {
      spawnParticles(words[wordIndexRef.current]);
      rafRef.current = requestAnimationFrame(animate);
    }, 1200);

    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <span
      ref={wrapperRef}
      className={wrapperClassName}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <span
        ref={spanRef}
        className={className}
        style={{
          ...style,
          display:    "block",
          textAlign:  "center",
          width:      "100%",
          opacity:    vanishing ? 0 : 1,
          transition: fadingIn  ? `opacity ${FADE_DURATION}ms ease-in` : "none",
        }}
      >
        {words[displayIndex]}
      </span>

      <canvas
        ref={sampleRef}
        aria-hidden
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity: 0 }}
      />
      <canvas
        ref={overlayRef}
        aria-hidden
        style={{ position: "absolute", pointerEvents: "none" }}
      />
    </span>
  );
}
