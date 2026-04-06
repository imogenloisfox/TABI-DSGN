"use client";

import { useEffect, useRef, useState } from "react";
import type { EngravingParams, ProductCategory, ProductVariant, GemPosition } from "@/lib/customiser/types";
import { EARRING_GEM_BOUNDS, ENGRAVING_SLIDER_CONFIG } from "@/lib/customiser/types";
import BarSlider, { type SliderTrackMode } from "./BarSlider";
import { CHROME_LABEL_FONT, stepLabelClassForCategory } from "@/lib/chromeUi";
import { UI_FONT_FAMILY } from "@/lib/uiFont";

interface InitialStepProps {
  category:                  ProductCategory | null;
  variant?:                  ProductVariant | null;
  /**
   * Desktop / wide layout only — when true, the first engraving field is focused after mount
   * so the user can type without clicking. Omit on coarse-pointer / mobile layouts to avoid
   * popping the on-screen keyboard or stealing focus from earlier controls.
   */
  autoFocusFirstEngraving?: boolean;
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
  // 2-D tint canvas previews (shows safe-zone guide)
  tintCanvas?:      HTMLCanvasElement | null;
  tintCanvasLeft?:  HTMLCanvasElement | null;
  tintCanvasRight?: HTMLCanvasElement | null;
  /** Slider rail/fill: ring, pendant, or default */
  sliderTrackMode?: SliderTrackMode;
  /** Mobile panel: render sliders above the textarea instead of below. */
  slidersFirst?: boolean;
  /** Mobile panel: halve textarea height. */
  compact?: boolean;
  /** When false, hides the section label (e.g. "Engraving"). */
  showLabel?: boolean;
  /** When true, suppresses earring gem position sliders (they live in the gemstone tab on mobile). */
  hideGemPositionSliders?: boolean;
}


function TintPreview({ tintCanvas, value }: { tintCanvas: HTMLCanvasElement; value: EngravingParams }) {
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const preview = previewRef.current;
      if (!preview) return;
      preview.width  = tintCanvas.width;
      preview.height = tintCanvas.height;
      const ctx = preview.getContext("2d");
      ctx?.drawImage(tintCanvas, 0, 0);
    });
    return () => cancelAnimationFrame(id);
  // value in deps so we re-copy after the hook redraws the canvas
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tintCanvas, value]);

  return (
    <canvas
      ref={previewRef}
      className="mt-0 w-full border border-[#676767]/40"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function EngravingSection({
  label,
  labelClassName,
  value,
  onChange,
  variant,
  isEarring,
  outOfBounds,
  tintCanvas,
  sliderTrackMode = "default",
  requestInitialFocus = false,
  slidersFirst = false,
  compact = false,
  showLabel = true,
}: {
  label:          string;
  labelClassName: string;
  value:       EngravingParams;
  onChange:    (params: EngravingParams) => void;
  variant:     ProductVariant;
  isEarring:   boolean;
  outOfBounds?: boolean;
  tintCanvas?:  HTMLCanvasElement | null;
  sliderTrackMode?: SliderTrackMode;
  /** First engraving block only (e.g. left earring) — avoids focusing two fields. */
  requestInitialFocus?: boolean;
  slidersFirst?: boolean;
  compact?: boolean;
  showLabel?: boolean;
}) {
  const cfg = ENGRAVING_SLIDER_CONFIG[variant];
  const set = (patch: Partial<EngravingParams>) => onChange({ ...value, ...patch });

  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!requestInitialFocus) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) textareaRef.current?.focus();
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [requestInitialFocus, variant]);

  function handleTextChange(raw: string) {
    if (isEarring) {
      // Disallow newlines for earrings — single line only
      const single = raw.replace(/\n/g, "");
      set({ text: single });
    } else {
      if (raw.split("\n").length > 5) return;
      set({ text: raw });
    }
  }

  const cursorColor = "#2a2c2d";

  const textareaHeight = isEarring ? "h-[40px]" : compact ? "h-[48px]" : "h-[96px]";

  const hasText = value.text.trim().length > 0;

  const textareaBlock = (
    <div
      className={`relative ${textareaHeight} w-[240px]`}
    >
      <textarea
        ref={textareaRef}
        rows={isEarring ? 1 : compact ? 2 : 5}
        value={value.text}
        placeholder="Type here..."
        onChange={(e) => handleTextChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          // Block Enter key entirely for earrings
          if (isEarring && e.key === "Enter") e.preventDefault();
        }}
        className={`w-full max-w-[240px] resize-none border-0 text-[16px] leading-[1.2] focus:outline-none min-h-0 ${
          isEarring
            ? "h-full px-2 whitespace-nowrap overflow-x-auto overflow-y-hidden pt-1.5 pb-1.5"
            : "h-full px-2 pt-1.5 pb-1.5"
        } bg-[#ffffff] text-[#2a2c2d] placeholder:text-[#b1b1b1] placeholder:font-normal`}
        style={{
          fontFamily: UI_FONT_FAMILY,
        }}
      />
      {/* Blinking cursor only when there's text and the field is unfocused */}
      {!isFocused && hasText && (
        <span
          aria-hidden
          className={`engraving-cursor-blink pointer-events-none absolute left-2 select-none text-[16px] leading-[1.2] top-1.5`}
          style={{ color: cursorColor, fontFamily: UI_FONT_FAMILY }}
        >
          |
        </span>
      )}
    </div>
  );

  const slidersBlock = (
    <div
      className="flex w-[240px] flex-col gap-0"
      style={{
        opacity: hasText ? 1 : 0.35,
        pointerEvents: hasText ? undefined : "none",
        transition: "opacity 0.2s ease",
      }}
    >
      <BarSlider
        label="Pos X"
        value={value.offsetX}
        min={cfg.posX.min} max={cfg.posX.max} step={0.01}
        trackMode={sliderTrackMode}
        onChange={(v) => set({ offsetX: v })}
      />
      <BarSlider
        label="Pos Y"
        value={value.offsetY}
        min={cfg.posY.min} max={cfg.posY.max} step={0.01}
        trackMode={sliderTrackMode}
        onChange={(v) => set({ offsetY: v })}
      />
      <BarSlider
        label="scale"
        value={value.fontSize}
        min={cfg.size.min} max={cfg.size.max} step={0.01}
        trackMode={sliderTrackMode}
        onChange={(v) => set({ fontSize: v })}
      />
      {cfg.spacing !== null && value.text.includes("\n") && (
        <BarSlider
          label="Spacing"
          value={value.lineSpacing}
          min={cfg.spacing.min} max={cfg.spacing.max} step={0.05}
          trackMode={sliderTrackMode}
          onChange={(v) => set({ lineSpacing: v })}
        />
      )}
    </div>
  );

  return (
    <div>
      {showLabel && (
        <p className={labelClassName} style={CHROME_LABEL_FONT}>
          {label}
        </p>
      )}
      {slidersFirst ? (
        <>
          {slidersBlock}
          {textareaBlock}
        </>
      ) : (
        <>
          {textareaBlock}
          {slidersBlock}
        </>
      )}
      {tintCanvas && <TintPreview tintCanvas={tintCanvas} value={value} />}
    </div>
  );
}

