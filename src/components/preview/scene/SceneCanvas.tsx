"use client";

import { Suspense, useCallback, useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { useControls } from "leva";
import type { ProductVariant, FinishType, GemstoneId, GemPosition } from "@/lib/customiser/types";
import { CAMERA_CONFIG, ORBIT_CONSTRAINTS, ORBIT_DISTANCE } from "./sceneConfig";
import ProductModel, { type OrbitControlsHandle } from "./ProductModel";
import StudioLighting from "./StudioLighting";

// ─── Scene background colour ──────────────────────────────────────────────────

const BG_COLOR = new THREE.Color("#e6e6e6");

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
}

// ─── Inner component — lives inside Canvas, has access to useThree ────────────

function CaptureHelper({
  orbitRef,
  onCaptureReady,
}: {
  orbitRef: RefObject<OrbitControlsHandle | null>;
  onCaptureReady?: ((handle: SceneCanvasHandle | null) => void) | null;
}) {
  const { gl, scene, camera } = useThree();

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

    // Compute current orbit radius and polar angle.
    // Captures use 60% of the current radius (40% closer) to fill the frame better.
    const offset    = camera.position.clone().sub(savedTarget);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    const { phi } = spherical;
    const captureRadius = spherical.radius * 0.6;

    async function captureAt(theta: number): Promise<string> {
      const dir = new THREE.Vector3().setFromSpherical(
        new THREE.Spherical(captureRadius, phi, theta),
      );
      camera.position.copy(savedTarget).add(dir);
      camera.lookAt(savedTarget);
      if (controls) controls.update();

      // Wait two animation frames so the renderer has fully updated
      await new Promise<void>((r) => setTimeout(r, 60));
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    }

    const front = await captureAt(0);
    const left  = await captureAt(-Math.PI / 2);
    const right = await captureAt( Math.PI / 2);

    // Restore original camera
    camera.position.copy(savedPos);
    camera.lookAt(savedTarget);
    if (controls) {
      controls.enabled = savedEnabled;
      controls.update();
    }
    await new Promise<void>((r) => setTimeout(r, 60));
    gl.render(scene, camera);

    return { front, left, right };
  }, [gl, scene, camera, orbitRef]);

  useEffect(() => {
    onCaptureReady?.({ captureAngles });
    return () => { onCaptureReady?.(null); };
  }, [captureAngles, onCaptureReady]);

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
  const { camera }       = useThree();
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
      // Variant switch: aim at mid-orbit distance along current view direction
      const midDist = ORBIT_DISTANCE.min + 0.5 * (ORBIT_DISTANCE.max - ORBIT_DISTANCE.min);
      const dir = camera.position.clone().sub(ctrl.target);
      if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1); else dir.normalize();
      targetPosRef.current.copy(ctrl.target).addScaledVector(dir, midDist);
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

type EnvSource = "Room (procedural)" | "HDRI file";

function ConfigurableEnvironment() {
  const { gl, scene } = useThree();
  const envRef = useRef<THREE.Texture | null>(null);

  const {
    source,
    hdriPath,
    exposure,
    showBackground,
    backgroundBlurriness,
    backgroundIntensity,
  } = useControls("Environment", {
    source: {
      value: "HDRI file" as EnvSource,
      options: ["Room (procedural)", "HDRI file"] as EnvSource[],
    },
    hdriPath: { value: "/hdri/studio_small_09_1k.hdr", label: "HDRI path" },
    exposure: { value: 1.4, min: 0.2, max: 4.0, step: 0.05 },
    showBackground: { value: false, label: "Show background" },
    backgroundBlurriness: { value: 0.6, min: 0, max: 1, step: 0.01, label: "BG blur" },
    backgroundIntensity: { value: 0.7, min: 0, max: 2, step: 0.05, label: "BG intensity" },
  });

  const rotationX = 2.45;

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  useEffect(() => {
    scene.backgroundBlurriness = backgroundBlurriness;
    scene.backgroundIntensity = backgroundIntensity;
    scene.background = showBackground && envRef.current ? envRef.current : null;
  }, [scene, showBackground, backgroundBlurriness, backgroundIntensity]);

  useEffect(() => {
    scene.environmentRotation.set(rotationX, 0, 0);
    scene.backgroundRotation.set(rotationX, 0, 0);
  }, [scene, rotationX]);

  useEffect(() => {
    if (envRef.current) {
      envRef.current.dispose();
      envRef.current = null;
      scene.environment = null;
      scene.background = null;
    }

    const applyEnv = (tex: THREE.Texture) => {
      scene.environment = tex;
      scene.background = showBackground ? tex : null;
      envRef.current = tex;
    };

    if (source === "Room (procedural)") {
      const pmrem = new THREE.PMREMGenerator(gl);
      applyEnv(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
      pmrem.dispose();
    } else {
      const pmrem = new THREE.PMREMGenerator(gl);
      new RGBELoader().load(
        hdriPath,
        (hdrTexture) => {
          applyEnv(pmrem.fromEquirectangular(hdrTexture).texture);
          hdrTexture.dispose();
          pmrem.dispose();
        },
        undefined,
        () => {
          console.warn(
            `Failed to load HDRI from ${hdriPath}. Drop an .hdr file in public/hdri/ and set the path.`
          );
          pmrem.dispose();
        }
      );
    }

    return () => {
      if (envRef.current) {
        envRef.current.dispose();
        scene.environment = null;
        scene.background = null;
      }
    };
  }, [gl, scene, source, hdriPath, showBackground]);

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
}: SceneCanvasProps) {
  const orbitRef = useRef<OrbitControlsHandle>(null);

  return (
    <Canvas
      camera={CAMERA_CONFIG}
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(230, 230, 230, 1)",
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.4,
        preserveDrawingBuffer: true,   // required for toDataURL() on export
      }}
    >
      <SceneClearColor />
      <CaptureHelper orbitRef={orbitRef} onCaptureReady={onCaptureReady} />
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

      <OrbitControls ref={orbitRef} makeDefault {...ORBIT_CONSTRAINTS} />
    </Canvas>
  );
}
