"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

import { getEnvTexture } from "@/lib/envTextureCache";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import { buildShowcasePieces, pickUniqueGems, type ShowcasePieceConfig } from "./showcaseConfig";
import ShowcasePiece, {
  type PieceMotionState,
  type MotionConfig,
  type ClickConfig,
} from "./ShowcasePiece";
import type { ProductCategory, ProductVariant } from "@/lib/customiser/types";

import {
  DevFpsMetricsCollector,
  DevFpsPillOverlay,
  type DevFpsSample,
} from "@/components/preview/DevFpsSessionChrome";
import { showFpsOverlay } from "@/lib/showFpsOverlay";
import PreviewOnlinePill from "@/components/preview/PreviewOnlinePill";

// ─── MOBILE HOMEPAGE TUNING — edit these values to adjust the scene ─────────
export const MOBILE_SCENE_CONFIG = {
  /** Increase to make pieces bigger, decrease to make smaller */
  scale: 0.9,
  /** Decrease to bring pieces closer to camera, increase to push back */
  posZ:  6.0,
};

/** Compute the resting world-position of a piece at t=0 (no offsets). */
function initialPiecePosition(cfg: ShowcasePieceConfig): { x: number; y: number; z: number } {
  return {
    x: cfg.orbitCenterX + Math.sin(cfg.orbitPhaseX) * cfg.orbitRadiusX,
    y: cfg.orbitCenterY + Math.cos(cfg.orbitPhaseY) * cfg.orbitRadiusY,
    z: cfg.posZ,
  };
}

/** Build motionStatesRef entries seeded at their correct t=0 positions. */
function buildInitialMotionStates(pieces: ShowcasePieceConfig[]): PieceMotionState[] {
  return pieces.map((cfg) => {
    const pos = initialPiecePosition(cfg);
    return {
      x: pos.x, y: pos.y, z: pos.z,
      offsetX: 0, offsetY: 0, offsetZ: 0,
      colliderX: cfg.colliderX,
      colliderY: cfg.colliderY,
    };
  });
}

// ─── HDRI environment ─────────────────────────────────────────────────────────

/** Match marketing shell — pure white behind jewellery. */
function ShowcaseSceneBackground() {
  const { scene } = useThree();
  useEffect(() => {
    const prev = scene.background;
    const c = new THREE.Color("#e9e9e9");
    scene.background = c;
    return () => {
      if (scene.background === c) scene.background = prev;
    };
  }, [scene]);
  return null;
}

function FixedEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = 1.4;
    // Use module-level singleton cache — reuses the texture already loaded by
    // the customiser scene (same HDRI path), skipping a redundant network fetch
    // and PMREMGenerator pass.
    const hdriPath = typeof window !== "undefined" && window.innerWidth < 768
      ? "/hdri/studio_small_09_512.hdr"
      : "/hdri/studio_small_09_1k.hdr";
    getEnvTexture(gl, hdriPath).then((envTex) => {
      scene.environment = envTex;
      scene.environmentRotation.set(2.45, 0, 0);
    });
    return () => { scene.environment = null; };
  }, [gl, scene]);
  return null;
}

// ─── Separation system — Position-Based Dynamics (PBD) ───────────────────────
// Per-piece radii derived from colliderX/Y half-extents replace the old single
// global minSeparation. This means a large earring pair naturally keeps further
// from neighbours than two small rings would from each other.
// 5 solver iterations resolve chain conflicts (A→B→C) that 2 passes missed.
// Offset decay 0.96 keeps corrections alive ~50% longer than the old 0.99.

