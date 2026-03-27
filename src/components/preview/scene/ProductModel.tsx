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
import { useControls } from "leva";
import type { ProductVariant, FinishType, GemstoneId, GemPosition } from "@/lib/customiser/types";
import {
  type MetalMaterialConfig,
  type StoneMaterialConfig,
  getMetalConfig,
  getStoneConfig,
  createMetalMaterial,
  createStoneMaterial,
} from "./materials";
import { ORBIT_DISTANCE } from "./sceneConfig";

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
    body:     "/models/ring.glb",
    setting:  "/models/ring-setting.glb",
    gemstone: "/models/ring-gemstone.glb",
  },
  ringConcave: {
    body:     "/models/Concave-Ring-v1.glb",
    setting:  "/models/CircleGem-Setting-v1.glb",
    gemstone: "/models/CircleGem-v1.glb",
  },
  // ── Edit pendant asset paths here ────────────────────────────────────────
  pendantOne: {
    body:     "/models/pendant.glb",
    chain:    "/models/Pendant-Chain-v6.glb",
    hook:     "/models/Pendant-Chain-Hook.glb",
    setting:  "/models/pendant-setting.glb",
    gemstone: "/models/pendant-gemstone.glb",
  },
  pendantTwo: {
    body:     "/models/Pendant-Mini.glb",
    chain:    "/models/Pendant-Chain-v6.glb",
    setting:  "/models/Pendant-Setting-Low.glb",
    gemstone: "/models/Pendant-Gemstone-Low.glb",
  },
  // ─────────────────────────────────────────────────────────────────────────
  earrings: {
    leftBody:  "/models/Earring-Left-v1.glb",
    rightBody: "/models/Earring-Right-v1.glb",
    leftGem:   "/models/Earring-Gemstone-v1.glb",
    rightGem:  "/models/Earring-Gemstone-v2.glb",
  },
} as const;

/** GLBs are large in world units; keep ring-style camera, shrink on screen */
const EARRINGS_MESH_SCALE = 0.45;

const DAMP_SCALE = 2;
const DAMP_Y = 5;

