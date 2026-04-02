"use client";

import dynamic from "next/dynamic";
import * as THREE from "three";
import type { ProductVariant, FinishType, GemstoneId, GemPosition } from "@/lib/customiser/types";
import type { SceneCanvasHandle } from "@/components/preview/scene/SceneCanvas";

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
  onCaptureReady?:    ((handle: SceneCanvasHandle | null) => void) | null;
  cameraResetSignal?: number;
  /** Incremented after sidebar chrome changes; used to resync WebGL once CSS width transition finishes. */
  previewLayoutEpoch?: number;
  /** Height of fixed left chrome stack — forwarded to PreviewShopPills for dynamic top offset. */
  leftChromeStackPx?: number;
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
  onCaptureReady,
  cameraResetSignal,
  previewLayoutEpoch = 0,
  leftChromeStackPx,
}: PreviewStageProps) {
  return (
    <div className="relative h-full min-h-0 w-full min-w-0 bg-[#e9e9e9]">
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
        onCaptureReady={onCaptureReady}
        cameraResetSignal={cameraResetSignal}
        previewLayoutEpoch={previewLayoutEpoch}
        leftChromeStackPx={leftChromeStackPx}
      />

      {!variant && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted">Select a piece</span>
        </div>
      )}
    </div>
  );
}
