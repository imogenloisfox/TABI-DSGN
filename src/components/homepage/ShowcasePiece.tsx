"use client";

import {
  useEffect, useMemo, useRef, useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useControls } from "leva";
import {
  createMetalMaterial,
  createStoneMaterial,
  getMetalConfig,
  type MetalMaterialConfig,
} from "@/components/preview/scene/materials";
import {
  CANVAS_SIZE,
  loadFont,
  drawBumpEngraved,
  makeCanvas,
} from "@/hooks/useEngravingTexture";
import {
  type ProductCategory,
  type ProductVariant,
  type FinishType,
  type GemstoneId,
} from "@/lib/customiser/types";
import { GEMSTONES } from "@/data/gemstones";
import { SHOWCASE_ASSETS, type ShowcasePieceConfig } from "./showcaseConfig";

// ─── Shared repulsion state — one entry per piece ─────────────────────────────
// Passed by ref so reads/writes never trigger React re-renders.

export type PieceMotionState = {
  x:       number;   // current world X (written by piece, read by repulsion pass)
  y:       number;   // current world Y
  z:       number;   // current world Z
  offsetX: number;   // repulsion push accumulator
  offsetY: number;
  offsetZ: number;
  colliderX: number; // half-extent — used by SeparationSystem for per-piece radii
  colliderY: number;
};

// ─── Motion + click control shapes (passed from Scene) ───────────────────────

export type MotionConfig = {
  globalSpeed:     number;
  spinMultiplier:  number;
  rotCap:          number;  // max oscillation amplitude (0 = always front-facing, 1 = full range)
  boundaryMargin:  number;  // world-unit inset from screen edge — keeps pieces in viewport
};

export type ClickConfig = {
  springStrength: number;  // how hard the spring pulls toward target (speed)
  damping:        number;  // how quickly velocity bleeds off (1 = instant settle, 0 = endless bounce)
  zSpread:        number;  // ±depth range for Z scatter — main driver of DOF changes
  kickStrength:   number;  // initial Y-axis rotation impulse magnitude (radians)
  kickDecay:      number;  // per-frame multiplier — how fast the kick fades (0.9 = quick, 0.99 = slow)
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyToAllMeshes(obj: THREE.Object3D, mat: THREE.Material) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = mat;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShowcaseMetalPart({
  url, config, bumpMap,
}: { url: string; config: MetalMaterialConfig; bumpMap: THREE.CanvasTexture | null }) {
  const { scene } = useGLTF(url);
  const cloned    = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    const mat = createMetalMaterial(config);
    if (bumpMap) { mat.bumpMap = bumpMap; mat.bumpScale = -1.0; }
    mat.needsUpdate = true;
    applyToAllMeshes(cloned, mat);
  }, [cloned, config, bumpMap]);
  return <primitive object={cloned} />;
}

function ShowcaseGemPart({ url, color }: { url: string; color: string }) {
  const { scene } = useGLTF(url);
  const cloned    = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    applyToAllMeshes(cloned, createStoneMaterial({
      color, transmission: 1.0, ior: 2.42, roughness: 0.0, thickness: 1.0,
    }));
  }, [cloned, color]);
  return <primitive object={cloned} />;
}

// ─── Floating piece — animated inner component ────────────────────────────────
// Orbital path (sine/cosine) drives position each frame.
// Rotation oscillates within bounded caps so the engraving always faces camera.
// Click shifts the orbit centre to a new random position; a spring lerps there.
//
// Group hierarchy:
//   groupRef  — position + rotation set in useFrame (no scale here)
//     ├─ scaleGroup  — piece scale, so model size doesn't affect collider viz
//     │    └─ earringGroup (×0.45 if earring) → metal + gem parts
//     └─ collider wireframe box (world-scale, only when showColliders is true)

