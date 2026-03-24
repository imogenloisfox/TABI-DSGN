"use client";

import type { EngravingParams, ProductVariant, GemPosition } from "@/lib/customiser/types";
import { EARRING_GEM_BOUNDS } from "@/lib/customiser/types";

interface InitialStepProps {
  variant?:                  ProductVariant | null;
  value:                     EngravingParams;
  onChange:                  (params: EngravingParams) => void;
  valueLeft?:                EngravingParams;
  onChangeLeft?:             (params: EngravingParams) => void;
  valueRight?:               EngravingParams;
  onChangeRight?:            (params: EngravingParams) => void;
  gemPositionLeft?:          GemPosition;
  onGemPositionLeftChange?:  (pos: GemPosition) => void;
  gemPositionRight?:         GemPosition;
  onGemPositionRightChange?: (pos: GemPosition) => void;
}

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[9px] font-mono text-muted uppercase tracking-wide">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-foreground"
      />
      <span className="w-8 text-right text-[9px] font-mono text-muted tabular-nums">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function EngravingSection({
  label, value, onChange,
}: {
  label: string; value: EngravingParams; onChange: (params: EngravingParams) => void;
}) {
  const set = (patch: Partial<EngravingParams>) => onChange({ ...value, ...patch });
  return (
    <div>
      <p className="mb-2 text-[10px] font-mono tracking-wide text-muted uppercase">{label}</p>
      <textarea
        rows={3}
        value={value.text}
        onChange={(e) => {
          const next = e.target.value;
          if (next.split("\n").length > 3) return;
          set({ text: next });
        }}
        placeholder="Type here..."
        className="mb-3 w-full resize-none border border-border bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted/40 focus:border-foreground focus:outline-none transition-colors"
      />
      <div className="flex flex-col gap-1.5">
        <Slider label="Pos X" value={value.offsetX} min={-0.5} max={0.5} step={0.01} onChange={(v) => set({ offsetX: v })} />
        <Slider label="Pos Y" value={value.offsetY} min={-0.5} max={0.5} step={0.01} onChange={(v) => set({ offsetY: v })} />
        <Slider label="Size"  value={value.fontSize} min={0.2}  max={1.5} step={0.01} onChange={(v) => set({ fontSize: v })} />
        {value.text.includes("\n") && (
          <Slider label="Spacing" value={value.lineSpacing} min={0} max={2} step={0.05} onChange={(v) => set({ lineSpacing: v })} />
        )}
      </div>
    </div>
  );
}

function GemPositionSliders({
  position, onChange,
}: {
  position: GemPosition; onChange: (pos: GemPosition) => void;
}) {
  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
      <p className="mb-1 text-[9px] font-mono tracking-wide text-muted uppercase">Gem position</p>
      <Slider
        label="Gem X" value={position.x}
        min={EARRING_GEM_BOUNDS.minX} max={EARRING_GEM_BOUNDS.maxX} step={0.01}
        onChange={(v) => onChange({ ...position, x: v })}
      />
      <Slider
        label="Gem Y" value={position.y}
        min={EARRING_GEM_BOUNDS.minY} max={EARRING_GEM_BOUNDS.maxY} step={0.01}
        onChange={(v) => onChange({ ...position, y: v })}
      />
    </div>
  );
}

export default function InitialStep({
  variant, value, onChange,
  valueLeft, onChangeLeft, valueRight, onChangeRight,
  gemPositionLeft, onGemPositionLeftChange,
  gemPositionRight, onGemPositionRightChange,
}: InitialStepProps) {
  if (variant === "earrings" && valueLeft && onChangeLeft && valueRight && onChangeRight) {
    return (
      <div className="bg-surface px-3 py-2.5 flex flex-col gap-4">
        <div>
          <EngravingSection label="Left Earring" value={valueLeft} onChange={onChangeLeft} />
          {gemPositionLeft && onGemPositionLeftChange && (
            <GemPositionSliders position={gemPositionLeft} onChange={onGemPositionLeftChange} />
          )}
        </div>
        <div>
          <EngravingSection label="Right Earring" value={valueRight} onChange={onChangeRight} />
          {gemPositionRight && onGemPositionRightChange && (
            <GemPositionSliders position={gemPositionRight} onChange={onGemPositionRightChange} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface px-3 py-2.5">
      <EngravingSection label="Engraving" value={value} onChange={onChange} />
    </div>
  );
}
