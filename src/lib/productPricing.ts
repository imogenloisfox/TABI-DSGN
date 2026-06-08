import type { ProductVariant } from "@/lib/customiser/types";

/**
 * RRP in GBP — marketing price list (MOI / EGO / SOI / …).
 */
export const PRODUCT_PRICE_GBP: Record<ProductVariant, number> = {
  ringClassic:      230, // MOI
  ringConcave:      240, // SUI
  ringClassicNoGem: 170, // MEUS
  ringConcaveNoGem: 185, // EGO (no gem)
  pendantOne:       165, // SOI
  pendantTwo:       165, // MOMENT
  pendantMesmo:     165, // MESMO
  earrings:         185,
};

export function formatPriceGbpLabel(gbp: number): string {
  return `${gbp} gbp`;
}
