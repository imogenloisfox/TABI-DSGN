import type { CustomiserState } from "@/lib/customiser/types";
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
  if (!state.product || !state.gemstone || !state.finish) return null;

  const product = PRODUCTS[state.product];
  const gemstone = getGemstone(state.gemstone);
  if (!gemstone) return null;

  return {
    productHandle: product.shopifyHandle,
    productType: product.label,
    engravingInitial: state.engravingInitial,
    gemstone: gemstone.shopifyValue,
    finish: state.finish,
    lineItemProperties: {
      _engraving: state.engravingInitial,
      _gemstone: gemstone.shopifyValue,
      _finish: state.finish,
    },
  };
}
