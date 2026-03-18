"use client";

import { useState, useCallback } from "react";
import type {
  CustomiserState,
  ProductType,
  FinishType,
} from "@/lib/customiser/types";
import { INITIAL_STATE } from "@/lib/customiser/types";
import StartPrompt from "./StartPrompt";
import ProductSelector from "./ProductSelector";
import InitialStep from "./InitialStep";
import FinishStep from "./FinishStep";
import PreviewStage from "@/components/preview/PreviewStage";
import StageLayout from "@/components/layout/StageLayout";

export default function CustomiserExperience() {
  const [state, setState] = useState<CustomiserState>(INITIAL_STATE);

  const enterWorkspace = useCallback(() => {
    setState((prev) => ({ ...prev, view: "workspace" }));
  }, []);

  const setProduct = useCallback((product: ProductType) => {
    setState((prev) => ({ ...prev, product }));
  }, []);

  const setEngravingText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, engravingInitial: text }));
  }, []);

  const setFinish = useCallback((finish: FinishType) => {
    setState((prev) => ({ ...prev, finish }));
  }, []);

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
                selected={state.product}
                onSelect={setProduct}
              />
              <InitialStep
                value={state.engravingInitial}
                onChange={setEngravingText}
              />
              <FinishStep
                selected={state.finish}
                onSelect={setFinish}
              />
            </aside>

            <main className="flex-1 min-h-0">
              <PreviewStage
                product={state.product}
                engravingInitial={state.engravingInitial}
                finish={state.finish}
              />
            </main>
          </div>
        </div>
      }
    />
  );
}
