"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  type RefObject,
} from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { ProductVariant, FinishType, GemstoneId, GemPosition } from "@/lib/customiser/types";
import {
  DevFpsMetricsCollector,
  type DevFpsSample,
} from "@/components/preview/DevFpsSessionChrome";
import { CAMERA_CONFIG, ORBIT_CONSTRAINTS, DEFAULT_ORBIT_DISTANCE } from "./sceneConfig";
import ProductModel, { type OrbitControlsHandle } from "./ProductModel";
import StudioLighting from "./StudioLighting";
import { getEnvTexture } from "@/lib/envTextureCache";
import PreviewShopPills from "@/components/preview/PreviewShopPills";

/** Slightly longer than aside `duration-[480ms]` so layout has settled before resync. */
const PREVIEW_LAYOUT_RESYNC_MS = 520;

// ─── Dev-only performance diagnostics (draw calls / DPR) ─────────────────────

function DevDiagnostics() {
  const { gl } = useThree();
  const frameRef = useRef(0);

  useEffect(() => {
    console.log("[perf] current DPR:", gl.getPixelRatio());
  }, [gl]);

  useFrame(() => {
    frameRef.current++;
    if (frameRef.current % 60 === 0) {
      console.log("[perf] draw calls:", gl.info.render.calls);
    }
  });

  return null;
}

// ─── Scene background colour ──────────────────────────────────────────────────

const BG_COLOR = new THREE.Color("#e9e9e9");

function SceneClearColor() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = BG_COLOR;
    return () => {
      // Only clear if we're the ones who set it
      if (scene.background === BG_COLOR) scene.background = null;
    };
  }, [scene]);
  return null;
}

// ─── Public handle type ───────────────────────────────────────────────────────

export interface SceneCanvasHandle {
  captureAngles(): Promise<{ front: string; left: string; right: string }>;
  /** Single front (θ=0) capture at current orbit distance / polar angle — higher DPR for PDF hero page. */
  captureHeroFront(): Promise<string | null>;
}

// ─── Inner component — lives inside Canvas, has access to useThree ────────────

function CaptureHelper({
  orbitRef,
  onCaptureReady,
}: {
  orbitRef: RefObject<OrbitControlsHandle | null>;
  onCaptureReady?: ((handle: SceneCanvasHandle | null) => void) | null;
}) {
  const { gl, scene, camera, invalidate } = useThree();

  const syncCameraAspect = useCallback(() => {
    const el = gl.domElement;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw <= 0 || ch <= 0) return;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    }
  }, [gl, camera]);

  const captureAngles = useCallback(async (): Promise<{
    front: string;
    left:  string;
    right: string;
  }> => {
    const controls = orbitRef.current as unknown as {
      target:   THREE.Vector3;
      enabled:  boolean;
      update(): void;
    } | null;

    const savedPos     = camera.position.clone();
    const savedTarget  = controls?.target.clone() ?? new THREE.Vector3();
    const savedEnabled = controls?.enabled ?? true;

    if (controls) controls.enabled = false;

    // Match on-screen product scale: use the same orbit radius as the live preview
    // (ProductModel maps zoom ↔ scale from ORBIT_DISTANCE / DEFAULT_ORBIT_DISTANCE).
    const offset    = camera.position.clone().sub(savedTarget);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    const { phi } = spherical;
    const captureRadius = Math.max(1e-4, spherical.radius);

    async function captureAt(theta: number): Promise<string> {
      const dir = new THREE.Vector3().setFromSpherical(
        new THREE.Spherical(captureRadius, phi, theta),
      );
      camera.position.copy(savedTarget).add(dir);
      camera.lookAt(savedTarget);
      if (controls) controls.update();

      await new Promise<void>((r) => setTimeout(r, 60));
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    }

    const front = await captureAt(0);
    const left  = await captureAt(-Math.PI / 2);
    const right = await captureAt( Math.PI / 2);

    camera.position.copy(savedPos);
    camera.lookAt(savedTarget);
    if (controls) {
      controls.enabled = savedEnabled;
      controls.update();
    }
    await new Promise<void>((r) => setTimeout(r, 60));
    gl.render(scene, camera);
    invalidate();

    return { front, left, right };
  }, [gl, scene, camera, orbitRef, invalidate]);

  const captureHeroFront = useCallback(async (): Promise<string | null> => {
    const controls = orbitRef.current as unknown as {
      target:   THREE.Vector3;
      enabled:  boolean;
      update(): void;
    } | null;

    const savedPos     = camera.position.clone();
    const savedTarget  = controls?.target.clone() ?? new THREE.Vector3();
    const savedEnabled = controls?.enabled ?? true;

    const el = gl.domElement;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw <= 0 || ch <= 0) return null;

    if (controls) controls.enabled = false;

    const offset    = camera.position.clone().sub(savedTarget);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    const { phi } = spherical;
    const r = Math.max(1e-4, spherical.radius);

    const prevDpr = gl.getPixelRatio();
    const heroDpr = Math.min(2.5, Math.max(2, prevDpr * 1.5));

    gl.setPixelRatio(heroDpr);
    gl.setSize(cw, ch, false);
    syncCameraAspect();

    const dir = new THREE.Vector3().setFromSpherical(new THREE.Spherical(r, phi, 0));
    camera.position.copy(savedTarget).add(dir);
    camera.lookAt(savedTarget);
    if (controls) controls.update();

    await new Promise<void>((resolve) => setTimeout(resolve, 80));
    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL("image/png");

    gl.setPixelRatio(prevDpr);
    gl.setSize(cw, ch, false);
    syncCameraAspect();

    camera.position.copy(savedPos);
    camera.lookAt(savedTarget);
    if (controls) {
      controls.enabled = savedEnabled;
      controls.update();
    }
    await new Promise<void>((r) => setTimeout(r, 60));
    gl.render(scene, camera);
    invalidate();

    return dataUrl;
  }, [gl, scene, camera, orbitRef, invalidate, syncCameraAspect]);

  useEffect(() => {
    onCaptureReady?.({ captureAngles, captureHeroFront });
    return () => { onCaptureReady?.(null); };
  }, [captureAngles, captureHeroFront, onCaptureReady]);

  return null;
}

