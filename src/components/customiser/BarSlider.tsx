"use client";

interface BarSliderProps {
  label: string;
  value: number;
  min:   number;
  max:   number;
  step:  number;
  onChange: (v: number) => void;
}

export default function BarSlider({ label, value, min, max, step, onChange }: BarSliderProps) {
  const percent = Math.round(((value - min) / (max - min)) * 100);

  function update(clientX: number, target: HTMLElement) {
    const rect  = target.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw   = min + ratio * (max - min);
    // snap to nearest step, clamp, then round floating-point noise
    const snapped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(max, snapped));
    onChange(parseFloat(clamped.toFixed(10)));
  }

  return (
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
      className="relative flex h-7 cursor-ew-resize select-none overflow-hidden border border-foreground bg-surface"
    >
      {/* Black fill growing left → right */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-foreground"
        style={{ width: `${percent}%` }}
      />
      {/* mix-blend-mode: difference auto-inverts text at the fill boundary:
          white text over black fill → white; white text over white bg → black */}
      <div
        className="relative z-10 flex w-full items-center justify-between px-2.5"
        style={{ mixBlendMode: "difference" }}
      >
        <span className="text-[9px] font-mono uppercase tracking-wide text-surface">
          {label}
        </span>
        <span className="text-[9px] font-mono text-surface tabular-nums">
          {percent}%
        </span>
      </div>
    </div>
  );
}
