"use client";

import dynamic from "next/dynamic";
import type { ProductType, FinishType } from "@/lib/customiser/types";

const SceneCanvas = dynamic(
  () => import("@/components/preview/scene/SceneCanvas"),
  { ssr: false }
);

interface PreviewStageProps {
  product: ProductType | null;
  engravingInitial: string;
  finish: FinishType | null;
}

export default function PreviewStage({
  product,
  engravingInitial,
  finish,
}: PreviewStageProps) {
  return (
    <div className="relative h-full w-full">
      <SceneCanvas product={product} finish={finish} />

      {!product && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted">Select a piece</span>
        </div>
      )}

      {engravingInitial && (
        <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center">
          <span className="font-script text-lg text-foreground/80">
            {engravingInitial}
          </span>
        </div>
      )}
    </div>
  );
}
