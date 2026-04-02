import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

/**
 * PMREM environment textures are WebGL-context-specific — a texture generated
 * with one renderer cannot be used in another renderer's context.
 * HomepageScene and SceneCanvas each have their own <Canvas> (their own gl),
 * so we cache per-renderer via WeakMap. Each canvas pays the PMREM cost once;
 * subsequent mounts of the same canvas reuse the cached texture instantly.
 */
const textureCache  = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();
const inFlightCache = new WeakMap<THREE.WebGLRenderer, Promise<THREE.Texture>>();

export function getEnvTexture(
  gl:   THREE.WebGLRenderer,
  path: string,
): Promise<THREE.Texture> {
  const cached = textureCache.get(gl);
  if (process.env.NODE_ENV === "development") console.log("env cache hit:", !!cached);
  if (cached) return Promise.resolve(cached);

  const inFlight = inFlightCache.get(gl);
  if (inFlight) return inFlight;

  const promise = new Promise<THREE.Texture>((resolve) => {
    new HDRLoader().load(path, (hdrTexture) => {
      const pmrem = new THREE.PMREMGenerator(gl);
      const envTex = pmrem.fromEquirectangular(hdrTexture).texture;
      hdrTexture.dispose();
      pmrem.dispose();
      textureCache.set(gl, envTex);
      inFlightCache.delete(gl);
      resolve(envTex);
    });
  });

  inFlightCache.set(gl, promise);
  return promise;
}
