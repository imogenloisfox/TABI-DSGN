"use client";

import { useEffect, useMemo, useState } from "react";

interface LoopParticleTextProps {
  words:             string[];
  className?:        string;
  style?:            React.CSSProperties;
  wrapperClassName?: string;
}

const ROW_PX = 30;
const SLIDE_MS = 520;
const HOLD_MS = 1020;
/** Smooth deceleration — no snappy “rail” stop */
const SLIDE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const REDUCED_MOTION_INTERVAL_MS = 2400;

const row = (w: string, i: number, className?: string, style?: React.CSSProperties) => (
  <span
    key={`strip-${i}`}
    className={`flex shrink-0 items-center justify-center whitespace-nowrap leading-none ${className ?? ""}`}
    style={{ ...style, height: ROW_PX, minHeight: ROW_PX }}
  >
    {w}
  </span>
);

/**
 * Vertical strip: slides up through `[...words, ...words]` so last → first is one
 * smooth step (duplicate “A” under “E”), then transform snaps back to 0 with
 * `transition: none` — no long rewind animation.
 */
export default function LoopParticleText({
  words,
  className,
  style,
  wrapperClassName,
}: LoopParticleTextProps) {
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const onChange = () => setPrefersReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const items = useMemo(
    () => (words.length > 1 ? [...words, ...words] : words),
    [words],
  );

  // After landing on the duplicate first row, snap scroll offset to 0 (same pixels).
  useEffect(() => {
    if (prefersReduced || words.length <= 1) return;
    if (index !== words.length) return;
    const t = window.setTimeout(() => {
      setInstant(true);
      setIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setInstant(false));
      });
    }, SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [index, prefersReduced, words.length]);

  useEffect(() => {
    if (words.length <= 1) return;

    if (prefersReduced) {
      const id = window.setInterval(() => {
        setIndex((i) => (i + 1) % words.length);
      }, REDUCED_MOTION_INTERVAL_MS);
      return () => clearInterval(id);
    }

    const id = window.setInterval(() => {
      setIndex((i) => {
        if (i >= words.length) return i;
        if (i === words.length - 1) return words.length;
        return i + 1;
      });
    }, HOLD_MS);
    return () => clearInterval(id);
  }, [prefersReduced, words.length]);

  if (words.length === 0) {
    return null;
  }

  if (words.length === 1) {
    return (
      <span
        className={wrapperClassName}
        style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      >
        <span
          className="inline-block overflow-hidden"
          style={{ height: ROW_PX, lineHeight: `${ROW_PX}px` }}
        >
          <span className="flex flex-col">{row(words[0], 0, className, style)}</span>
        </span>
      </span>
    );
  }

  if (prefersReduced) {
    return (
      <span
        className={wrapperClassName}
        style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      >
        <span
          className="inline-block overflow-hidden"
          style={{ height: ROW_PX, lineHeight: `${ROW_PX}px` }}
        >
          <span
            className="flex flex-col"
            style={{
              transform:  `translate3d(0, -${(index % words.length) * ROW_PX}px, 0)`,
              transition: "none",
            }}
          >
            {words.map((w, i) => row(w, i, className, style))}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={wrapperClassName}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <span
        className="inline-block overflow-hidden"
        style={{ height: ROW_PX, lineHeight: `${ROW_PX}px` }}
      >
        <span
          className="flex flex-col"
          style={{
            transform:  `translate3d(0, -${index * ROW_PX}px, 0)`,
            transition: instant ? "none" : `transform ${SLIDE_MS}ms ${SLIDE_EASE}`,
          }}
        >
          {items.map((w, i) => row(w, i, className, style))}
        </span>
      </span>
    </span>
  );
}
