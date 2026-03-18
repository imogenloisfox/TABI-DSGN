"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { FlakesTexture } from "three/addons/textures/FlakesTexture.js";
import { useControls, button, folder } from "leva";
import type { ProductType, FinishType } from "@/lib/customiser/types";

const MODEL_PATHS: Record<ProductType, string> = {
  ring: "/models/ring.glb",
  pendant: "/models/pendant.glb",
};

interface SceneCanvasProps {
  product: ProductType | null;
  finish: FinishType | null;
}

const flakesCanvas = new FlakesTexture();
const flakesTexture = new THREE.CanvasTexture(flakesCanvas);
flakesTexture.wrapS = flakesTexture.wrapT = THREE.RepeatWrapping;
flakesTexture.repeat.set(80, 80);

function ensureUVs(geometry: THREE.BufferGeometry) {
  if (geometry.attributes.uv) return;
  const pos = geometry.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = pos.getX(i);
    uvs[i * 2 + 1] = pos.getY(i);
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
}

type EnvSource = "Room (procedural)" | "HDRI file";

function ConfigurableEnvironment() {
  const { gl, scene } = useThree();
  const envRef = useRef<THREE.Texture | null>(null);

  const { source, hdriPath, exposure } = useControls("Environment", {
    source: {
      value: "Room (procedural)" as EnvSource,
      options: ["Room (procedural)", "HDRI file"] as EnvSource[],
    },
    hdriPath: { value: "/hdri/studio.hdr", label: "HDRI path" },
    exposure: { value: 1.3, min: 0.2, max: 4.0, step: 0.05 },
  });

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  useEffect(() => {
    if (envRef.current) {
      envRef.current.dispose();
      envRef.current = null;
      scene.environment = null;
    }

    if (source === "Room (procedural)") {
      const pmrem = new THREE.PMREMGenerator(gl);
      const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = tex;
      envRef.current = tex;
      pmrem.dispose();
    } else {
      const pmrem = new THREE.PMREMGenerator(gl);
      new RGBELoader().load(
        hdriPath,
        (hdrTexture) => {
          const envMap = pmrem.fromEquirectangular(hdrTexture).texture;
          scene.environment = envMap;
          envRef.current = envMap;
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
      }
    };
  }, [gl, scene, source, hdriPath]);

  return null;
}

function ProductModel({
  product,
}: {
  product: ProductType;
}) {
  const { scene } = useGLTF(MODEL_PATHS[product]);

  const matControls = useControls("Material", {
    color: { value: "#d0cec9" },
    metalness: { value: 1.0, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.08, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: 1.5, min: 0, max: 5, step: 0.05 },
    clearcoat: { value: 0.8, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.05, min: 0, max: 1, step: 0.01 },
    reflectivity: { value: 0.9, min: 0, max: 1, step: 0.01 },
    normalScale: { value: 0.08, min: 0, max: 0.5, step: 0.005 },
  });

  useControls("Export", {
    "Copy settings to console": button(() => {
      const output = {
        material: {
          color: matControls.color,
          metalness: matControls.metalness,
          roughness: matControls.roughness,
          envMapIntensity: matControls.envMapIntensity,
          clearcoat: matControls.clearcoat,
          clearcoatRoughness: matControls.clearcoatRoughness,
          reflectivity: matControls.reflectivity,
          normalScale: matControls.normalScale,
        },
      };
      console.log("=== MATERIAL SETTINGS ===");
      console.log(JSON.stringify(output, null, 2));
    }),
  });

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      const asMesh = child as THREE.Mesh;
      if (asMesh.isMesh) {
        ensureUVs(asMesh.geometry);

        const mat = new THREE.MeshPhysicalMaterial({
          color: matControls.color,
          metalness: matControls.metalness,
          roughness: matControls.roughness,
          envMapIntensity: matControls.envMapIntensity,
          clearcoat: matControls.clearcoat,
          clearcoatRoughness: matControls.clearcoatRoughness,
          reflectivity: matControls.reflectivity,
          normalMap: flakesTexture,
          normalScale: new THREE.Vector2(
            matControls.normalScale,
            matControls.normalScale
          ),
          side: THREE.DoubleSide,
        });
        asMesh.material = mat;
      }
    });
  }, [clonedScene, matControls]);

  return (
    <Center>
      <primitive object={clonedScene} />
    </Center>
  );
}

function PostProcessing() {
  const dof = useControls("Depth of Field", {
    enabled: true,
    focusDistance: { value: 0.02, min: 0, max: 0.1, step: 0.001 },
    focalLength: { value: 0.06, min: 0, max: 0.3, step: 0.005 },
    bokehScale: { value: 3, min: 0, max: 12, step: 0.5 },
  });

  if (!dof.enabled) return null;

  return (
    <EffectComposer>
      <DepthOfField
        focusDistance={dof.focusDistance}
        focalLength={dof.focalLength}
        bokehScale={dof.bokehScale}
      />
    </EffectComposer>
  );
}

export default function SceneCanvas({ product }: SceneCanvasProps) {
  return (
    <Canvas
      camera={{
        fov: 35,
        position: [0, 0.05, 0.5],
        near: 0.001,
        far: 50,
      }}
      style={{ width: "100%", height: "100%" }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.3,
      }}
    >
      <Suspense fallback={null}>
        <ConfigurableEnvironment />
        {product && <ProductModel product={product} />}
      </Suspense>

      <OrbitControls
        enableZoom
        enablePan={false}
        dampingFactor={0.08}
        enableDamping
        minDistance={0.1}
        maxDistance={3}
      />

      <PostProcessing />
    </Canvas>
  );
}

useGLTF.preload(MODEL_PATHS.ring);
useGLTF.preload(MODEL_PATHS.pendant);
