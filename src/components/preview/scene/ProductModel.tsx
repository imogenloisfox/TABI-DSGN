"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type RefObject,
} from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import type { ProductVariant, FinishType, GemstoneId, GemPosition } from "@/lib/customiser/types";
import {
  type MetalMaterialConfig,
  type StoneMaterialConfig,
  getMetalConfig,
  getSecondaryMetalConfig,
  getStoneConfig,
  createMetalMaterial,
  createStoneMaterial,
} from "./materials";
import { DEFAULT_ORBIT_DISTANCE, ORBIT_DISTANCE } from "./sceneConfig";
import { MOBILE_Y_OFFSETS } from "@/lib/mobileConfig";

export type OrbitControlsHandle = ComponentRef<typeof OrbitControls>;

export interface ProductModelProps {
  variant:            ProductVariant;
  finish:             FinishType | null;
  gemstone:           GemstoneId | null;
  orbitControlsRef:   RefObject<OrbitControlsHandle | null>;
  bumpMap:            THREE.CanvasTexture | null;
  colorTintMap:       THREE.CanvasTexture | null;
  bumpMapRight?:      THREE.CanvasTexture | null;
  colorTintMapRight?: THREE.CanvasTexture | null;
  gemPosition:        GemPosition;
  gemPositionLeft:    GemPosition;
  gemPositionRight:   GemPosition;
}

// ─── Asset paths per variant ──────────────────────────────────────────────────
const VARIANT_MODELS = {
  ringClassic: {
    body:     "/models/RING-MOI.glb",
    setting:  "/models/RING-MOI-SETTING.glb",
    gemstone: "/models/RING-MOI-GEMSTONE.glb",
  },
  ringConcave: {
    body:     "/models/RING-SUI.glb",
    setting:  "/models/RING-SUI-SETTING.glb",
    gemstone: "/models/RING-SUI-GEMSTONE.glb",
  },
  // ── Edit pendant asset paths here ────────────────────────────────────────
  pendantOne: {
    body:     "/models/PENDANT-SOI.glb",
    chain:    "/models/PENDANT-CHAIN.glb",
    hook:     "/models/PENDANT-SOI-LINK.glb",
    setting:  "/models/PENDANT-SOI-SETTING.glb",
    gemstone: "/models/PENDANT-SOI-GEMSTONE.glb",
  },
  pendantTwo: {
    body:     "/models/PENDANT-MOMENT.glb",
    chain:    "/models/PENDANT-CHAIN.glb",
    setting:  "/models/PENDANT-MOMENT-SETTING.glb",
    gemstone: "/models/PENDANT-MOMENT-GEMSTONE.glb",
  },
  pendantMesmo: {
    body:     "/models/PENDANT-MESMO.glb",
    chain:    "/models/PENDANT-CHAIN.glb",
    setting:  "/models/PENDANT-MESMO-SETTING.glb",
    gemstone: "/models/PENDANT-MESMO-GEMSTONE.glb",
  },
  // ─────────────────────────────────────────────────────────────────────────
  earrings: {
    leftBody:  "/models/EARRING-LEFT.glb",
    rightBody: "/models/EARRING-RIGHT.glb",
    leftGem:   "/models/EARRING-LEFT-GEMSTONE.glb",
    rightGem:  "/models/EARRING-RIGHT-GEMSTONE.glb",
  },
} as const;

/** GLBs are large in world units; keep ring-style camera, shrink on screen */
const EARRINGS_MESH_SCALE = 0.45;

const DAMP_SCALE = 2;
const DAMP_Y = 5;

function orbitDistance(controls: OrbitControlsHandle | null, camera: THREE.Camera): number {
  if (!controls) return DEFAULT_ORBIT_DISTANCE;
  if (typeof controls.getDistance === "function") return controls.getDistance();
  return camera.position.distanceTo(controls.target);
}

