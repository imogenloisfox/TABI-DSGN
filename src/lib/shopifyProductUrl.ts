import type { ProductVariant } from "@/lib/customiser/types";
import { PRODUCTS } from "@/data/products";

/**
 * Builds `https://your-store.com/products/{handle}` when
 * `NEXT_PUBLIC_SHOPIFY_STORE_URL` is set (no trailing slash).
 * Handles come from `PRODUCTS[].shopifyHandle` until you swap in full product URLs.
 */
export function getShopifyProductUrl(variant: ProductVariant | null): string | null {
  if (!variant) return null;
  const opt = PRODUCTS[variant];
  const direct = opt.storefrontProductUrl?.trim();
  if (direct) return direct;

  const raw = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL;
  const base = typeof raw === "string" ? raw.trim() : "";
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/products/${opt.shopifyHandle}`;
}
