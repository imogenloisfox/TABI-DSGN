"use client";

import { CHROME_HEADER_FONT } from "@/lib/chromeUi";

// ─── Props ────────────────────────────────────────────────────────────────────

export type SliderTrackMode = "default" | "ring" | "pendant" | "mobileEngraving";

/** White rail (#ffffff); fill matches category (ring #d9d9d9, pendant #b1b1b1, earrings #8d8d8d). */
const TRACK: Record<SliderTrackMode, { rail: string; fill: string }> = {
  ring:            { rail: "bg-[#b1b1b1]", fill: "bg-[#d9d9d9]" },
  pendant:         { rail: "bg-[#b1b1b1]", fill: "bg-[#d9d9d9]" },
  default:         { rail: "bg-[#b1b1b1]", fill: "bg-[#d9d9d9]" },
  mobileEngraving: { rail: "bg-[#b1b1b1]", fill: "bg-[#d9d9d9]" },
};

interface BarSliderProps {
  label: string;
  value: number;
  min:   number;
  max:   number;
  step:  number;
  onChange: (v: number) => void;
  /** Rail #ffffff; fill from `trackMode` (ring / pendant / default). */
  trackMode?: SliderTrackMode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BarSlider({
  label, value, min, max, step, onChange, trackMode = "default",
}: BarSliderProps) {
  const percent = Math.round(((value - min) / (max - min)) * 100);
  const t = TRACK[trackMode];

  function update(clientX: number, target: HTMLElement) {
    const rect  = target.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw   = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(max, snapped));
    onChange(parseFloat(clamped.toFixed(10)));
  }

  return (
    // Outer div expands touch target to 44px on mobile without changing visual height.
    // `update` reads clientX from this div's boundingRect — same left/width as the
    // visual bar since they share full width, so horizontal maths are unaffected.
    <div
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.currentTarget);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        update(e.clientX, e.currentTarget);
      }}
      className="cursor-ew-resize select-none py-0"
      style={{ touchAction: "pan-y" }}
    >
      <div className={`relative flex h-[30px] overflow-hidden border-0 ${t.rail}`}>
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 ${t.fill}`}
          style={{ width: `${percent}%` }}
        />
        <div
          className="relative z-10 flex w-full items-center justify-between px-2.5 font-bold text-[#2a2c2d]"
          style={CHROME_HEADER_FONT}
        >
          <span className="text-[14px] lowercase tracking-normal">{label}</span>
          <span className="text-[12px] tabular-nums">{percent}%</span>
        </div>
      </div>
    </div>
  );
}
