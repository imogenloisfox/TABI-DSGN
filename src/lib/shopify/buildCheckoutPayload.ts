import type { CustomiserState } from "@/lib/customiser/types";
import { productUsesGemstone } from "@/lib/customiser/types";
import { PRODUCTS } from "@/data/products";
import { getGemstone } from "@/data/gemstones";

export interface ShopifyCheckoutPayload {
  productHandle: string;
  productType: string;
  engravingInitial: string;
  gemstone: string;
  finish: string;
  lineItemProperties: Record<string, string>;
}

export function buildCheckoutPayload(
  state: CustomiserState
): ShopifyCheckoutPayload | null {
  if (!state.product || !state.finish) return null;

  const needsGem = productUsesGemstone(state.product);
  if (needsGem && !state.gemstone) return null;

  const product = PRODUCTS[state.product];
  const gemstone = state.gemstone ? getGemstone(state.gemstone) : null;
  if (needsGem && !gemstone) return null;

  const gemValue = gemstone?.shopifyValue ?? "none";

  return {
    productHandle: product.shopifyHandle,
    productType: product.label,
    engravingInitial: state.engraving.text,
    gemstone: gemValue,
    finish: state.finish,
    lineItemProperties: {
      _engraving: state.engraving.text,
      _gemstone: gemValue,
      _finish: state.finish,
    },
  };
}
