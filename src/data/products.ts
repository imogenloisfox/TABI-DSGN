import type { ProductVariant } from "@/lib/customiser/types";

export interface ProductOption {
  id: ProductVariant;
  label: string;
  description: string;
  previewImage: string;
  dimensions: { width: number; height: number; unit: string };
  shopifyHandle: string;
  /** When set, Buy uses this URL instead of `NEXT_PUBLIC_SHOPIFY_STORE_URL` + handle. */
  storefrontProductUrl?: string;
  /**
   * Shopify product variant ID (the numeric ID from admin/products/.../variants/ID).
   * When set, clicking Buy creates a Shopify cart via the Storefront API with all
   * customisation details attached as line item properties, then redirects to checkout.
   * Leave unset to fall back to the plain product page URL.
   */
  shopifyVariantId?: string;
}

export const PRODUCTS: Record<ProductVariant, ProductOption> = {
  ringClassic: {
    id: "ringClassic",
    label: "MOI",
    description: "Wide polished silver band with stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-ring",
    shopifyVariantId: "15844537663861",
  },
  ringConcave: {
    id: "ringConcave",
    label: "SUI",
    description: "Wide concave band with stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-ring-concave",
    shopifyVariantId: "15844538253685",
  },
  ringClassicNoGem: {
    id: "ringClassicNoGem",
    label: "MEUS",
    description: "Classic band without centre stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-ring-meus",
    shopifyVariantId: "15844538286453",
  },
  ringConcaveNoGem: {
    id: "ringConcaveNoGem",
    label: "EGO",
    description: "EGO — concave band without centre stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-ring-sui-plain",
    shopifyVariantId: "15844538581365",
  },
  pendantOne: {
    id: "pendantOne",
    label: "SOI",
    description: "Pendant with chain, hook, and standard setting",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 15, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-pendant-1",
    shopifyVariantId: "15844538089845",
  },
  pendantTwo: {
    id: "pendantTwo",
    label: "MOMENT",
    description: "Mini body with chain and low-set stone",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 12, height: 14, unit: "mm" },
    shopifyHandle: "tabi-engraving-pendant-2",
    shopifyVariantId: "15844538548597",
  },
  pendantMesmo: {
    id: "pendantMesmo",
    label: "MESMO",
    description: "Pendant with chain, setting, and centre stone",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 15, height: 17, unit: "mm" },
    shopifyHandle: "tabi-engraving-pendant-mesmo",
    shopifyVariantId: "15844538483061",
  },
  earrings: {
    id: "earrings",
    label: "Earrings",
    description: "Pair of engraved earrings",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 12, height: 12, unit: "mm" },
    shopifyHandle: "tabi-engraving-earrings",
    shopifyVariantId: "15844538188149",
  },
};
