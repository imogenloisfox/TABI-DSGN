"use client";

import { useState, useCallback } from "react";
import type {
  CustomiserState,
  ProductCategory,
  ProductVariant,
  FinishType,
  GemstoneId,
  EngravingParams,
  GemPosition,
} from "@/lib/customiser/types";
import {
  INITIAL_STATE,
  ENGRAVING_DEFAULTS,
  ENGRAVING_DEFAULTS_EARRING,
  variantEngravingGroup,
} from "@/lib/customiser/types";
import { useEngravingTexture } from "@/hooks/useEngravingTexture";
import StartPrompt from "./StartPrompt";
import ProductSelector from "./ProductSelector";
import InitialStep from "./InitialStep";
import FinishStep from "./FinishStep";
import GemstoneStep from "./GemstoneStep";
import PreviewStage from "@/components/preview/PreviewStage";
import StageLayout from "@/components/layout/StageLayout";

export default function CustomiserExperience() {
  const [state, setState] = useState<CustomiserState>(INITIAL_STATE);

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
      gemPositionLeft:  { x: 0, y: 0 },
      gemPositionRight: { x: 0, y: 0 },
    }));
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

  // Main engraving texture — ring/pendant group, null for earrings
  const engravingTextures = useEngravingTexture(
    state.engraving,
    state.variant && !isEarrings ? variantEngravingGroup(state.variant) : null,
    state.finish,
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

  return (
    <StageLayout
      view={state.view}
      startScreen={<StartPrompt onStart={enterWorkspace} />}
      workspace={
        <div className="flex h-full flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-2">
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground">
              TABI DSGN
            </span>
            <span className="text-[10px] font-mono text-muted">
              Engraving Customiser
            </span>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            <aside className="flex shrink-0 flex-col gap-px overflow-y-auto border-b border-border bg-border md:w-[240px] md:border-b-0 md:border-r">
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
                  />
                </>
              )}
            </aside>

            <main className="flex-1 min-h-0">
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
              />
            </main>
          </div>
        </div>
      }
    />
  );
}
