"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import { useControls } from "leva";
import { buildShowcasePieces, pickUniqueGems } from "./showcaseConfig";
import ShowcasePiece, {
  type PieceMotionState,
  type MotionConfig,
  type ClickConfig,
} from "./ShowcasePiece";
import type { ProductCategory, ProductVariant } from "@/lib/customiser/types";

// ─── HDRI environment ─────────────────────────────────────────────────────────

function FixedEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = 1.4;
    const pmrem = new THREE.PMREMGenerator(gl);
    new RGBELoader().load("/hdri/studio_small_09_1k.hdr", (hdrTex) => {
      const envTex = pmrem.fromEquirectangular(hdrTex).texture;
      scene.environment = envTex;
      scene.environmentRotation.set(2.45, 0, 0);
      hdrTex.dispose();
      pmrem.dispose();
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
  motionStatesRef:  React.MutableRefObject<PieceMotionState[]>;
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

    for (let iter = 0; iter < 5; iter++) {
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
  hoveredZRef:   React.MutableRefObject<number | null>;
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
// All Leva controls live here so they're inside the Canvas/R3F context.
// Shared mutable refs (motionStatesRef, clickSignalRef) are passed down to
// each piece — no useState, no re-renders on interaction.

function Scene({
  onPieceClick,
}: {
  onPieceClick: (category: ProductCategory, variant: ProductVariant) => void;
}) {
  // ── Debug controls — always open so the tick box is immediately visible ────
  const { showColliders } = useControls("Debug", {
    showColliders: false,
  });

  // ── Global motion controls ─────────────────────────────────────────────────
  const motionControls = useControls(
    "Motion",
    {
      globalSpeed:          { value: 0.95, min: 0,   max: 3,   step: 0.05 },
      spinMultiplier:       { value: 0.45, min: 0,   max: 3,   step: 0.05 },
      rotCap:               { value: 1.00, min: 0,   max: 1.5, step: 0.05 },
      collisionScale:       { value: 1.00, min: 0.3, max: 2.0, step: 0.05 },
      collisionPadding:     { value: 0.20, min: 0,   max: 1.5, step: 0.05 },
      separationStiffness:  { value: 1.00, min: 0,   max: 1,   step: 0.05 },
      boundaryMargin:       { value: 1.50, min: 0,   max: 4,   step: 0.1  },
    },
    { collapsed: true },
  );

  // ── Click orbit-shift controls ──────────────────────────────────────────────
  const clickControls = useControls(
    "Click Orbit Shift",
    {
      // springStrength: acceleration toward target — higher = snappier
      springStrength: { value: 0.020, min: 0.001, max: 0.15, step: 0.001 },
      // damping: 0 = endless oscillation, 0.5+ = overdamped/sluggish
      damping:        { value: 0.40,  min: 0.01,  max: 0.5,  step: 0.01  },
      // zSpread: ±depth range per click — main driver of DOF composition change
      zSpread:        { value: 2.50,  min: 0,     max: 8,    step: 0.1   },
      // Y-axis rotation kick on click
      kickStrength:   { value: 3.00,  min: 0,     max: 3.0,  step: 0.05  },
      // kickDecay: per-frame fade rate (0.90 = quick snap-back, 0.99 = slow fade)
      kickDecay:      { value: 0.95,  min: 0.80,  max: 0.99, step: 0.005 },
    },
    { collapsed: true },
  );

  // ── Depth of Field controls ────────────────────────────────────────────────
  const dofControls = useControls(
    "Depth of Field",
    {
      enabled:       true,
      focusDistance: { value: 5.460, min: 0, max: 10,  step: 0.001 },
      focalLength:   { value: 2.840, min: 0, max: 10,  step: 0.005 },
      bokehScale:    { value: 3.5,   min: 0, max: 10,  step: 0.5   },
    },
    { collapsed: true },
  );

  // ── Per-visit random gem assignment ───────────────────────────────────────
  const [pieces] = useState(() => buildShowcasePieces(pickUniqueGems()));

  // ── Shared refs — stable across renders ────────────────────────────────────
  const motionStatesRef = useRef<PieceMotionState[]>(
    pieces.map((cfg) => ({
      x: 0, y: 0, z: 0,
      offsetX: 0, offsetY: 0, offsetZ: 0,
      colliderX: cfg.colliderX,
      colliderY: cfg.colliderY,
    })),
  );

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
      <FixedEnvironment />

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

      {dofControls.enabled && (
        <SmartDOF
          hoveredZRef={hoveredZRef}
          restFocusDist={dofControls.focusDistance}
          focalLength={dofControls.focalLength}
          bokehScale={dofControls.bokehScale}
        />
      )}
    </>
  );
}

// ─── Loading fallback ─────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 select-none">
        <span className="text-[12px] font-medium tracking-[0.3em] uppercase text-foreground/60">
          TABI DSGN
        </span>
        <div className="h-px w-12 bg-border/60 animate-pulse" />
      </div>
    </Html>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function HomepageScene({
  onPieceClick,
  exiting,
}: {
  onPieceClick: (category: ProductCategory, variant: ProductVariant) => void;
  exiting:      boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="h-dvh w-full transition-all duration-500 ease-out"
      style={{
        opacity:   exiting ? 0 : visible ? 1 : 0,
        transform: exiting ? "scale(0.97)" : "scale(1)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-8 z-10 flex justify-center">
        <span className="text-[12px] font-medium tracking-[0.3em] uppercase text-foreground select-none">
          TABI DSGN
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center">
        <span className="text-[8px] font-medium tracking-[0.3em] uppercase text-foreground select-none">
          CLICK ON A PIECE TO START CUSTOMISING
        </span>
      </div>

      <Canvas
        camera={{ fov: 45, position: [0, 0, 7], near: 0.01, far: 100 }}
        gl={{
          antialias:           true,
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <Scene onPieceClick={onPieceClick} />
        </Suspense>
      </Canvas>
    </div>
  );
}
