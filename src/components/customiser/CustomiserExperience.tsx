"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  CustomiserState,
  ProductCategory,
  ProductVariant,
  FinishType,
  GemstoneId,
  EngravingParams,
  GemPosition,
  UKRingSize,
} from "@/lib/customiser/types";
import {
  INITIAL_STATE,
  ENGRAVING_DEFAULTS,
  ENGRAVING_DEFAULTS_EARRING,
  EARRING_GEM_POSITION_DEFAULT,
  variantEngravingGroup,
  variantIsRing,
} from "@/lib/customiser/types";
import { useEngravingTexture, CANVAS_SIZE } from "@/hooks/useEngravingTexture";
import { getGemstone } from "@/data/gemstones";
import { exportSpecSheet } from "@/lib/customiser/exportSpecSheet";
import type { SceneCanvasHandle } from "@/components/preview/scene/SceneCanvas";
import StartPrompt from "./StartPrompt";
import ProductSelector from "./ProductSelector";
import InitialStep from "./InitialStep";
import FinishStep from "./FinishStep";
import GemstoneStep from "./GemstoneStep";
import RingSizeStep from "./RingSizeStep";
import PreviewStage from "@/components/preview/PreviewStage";
import StageLayout from "@/components/layout/StageLayout";

// Fallback variant per category when no specific variant is provided
const CATEGORY_DEFAULT_VARIANT: Record<ProductCategory, ProductVariant> = {
  ring:     "ringClassic",
  pendant:  "pendantOne",
  earrings: "earrings",
};

function buildInitialState(initialCategory?: ProductCategory, initialVariant?: ProductVariant): CustomiserState {
  if (!initialCategory) return INITIAL_STATE;
  const variant = initialVariant ?? CATEGORY_DEFAULT_VARIANT[initialCategory];
  return {
    ...INITIAL_STATE,
    view:     "workspace",
    category: initialCategory,
    variant,
    engraving: ENGRAVING_DEFAULTS[variantEngravingGroup(variant)],
  };
}

interface CustomiserExperienceProps {
  initialCategory?: ProductCategory;
  initialVariant?:  ProductVariant;
  onBack?:          () => void;
  exiting?:         boolean;
}