// ─── Zoom curves ──────────────────────────────────────────────────────────────
interface ZoomCurve {
  scaleClose: number;
  scaleBase:  number;
  scaleFar:   number;
  yClose:     number;
  yBase:      number;
  yFar:       number;
}

// Edit zoom values here
const RING_ZOOM: ZoomCurve = {
  scaleClose: 0.55, scaleBase: 0.5, scaleFar: 0.5,
  yClose: 0, yBase: 0, yFar: 0,
};

/** Pendant variants only — each has its own curve so yClose/yBase/yFar can differ per asset */
type PendantZoomVariant = Extract<ProductVariant, "pendantOne" | "pendantTwo" | "pendantMesmo">;

const PENDANT_ZOOM: Record<PendantZoomVariant, ZoomCurve> = {
  // SOI (pendantOne)
  pendantOne: {
    scaleClose: 0.6, scaleBase: 0.55, scaleFar: 0.5,
    yClose: -0.1, yBase: -0.2, yFar: -0.3,
  },
  // MOMENT (pendantTwo)
  pendantTwo: {
    scaleClose: 0.55, scaleBase: 0.5, scaleFar: 0.45,
    yClose: 0.1, yBase: 0, yFar: -0.2,
  },
  // MESMO
  pendantMesmo: {
    scaleClose: 0.55, scaleBase: 0.5, scaleFar: 0.45,
    yClose: 0.05, yBase: -0.1, yFar: -0.2,
  },
};

const EARRINGS_ZOOM: ZoomCurve = {
  scaleClose: 0.65, scaleBase: 0.6, scaleFar: 0.6,
  yClose: 0, yBase: 0, yFar: 0,
};

function evalCurve(u: number, c: ZoomCurve): { scale: number; y: number } {
  const t = THREE.MathUtils.clamp(u, 0, 1);
  const scale = t <= 0.5
    ? THREE.MathUtils.lerp(c.scaleClose, c.scaleBase, t * 2)
    : THREE.MathUtils.lerp(c.scaleBase,  c.scaleFar,  (t - 0.5) * 2);
  const y = t <= 0.5
    ? THREE.MathUtils.lerp(c.yClose, c.yBase, t * 2)
    : THREE.MathUtils.lerp(c.yBase,  c.yFar,  (t - 0.5) * 2);
  return { scale, y };
}