/** After the flex sidebar finishes its width transition, nudge projection + controls so framing does not drift. */
function PreviewLayoutResync({
  layoutEpoch,
  orbitRef,
}: {
  layoutEpoch: number;
  orbitRef: RefObject<OrbitControlsHandle | null>;
}) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    if (layoutEpoch === 0) return;
    const id = window.setTimeout(() => {
      const ctrl = orbitRef.current as { update?: () => void } | null;
      ctrl?.update?.();
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.updateProjectionMatrix();
      }
      invalidate();
    }, PREVIEW_LAYOUT_RESYNC_MS);
    return () => clearTimeout(id);
  }, [layoutEpoch, camera, orbitRef]);

  return null;
}

// ─── Cinematic camera transition on variant switch or reset ──────────────────
function CameraController({
  variant,
  orbitRef,
  cameraResetSignal,
}: {
  variant:            ProductVariant | null;
  orbitRef:           RefObject<OrbitControlsHandle | null>;
  cameraResetSignal?: number;
}) {
  const { camera } = useThree();
  const transitioningRef = useRef(false);
  const targetPosRef     = useRef(new THREE.Vector3());

  // Shared lerp trigger — fires on variant switch OR reset signal change
  function triggerLerp(targetPosition?: THREE.Vector3) {
    const ctrl = orbitRef.current;
    if (!ctrl) return;

    if (targetPosition) {
      // Hard reset: lerp toward the supplied absolute position
      targetPosRef.current.copy(targetPosition);
    } else {
      // Variant switch: same default framing as initial load (zoomed in), along current view direction
      const dir = camera.position.clone().sub(ctrl.target);
      if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1); else dir.normalize();
      targetPosRef.current.copy(ctrl.target).addScaledVector(dir, DEFAULT_ORBIT_DISTANCE);
    }

    transitioningRef.current = true;
    ctrl.enabled = false;
  }

  // Variant switch
  useEffect(() => {
    triggerLerp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, camera, orbitRef]);

  // Camera reset signal — lerp back to default front position and reset target
  useEffect(() => {
    if (!cameraResetSignal) return; // skip initial 0
    const ctrl = orbitRef.current;
    if (ctrl) {
      ctrl.target.set(0, 0, 0);
      ctrl.update();
    }
    triggerLerp(new THREE.Vector3(...CAMERA_CONFIG.position));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraResetSignal]);

  useFrame(() => {
    const ctrl = orbitRef.current;
    if (!ctrl || !transitioningRef.current) return;

    camera.position.lerp(targetPosRef.current, 0.08);
    ctrl.update();

    if (camera.position.distanceTo(targetPosRef.current) < 0.01) {
      camera.position.copy(targetPosRef.current);
      transitioningRef.current = false;
      ctrl.enabled = true;
      ctrl.update();
    }

  });

  return null;
}