export default function CustomiserExperience({
  initialCategory,
  initialVariant,
  onBack,
  exiting = false,
}: CustomiserExperienceProps) {
  const [state, setState] = useState<CustomiserState>(() => buildInitialState(initialCategory, initialVariant));
  const [isGenerating, setIsGenerating] = useState(false);

  const [cameraResetSignal] = useState(0);

  // Imperative handle for three-angle camera captures
  const captureHandleRef = useRef<SceneCanvasHandle | null>(null);

  // Fade-in on mount
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleCaptureReady = useCallback((handle: SceneCanvasHandle | null) => {
    captureHandleRef.current = handle;
  }, []);

  // ── Reset the current piece customisation without changing product or variant ─
  const resetAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      engraving:        ENGRAVING_DEFAULTS[variantEngravingGroup(prev.variant ?? "ringClassic")],
      engravingLeft:    ENGRAVING_DEFAULTS_EARRING.earringLeft,
      engravingRight:   ENGRAVING_DEFAULTS_EARRING.earringRight,
      finish:           "shiny",
      gemstone:         "white-cz",
      gemPosition:      { x: 0, y: 0 },
      gemPositionLeft:  EARRING_GEM_POSITION_DEFAULT,
      gemPositionRight: EARRING_GEM_POSITION_DEFAULT,
      ringSize:         "M",
    }));
  }, []);

  const enterWorkspace = useCallback(() => {
    setState((prev) => ({ ...prev, view: "workspace" }));
  }, []);

  const setVariant = useCallback((category: ProductCategory, variant: ProductVariant) => {
    setState((prev) => ({
      ...prev,
      category,
      variant,
      engraving:      ENGRAVING_DEFAULTS[variantEngravingGroup(variant)],
      engravingLeft:  ENGRAVING_DEFAULTS_EARRING.earringLeft,
      engravingRight: ENGRAVING_DEFAULTS_EARRING.earringRight,
      gemstone:         "white-cz",
      gemPosition:      { x: 0, y: 0 },
      gemPositionLeft:  EARRING_GEM_POSITION_DEFAULT,
      gemPositionRight: EARRING_GEM_POSITION_DEFAULT,
      ringSize:         "M",
    }));
  }, []);

  const setRingSize = useCallback((ringSize: UKRingSize) => {
    setState((prev) => ({ ...prev, ringSize }));
  }, []);

  const setEngraving = useCallback((engraving: EngravingParams) => {
    setState((prev) => ({ ...prev, engraving }));
  }, []);

  const setEngravingLeft = useCallback((engravingLeft: EngravingParams) => {
    setState((prev) => ({ ...prev, engravingLeft }));
  }, []);

  const setEngravingRight = useCallback((engravingRight: EngravingParams) => {
    setState((prev) => ({ ...prev, engravingRight }));
  }, []);

  const setFinish = useCallback((finish: FinishType) => {
    setState((prev) => ({ ...prev, finish }));
  }, []);

  const setGemstone = useCallback((gemstone: GemstoneId) => {
    setState((prev) => ({ ...prev, gemstone }));
  }, []);

  const setGemPosition = useCallback((gemPosition: GemPosition) => {
    setState((prev) => ({ ...prev, gemPosition }));
  }, []);

  const setGemPositionLeft = useCallback((gemPositionLeft: GemPosition) => {
    setState((prev) => ({ ...prev, gemPositionLeft }));
  }, []);

  const setGemPositionRight = useCallback((gemPositionRight: GemPosition) => {
    setState((prev) => ({ ...prev, gemPositionRight }));
  }, []);

  const isEarrings = state.variant === "earrings";
  const isRing     = variantIsRing(state.variant);

  // Main engraving texture — ring/pendant group, null for earrings
  const engravingTextures = useEngravingTexture(
    state.engraving,
    state.variant && !isEarrings ? variantEngravingGroup(state.variant) : null,
    state.finish,
    undefined,
    undefined,
    state.variant,
  );

  // Per-earring textures
  const earringLeftTextures = useEngravingTexture(
    state.engravingLeft,
    isEarrings ? "earringLeft" : null,
    state.finish,
    undefined,
    "engraving-left-earring.png",
  );

  const earringRightTextures = useEngravingTexture(
    state.engravingRight,
    isEarrings ? "earringRight" : null,
    state.finish,
    undefined,
    "engraving-right-earring.png",
  );

  // Combined out-of-bounds flag for the preview overlay
  const anyOutOfBounds = isEarrings
    ? ((earringLeftTextures?.isOutOfBounds ?? false) || (earringRightTextures?.isOutOfBounds ?? false))
    : (engravingTextures?.isOutOfBounds ?? false);

  const handleExportSpec = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      let renderViews: { front: string; left: string; right: string } | null = null;
      if (captureHandleRef.current) {
        renderViews = await captureHandleRef.current.captureAngles();
      }

      const bumpCanvas      = isEarrings
        ? (earringLeftTextures?.bumpCanvas  ?? null)
        : (engravingTextures?.bumpCanvas    ?? null);
      const bumpCanvasRight = isEarrings
        ? (earringRightTextures?.bumpCanvas ?? null)
        : undefined;

      const variant     = state.variant;
      const engTarget   = isEarrings ? "earringLeft" as const
                        : variant?.startsWith("pendant") ? "pendant" as const
                        : "ring" as const;
      const { w, h }    = CANVAS_SIZE[engTarget];
      const canvasLabel = `${engTarget} (${w}×${h})`;

      const engraving   = isEarrings ? state.engravingLeft : state.engraving;

      await exportSpecSheet({
        variant,
        finish:            state.finish,
        gemstoneLabel:     state.gemstone ? (getGemstone(state.gemstone)?.label ?? null) : null,
        ringSize:          isRing ? (state.ringSize ?? null) : null,
        engravingText:     engraving.text,
        engravingOffsetX:  engraving.offsetX,
        engravingOffsetY:  engraving.offsetY,
        engravingFontSize: engraving.fontSize,
        engravingRotation: engraving.rotation,
        engravingSpacing:  engraving.lineSpacing,
        engravingRightText:     isEarrings ? state.engravingRight.text         : undefined,
        engravingRightOffsetX:  isEarrings ? state.engravingRight.offsetX      : undefined,
        engravingRightOffsetY:  isEarrings ? state.engravingRight.offsetY      : undefined,
        engravingRightFontSize: isEarrings ? state.engravingRight.fontSize     : undefined,
        engravingRightRotation: isEarrings ? state.engravingRight.rotation     : undefined,
        engravingRightSpacing:  isEarrings ? state.engravingRight.lineSpacing  : undefined,
        renderViews,
        bumpCanvas,
        bumpCanvasRight,
        canvasTarget: canvasLabel,
      });
    } catch (err) {
      console.error("Spec sheet export failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [
    state, isEarrings, isRing, isGenerating,
    engravingTextures, earringLeftTextures, earringRightTextures,
  ]);

  return (
    <div
      className="h-dvh w-full transition-all duration-500 ease-out"
      style={{
        opacity:   exiting ? 0 : visible ? 1 : 0,
        transform: exiting ? "translateY(12px)" : visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
    <StageLayout
      view={state.view}
      startScreen={<StartPrompt onStart={enterWorkspace} />}
      workspace={
        <div className="flex h-full flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-2">
            {onBack ? (
              <button
                onClick={onBack}
                className="text-[10px] font-mono uppercase tracking-wide text-foreground transition-colors"
              >
                TABI DSGN
              </button>
            ) : (
              <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground">
                TABI DSGN
              </span>
            )}
            <span className="text-[10px] font-mono uppercase tracking-wide text-foreground">
              Engraving Customiser
            </span>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            <aside className="flex shrink-0 flex-col divide-y divide-foreground overflow-y-auto border-b border-border bg-background md:w-[240px] md:border-b-0 md:border-r">
              <ProductSelector
                selectedCategory={state.category}
                selectedVariant={state.variant}
                onSelect={setVariant}
              />
              {state.variant && (
                <>
                  <FinishStep
                    selected={state.finish}
                    onSelect={setFinish}
                  />
                  {isRing && (
                    <RingSizeStep
                      selected={state.ringSize}
                      onSelect={setRingSize}
                    />
                  )}
                  {state.variant !== "earrings" && (
                    <GemstoneStep
                      variant={state.variant}
                      selected={state.gemstone}
                      onSelect={setGemstone}
                      gemPosition={state.gemPosition}
                      onGemPositionChange={setGemPosition}
                    />
                  )}
                  <InitialStep
                    variant={state.variant}
                    value={state.engraving}
                    onChange={setEngraving}
                    valueLeft={state.engravingLeft}
                    onChangeLeft={setEngravingLeft}
                    valueRight={state.engravingRight}
                    onChangeRight={setEngravingRight}
                    gemPositionLeft={state.gemPositionLeft}
                    onGemPositionLeftChange={setGemPositionLeft}
                    gemPositionRight={state.gemPositionRight}
                    onGemPositionRightChange={setGemPositionRight}
                    outOfBounds={isEarrings ? false : (engravingTextures?.isOutOfBounds ?? false)}
                    outOfBoundsLeft={isEarrings ? (earringLeftTextures?.isOutOfBounds  ?? false) : false}
                    outOfBoundsRight={isEarrings ? (earringRightTextures?.isOutOfBounds ?? false) : false}
                  />
                  {/* Reset current piece customisation */}
                  <div className="bg-background px-3 py-2.5">
                    <button
                      onClick={resetAll}
                      className="btn-primary w-full cursor-pointer border border-foreground bg-surface px-3 py-2 text-[10px] font-mono tracking-[0.12em] uppercase text-foreground"
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}

              {/* Export spec sheet — pinned to bottom */}
              {state.variant && (
                <div className="mt-auto bg-background px-3 py-3">
                  <button
                    onClick={handleExportSpec}
                    disabled={isGenerating}
                    className="btn-primary w-full cursor-pointer border border-foreground bg-surface px-3 py-2 text-[10px] font-mono tracking-[0.12em] uppercase text-foreground disabled:cursor-wait disabled:opacity-50"
                  >
                    {isGenerating ? "Generating…" : "Export Spec Sheet"}
                  </button>
                </div>
              )}
            </aside>

            <main className="relative flex-1 min-h-0 bg-background">
              <PreviewStage
                variant={state.variant}
                finish={state.finish}
                gemstone={state.gemstone}
                bumpMap={isEarrings ? (earringLeftTextures?.bumpMap ?? null) : (engravingTextures?.bumpMap ?? null)}
                colorTintMap={isEarrings ? (earringLeftTextures?.colorTintMap ?? null) : (engravingTextures?.colorTintMap ?? null)}
                bumpMapRight={earringRightTextures?.bumpMap ?? null}
                colorTintMapRight={earringRightTextures?.colorTintMap ?? null}
                gemPosition={state.gemPosition}
                gemPositionLeft={state.gemPositionLeft}
                gemPositionRight={state.gemPositionRight}
                onCaptureReady={handleCaptureReady}
                cameraResetSignal={cameraResetSignal}
              />

              {/* Out-of-bounds warning overlay */}
              {anyOutOfBounds && !isGenerating && (
                <div className="pointer-events-none absolute inset-x-0 top-8 z-20 flex justify-center">
                  <div className="border border-foreground bg-background px-5 py-4 text-center">
                    <p className="text-[10px] font-mono tracking-[0.12em] uppercase text-foreground">
                      Engraving out of bounds
                    </p>
                    <p className="mt-1 text-[9px] font-mono tracking-[0.1em] uppercase text-foreground">
                      Move or reduce the size of the engraving
                    </p>
                  </div>
                </div>
              )}

              {/* Generating overlay */}
              {isGenerating && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
                  <div className="border border-border bg-surface px-5 py-3 shadow-sm">
                    <p className="text-[10px] font-mono tracking-[0.14em] uppercase text-foreground">
                      Generating spec sheet…
                    </p>
                    <p className="mt-1 text-[9px] font-mono text-foreground">
                      Please do not interact with the canvas
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      }
    />
    </div>
  );
}
