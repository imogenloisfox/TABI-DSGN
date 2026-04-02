"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { CHROME_HEADER_FONT, CHROME_TOP_PILL_BASE } from "@/lib/chromeUi";

/** Same hover invert as `SiteHeader` info / play pills. */
const DEV_METRIC_PILL_HOVER =
  "transition-[color,background-color] duration-150 ease-out hover:!bg-[#7a7a7a] hover:!text-[#ffffff]";

type DevMetricMode = "fps" | "ms" | "mb";

function chromeHeapMb(): number | null {
  if (typeof performance === "undefined") return null;
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  if (!mem?.usedJSHeapSize) return null;
  return Math.round((mem.usedJSHeapSize / 1048576) * 10) / 10;
}

export type DevFpsSample = { fps: number; msAvg: number; heapMb: number | null };

/**
 * Lives inside `<Canvas>` only — returns null so R3F never sees DOM nodes.
 * Pushes rolling samples ~2/s to the parent via ref (stable useFrame).
 */
export function DevFpsMetricsCollector({
  onSampleRef,
}: {
  onSampleRef: RefObject<(sample: DevFpsSample) => void>;
}) {
  const framesRef = useRef(0);
  const msAccumRef = useRef(0);
  const lastTickRef = useRef(0);

  useFrame((_, delta) => {
    const now = performance.now();
    if (lastTickRef.current === 0) lastTickRef.current = now;

    framesRef.current += 1;
    msAccumRef.current += delta * 1000;

    const elapsed = now - lastTickRef.current;
    if (elapsed < 500) return;

    const sample: DevFpsSample = {
      fps:    Math.round((framesRef.current * 1000) / elapsed),
      msAvg:  Math.round((msAccumRef.current / framesRef.current) * 100) / 100,
      heapMb: chromeHeapMb(),
    };
    onSampleRef.current?.(sample);

    framesRef.current = 0;
    msAccumRef.current = 0;
    lastTickRef.current = now;
  });

  return null;
}

/**
 * Renders in the React DOM tree (sibling of `<Canvas>`), not inside R3F — avoids
 * "Button is not part of the THREE namespace".
 * Fixed bottom-right (`bottom-4 right-4` — mirrors App `top-4` + strip `right-4`).
 */
export function DevFpsPillOverlay({ metrics }: { metrics: DevFpsSample }) {
  const [mode, setMode] = useState<DevMetricMode>("fps");

  const cycleMode = useCallback(() => {
    setMode((m) => {
      if (m === "fps") return "ms";
      if (m === "ms") return metrics.heapMb !== null ? "mb" : "fps";
      return "fps";
    });
  }, [metrics.heapMb]);

  let label = `${metrics.fps} fps`;
  if (mode === "ms") label = `${metrics.msAvg} ms`;
  if (mode === "mb") label = metrics.heapMb !== null ? `${metrics.heapMb} mb` : "—";

  return (
    <button
      type="button"
      className={`${CHROME_TOP_PILL_BASE} w-[100px] shrink-0 cursor-pointer justify-center tabular-nums normal-case lowercase !bg-[#d9d9d9] !text-[#2a2c2d] ${DEV_METRIC_PILL_HOVER} select-none`}
      style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
      onClick={cycleMode}
      aria-label={`Performance readout: ${label}. Click to change metric.`}
    >
      {label}
    </button>
  );
}
