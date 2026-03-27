"use client";

import type { GemstoneId, GemPosition, ProductVariant } from "@/lib/customiser/types";
import { CONCAVE_GEM_BOUNDS, variantUsesGemColour, variantHasGemSliders } from "@/lib/customiser/types";
import { GEMSTONES } from "@/data/gemstones";
import BarSlider from "./BarSlider";

interface GemstoneStepProps {
  variant:             ProductVariant | null;
  selected:            GemstoneId | null;
  onSelect:            (id: GemstoneId) => void;
  gemPosition:         GemPosition;
  onGemPositionChange: (pos: GemPosition) => void;
}

export default function GemstoneStep({
  variant, selected, onSelect, gemPosition, onGemPositionChange,
}: GemstoneStepProps) {
  const showColours = variant ? variantUsesGemColour(variant) : false;
  const showSliders = variant ? variantHasGemSliders(variant) : false;

  return (
    <div className="bg-background px-3 py-2.5">
      <div className="mb-2">
        <p className="text-[10px] font-mono tracking-wide text-foreground uppercase">Gemstone</p>
      </div>

      {showColours && (
        <>
          <div className="flex flex-wrap gap-1">
            {GEMSTONES.map((gem) => {
              const isActive = selected === gem.id;
              return (
                <button
                  key={gem.id}
                  onClick={() => onSelect(gem.id)}
                  title={gem.label}
                  className={`btn-primary h-7 w-7 cursor-pointer border border-foreground flex items-center justify-center ${
                    isActive ? "bg-foreground" : "bg-surface"
                  }`}
                >
                  <div
                    className="h-5 w-4"
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
            <p className="mt-1.5 mb-2 text-[10px] font-mono tracking-wide text-foreground uppercase">
              {GEMSTONES.find((g) => g.id === selected)?.label}
            </p>
          )}
        </>
      )}

      {showSliders && (
        <div className="mt-2 flex flex-col gap-1.5">
          <BarSlider
            label="Pos X" value={gemPosition.x}
            min={CONCAVE_GEM_BOUNDS.minX} max={CONCAVE_GEM_BOUNDS.maxX} step={0.01}
            onChange={(v) => onGemPositionChange({ ...gemPosition, x: v })}
          />
          <BarSlider
            label="Pos Y" value={gemPosition.y}
            min={CONCAVE_GEM_BOUNDS.minY} max={CONCAVE_GEM_BOUNDS.maxY} step={0.01}
            onChange={(v) => onGemPositionChange({ ...gemPosition, y: v })}
          />
        </div>
      )}
    </div>
  );
}
