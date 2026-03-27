import * as THREE from "three";
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

const METAL_SHINY: MetalMaterialConfig = {
  color: "#d4d2ce",
  metalness: 0.98,
  roughness: 0.1,
  envMapIntensity: 2.5,
  clearcoat: 0.8,
  clearcoatRoughness: 0.05,
  reflectivity: 0.9,
};

const METAL_MATTE: MetalMaterialConfig = {
  color: "#c8c6c2",
  metalness: 1,
  roughness: 0.35,
  envMapIntensity: 2.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0,
  reflectivity: 0.5,
};

export function getMetalConfig(finish: FinishType | null): MetalMaterialConfig {
  return finish === "matte" ? { ...METAL_MATTE } : { ...METAL_SHINY };
}

export function createMetalMaterial(config: MetalMaterialConfig): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: config.color,
    metalness: config.metalness,
    roughness: config.roughness,
    envMapIntensity: config.envMapIntensity,
    clearcoat: config.clearcoat,
    clearcoatRoughness: config.clearcoatRoughness,
    reflectivity: config.reflectivity,
    side: THREE.DoubleSide,
  });
}

export function getStoneConfig(gemstoneId: GemstoneId | null): StoneMaterialConfig {
  const gem = gemstoneId ? getGemstone(gemstoneId) : null;

  if (!gem) {
    return {
      color: "#f5f8fb",
      transmission: 1.0,
      ior: 2.42,
      roughness: 0.05,
      thickness: 1.0,
    };
  }

  return {
    color: gem.hex,
    transmission: 1.0,
    ior: 2.42,
    roughness: 0.0,
    thickness: 1.0,
  };
}

export function createStoneMaterial(config: StoneMaterialConfig): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: config.color,
    transmission: config.transmission,
    ior: config.ior,
    roughness: config.roughness,
    thickness: config.thickness,
    // Hardcoded gem appearance — not managed by Leva
    attenuationDistance: 0.5,
    attenuationColor: config.color,
    specularIntensity: 1.0,
    specularColor: new THREE.Color("#e6e6e6"),
    metalness: 0,
    envMapIntensity: 3.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 1.0,
    side: THREE.DoubleSide,
    transparent: true,
  });
}

const METAL_MATERIAL_NAMES = ["silver", "gold", "platinum", "metal", "setting", "prong", "bezel"];

export function isMetalByMaterialName(materialName: string): boolean {
  const lower = materialName.toLowerCase();
  return METAL_MATERIAL_NAMES.some((kw) => lower.includes(kw));
}