function ConfigurableEnvironment() {
  const { gl, scene } = useThree();

  const hdriPath             = "/hdri/studio_small_09_1k.hdr";
  const exposure             = 1.4;
  const showBackground       = false;
  const backgroundBlurriness = 0.6;
  const backgroundIntensity  = 0.7;
  const rotationX            = 2.45;

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  useEffect(() => {
    scene.backgroundBlurriness = backgroundBlurriness;
    scene.backgroundIntensity = backgroundIntensity;
    scene.background = showBackground ? (scene.environment ?? null) : null;
  }, [scene, showBackground, backgroundBlurriness, backgroundIntensity]);

  useEffect(() => {
    scene.environmentRotation.set(rotationX, 0, 0);
    scene.backgroundRotation.set(rotationX, 0, 0);
  }, [scene, rotationX]);

  useEffect(() => {
    // Use module-level singleton cache — second scene reuses the same texture,
    // skipping a full RGBELoader + PMREMGenerator round-trip.
    getEnvTexture(gl, hdriPath).then((tex) => {
      scene.environment = tex;
      scene.background = showBackground ? tex : null;
    }).catch(() => {
      console.warn(
        `Failed to load HDRI from ${hdriPath}. Drop an .hdr file in public/hdri/ and set the path.`
      );
    });

    return () => {
      // Do NOT dispose the texture here — it is shared via the module cache.
      scene.environment = null;
      scene.background = null;
    };
  }, [gl, scene, hdriPath, showBackground]);

  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SceneCanvasProps {
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
  previewLayoutEpoch?: number;
  /** Dev FPS samples — parent owns DOM overlay; collector stays inside Canvas. */
  devFpsSampleRef:    RefObject<(sample: DevFpsSample) => void>;
  onBuy?: () => Promise<void>;
}

export default function SceneCanvas({
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
  devFpsSampleRef,
  onBuy,
}: SceneCanvasProps) {
  const orbitRef = useRef<OrbitControlsHandle>(null);
  const isDev    = process.env.NODE_ENV === "development";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
    <Canvas
      className="r3f-canvas-wrapper r3f-canvas-preview"
      resize={{ scroll: false }}
      camera={CAMERA_CONFIG}
      // Cap DPR at 1 on low-end devices (< 4 cores); cap at 2 otherwise.
      dpr={typeof navigator !== "undefined" && navigator.hardwareConcurrency < 4 ? 1 : [1, 2]}
      style={{
        width:           "100%",
        height:          "100%",
        background:      "rgba(233, 233, 233, 1)",
        backgroundColor: "rgba(233, 233, 233, 1)",
        // Prevent double-tap zoom on mobile; OrbitControls handles pinch-to-zoom natively.
        touchAction:     "manipulation",
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.4,
        // preserveDrawingBuffer must remain true: captureAngles() calls gl.render()
        // then reads gl.domElement.toDataURL() after a setTimeout delay. With
        // preserveDrawingBuffer: false the browser may clear the buffer before
        // toDataURL is reached. Refactoring capture to a synchronous render→read
        // in a single microtask would allow removing this, but is out of scope here.
        preserveDrawingBuffer: true,
      }}
    >
      <SceneClearColor />
      <CaptureHelper orbitRef={orbitRef} onCaptureReady={onCaptureReady} />
      <PreviewLayoutResync layoutEpoch={previewLayoutEpoch} orbitRef={orbitRef} />
      <CameraController variant={variant} orbitRef={orbitRef} cameraResetSignal={cameraResetSignal} />
      <Suspense fallback={null}>
        <ConfigurableEnvironment />
        <StudioLighting />
        {variant && (
          <ProductModel
            variant={variant}
            finish={finish}
            gemstone={gemstone}
            orbitControlsRef={orbitRef}
            bumpMap={bumpMap}
            colorTintMap={colorTintMap}
            bumpMapRight={bumpMapRight}
            colorTintMapRight={colorTintMapRight}
            gemPosition={gemPosition}
            gemPositionLeft={gemPositionLeft}
            gemPositionRight={gemPositionRight}
          />
        )}
      </Suspense>

      <OrbitControls
        ref={orbitRef}
        makeDefault
        {...ORBIT_CONSTRAINTS}
        enableZoom={!isMobile}
      />
      {isDev && <DevFpsMetricsCollector onSampleRef={devFpsSampleRef} />}
      {isDev && <DevDiagnostics />}
    </Canvas>
    {/* Desktop only — bottom left, price + buy (viewport-fixed; sidebar is separate) */}
    <div className="hidden md:flex fixed bottom-4 left-4 z-[100] flex-row items-center gap-0">
      <PreviewShopPills variant={variant} onBuy={onBuy} />
    </div>
    </>
  );
}
