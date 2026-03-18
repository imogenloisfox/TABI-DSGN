import type { FinishType, GemstoneId } from "@/lib/customiser/types";
import { getGemstone } from "@/data/gemstones";

export interface MetalMaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  reflectivity: number;
}

export interface StoneMaterialConfig {
  color: string;
  transmission: number;
  ior: number;
  roughness: number;
  thickness: number;
}

export function getMetalMaterial(
  finish: FinishType | null
): MetalMaterialConfig {
  if (finish === "matte") {
    return {
      color: "#c5c3c0",
      metalness: 1.0,
      roughness: 0.35,
      envMapIntensity: 1.0,
      clearcoat: 0,
      clearcoatRoughness: 0,
      reflectivity: 0.5,
    };
  }

  return {
    color: "#d0cec9",
    metalness: 1.0,
    roughness: 0.08,
    envMapIntensity: 1.5,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
  };
}

export function getStoneMaterial(
  gemstoneId: GemstoneId | null
): StoneMaterialConfig {
  const gem = gemstoneId ? getGemstone(gemstoneId) : null;

  if (!gem) {
    return {
      color: "#ffffff",
      transmission: 0.95,
      ior: 1.5,
      roughness: 0.0,
      thickness: 0.5,
    };
  }

  return {
    color: gem.hex,
    transmission: 0.6,
    ior: 1.77,
    roughness: 0.05,
    thickness: 0.8,
  };
}
