"use client";

import type { EngravingParams, ProductVariant, GemPosition } from "@/lib/customiser/types";
import { EARRING_GEM_BOUNDS, ENGRAVING_SLIDER_CONFIG } from "@/lib/customiser/types";
import BarSlider from "./BarSlider";

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
  // Safe zone warning flags — true when engraving breaches the keep-out margins
  outOfBounds?:      boolean;
  outOfBoundsLeft?:  boolean;
  outOfBoundsRight?: boolean;
}


function EngravingSection({
  label,
  value,
  onChange,
  variant,
  isEarring,
  outOfBounds,
}: {
  label:       string;
  value:       EngravingParams;
  onChange:    (params: EngravingParams) => void;
  variant:     ProductVariant;
  isEarring:   boolean;
  outOfBounds?: boolean;
}) {
  const cfg = ENGRAVING_SLIDER_CONFIG[variant];
  const set = (patch: Partial<EngravingParams>) => onChange({ ...value, ...patch });

  function handleTextChange(raw: string) {
    if (isEarring) {
      // Disallow newlines for earrings — single line only
      const single = raw.replace(/\n/g, "");
      set({ text: single });
    } else {
      if (raw.split("\n").length > 3) return;
      set({ text: raw });
    }
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-mono tracking-wide text-foreground uppercase">{label}</p>
      <textarea
        rows={isEarring ? 1 : 3}
        value={value.text}
        onChange={(e) => handleTextChange(e.target.value)}
        onKeyDown={(e) => {
          // Block Enter key entirely for earrings
          if (isEarring && e.key === "Enter") e.preventDefault();
        }}
        placeholder="Type here..."
        className="mb-1 w-full resize-none border border-border bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted/40 focus:border-foreground focus:outline-none transition-colors"
        style={{ minHeight: isEarring ? "2rem" : undefined }}
      />
      {isEarring && (
        <p className="mb-2 text-[8px] font-mono tracking-wide uppercase text-foreground">Single line only for earrings</p>
      )}
      <div className="flex flex-col gap-1.5">
        <BarSlider
          label="Pos X"
          value={value.offsetX}
          min={cfg.posX.min} max={cfg.posX.max} step={0.01}
          onChange={(v) => set({ offsetX: v })}
        />
        <BarSlider
          label="Pos Y"
          value={value.offsetY}
          min={cfg.posY.min} max={cfg.posY.max} step={0.01}
          onChange={(v) => set({ offsetY: v })}
        />
        <BarSlider
          label="Size"
          value={value.fontSize}
          min={cfg.size.min} max={cfg.size.max} step={0.01}
          onChange={(v) => set({ fontSize: v })}
        />
        {cfg.spacing !== null && value.text.includes("\n") && (
          <BarSlider
            label="Spacing"
            value={value.lineSpacing}
            min={cfg.spacing.min} max={cfg.spacing.max} step={0.05}
            onChange={(v) => set({ lineSpacing: v })}
          />
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
      <p className="mb-1 text-[9px] font-mono tracking-wide text-foreground uppercase">Gem position</p>
      <BarSlider
        label="Gem X" value={position.x}
        min={EARRING_GEM_BOUNDS.minX} max={EARRING_GEM_BOUNDS.maxX} step={0.01}
        onChange={(v) => onChange({ ...position, x: v })}
      />
      <BarSlider
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
  outOfBounds, outOfBoundsLeft, outOfBoundsRight,
}: InitialStepProps) {
  const resolvedVariant: ProductVariant = variant ?? "ringClassic";
  const isEarring = resolvedVariant === "earrings";

  if (isEarring && valueLeft && onChangeLeft && valueRight && onChangeRight) {
    return (
      <div className="bg-background px-3 py-2.5 flex flex-col gap-4">
        <div>
          <EngravingSection
            label="Left Earring"
            value={valueLeft}
            onChange={onChangeLeft}
            variant="earrings"
            isEarring
            outOfBounds={outOfBoundsLeft}
          />
          {gemPositionLeft && onGemPositionLeftChange && (
            <GemPositionSliders position={gemPositionLeft} onChange={onGemPositionLeftChange} />
          )}
        </div>
        <div>
          <EngravingSection
            label="Right Earring"
            value={valueRight}
            onChange={onChangeRight}
            variant="earrings"
            isEarring
            outOfBounds={outOfBoundsRight}
          />
          {gemPositionRight && onGemPositionRightChange && (
            <GemPositionSliders position={gemPositionRight} onChange={onGemPositionRightChange} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background px-3 py-2.5">
      <EngravingSection
        label="Engraving"
        value={value}
        onChange={onChange}
        variant={resolvedVariant}
        isEarring={false}
        outOfBounds={outOfBounds}
      />
    </div>
  );
}