function FloatingPiece({
  config,
  pieceControls,
  motion,
  clickConfig,
  showColliders,
  index,
  motionStatesRef,
  clickSignalRef,
  hoveredZRef,
  bumpTexture,
  bumpTextureRight,
  onClick,
}: {
  config:          ShowcasePieceConfig;
  pieceControls:   { posZ: number; scale: number; finish: FinishType; gemstone: GemstoneId; colliderX: number; colliderY: number; colliderZ: number };
  motion:          MotionConfig;
  clickConfig:     ClickConfig;
  showColliders:   boolean;
  index:           number;
  motionStatesRef: MutableRefObject<PieceMotionState[]>;
  clickSignalRef:  MutableRefObject<number>;
  hoveredZRef:     MutableRefObject<number | null>;
  bumpTexture:      THREE.CanvasTexture | null;
  bumpTextureRight: THREE.CanvasTexture | null;
  onClick:          (category: ProductCategory, variant: ProductVariant) => void;
}) {
  const groupRef      = useRef<THREE.Group>(null);
  const scaleGroupRef = useRef<THREE.Group>(null);
  const metalConfig   = useMemo(() => getMetalConfig(pieceControls.finish), [pieceControls.finish]);
  const gemColor      = useMemo(
    () => GEMSTONES.find((g) => g.id === pieceControls.gemstone)?.hex ?? "#f5f8fb",
    [pieceControls.gemstone],
  );
  const assets = SHOWCASE_ASSETS[config.variant];
  const { gl } = useThree();

  // ── Orbit-shift refs — click seeds new targets; spring+damping drives toward them
  const lastClick     = useRef(clickSignalRef.current);
  const liveCenterX   = useRef(config.orbitCenterX);
  const liveCenterY   = useRef(config.orbitCenterY);
  const livePosZ      = useRef(config.posZ);
  const targetCenterX = useRef(config.orbitCenterX);
  const targetCenterY = useRef(config.orbitCenterY);
  const targetPosZ    = useRef(config.posZ);
  // Velocity state for the spring system (separate from position)
  const velX = useRef(0);
  const velY = useRef(0);
  const velZ = useRef(0);
  // Y-axis rotation kick — seeded on click, decays each frame back to oscillation
  const spinKickY = useRef(0);

  // ── Hover state — drives scale and speed, updated via pointer events ──────
  const isHovered     = useRef(false);
  const liveSpeedMult = useRef(1.0);          // lerps 1.0 ↔ 0.5 on hover
  const localTime     = useRef(0);            // per-piece accumulated time
  const liveScale     = useRef(pieceControls.scale);

  useFrame((_state, delta) => {
    const g  = groupRef.current;
    const sg = scaleGroupRef.current;
    if (!g) return;

    const ms = motionStatesRef.current[index];
    const vp = _state.viewport;

    // ── Hover: smoothly transition speed multiplier and scale ────────────────
    const targetSpeedMult = isHovered.current ? 0.1 : 1.0;
    liveSpeedMult.current = THREE.MathUtils.lerp(liveSpeedMult.current, targetSpeedMult, 0.07);

    // Accumulate per-piece local time — slows smoothly on hover
    localTime.current += delta * liveSpeedMult.current;
    const t = localTime.current;

    // Scale: lerp toward base scale × hover multiplier; 1.07 = 7% enlargement
    const targetScale = pieceControls.scale * (isHovered.current ? 1.07 : 1.0);
    liveScale.current = THREE.MathUtils.lerp(liveScale.current, targetScale, 0.10);
    if (sg) sg.scale.setScalar(liveScale.current);

    // ── Detect click → seed new random targets ──────────────────────────────
    if (clickSignalRef.current !== lastClick.current) {
      lastClick.current = clickSignalRef.current;
      const hw = vp.width  * 0.5 - motion.boundaryMargin;
      const hh = vp.height * 0.5 - motion.boundaryMargin;
      targetCenterX.current = (Math.random() * 2 - 1) * hw * 0.7;
      targetCenterY.current = (Math.random() * 2 - 1) * hh * 0.7;
      targetPosZ.current    = pieceControls.posZ + (Math.random() * 2 - 1) * clickConfig.zSpread;
      spinKickY.current = (Math.random() > 0.5 ? 1 : -1) * clickConfig.kickStrength;
    }

    // ── Spring + damping toward each target ─────────────────────────────────
    const ss   = clickConfig.springStrength;
    const damp = 1 - clickConfig.damping;
    velX.current = (velX.current + (targetCenterX.current - liveCenterX.current) * ss) * damp;
    velY.current = (velY.current + (targetCenterY.current - liveCenterY.current) * ss) * damp;
    velZ.current = (velZ.current + (targetPosZ.current    - livePosZ.current)    * ss) * damp;
    liveCenterX.current += velX.current;
    liveCenterY.current += velY.current;
    livePosZ.current    += velZ.current;

    // ── Bounded oscillating rotation — engraving always faces camera ──────
    const sm  = motion.spinMultiplier;
    const cap = motion.rotCap;
    const phZ = config.orbitPhaseX + config.orbitPhaseY;

    spinKickY.current *= clickConfig.kickDecay;

    g.rotation.x = Math.sin(t * config.spinSpeedX * sm + config.orbitPhaseX) * 0.45 * cap;
    g.rotation.y = (
      Math.sin(t * config.spinSpeedY * sm       + config.orbitPhaseY) * 0.70 +
      Math.sin(t * config.spinSpeedX * sm * 1.4 + config.orbitPhaseX) * 0.30
    ) * 1.05 * cap + spinKickY.current;
    g.rotation.z = Math.sin(t * config.spinSpeedZ * sm + phZ) * 0.30 * cap;

    // ── Smooth orbital position using live (spring-driven) centre ──────────
    const gs   = motion.globalSpeed;
    const orbX = liveCenterX.current
      + Math.sin(t * config.orbitSpeedX * gs + config.orbitPhaseX) * config.orbitRadiusX;
    const orbY = liveCenterY.current
      + Math.cos(t * config.orbitSpeedY * gs + config.orbitPhaseY) * config.orbitRadiusY;

    const rawX = orbX + ms.offsetX;
    const rawY = orbY + ms.offsetY;

    const halfW  = vp.width  * 0.5 - motion.boundaryMargin;
    const halfH  = vp.height * 0.5 - motion.boundaryMargin;
    const finalX = Math.max(-halfW, Math.min(halfW, rawX));
    const finalY = Math.max(-halfH, Math.min(halfH, rawY));
    const finalZ = livePosZ.current + ms.offsetZ;

    g.position.set(finalX, finalY, finalZ);

    ms.x = finalX;
    ms.y = finalY;
    ms.z = finalZ;

    // Keep hoveredZRef in sync while this piece is hovered so DOF tracks the moving piece
    if (isHovered.current) hoveredZRef.current = finalZ;
  });

  // Collider box: half-extents → full-extents for boxGeometry args
  const cx = pieceControls.colliderX * 2;
  const cy = pieceControls.colliderY * 2;
  const cz = pieceControls.colliderZ * 2;

  return (
    // groupRef: position + rotation only — scale is handled imperatively in useFrame
    <group
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onClick(config.category, config.variant); }}
      onPointerOver={(e) => {
        e.stopPropagation();
        isHovered.current = true;
        // Seed immediately so DOF starts moving on the same frame
        hoveredZRef.current = groupRef.current?.position.z ?? null;
        gl.domElement.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        isHovered.current = false;
        hoveredZRef.current = null;
        gl.domElement.style.cursor = "auto";
      }}
    >
      {/* scaleGroupRef: scale driven imperatively by hover lerp in useFrame */}
      <group ref={scaleGroupRef}>
        {config.variant === "earrings" ? (
          <group scale={0.45}>
            <ShowcaseMetalPart url={assets.metal[0]} config={metalConfig} bumpMap={bumpTexture} />
            <ShowcaseMetalPart url={assets.metal[1]} config={metalConfig} bumpMap={bumpTextureRight} />
            <group position={[
              (config.gemPositionLeft?.x  ?? 0) * 0.5,
              (config.gemPositionLeft?.y  ?? 0) * 0.5,
              0,
            ]}>
              <ShowcaseGemPart url={assets.gems[0]} color="#f5f8fb" />
            </group>
            <group position={[
              (config.gemPositionRight?.x ?? 0) * 0.5,
              (config.gemPositionRight?.y ?? 0) * 0.5,
              0,
            ]}>
              <ShowcaseGemPart url={assets.gems[1]} color="#f5f8fb" />
            </group>
          </group>
        ) : config.variant === "ringConcave" ? (
          <>
            <ShowcaseMetalPart url={assets.metal[0]} config={metalConfig} bumpMap={bumpTexture} />
            <group rotation={[0, (config.gemPosition?.x ?? 0) * Math.PI * 0.6, 0]}>
              <group position={[0, config.gemPosition?.y ?? 0, 0]}>
                <ShowcaseMetalPart url={assets.metal[1]} config={metalConfig} bumpMap={null} />
                <ShowcaseGemPart url={assets.gems[0]} color={gemColor} />
              </group>
            </group>
          </>
        ) : (
          <>
            {assets.metal.map((url, i) => (
              <ShowcaseMetalPart
                key={url}
                url={url}
                config={metalConfig}
                bumpMap={i === 0 ? bumpTexture : null}
              />
            ))}
            <ShowcaseGemPart url={assets.gems[0]} color={gemColor} />
          </>
        )}
      </group>

      {/* Debug collider box — world-scale, renders on top of the model */}
      {showColliders && (
        <mesh renderOrder={999}>
          <boxGeometry args={[cx, cy, cz]} />
          <meshBasicMaterial wireframe color="#00ff88" depthTest={false} />
        </mesh>
      )}
    </group>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