function SeparationSystem({
  motionStatesRef,
  collisionScale,
  collisionPadding,
  stiffness,
}: {
  motionStatesRef:  React.RefObject<PieceMotionState[]>;
  collisionScale:   number;
  collisionPadding: number;
  stiffness:        number;
}) {
  useFrame(() => {
    const states = motionStatesRef.current;
    const n      = states.length;

    for (let i = 0; i < n; i++) {
      states[i].offsetX *= 0.96;
      states[i].offsetY *= 0.96;
      states[i].offsetZ *= 0.96;
    }

    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const ri = Math.max(states[i].colliderX, states[i].colliderY);
          const rj = Math.max(states[j].colliderX, states[j].colliderY);
          const minDist = (ri + rj) * collisionScale + collisionPadding;

          const dx   = states[i].x - states[j].x;
          const dy   = states[i].y - states[j].y;
          const dz   = states[i].z - states[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
          if (dist < minDist) {
            const half = (minDist - dist) * 0.5 * stiffness;
            const nx   = dx / dist;
            const ny   = dy / dist;
            const nz   = dz / dist;
            const cx = nx * half, cy = ny * half, cz = nz * half;

            states[i].offsetX += cx;
            states[i].offsetY += cy;
            states[i].offsetZ += cz;
            states[j].offsetX -= cx;
            states[j].offsetY -= cy;
            states[j].offsetZ -= cz;

            states[i].x += cx;
            states[i].y += cy;
            states[i].z += cz;
            states[j].x -= cx;
            states[j].y -= cy;
            states[j].z -= cz;
          }
        }
      }
    }
  });
  return null;
}

// ─── Drag camera rotation — desktop/mouse only; gives parallax depth feel ────

interface DragState {
  targetX: number;   // degrees, ±12 horizontal
  targetY: number;   // degrees, ±6 vertical
  isDown: boolean;
  startX: number;
  startY: number;
  moved: boolean;
}

// Rotates the scene group ref rather than the camera — pieces tilt slightly on drag,
// giving a parallax depth feel without changing the viewing angle of the scene.
function DragGroupController({
  dragRef,
  groupRef,
}: {
  dragRef:  React.RefObject<DragState>;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const currXRef = useRef(0);
  const currYRef = useRef(0);

  useFrame(() => {
    const d = dragRef.current;
    const g = groupRef.current;
    if (!d || !g) return;

    const LERP   = 0.06;
    const DECAY  = 0.92;
    const TO_RAD = Math.PI / 180;

    currXRef.current += (d.targetX - currXRef.current) * LERP;
    currYRef.current += (d.targetY - currYRef.current) * LERP;

    // Y-axis = horizontal drag (yaw); X-axis = vertical drag (pitch)
    g.rotation.y = currXRef.current * TO_RAD;
    g.rotation.x = currYRef.current * TO_RAD;

    if (!d.isDown) {
      d.targetX *= DECAY;
      d.targetY *= DECAY;
      if (Math.abs(d.targetX) < 0.01) d.targetX = 0;
      if (Math.abs(d.targetY) < 0.01) d.targetY = 0;
    }
  });

  return null;
}

// ─── Mobile camera — wider FOV so pieces spread across the narrow viewport ────

function MobileCameraAdjust({ enabled, posZ }: { enabled: boolean; posZ?: number }) {
  const { camera } = useThree();
  // useLayoutEffect so FOV/posZ are set BEFORE the first paint — prevents the
  // visible snap from default 45°/z=7 to mobile 70°/z=6.
  useLayoutEffect(() => {
    if (!enabled) return;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 70;
      if (posZ !== undefined) camera.position.z = posZ;
      camera.updateProjectionMatrix();
    }
  }, [camera, enabled, posZ]);
  return null;
}

// ─── Smart DOF — imperative uniform mutation, zero React overhead ─────────────
// focusDistance = camera.z − piece.worldZ (camera is at z=7).
// Directly writes to dofRef.current.cocMaterial.focusDistance each frame —
// no setState, no re-renders, no reconciliation cost.

