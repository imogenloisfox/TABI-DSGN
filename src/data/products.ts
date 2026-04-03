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
    shopifyHandle: "moi-ring",
    shopifyVariantId: "15844537663861",
    storefrontProductUrl: "https://tabidsgn.com/products/moi-ring",
  },
  ringConcave: {
    id: "ringConcave",
    label: "SUI",
    description: "Wide concave band with stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "sui-ring",
    shopifyVariantId: "15844538253685",
    storefrontProductUrl: "https://tabidsgn.com/products/sui-ring",
  },
  ringClassicNoGem: {
    id: "ringClassicNoGem",
    label: "MEUS",
    description: "Classic band without centre stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "meus-ring",
    shopifyVariantId: "15844538286453",
    storefrontProductUrl: "https://tabidsgn.com/products/meus-ring",
  },
  ringConcaveNoGem: {
    id: "ringConcaveNoGem",
    label: "EGO",
    description: "EGO — concave band without centre stone",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 17, height: 17, unit: "mm" },
    shopifyHandle: "ego-ring",
    shopifyVariantId: "15844538581365",
    storefrontProductUrl: "https://tabidsgn.com/products/ego-ring",
  },
  pendantOne: {
    id: "pendantOne",
    label: "SOI",
    description: "Pendant with chain, hook, and standard setting",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 15, height: 17, unit: "mm" },
    shopifyHandle: "soi-pendant",
    shopifyVariantId: "15844538089845",
    storefrontProductUrl: "https://tabidsgn.com/products/soi-pendant",
  },
  pendantTwo: {
    id: "pendantTwo",
    label: "MOMENT",
    description: "Mini body with chain and low-set stone",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 12, height: 14, unit: "mm" },
    shopifyHandle: "moment-pendant",
    shopifyVariantId: "15844538548597",
    storefrontProductUrl: "https://tabidsgn.com/products/moment-pendant",
  },
  pendantMesmo: {
    id: "pendantMesmo",
    label: "MESMO",
    description: "Pendant with chain, setting, and centre stone",
    previewImage: "/images/pendant/pendant-plain.png",
    dimensions: { width: 15, height: 17, unit: "mm" },
    shopifyHandle: "mesmo-pendant",
    shopifyVariantId: "15844538483061",
    storefrontProductUrl: "https://tabidsgn.com/products/mesmo-pendant",
  },
  earrings: {
    id: "earrings",
    label: "Earrings",
    description: "Pair of engraved earrings",
    previewImage: "/images/ring/ring-plain.png",
    dimensions: { width: 12, height: 12, unit: "mm" },
    shopifyHandle: "earrings",
    shopifyVariantId: "15844538188149",
    storefrontProductUrl: "https://tabidsgn.com/products/earrings",
  },
};