function ZoomDrivenGroup({
  variant,
  orbitControlsRef,
  sizeMultiplier,
  curveRef,
  children,
}: {
  variant: ProductVariant;
  orbitControlsRef: RefObject<OrbitControlsHandle | null>;
  sizeMultiplier: number;
  curveRef: RefObject<ZoomCurve>;
  children: React.ReactNode;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const { camera }  = useThree();
  const smoothScale = useRef(curveRef.current.scaleBase);
  const smoothY     = useRef(curveRef.current.yBase);
  const sizeMultRef = useRef(sizeMultiplier);
  sizeMultRef.current = sizeMultiplier;

  const isMobile    = typeof window !== "undefined" && window.innerWidth < 768;
  const mobileYOffset = isMobile ? (MOBILE_Y_OFFSETS[variant] ?? 0) : 0;

  // Intro: rotation only — scale stays at curve targets (starts at scaleBase / yBase on variant mount).
  const introRef = useRef({ active: true, rot: Math.PI * 1.5, t: 0 });

  // Snap model scale/Y to the new curve's base values on variant switch.
  // Camera transition is handled by CameraController in SceneCanvas.
  useEffect(() => {
    const base = curveRef.current;
    smoothScale.current = base.scaleBase;
    smoothY.current     = base.yBase;
  }, [variant, curveRef]);

  useFrame((_, delta) => {
    const ctrl = orbitControlsRef.current;
    const dist = orbitDistance(ctrl, camera);
    const span = ORBIT_DISTANCE.max - ORBIT_DISTANCE.min;
    const u    = THREE.MathUtils.clamp(span > 0 ? (dist - ORBIT_DISTANCE.min) / span : 0.5, 0, 1);

    const { scale, y } = evalCurve(u, curveRef.current);

    smoothScale.current = THREE.MathUtils.damp(smoothScale.current, scale, DAMP_SCALE, delta);
    smoothY.current     = THREE.MathUtils.damp(smoothY.current,     y,     DAMP_Y,     delta);

    const intro = introRef.current;
    const INTRO_DURATION = 1.4;
    if (intro.active) {
      intro.t = Math.min(1, intro.t + delta / INTRO_DURATION);
      const e = 1 - Math.pow(1 - intro.t, 3);
      intro.rot = (1 - e) * Math.PI * 1.5;
      if (intro.t >= 1) {
        intro.active = false;
        intro.rot    = 0;
      }
    }

    const g = groupRef.current;
    if (g) {
      g.scale.setScalar(smoothScale.current * sizeMultRef.current);
      g.position.set(0, smoothY.current + mobileYOffset, 0);
      g.rotation.y = intro.rot;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function applyToAllMeshes(scene: THREE.Object3D, material: THREE.Material) {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) mesh.material = material;
  });
}

function MetalPart({
  url,
  config,
  bumpMap,
  colorTintMap,
  bumpScale,
}: {
  url:           string;
  config:        MetalMaterialConfig;
  bumpMap?:      THREE.Texture | null;
  colorTintMap?: THREE.Texture | null;
  bumpScale?:    number;
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const mat = createMetalMaterial(config);
    mat.bumpMap = bumpMap      ?? null;
    mat.map     = colorTintMap ?? null;
    if (bumpMap) mat.bumpScale = bumpScale ?? -1.0;
    mat.needsUpdate = true;
    applyToAllMeshes(cloned, mat);
  }, [cloned, config, bumpMap, colorTintMap, bumpScale]);

  return <primitive object={cloned} />;
}

function StonePart({ url, config }: { url: string; config: StoneMaterialConfig }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    const mat = createStoneMaterial(config);
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = mat;
      // Render gems after all opaque meshes — the transmission pass fires
      // once at the end of the frame instead of mid-draw-order.
      mesh.renderOrder = 1;
    });
  }, [cloned, config]);
  return <primitive object={cloned} />;
}

/** Fixed white/clear material for earring gems — not controlled by gem picker */
const EARRING_GEM_CONFIG: StoneMaterialConfig = {
  color: "#f5f8fb",
  transmission: 1.0,
  ior: 2.42,
  roughness: 0.0,
  thickness: 3.0,
};