// Owns Leva per-piece folder and engraving texture generation.

export default function ShowcasePiece({
  config,
  index,
  motionStatesRef,
  clickSignalRef,
  hoveredZRef,
  motion,
  clickConfig,
  showColliders,
  onClick,
}: {
  config:          ShowcasePieceConfig;
  index:           number;
  motionStatesRef: MutableRefObject<PieceMotionState[]>;
  clickSignalRef:  MutableRefObject<number>;
  hoveredZRef:     MutableRefObject<number | null>;
  motion:          MotionConfig;
  clickConfig:     ClickConfig;
  showColliders:   boolean;
  onClick:         (category: ProductCategory, variant: ProductVariant) => void;
}) {
  const [bumpTexture,      setBumpTexture]      = useState<THREE.CanvasTexture | null>(null);
  const [bumpTextureRight, setBumpTextureRight] = useState<THREE.CanvasTexture | null>(null);

  // Build gemstone options map once per render cycle
  const gemOptions = useMemo(
    () => Object.fromEntries(GEMSTONES.map((g) => [g.label, g.id])),
    [],
  );

  // Per-piece Leva folder — collapsed by default so the panel stays tidy
  const rawControls = useControls(
    `Piece · ${config.id}`,
    {
      finish:    { value: config.finish,   options: { Shiny: "shiny", Matte: "matte" } },
      gemstone:  { value: config.gemstone, options: gemOptions },
      posZ:      { value: config.posZ,      min: -8,   max: 8,   step: 0.1  },
      scale:     { value: config.scale,     min: 0.3,  max: 5.0, step: 0.05 },
      colliderX: { value: config.colliderX, min: 0.05, max: 5,   step: 0.01 },
      colliderY: { value: config.colliderY, min: 0.05, max: 6,   step: 0.01 },
      colliderZ: { value: config.colliderZ, min: 0.05, max: 5,   step: 0.01 },
    },
    { collapsed: true },
  );

  const pieceControls = rawControls as {
    finish:    FinishType;
    gemstone:  GemstoneId;
    posZ:      number;
    scale:     number;
    colliderX: number;
    colliderY: number;
    colliderZ: number;
  };

  // ── Left / main engraving texture ─────────────────────────────────────────
  useEffect(() => {
    const isPendant = config.variant.startsWith("pendant");
    const isEarring = config.variant === "earrings";
    const target    = isEarring ? "earringLeft" as const
                    : isPendant ? "pendant"      as const
                    :             "ring"          as const;

    const { w, h } = CANVAS_SIZE[target];
    const canvas   = makeCanvas(w, h);
    let alive      = true;

    loadFont().then(() => {
      if (!alive) return;
      drawBumpEngraved(canvas.getContext("2d")!, config.engraving, w, h);
      const tex    = new THREE.CanvasTexture(canvas);
      tex.wrapS    = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.offset.x =  1;
      setBumpTexture(tex);
    });

    return () => {
      alive = false;
      setBumpTexture((prev) => { prev?.dispose(); return null; });
    };
  }, [config.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Right earring engraving texture ───────────────────────────────────────
  useEffect(() => {
    if (config.variant !== "earrings" || !config.engravingRight) return;
    const { w, h } = CANVAS_SIZE["earringRight"];
    const canvas   = makeCanvas(w, h);
    let alive      = true;

    loadFont().then(() => {
      if (!alive) return;
      drawBumpEngraved(canvas.getContext("2d")!, config.engravingRight!, w, h);
      const tex    = new THREE.CanvasTexture(canvas);
      tex.wrapS    = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.offset.x =  1;
      setBumpTextureRight(tex);
    });

    return () => {
      alive = false;
      setBumpTextureRight((prev) => { prev?.dispose(); return null; });
    };
  }, [config.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FloatingPiece
      config={config}
      pieceControls={pieceControls}
      motion={motion}
      clickConfig={clickConfig}
      showColliders={showColliders}
      index={index}
      motionStatesRef={motionStatesRef}
      clickSignalRef={clickSignalRef}
      hoveredZRef={hoveredZRef}
      bumpTexture={bumpTexture}
      bumpTextureRight={bumpTextureRight}
      onClick={onClick}
    />
  );
}