function GemPositionSliders({
  labelClassName,
  position, onChange, sliderTrackMode = "default",
}: {
  labelClassName: string;
  position: GemPosition;
  onChange: (pos: GemPosition) => void;
  sliderTrackMode?: SliderTrackMode;
}) {
  return (
    <div className="mt-0 flex w-[240px] flex-col gap-0 pt-0">
      <p className={labelClassName} style={CHROME_LABEL_FONT}>
        Gemstone
      </p>
      <BarSlider
        label="Pos X" value={position.x}
        min={EARRING_GEM_BOUNDS.minX} max={EARRING_GEM_BOUNDS.maxX} step={0.01}
        trackMode={sliderTrackMode}
        onChange={(v) => onChange({ ...position, x: v })}
      />
      <BarSlider
        label="Pos Y" value={position.y}
        min={EARRING_GEM_BOUNDS.minY} max={EARRING_GEM_BOUNDS.maxY} step={0.01}
        trackMode={sliderTrackMode}
        onChange={(v) => onChange({ ...position, y: v })}
      />
    </div>
  );
}

export default function InitialStep({
  category,
  variant, value, onChange,
  valueLeft, onChangeLeft, valueRight, onChangeRight,
  gemPositionLeft, onGemPositionLeftChange,
  gemPositionRight, onGemPositionRightChange,
  outOfBounds, outOfBoundsLeft, outOfBoundsRight,
  tintCanvas, tintCanvasLeft, tintCanvasRight,
  sliderTrackMode = "default",
  autoFocusFirstEngraving = false,
  slidersFirst = false,
  compact = false,
  showLabel = true,
  hideGemPositionSliders = false,
}: InitialStepProps) {
  const resolvedVariant: ProductVariant = variant ?? "ringClassic";
  const isEarring = resolvedVariant === "earrings";
  const sectionLabelClass = stepLabelClassForCategory(
    category,
    isEarring ? "earring" : "standard",
  );

  if (isEarring && valueLeft && onChangeLeft && valueRight && onChangeRight) {
    return (
      <div className="flex flex-col gap-0 py-0">
        <div>
          <EngravingSection
            label="Left engraving"
            labelClassName={sectionLabelClass}
            value={valueLeft}
            onChange={onChangeLeft}
            variant="earrings"
            isEarring
            outOfBounds={outOfBoundsLeft}
            tintCanvas={tintCanvasLeft}
            sliderTrackMode={sliderTrackMode}
            requestInitialFocus={autoFocusFirstEngraving}
            slidersFirst={slidersFirst}
            compact={compact}
            showLabel={showLabel}
          />
          {!hideGemPositionSliders && gemPositionLeft && onGemPositionLeftChange && (
            <GemPositionSliders
              labelClassName={sectionLabelClass}
              position={gemPositionLeft}
              onChange={onGemPositionLeftChange}
              sliderTrackMode={sliderTrackMode}
            />
          )}
        </div>
        <div>
          <EngravingSection
            label="Right engraving"
            labelClassName={sectionLabelClass}
            value={valueRight}
            onChange={onChangeRight}
            variant="earrings"
            isEarring
            outOfBounds={outOfBoundsRight}
            tintCanvas={tintCanvasRight}
            sliderTrackMode={sliderTrackMode}
            requestInitialFocus={false}
            slidersFirst={slidersFirst}
            compact={compact}
            showLabel={showLabel}
          />
          {!hideGemPositionSliders && gemPositionRight && onGemPositionRightChange && (
            <GemPositionSliders
              labelClassName={sectionLabelClass}
              position={gemPositionRight}
              onChange={onGemPositionRightChange}
              sliderTrackMode={sliderTrackMode}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-0">
      <EngravingSection
        label="Engraving"
        labelClassName={sectionLabelClass}
        value={value}
        onChange={onChange}
        variant={resolvedVariant}
        isEarring={false}
        outOfBounds={outOfBounds}
        tintCanvas={tintCanvas}
        sliderTrackMode={sliderTrackMode}
        requestInitialFocus={autoFocusFirstEngraving}
        slidersFirst={slidersFirst}
        compact={compact}
        showLabel={showLabel}
      />
    </div>
  );
}