export default function ProductModel({
  variant,
  finish,
  gemstone,
  orbitControlsRef,
  bumpMap,
  colorTintMap,
  bumpMapRight,
  colorTintMapRight,
  gemPosition,
  gemPositionLeft,
  gemPositionRight,
}: ProductModelProps) {
  const metalConfig          = useMemo(() => getMetalConfig(finish),          [finish]);
  const secondaryMetalConfig = useMemo(() => getSecondaryMetalConfig(finish), [finish]);
  const stoneConfig          = useMemo(() => getStoneConfig(gemstone),        [gemstone]);

  // ─── Zoom curves ──────────────────────────────────────────────────────────
  const ringCurveRef         = useRef<ZoomCurve>(RING_ZOOM);
  const pendantOneCurveRef   = useRef<ZoomCurve>(PENDANT_ZOOM.pendantOne);
  const pendantTwoCurveRef   = useRef<ZoomCurve>(PENDANT_ZOOM.pendantTwo);
  const pendantMesmoCurveRef = useRef<ZoomCurve>(PENDANT_ZOOM.pendantMesmo);
  const earringsCurveRef     = useRef<ZoomCurve>(EARRINGS_ZOOM);
  ringCurveRef.current          = RING_ZOOM;
  pendantOneCurveRef.current    = PENDANT_ZOOM.pendantOne;
  pendantTwoCurveRef.current    = PENDANT_ZOOM.pendantTwo;
  pendantMesmoCurveRef.current  = PENDANT_ZOOM.pendantMesmo;
  earringsCurveRef.current      = EARRINGS_ZOOM;

  const activeCurveRef =
    variant === "earrings"     ? earringsCurveRef     :
    variant === "pendantMesmo" ? pendantMesmoCurveRef :
    variant === "pendantTwo"   ? pendantTwoCurveRef   :
    variant === "pendantOne"   ? pendantOneCurveRef   :
    ringCurveRef;

  return (
    <ZoomDrivenGroup
      key={variant}
      variant={variant}
      orbitControlsRef={orbitControlsRef}
      sizeMultiplier={1}
      curveRef={activeCurveRef}
    >
      {variant === "earrings" ? (
        <group scale={EARRINGS_MESH_SCALE}>
          <MetalPart
            url={VARIANT_MODELS.earrings.leftBody}
            config={metalConfig}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
          />
          <MetalPart
            url={VARIANT_MODELS.earrings.rightBody}
            config={metalConfig}
            bumpMap={bumpMapRight ?? null}
            colorTintMap={colorTintMapRight ?? null}
          />
          <group position={[gemPositionLeft.x * 0.5, gemPositionLeft.y * 0.5, 0]}>
            <StonePart url={VARIANT_MODELS.earrings.leftGem} config={EARRING_GEM_CONFIG} />
          </group>
          <group position={[gemPositionRight.x * 0.5, gemPositionRight.y * 0.5, 0]}>
            <StonePart url={VARIANT_MODELS.earrings.rightGem} config={EARRING_GEM_CONFIG} />
          </group>
        </group>

      ) : variant === "ringConcave" ? (
        <>
          <MetalPart
            url={VARIANT_MODELS.ringConcave.body}
            config={metalConfig}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
          />
          {/* Outer group rotates around Y axis → gem orbits the band */}
          <group rotation={[0, gemPosition.x * Math.PI * 0.6, 0]}>
            {/* Inner group sits at band surface radius */}
            <group position={[0, gemPosition.y, 0]}>
              <MetalPart url={VARIANT_MODELS.ringConcave.setting}  config={secondaryMetalConfig} />
              <StonePart url={VARIANT_MODELS.ringConcave.gemstone} config={stoneConfig} />
            </group>
          </group>
        </>

      ) : variant === "ringClassicNoGem" ? (
        <MetalPart
          url={VARIANT_MODELS.ringClassic.body}
          config={metalConfig}
          bumpMap={bumpMap}
          colorTintMap={colorTintMap}
        />

      ) : variant === "ringClassic" ? (
        <>
          <MetalPart
            url={VARIANT_MODELS.ringClassic.body}
            config={metalConfig}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
          />
          <MetalPart url={VARIANT_MODELS.ringClassic.setting}  config={secondaryMetalConfig} />
          <StonePart url={VARIANT_MODELS.ringClassic.gemstone} config={stoneConfig} />
        </>

      ) : variant === "ringConcaveNoGem" ? (
        <MetalPart
          url={VARIANT_MODELS.ringConcave.body}
          config={metalConfig}
          bumpMap={bumpMap}
          colorTintMap={colorTintMap}
        />

      ) : variant === "pendantTwo" ? (
        // Pendant 2: Mini body + chain + low setting + low gemstone
        <>
          <MetalPart
            url={VARIANT_MODELS.pendantTwo.body}
            config={metalConfig}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
          />
          <MetalPart url={VARIANT_MODELS.pendantTwo.chain}   config={secondaryMetalConfig} />
          <MetalPart url={VARIANT_MODELS.pendantTwo.setting}  config={secondaryMetalConfig} />
          <StonePart url={VARIANT_MODELS.pendantTwo.gemstone} config={stoneConfig} />
        </>

      ) : variant === "pendantMesmo" ? (
        <>
          <MetalPart
            url={VARIANT_MODELS.pendantMesmo.body}
            config={metalConfig}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
          />
          <MetalPart url={VARIANT_MODELS.pendantMesmo.chain}   config={secondaryMetalConfig} />
          <MetalPart url={VARIANT_MODELS.pendantMesmo.setting}  config={secondaryMetalConfig} />
          <StonePart url={VARIANT_MODELS.pendantMesmo.gemstone} config={stoneConfig} />
        </>

      ) : (
        // Pendant 1: Standard body + chain + hook + standard setting + standard gemstone
        <>
          <MetalPart
            url={VARIANT_MODELS.pendantOne.body}
            config={metalConfig}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
          />
          <MetalPart url={VARIANT_MODELS.pendantOne.chain}   config={secondaryMetalConfig} />
          <MetalPart url={VARIANT_MODELS.pendantOne.hook}    config={secondaryMetalConfig} />
          <MetalPart url={VARIANT_MODELS.pendantOne.setting}  config={secondaryMetalConfig} />
          <StonePart url={VARIANT_MODELS.pendantOne.gemstone} config={stoneConfig} />
        </>
      )}
    </ZoomDrivenGroup>
  );
}

