import type { ProductVariant } from "@/lib/customiser/types";

export interface ProductOption {
  id: ProductVariant;
  label: string;
  description: string;
  previewImage: string;
  dimensions: { width: number; height: number; unit: string };
  shopifyHandle: string;
}

export const PRODUCTS: Record<ProductVariant, ProductOption> = {
  ringClassic: {
    id: "ringClassic",
    label: "Ring — Classic",
    description: "Wide polished silver band with stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-ring",
  },
  ringConcave: {
    id: "ringConcave",
    label: "Ring — Concave",
    description: "Wide concave band with stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-ring-concave",
  },
  pendantOne: {
    id: "pendantOne",
    label: "Pendant 1",
    description: "Pendant with chain, hook, and standard setting",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 15, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-pendant-1",
  },
  pendantTwo: {
    id: "pendantTwo",
    label: "Pendant 2",
    description: "Mini body with chain and low-set stone",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 12, height: 14, unit: "mm" },
    shopifyHandle: "tabi-engraving-pendant-2",
  },
  earrings: {
    id: "earrings",
    label: "Earrings",
    description: "Pair of engraved earrings",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 12, height: 12, unit: "mm" },
    shopifyHandle: "tabi-engraving-earrings",
  },
};
