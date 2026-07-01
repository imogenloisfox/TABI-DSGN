import type { ProductVariant } from "@/lib/customiser/types";

/**
 * RRP in GBP — marketing price list (MOI / EGO / SOI / …).
 */
export const PRODUCT_PRICE_GBP: Record<ProductVariant, number> = {
  ringClassic:      276, // MOI
  ringConcave:      288, // SUI
  ringClassicNoGem: 204, // MEUS
  ringConcaveNoGem: 222, // EGO (no gem)
  pendantOne:       198, // SOI
  pendantTwo:       198, // MOMENT
  pendantMesmo:     198, // MESMO
  earrings:         222,
};

export function formatPriceGbpLabel(gbp: number): string {
  return `${gbp} gbp`;
}