// ─── Preload strategy ─────────────────────────────────────────────────────────
// Only Ring GLBs are preloaded at module scope — Ring is the default category
// shown when the customiser first opens, so these are always needed immediately.
// Pendant and earring assets are deferred until the user switches category.
useGLTF.preload(VARIANT_MODELS.ringClassic.body);
useGLTF.preload(VARIANT_MODELS.ringClassic.setting);
useGLTF.preload(VARIANT_MODELS.ringClassic.gemstone);
useGLTF.preload(VARIANT_MODELS.ringConcave.body);
useGLTF.preload(VARIANT_MODELS.ringConcave.setting);
useGLTF.preload(VARIANT_MODELS.ringConcave.gemstone);

// Call this when the user selects a non-ring category so assets are warming
// in the background before the model actually mounts.
const preloadedCategories = new Set<string>(["ring"]);

export function preloadCategory(category: import("@/lib/customiser/types").ProductCategory): void {
  if (preloadedCategories.has(category)) return;
  preloadedCategories.add(category);

  const defer = typeof requestIdleCallback !== "undefined"
    ? (fn: () => void) => requestIdleCallback(fn, { timeout: 2000 })
    : (fn: () => void) => setTimeout(fn, 100);

  if (category === "pendant") {
    defer(() => {
      useGLTF.preload(VARIANT_MODELS.pendantOne.body);
      useGLTF.preload(VARIANT_MODELS.pendantOne.chain);
      useGLTF.preload(VARIANT_MODELS.pendantOne.hook);
      useGLTF.preload(VARIANT_MODELS.pendantOne.setting);
      useGLTF.preload(VARIANT_MODELS.pendantOne.gemstone);
      useGLTF.preload(VARIANT_MODELS.pendantTwo.body);
      useGLTF.preload(VARIANT_MODELS.pendantTwo.chain);
      useGLTF.preload(VARIANT_MODELS.pendantTwo.setting);
      useGLTF.preload(VARIANT_MODELS.pendantTwo.gemstone);
      useGLTF.preload(VARIANT_MODELS.pendantMesmo.body);
      useGLTF.preload(VARIANT_MODELS.pendantMesmo.chain);
      useGLTF.preload(VARIANT_MODELS.pendantMesmo.setting);
      useGLTF.preload(VARIANT_MODELS.pendantMesmo.gemstone);
    });
  } else if (category === "earrings") {
    defer(() => {
      useGLTF.preload(VARIANT_MODELS.earrings.leftBody);
      useGLTF.preload(VARIANT_MODELS.earrings.rightBody);
      useGLTF.preload(VARIANT_MODELS.earrings.leftGem);
      useGLTF.preload(VARIANT_MODELS.earrings.rightGem);
    });
  }
}