function orbitDistance(controls: OrbitControlsHandle | null, camera: THREE.Camera): number {
  if (!controls) return (ORBIT_DISTANCE.min + ORBIT_DISTANCE.max) / 2;
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

const PENDANT_ONE_ZOOM: ZoomCurve = {
  scaleClose: 0.55, scaleBase: 0.5, scaleFar: 0.5,
  yClose: -0.1, yBase: -0.2, yFar: -0.3,
};

const PENDANT_TWO_ZOOM: ZoomCurve = {
  scaleClose: 0.55, scaleBase: 0.5, scaleFar: 0.5,
  yClose: -0.15, yBase: -0.2, yFar: -0.3,
};

const EARRINGS_ZOOM: ZoomCurve = {
  scaleClose: 0.65, scaleBase: 0.6, scaleFar: 0.6,
  yClose: -0, yBase: 0, yFar: 0,
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

  // Snap model scale/Y to the new curve's base values on variant switch.
  // Camera transition is handled by CameraController in SceneCanvas.
  useEffect(() => {
    const base = curveRef.current;
    smoothScale.current = base.scaleBase;
    smoothY.current     = base.yBase;
    const g = groupRef.current;
    if (g) {
      g.scale.setScalar(base.scaleBase * sizeMultRef.current);
      g.position.set(0, base.yBase, 0);
    }
  }, [variant, curveRef]);

  useFrame((_, delta) => {
    const ctrl = orbitControlsRef.current;
    const dist = orbitDistance(ctrl, camera);
    const span = ORBIT_DISTANCE.max - ORBIT_DISTANCE.min;
    const u    = THREE.MathUtils.clamp(span > 0 ? (dist - ORBIT_DISTANCE.min) / span : 0.5, 0, 1);

    const { scale, y } = evalCurve(u, curveRef.current);

    smoothScale.current = THREE.MathUtils.damp(smoothScale.current, scale, DAMP_SCALE, delta);
    smoothY.current     = THREE.MathUtils.damp(smoothY.current,     y,     DAMP_Y,     delta);

    const g = groupRef.current;
    if (g) {
      g.scale.setScalar(smoothScale.current * sizeMultRef.current);
      g.position.set(0, smoothY.current, 0);
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
  useEffect(() => { applyToAllMeshes(cloned, createStoneMaterial(config)); }, [cloned, config]);
  return <primitive object={cloned} />;
}

/** Fixed white/clear material for earring gems — not controlled by gem picker */
const EARRING_GEM_CONFIG: StoneMaterialConfig = {
  color: "#f5f8fb",
  transmission: 0.95,
  ior: 2.42,
  roughness: 0.0,
  thickness: 1.0,
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

  // ─── Metal ────────────────────────────────────────────────────────────────
  const defaults = getMetalConfig(null);
  const [metalControls, setMetal] = useControls("Metal", () => ({
    color:              { value: defaults.color },
    metalness:          { value: defaults.metalness,          min: 0, max: 1, step: 0.01 },
    roughness:          { value: defaults.roughness,          min: 0, max: 1, step: 0.01 },
    envMapIntensity:    { value: defaults.envMapIntensity,    min: 0, max: 5, step: 0.05 },
    clearcoat:          { value: defaults.clearcoat,          min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: defaults.clearcoatRoughness, min: 0, max: 1, step: 0.01 },
    reflectivity:       { value: defaults.reflectivity,       min: 0, max: 1, step: 0.01 },
  }));
  useEffect(() => { setMetal(getMetalConfig(finish)); }, [finish, setMetal]);

  // ─── Stone ────────────────────────────────────────────────────────────────
  const stoneDefaults = getStoneConfig(null);
  const [stoneControls, setStone] = useControls("Stone", () => ({
    color:        { value: stoneDefaults.color },
    transmission: { value: stoneDefaults.transmission, min: 0, max: 1, step: 0.01 },
    ior:          { value: stoneDefaults.ior,          min: 1, max: 3, step: 0.01 },
    roughness:    { value: stoneDefaults.roughness,    min: 0, max: 1, step: 0.01 },
    thickness:    { value: stoneDefaults.thickness,    min: 0, max: 2, step: 0.05 },
  }));
  useEffect(() => {
    if (!gemstone) return;
    const config = getStoneConfig(gemstone);
    if (!config) return;
    const { color, transmission, ior, roughness, thickness } = config;
    setStone({ color, transmission, ior, roughness, thickness });
  }, [gemstone, setStone]);

  // ─── Zoom curves ──────────────────────────────────────────────────────────
  const ringCurveRef      = useRef<ZoomCurve>(RING_ZOOM);
  const pendantOneCurveRef = useRef<ZoomCurve>(PENDANT_ONE_ZOOM);
  const pendantTwoCurveRef = useRef<ZoomCurve>(PENDANT_TWO_ZOOM);
  const earringsCurveRef   = useRef<ZoomCurve>(EARRINGS_ZOOM);
  ringCurveRef.current       = RING_ZOOM;
  pendantOneCurveRef.current = PENDANT_ONE_ZOOM;
  pendantTwoCurveRef.current = PENDANT_TWO_ZOOM;
  earringsCurveRef.current   = EARRINGS_ZOOM;

  const activeCurveRef =
    variant === "earrings"   ? earringsCurveRef   :
    variant === "pendantTwo" ? pendantTwoCurveRef :
    variant === "pendantOne" ? pendantOneCurveRef :
    ringCurveRef;

  const metalConfig: MetalMaterialConfig = {
    color:              metalControls.color,
    metalness:          metalControls.metalness,
    roughness:          metalControls.roughness,
    envMapIntensity:    metalControls.envMapIntensity,
    clearcoat:          metalControls.clearcoat,
    clearcoatRoughness: metalControls.clearcoatRoughness,
    reflectivity:       metalControls.reflectivity,
  };

  const stoneConfig: StoneMaterialConfig = {
    color:        stoneControls.color,
    transmission: stoneControls.transmission,
    ior:          stoneControls.ior,
    roughness:    stoneControls.roughness,
    thickness:    stoneControls.thickness,
  };

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
              <MetalPart url={VARIANT_MODELS.ringConcave.setting}  config={metalConfig} />
              <StonePart url={VARIANT_MODELS.ringConcave.gemstone} config={stoneConfig} />
            </group>
          </group>
        </>

      ) : variant === "ringClassic" ? (
        <>
          <MetalPart
            url={VARIANT_MODELS.ringClassic.body}
            config={metalConfig}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
          />
          <MetalPart url={VARIANT_MODELS.ringClassic.setting}  config={metalConfig} />
          <StonePart url={VARIANT_MODELS.ringClassic.gemstone} config={stoneConfig} />
        </>

      ) : variant === "pendantTwo" ? (
        // Pendant 2: Mini body + chain + low setting + low gemstone
        <>
          <MetalPart
            url={VARIANT_MODELS.pendantTwo.body}
            config={metalConfig}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
          />
          <MetalPart url={VARIANT_MODELS.pendantTwo.chain}   config={metalConfig} />
          <MetalPart url={VARIANT_MODELS.pendantTwo.setting}  config={metalConfig} />
          <StonePart url={VARIANT_MODELS.pendantTwo.gemstone} config={stoneConfig} />
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
          <MetalPart url={VARIANT_MODELS.pendantOne.chain}   config={metalConfig} />
          <MetalPart url={VARIANT_MODELS.pendantOne.hook}    config={metalConfig} />
          <MetalPart url={VARIANT_MODELS.pendantOne.setting}  config={metalConfig} />
          <StonePart url={VARIANT_MODELS.pendantOne.gemstone} config={stoneConfig} />
        </>
      )}
    </ZoomDrivenGroup>
  );
}

// Preload assets that exist in /public/models/
useGLTF.preload(VARIANT_MODELS.ringClassic.body);
useGLTF.preload(VARIANT_MODELS.ringClassic.setting);
useGLTF.preload(VARIANT_MODELS.ringClassic.gemstone);
useGLTF.preload(VARIANT_MODELS.ringConcave.body);
useGLTF.preload(VARIANT_MODELS.ringConcave.setting);
useGLTF.preload(VARIANT_MODELS.ringConcave.gemstone);

useGLTF.preload(VARIANT_MODELS.pendantOne.body);
useGLTF.preload(VARIANT_MODELS.pendantOne.chain);
useGLTF.preload(VARIANT_MODELS.pendantOne.hook);
useGLTF.preload(VARIANT_MODELS.pendantOne.setting);
useGLTF.preload(VARIANT_MODELS.pendantOne.gemstone);
useGLTF.preload(VARIANT_MODELS.pendantTwo.body);
useGLTF.preload(VARIANT_MODELS.pendantTwo.chain);
useGLTF.preload(VARIANT_MODELS.pendantTwo.setting);
useGLTF.preload(VARIANT_MODELS.pendantTwo.gemstone);
useGLTF.preload(VARIANT_MODELS.earrings.leftBody);
useGLTF.preload(VARIANT_MODELS.earrings.rightBody);
useGLTF.preload(VARIANT_MODELS.earrings.leftGem);
useGLTF.preload(VARIANT_MODELS.earrings.rightGem);