function SmartDOF({
  hoveredZRef,
  restFocusDist,
  focalLength,
  bokehScale,
}: {
  hoveredZRef:   React.RefObject<number | null>;
  restFocusDist: number;
  focalLength:   number;
  bokehScale:    number;
}) {
  const { camera } = useThree();
  const dofRef       = useRef<DepthOfFieldEffect>(null);
  const liveFocusRef = useRef(restFocusDist);

  useFrame(() => {
    if (!dofRef.current) return;
    const hz     = hoveredZRef.current;
    const camZ   = (camera as THREE.PerspectiveCamera).position.z;
    const target = hz !== null ? Math.max(0.1, camZ - hz) : restFocusDist;
    const next   = THREE.MathUtils.lerp(liveFocusRef.current, target, 0.08);
    if (Math.abs(next - liveFocusRef.current) > 0.0005) {
      liveFocusRef.current = next;
      // Direct uniform write — no React state, no re-render
      dofRef.current.cocMaterial.focusDistance = next;
    }
  });

  return (
    <EffectComposer>
      <DepthOfField
        ref={dofRef}
        focusDistance={restFocusDist}
        focalLength={focalLength}
        bokehScale={bokehScale}
      />
    </EffectComposer>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
// Shared mutable refs (motionStatesRef, clickSignalRef) are passed down to
// each piece — no useState, no re-renders on interaction.

/** After the floating scene graph commits, wait two frames so the first GL draw can land. */
function ExperienceReadyGate({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  useLayoutEffect(() => {
    if (fired.current) return;
    fired.current = true;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => onReady());
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [onReady]);
  return null;
}

function Scene({
  onPieceClick,
  showcaseGemEpoch,
  onExperienceReady,
  dragRef,
}: {
  onPieceClick:         (category: ProductCategory, variant: ProductVariant) => void;
  showcaseGemEpoch:     number;
  onExperienceReady?:   () => void;
  dragRef?:             React.RefObject<DragState>;
}) {
  const showColliders = false;
  const isMobile      = typeof window !== "undefined" && window.innerWidth < 768;

  const motionControls = {
    globalSpeed:         0.95,
    spinMultiplier:      0.45,
    rotCap:              1.0,
    collisionScale:      1.0,
    collisionPadding:    0.2,
    separationStiffness: 1.0,
    // On mobile the viewport is narrow — reduce margin so pieces can spread out
    boundaryMargin:      isMobile ? 0.4 : 1.5,
  };

  const clickControls = {
    springStrength: 0.02,
    damping:        0.4,
    zSpread:        2.5,
    kickStrength:   3.0,
    kickDecay:      0.95,
  };

  const dofFocusDistance = 5.46;
  const dofFocalLength   = 2.84;
  const dofBokehScale    = 3.5;

  // ── Per-visit random gem assignment ───────────────────────────────────────
  const [pieces, setPieces] = useState(() => buildShowcasePieces(pickUniqueGems()));

  // ── Shared refs — stable across renders ────────────────────────────────────
  // Seed at correct t=0 positions so the separation system never acts on 0,0,0 origins.
  const motionStatesRef = useRef<PieceMotionState[]>(buildInitialMotionStates(pieces));
  const groupRef = useRef<THREE.Group | null>(null);

  // Re-roll gems when App bumps `showcaseGemEpoch` (back from customiser); skip 0 on first paint.
  useEffect(() => {
    if (showcaseGemEpoch === 0) return;
    const next = buildShowcasePieces(pickUniqueGems());
    motionStatesRef.current = buildInitialMotionStates(next);
    setPieces(next);
  }, [showcaseGemEpoch]);

  // Incrementing this ref tells every piece "a click happened" without
  // triggering a React re-render.
  const clickSignalRef = useRef(0);

  // Written by whichever piece is currently hovered (its world Z), cleared on unhover.
  // Read by SmartDOF every frame to lerp the focus plane.
  const hoveredZRef = useRef<number | null>(null);

  const motion: MotionConfig = {
    globalSpeed:    motionControls.globalSpeed,
    spinMultiplier: motionControls.spinMultiplier,
    rotCap:         motionControls.rotCap,
    boundaryMargin: motionControls.boundaryMargin,
  };

  const clickConfig: ClickConfig = {
    springStrength: clickControls.springStrength,
    damping:        clickControls.damping,
    zSpread:        clickControls.zSpread,
    kickStrength:   clickControls.kickStrength,
    kickDecay:      clickControls.kickDecay,
  };

  return (
    <>
      <ShowcaseSceneBackground />
      <FixedEnvironment />
      {/* Widen FOV on mobile so pieces spread across the narrow portrait viewport */}
      <MobileCameraAdjust enabled={isMobile} posZ={MOBILE_SCENE_CONFIG.posZ} />

      <SeparationSystem
        motionStatesRef={motionStatesRef}
        collisionScale={motionControls.collisionScale}
        collisionPadding={motionControls.collisionPadding}
        stiffness={motionControls.separationStiffness}
      />

      {/* Invisible hit-plane behind all pieces so clicks on empty space also scatter */}
      <mesh
        position={[0, 0, -5]}
        onClick={() => { clickSignalRef.current++; }}
        visible={false}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial />
      </mesh>

      {/* Scale down on mobile so pieces never dominate the narrow screen */}
      <group ref={groupRef} scale={isMobile ? MOBILE_SCENE_CONFIG.scale : 1}>
        {pieces.map((config, i) => (
          <ShowcasePiece
            key={config.id}
            config={config}
            index={i}
            motionStatesRef={motionStatesRef}
            clickSignalRef={clickSignalRef}
            hoveredZRef={hoveredZRef}
            motion={motion}
            clickConfig={clickConfig}
            showColliders={showColliders}
            onClick={(category, variant) => {
              clickSignalRef.current++;
              onPieceClick(category, variant);
            }}
          />
        ))}
      </group>

      {/* DOF: static on mobile (same desktop defaults, max height); dynamic hover-tracking on desktop */}
      {isMobile ? (
        <EffectComposer>
          <DepthOfField
            focusDistance={dofFocusDistance}
            focalLength={dofFocalLength}
            bokehScale={dofBokehScale}
            height={1000}
          />
        </EffectComposer>
      ) : (
        <SmartDOF
          hoveredZRef={hoveredZRef}
          restFocusDist={dofFocusDistance}
          focalLength={dofFocalLength}
          bokehScale={dofBokehScale}
        />
      )}

      {dragRef ? <DragGroupController dragRef={dragRef} groupRef={groupRef} /> : null}
      {onExperienceReady ? <ExperienceReadyGate onReady={onExperienceReady} /> : null}
    </>
  );
}

/** Lobby loader fade duration (ms) — keep in sync with CSS transition below. */
const LOBBY_LOADER_FADE_MS = 1200;

type LobbyLoaderPhase = "on" | "fade" | "off";

function LobbyLoaderOverlay({
  phase,
  onFadeComplete,
}: {
  phase:            LobbyLoaderPhase;
  onFadeComplete:   () => void;
}) {
  if (phase === "off") return null;
  const fading = phase === "fade";
  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
      style={{
        background: "#ffffff",
        opacity: fading ? 0 : 1,
        transition: `opacity ${LOBBY_LOADER_FADE_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
      }}
      onTransitionEnd={(e) => {
        if (e.propertyName === "opacity" && fading) onFadeComplete();
      }}
    >
      <span
        className="text-[14px] font-medium lowercase"
        style={{
          fontFamily: '"ABC Diatype", ui-sans-serif, system-ui, sans-serif',
          color: "#2a2c2d",
          letterSpacing: "-0.3px",
          animation: "loaderPulse 1.8s ease-in-out infinite",
        }}
      >
        tabi dsgn
      </span>
      <style>{`
        @keyframes loaderPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.12); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * Full-viewport lobby: loader stays up until the scene commits, then fades out.
 * Suspense fallback is null — the overlay covers the load; replacing fallback cannot animate.
 */
function LobbyEntrance({
  onPieceClick,
  showcaseGemEpoch,
  devFpsSampleRef,
  onSceneReady,
  onLoaderPhaseChange,
  dragRef,
}: {
  onPieceClick:          (category: ProductCategory, variant: ProductVariant) => void;
  showcaseGemEpoch:      number;
  devFpsSampleRef?:      RefObject<(sample: DevFpsSample) => void> | null;
  onSceneReady?:         () => void;
  onLoaderPhaseChange?:  (phase: LobbyLoaderPhase) => void;
  dragRef?:              RefObject<DragState>;
}) {
  const fadeStartedRef = useRef(false);

  const beginFadeOut = useCallback(() => {
    if (fadeStartedRef.current) return;
    fadeStartedRef.current = true;
    onSceneReady?.();
    onLoaderPhaseChange?.("fade");
  }, [onSceneReady, onLoaderPhaseChange]);

  useEffect(() => {
    const t = window.setTimeout(beginFadeOut, 12000);
    return () => window.clearTimeout(t);
  }, [beginFadeOut]);

  return (
    <>
      <Suspense fallback={null}>
        <Scene
          onPieceClick={onPieceClick}
          showcaseGemEpoch={showcaseGemEpoch}
          onExperienceReady={beginFadeOut}
          dragRef={dragRef}
        />
      </Suspense>
      {devFpsSampleRef ? <DevFpsMetricsCollector onSampleRef={devFpsSampleRef} /> : null}
    </>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function HomepageScene({
  onPieceClick,
  exiting,
  showcaseGemEpoch = 0,
}: {
  onPieceClick:       (category: ProductCategory, variant: ProductVariant) => void;
  exiting:            boolean;
  showcaseGemEpoch?:  number;
}) {
  const fpsOn = showFpsOverlay();
  const lobbySurfaceRef = useRef<HTMLDivElement>(null);

  // Drag rotation — mouse only; touch drives piece orbits, not camera
  const dragRef = useRef<DragState>({
    targetX: 0, targetY: 0,
    isDown: false, startX: 0, startY: 0, moved: false,
  });
  const isDraggingRef = useRef(false);

  // Hide the entire scene until ExperienceReadyGate fires (2 rAFs after scene
  // commit inside the Canvas). This guarantees the first GL draw has landed and
  // MobileCameraAdjust (useLayoutEffect) has already set FOV/posZ — the user
  // never sees the default-camera snap.
  const [ready, setReady] = useState(false);
  const [loaderPhase, setLoaderPhase] = useState<LobbyLoaderPhase>("on");

  const [devFpsMetrics, setDevFpsMetrics] = useState<DevFpsSample>({
    fps:    0,
    msAvg:  0,
    heapMb: null,
  });
  const devSampleRef = useRef<(sample: DevFpsSample) => void>(setDevFpsMetrics);
  devSampleRef.current = setDevFpsMetrics;

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ease-out${exiting ? " pointer-events-none" : ""}`}
      style={{
        opacity: exiting ? 0 : ready ? 1 : 0,
        transition: exiting ? "opacity 0.4s ease" : "opacity 1200ms cubic-bezier(0.76, 0, 0.24, 1)",
      }}
    >
      <div
        ref={lobbySurfaceRef}
        className="absolute inset-0"
        onPointerDown={(e) => {
          if (e.pointerType === "touch") return;
          dragRef.current.isDown = true;
          dragRef.current.startX = e.clientX;
          dragRef.current.startY = e.clientY;
          dragRef.current.moved = false;
          isDraggingRef.current = false;
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.isDown || e.pointerType === "touch") return;
          const dx = e.clientX - dragRef.current.startX;
          const dy = e.clientY - dragRef.current.startY;
          if (Math.sqrt(dx * dx + dy * dy) > 5) {
            dragRef.current.moved = true;
            isDraggingRef.current = true;
          }
          dragRef.current.targetX = Math.max(-12, Math.min(12, dx * 0.025));
          dragRef.current.targetY = Math.max(-6,  Math.min(6,  -dy * 0.018));
        }}
        onPointerUp={(e) => {
          if (e.pointerType === "touch") return;
          if (isDraggingRef.current) {
            // Suppress the subsequent click event so R3F pieces don't fire
            const el = lobbySurfaceRef.current;
            if (el) {
              el.addEventListener("click", (ev) => ev.stopPropagation(), { capture: true, once: true });
            }
          }
          dragRef.current.isDown = false;
          isDraggingRef.current = false;
        }}
      >
        <Canvas
          className="r3f-canvas-wrapper"
          camera={{ fov: 45, position: [0, 0, 7], near: 0.01, far: 100 }}
          // Cap DPR at 1 on low-end devices (< 4 cores); cap at 2 otherwise.
          dpr={typeof navigator !== "undefined" && navigator.hardwareConcurrency < 4 ? 1 : [1, 2]}
          gl={{
            antialias:           true,
            toneMapping:         THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.4,
          }}
        >
          <LobbyEntrance
            onPieceClick={onPieceClick}
            showcaseGemEpoch={showcaseGemEpoch}
            devFpsSampleRef={fpsOn ? devSampleRef : undefined}
            onSceneReady={() => setReady(true)}
            onLoaderPhaseChange={setLoaderPhase}
            dragRef={dragRef}
          />
        </Canvas>
        <div className="pointer-events-auto fixed bottom-4 right-4 z-[100] flex flex-row items-end gap-0">
          <PreviewOnlinePill />
          {fpsOn ? <DevFpsPillOverlay metrics={devFpsMetrics} /> : null}
        </div>
        <LobbyLoaderOverlay
          phase={loaderPhase}
          onFadeComplete={() => setLoaderPhase("off")}
        />
      </div>
    </div>
  );
}
