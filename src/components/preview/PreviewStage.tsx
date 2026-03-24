"use client";

import dynamic from "next/dynamic";
import * as THREE from "three";
import type { ProductVariant, FinishType, GemstoneId, GemPosition } from "@/lib/customiser/types";

const SceneCanvas = dynamic(
  () => import("@/components/preview/scene/SceneCanvas"),
  { ssr: false }
);

interface PreviewStageProps {
  variant:            ProductVariant | null;
  finish:             FinishType | null;
  gemstone:           GemstoneId | null;
  bumpMap:            THREE.CanvasTexture | null;
  colorTintMap:       THREE.CanvasTexture | null;
  bumpMapRight?:      THREE.CanvasTexture | null;
  colorTintMapRight?: THREE.CanvasTexture | null;
  gemPosition:        GemPosition;
  gemPositionLeft:    GemPosition;
  gemPositionRight:   GemPosition;
}

export default function PreviewStage({
  variant,
  finish,
  gemstone,
  bumpMap,
  colorTintMap,
  bumpMapRight,
  colorTintMapRight,
  gemPosition,
  gemPositionLeft,
  gemPositionRight,
}: PreviewStageProps) {
  return (
    <div className="relative h-full w-full">
      <SceneCanvas
        variant={variant}
        finish={finish}
        gemstone={gemstone}
        bumpMap={bumpMap}
        colorTintMap={colorTintMap}
        bumpMapRight={bumpMapRight}
        colorTintMapRight={colorTintMapRight}
        gemPosition={gemPosition}
        gemPositionLeft={gemPositionLeft}
        gemPositionRight={gemPositionRight}
      />

      {!variant && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted">Select a piece</span>
        </div>
      )}
    </div>
  );
}
