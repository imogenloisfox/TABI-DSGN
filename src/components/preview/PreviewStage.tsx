"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { ProductVariant, FinishType, GemstoneId, GemPosition } from "@/lib/customiser/types";
import type { SceneCanvasHandle } from "@/components/preview/scene/SceneCanvas";
import {
  DevFpsPillOverlay,
  type DevFpsSample,
} from "@/components/preview/DevFpsSessionChrome";
import { showFpsOverlay } from "@/lib/showFpsOverlay";
import PreviewMakingVideo from "@/components/preview/PreviewMakingVideo";
import PreviewOnlinePill from "@/components/preview/PreviewOnlinePill";

const SceneCanvas = dynamic(
  () => import("@/components/preview/scene/SceneCanvas"),
  { ssr: false }
);

/** Right rail width matches making-of video; online + FPS pills row aligns within it. */
const PREVIEW_RIGHT_RAIL_W = "w-[220px]";

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
  onBuy?: (win?: Window | null) => Promise<void>;
  onSave?: () => Promise<void>;
  shareUrl?: string;
  onSceneReady?: () => void;
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
  onBuy,
  onSave,
  shareUrl,
  onSceneReady,
}: PreviewStageProps) {
  const fpsOn = showFpsOverlay();
  const [devFpsMetrics, setDevFpsMetrics] = useState<DevFpsSample>({
    fps:    0,
    msAvg:  0,
    heapMb: null,
  });
  const devFpsSampleRef = useRef<(sample: DevFpsSample) => void>(setDevFpsMetrics);
  devFpsSampleRef.current = setDevFpsMetrics;

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-[#e9e9e9] md:flex-row">
      {/* Centre column — WebGL fills this region only so the product is framed between sidebar and right rail */}
      <div className="relative min-h-0 min-w-0 flex-1">
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
          devFpsSampleRef={devFpsSampleRef}
          onBuy={onBuy}
          onSave={onSave}
          shareUrl={shareUrl}
          onSceneReady={onSceneReady}
        />

        {!variant && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-muted">Select a piece</span>
          </div>
        )}
      </div>

      {/* Desktop — dedicated column: making-of + online + FPS (no overlap with 3D viewport) */}
      <aside
        className={`hidden shrink-0 flex-col items-end justify-end gap-0 self-stretch bg-[#e9e9e9] pb-4 pr-4 pt-0 md:flex ${PREVIEW_RIGHT_RAIL_W}`}
      >
        <PreviewMakingVideo variant={variant} />
        <div className="flex flex-row items-center gap-0">
          <PreviewOnlinePill />
          {fpsOn ? <DevFpsPillOverlay metrics={devFpsMetrics} /> : null}
        </div>
      </aside>
    </div>
  );
}
