"use client";

import type { GemstoneId, GemPosition, ProductVariant } from "@/lib/customiser/types";
import { CONCAVE_GEM_BOUNDS, variantUsesGemColour, variantHasGemSliders } from "@/lib/customiser/types";
import { GEMSTONES } from "@/data/gemstones";

interface GemstoneStepProps {
  variant:             ProductVariant | null;
  selected:            GemstoneId | null;
  onSelect:            (id: GemstoneId) => void;
  gemPosition:         GemPosition;
  onGemPositionChange: (pos: GemPosition) => void;
}

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[9px] font-mono text-muted uppercase tracking-wide">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-foreground"
      />
      <span className="w-8 text-right text-[9px] font-mono text-muted tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

export default function GemstoneStep({
  variant, selected, onSelect, gemPosition, onGemPositionChange,
}: GemstoneStepProps) {
  const showColours = variant ? variantUsesGemColour(variant) : false;
  const showSliders = variant ? variantHasGemSliders(variant) : false;

  return (
    <div className="bg-surface px-3 py-2.5">
      <div className="mb-2">
        <p className="text-[10px] font-mono tracking-wide text-muted uppercase">Stone</p>
      </div>

      {showColours && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {GEMSTONES.map((gem) => {
              const isActive = selected === gem.id;
              return (
                <button
                  key={gem.id}
                  onClick={() => onSelect(gem.id)}
                  title={gem.label}
                  className={`group flex cursor-pointer items-center justify-center border p-1.5 transition-colors duration-100 ${
                    isActive ? "border-foreground" : "border-border hover:border-border-strong"
                  }`}
                >
                  <div
                    className="h-4 w-3"
                    style={{
                      backgroundColor: gem.hex,
                      clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)",
                    }}
                  />
                </button>
              );
            })}
          </div>
          {selected && (
            <p className="mt-1.5 mb-2 text-[10px] text-muted">
              {GEMSTONES.find((g) => g.id === selected)?.label}
            </p>
          )}
        </>
      )}

      {showSliders && (
        <div className="mt-2 flex flex-col gap-1.5">
          <Slider
            label="Gem X" value={gemPosition.x}
            min={CONCAVE_GEM_BOUNDS.minX} max={CONCAVE_GEM_BOUNDS.maxX} step={0.01}
            onChange={(v) => onGemPositionChange({ ...gemPosition, x: v })}
          />
          <Slider
            label="Gem Y" value={gemPosition.y}
            min={CONCAVE_GEM_BOUNDS.minY} max={CONCAVE_GEM_BOUNDS.maxY} step={0.01}
            onChange={(v) => onGemPositionChange({ ...gemPosition, y: v })}
          />
        </div>
      )}
    </div>
  );
}
