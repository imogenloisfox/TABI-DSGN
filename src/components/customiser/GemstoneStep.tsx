"use client";

import type { GemstoneId, GemPosition, ProductCategory, ProductVariant } from "@/lib/customiser/types";
import {
  CONCAVE_GEM_BOUNDS,
  variantUsesGemColour,
  variantHasGemSliders,
  variantIsPendant,
  variantIsRing,
} from "@/lib/customiser/types";
import { GEMSTONES, getGemstone } from "@/data/gemstones";
import {
  CHROME_HEADER_FONT,
  CHROME_LABEL_FONT,
  chromeChipInactive,
  chromeChipInactivePendant,
  pendantGemSwatchChipSelected,
  pendantGemSwatchChipDefaultMobile,
  pendantGemSwatchChipSelectedMobile,
  mobileBtnStyle,
  ringGemSwatchChipDefault,
  ringGemSwatchChipSelected,
  ringGemSwatchChipDefaultMobile,
  ringGemSwatchChipSelectedMobile,
  stepLabelClassForCategory,
} from "@/lib/chromeUi";
import BarSlider, { type SliderTrackMode } from "./BarSlider";

/** Read-only header cells (no pointer/hover — not buttons). */
function gemstoneHeaderCellClass(): string {
  return (
    "flex h-[30px] min-w-0 w-full items-center justify-center border-0 px-3 text-center text-[14px] font-bold leading-none lowercase shadow-none outline-none pointer-events-none select-none tracking-normal text-[#2a2c2d]"
  );
}

interface GemstoneStepProps {
  category:            ProductCategory | null;
  variant:             ProductVariant | null;
  selected:            GemstoneId | null;
  onSelect:            (id: GemstoneId) => void;
  gemPosition:         GemPosition;
  onGemPositionChange: (pos: GemPosition) => void;
  sliderTrackMode?: SliderTrackMode;
  showLabel?: boolean;
  /** When true, swatches render in a single scrollable row (mobile panels). */
  singleRow?: boolean;
  /** When true, use mobile class variants (no hover/active colour changes). */
  mobile?: boolean;
}

export default function GemstoneStep({
  category,
  variant, selected, onSelect, gemPosition, onGemPositionChange,
  sliderTrackMode = "default",
  showLabel = true,
  singleRow = false,
  mobile = false,
}: GemstoneStepProps) {
  const showColours = variant ? variantUsesGemColour(variant) : false;
  const showSliders = variant ? variantHasGemSliders(variant) : false;
  const isPendantGem = Boolean(variant && variantIsPendant(variant));
  const isRingGem    = Boolean(variant && variantIsRing(variant));
  const selectedGem = showColours && selected ? getGemstone(selected) : undefined;

  return (
    <div className="py-0">
      {showLabel &&
        (showColours ? (
          <div
            className="grid w-full max-w-[240px] grid-cols-2 gap-0"
            role="group"
            aria-label="Gemstone selection display"
          >
            <div
              className={gemstoneHeaderCellClass()}
              style={{ ...CHROME_HEADER_FONT, backgroundColor: "#ffffff" }}
            >
              Gemstone
            </div>
            <div
              className={gemstoneHeaderCellClass()}
              style={{ ...CHROME_HEADER_FONT, backgroundColor: "#ffffff" }}
              title={selectedGem?.label}
            >
              {selectedGem ? (
                <span className="min-w-0 w-full truncate lowercase">{selectedGem.label}</span>
              ) : (
                <span className="text-[#2a2c2d]" aria-hidden>
                  —
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className={stepLabelClassForCategory(category)} style={CHROME_LABEL_FONT}>
            Gemstone
          </p>
        ))}

      {/* Mobile single-row: sliders above, swatches below; desktop: swatches then sliders */}
      {singleRow && showSliders && (
        <div className="flex flex-col gap-0" style={{ width: 240 }}>
          <BarSlider
            label="Pos X" value={gemPosition.x}
            min={CONCAVE_GEM_BOUNDS.minX} max={CONCAVE_GEM_BOUNDS.maxX} step={0.01}
            trackMode={sliderTrackMode}
            onChange={(v) => onGemPositionChange({ ...gemPosition, x: v })}
          />
          <BarSlider
            label="Pos Y" value={gemPosition.y}
            min={CONCAVE_GEM_BOUNDS.minY} max={CONCAVE_GEM_BOUNDS.maxY} step={0.01}
            trackMode={sliderTrackMode}
            onChange={(v) => onGemPositionChange({ ...gemPosition, y: v })}
          />
        </div>
      )}

      {/* Mobile gem name label — shows above swatch row */}
      {singleRow && mobile && showColours && (
        <div
          className="flex h-[30px] w-[80px] shrink-0 items-center justify-center"
          style={{ ...CHROME_HEADER_FONT, backgroundColor: "#ffffff", color: "#2a2c2d" }}
        >
          <span className="truncate text-[14px] lowercase">
            {selectedGem ? selectedGem.label : "—"}
          </span>
        </div>
      )}

      {showColours && (
        <div className={singleRow ? "flex flex-nowrap gap-0 overflow-x-auto" : "flex max-w-[240px] flex-wrap gap-x-0 gap-y-0"}>
          {GEMSTONES.map((gem) => {
            const active = selected === gem.id;
            const chipBase = isPendantGem
              ? mobile
                ? (active ? pendantGemSwatchChipSelectedMobile : pendantGemSwatchChipDefaultMobile)
                : (active ? pendantGemSwatchChipSelected : chromeChipInactivePendant)
              : isRingGem
                ? mobile
                  ? (active ? ringGemSwatchChipSelectedMobile : ringGemSwatchChipDefaultMobile)
                  : (active ? ringGemSwatchChipSelected : ringGemSwatchChipDefault)
                : chromeChipInactive;
            return (
              <button
                key={gem.id}
                type="button"
                onClick={() => onSelect(gem.id)}
                title={gem.label}
                className={`${chipBase} !h-[30px] !min-h-[30px] !min-w-[30px] !w-[30px] shrink-0 !p-0 shadow-none chip-hover`}
                style={{ color: "#2a2c2d", backgroundColor: active ? "#d9d9d9" : "#ffffff", ["--btn-bg" as string]: active ? "#d9d9d9" : "#ffffff", ["--btn-color" as string]: "#2a2c2d" }}
                data-active={active ? "true" : undefined}
              >
                <span
                  className="block h-4 w-4 shrink-0"
                  style={{ backgroundColor: gem.hex }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Desktop: sliders below swatches */}
      {!singleRow && showSliders && (
        <div className="mt-0 flex max-w-[240px] flex-col gap-0">
          <BarSlider
            label="Pos X" value={gemPosition.x}
            min={CONCAVE_GEM_BOUNDS.minX} max={CONCAVE_GEM_BOUNDS.maxX} step={0.01}
            trackMode={sliderTrackMode}
            onChange={(v) => onGemPositionChange({ ...gemPosition, x: v })}
          />
          <BarSlider
            label="Pos Y" value={gemPosition.y}
            min={CONCAVE_GEM_BOUNDS.minY} max={CONCAVE_GEM_BOUNDS.maxY} step={0.01}
            trackMode={sliderTrackMode}
            onChange={(v) => onGemPositionChange({ ...gemPosition, y: v })}
          />
        </div>
      )}
    </div>
  );
}
