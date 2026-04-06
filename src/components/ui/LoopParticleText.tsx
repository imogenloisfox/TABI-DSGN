"use client";

import { useEffect, useRef, useState } from "react";

interface LoopParticleTextProps {
  words:             string[];
  className?:        string;
  style?:            React.CSSProperties;
  wrapperClassName?: string;
}

const HOLD_MS = 1800;
const FADE_MS = 350;

export default function LoopParticleText({
  words,
  className,
  style,
  wrapperClassName,
}: LoopParticleTextProps) {
  const [displayed, setDisplayed] = useState(words[0] ?? "");
  const [visible, setVisible]     = useState(true);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const indexRef = useRef(0);
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const onChange = () => setPrefersReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (words.length <= 1) return;

    function cycle() {
      // fade out
      setVisible(false);
      t1.current = setTimeout(() => {
        // swap word at invisible peak
        indexRef.current = (indexRef.current + 1) % words.length;
        setDisplayed(words[indexRef.current]);
        // fade in
        setVisible(true);
        // hold then repeat
        t2.current = setTimeout(cycle, HOLD_MS);
      }, FADE_MS);
    }

    t2.current = setTimeout(cycle, HOLD_MS);

    return () => {
      if (t1.current) clearTimeout(t1.current);
      if (t2.current) clearTimeout(t2.current);
    };
  }, [words]);

  if (words.length === 0) return null;

  return (
    <span
      className={wrapperClassName}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <span
        className={className}
        style={{
          ...style,
          display:    "inline-block",
          whiteSpace: "nowrap",
          opacity:    prefersReduced ? 1 : visible ? 1 : 0,
          transition: prefersReduced ? "none" : `opacity ${FADE_MS}ms ease`,
        }}
      >
        {displayed}
      </span>
    </span>
  );
}
