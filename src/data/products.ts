import type { ProductType } from "@/lib/customiser/types";

export interface ProductOption {
  id: ProductType;
  label: string;
  description: string;
  previewImage: string;
  dimensions: { width: number; height: number; unit: string };
  shopifyHandle: string;
}

export const PRODUCTS: Record<ProductType, ProductOption> = {
  ring: {
    id: "ring",
    label: "Ring",
    description: "Wide polished silver band with emerald-cut stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-ring",
  },
  pendant: {
    id: "pendant",
    label: "Pendant",
    description: "Rectangular silver tag with emerald-cut stone",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 15, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-pendant",
  },
  ringConcave: {
    id: "ringConcave",
    label: "Ring Concave",
    description: "Wide concave band, engraving only",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-ring-concave",
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
