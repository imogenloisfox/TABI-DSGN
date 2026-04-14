import type { CustomiserState } from "@/lib/customiser/types";
import type { BagItem } from "@/lib/bag";
import {
  ENGRAVING_SLIDER_CONFIG,
  CONCAVE_GEM_BOUNDS,
  EARRING_GEM_BOUNDS,
  productUsesGemstone,
  variantHasGemSliders,
  variantIsRing,
} from "@/lib/customiser/types";
import { PRODUCTS } from "@/data/products";
import { getGemstone } from "@/data/gemstones";

const STOREFRONT_API_VERSION = "2025-01";

function toPercent(value: number, min: number, max: number): string {
  return `${Math.round(((value - min) / (max - min)) * 100)}%`;
}

/** Replace spaces with _ so spaces in engraving text are visible in Shopify admin. */
function visibleSpaces(text: string): string {
  return text.replace(/ /g, "_");
}

export function buildLineItemAttributes(state: CustomiserState): Array<{ key: string; value: string }> {
  if (!state.variant || !state.finish) return [];

  const cfg = ENGRAVING_SLIDER_CONFIG[state.variant];
  const attrs: Array<{ key: string; value: string }> = [];

  // Customer-visible attributes
  attrs.push({ key: "Finish", value: state.finish === "shiny" ? "Shiny" : "Matte" });

  if (productUsesGemstone(state.variant) && state.gemstone) {
    const gem = getGemstone(state.gemstone);
    if (gem) attrs.push({ key: "Gemstone", value: gem.shopifyValue });
  }

  if (variantIsRing(state.variant) && state.ringSize) {
    attrs.push({ key: "Ring Size", value: state.ringSize });
  }

  if (state.variant === "earrings") {
    if (state.engravingLeft.text)  attrs.push({ key: "Left Engraving",  value: visibleSpaces(state.engravingLeft.text) });
    if (state.engravingRight.text) attrs.push({ key: "Right Engraving", value: visibleSpaces(state.engravingRight.text) });
  } else {
    if (state.engraving.text) attrs.push({ key: "Engraving", value: visibleSpaces(state.engraving.text) });
  }

  // Technical attributes — prefixed with _ so Shopify hides them from customers
  if (state.variant === "earrings") {
    attrs.push({ key: "_left_pos_x",  value: toPercent(state.engravingLeft.offsetX,  cfg.posX.min, cfg.posX.max) });
    attrs.push({ key: "_left_pos_y",  value: toPercent(state.engravingLeft.offsetY,  cfg.posY.min, cfg.posY.max) });
    attrs.push({ key: "_left_scale",  value: toPercent(state.engravingLeft.fontSize,  cfg.size.min, cfg.size.max) });
    attrs.push({ key: "_right_pos_x", value: toPercent(state.engravingRight.offsetX, cfg.posX.min, cfg.posX.max) });
    attrs.push({ key: "_right_pos_y", value: toPercent(state.engravingRight.offsetY, cfg.posY.min, cfg.posY.max) });
    attrs.push({ key: "_right_scale", value: toPercent(state.engravingRight.fontSize, cfg.size.min, cfg.size.max) });
    attrs.push({ key: "_gem_x_left",  value: toPercent(state.gemPositionLeft.x,  EARRING_GEM_BOUNDS.minX, EARRING_GEM_BOUNDS.maxX) });
    attrs.push({ key: "_gem_y_left",  value: toPercent(state.gemPositionLeft.y,  EARRING_GEM_BOUNDS.minY, EARRING_GEM_BOUNDS.maxY) });
    attrs.push({ key: "_gem_x_right", value: toPercent(state.gemPositionRight.x, EARRING_GEM_BOUNDS.minX, EARRING_GEM_BOUNDS.maxX) });
    attrs.push({ key: "_gem_y_right", value: toPercent(state.gemPositionRight.y, EARRING_GEM_BOUNDS.minY, EARRING_GEM_BOUNDS.maxY) });
  } else {
    attrs.push({ key: "_pos_x",  value: toPercent(state.engraving.offsetX, cfg.posX.min, cfg.posX.max) });
    attrs.push({ key: "_pos_y",  value: toPercent(state.engraving.offsetY, cfg.posY.min, cfg.posY.max) });
    attrs.push({ key: "_scale",  value: toPercent(state.engraving.fontSize, cfg.size.min, cfg.size.max) });
    if (cfg.spacing) {
      attrs.push({ key: "_line_spacing", value: toPercent(state.engraving.lineSpacing, cfg.spacing.min, cfg.spacing.max) });
    }
    if (variantHasGemSliders(state.variant)) {
      attrs.push({ key: "_gem_x", value: toPercent(state.gemPosition.x, CONCAVE_GEM_BOUNDS.minX, CONCAVE_GEM_BOUNDS.maxX) });
      attrs.push({ key: "_gem_y", value: toPercent(state.gemPosition.y, CONCAVE_GEM_BOUNDS.minY, CONCAVE_GEM_BOUNDS.maxY) });
    }
  }

  return attrs;
}

/**
 * Creates a Shopify cart via the Storefront API with all items from the bag,
 * each with their customisation details as line item properties.
 * Returns the checkout URL or null on failure.
 */
export async function createShopifyCart(
  items: BagItem[],
  specPdfUrls: (string | null)[],
): Promise<string | null> {
  if (items.length === 0) return null;

  const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL;
  const token    = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  if (!storeUrl || !token) return null;

  const handleQuery = `
    query variantByHandle($handle: String!) {
      product(handle: $handle) {
        variants(first: 1) { edges { node { id } } }
      }
    }
  `;

  // Resolve variant GIDs — prefer hardcoded ID, fall back to handle lookup
  const resolvedIds = await Promise.all(
    items.map(async (item) => {
      if (!item.state.variant) return null;
      const product = PRODUCTS[item.state.variant];
      // Try handle lookup first (works for published products; gives real GID)
      try {
        const res = await fetch(`${storeUrl}/api/${STOREFRONT_API_VERSION}/graphql.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
          body: JSON.stringify({ query: handleQuery, variables: { handle: product.shopifyHandle } }),
        });
        const data = (await res.json()) as { data?: { product?: { variants?: { edges?: Array<{ node?: { id?: string } }> } } } };
        const gid = data?.data?.product?.variants?.edges?.[0]?.node?.id ?? null;
        console.log("[createCart] handle lookup", product.shopifyHandle, "→", gid);
        if (gid) return gid;
      } catch (err) {
        console.warn("[createCart] handle lookup failed for", product.shopifyHandle, err);
      }
      // Fall back to hardcoded GID (needed if products are drafted/unlisted)
      if (product.shopifyVariantId) {
        const gid = `gid://shopify/ProductVariant/${product.shopifyVariantId}`;
        console.log("[createCart] using hardcoded GID for", product.shopifyHandle, "→", gid);
        return gid;
      }
      return null;
    })
  );

  const lines = items
    .map((item, i) => {
      if (!item.state.variant || !item.state.finish) return null;
      const merchandiseId = resolvedIds[i];
      if (!merchandiseId) return null;
      const attributes = buildLineItemAttributes(item.state);
      const pdfUrl = specPdfUrls[i];
      if (pdfUrl) attributes.push({ key: "_spec_pdf", value: pdfUrl });
      return { quantity: 1, merchandiseId, attributes };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (lines.length === 0) return null;

  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { field message }
      }
    }
  `;

  try {
    const res = await fetch(`${storeUrl}/api/${STOREFRONT_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables: { input: { lines } } }),
    });

    if (!res.ok) {
      console.error("[createCart] Storefront API HTTP error:", res.status, res.statusText);
      return null;
    }

    const data = (await res.json()) as {
      data?: { cartCreate?: { cart?: { checkoutUrl?: string }; userErrors?: Array<{ field: string[]; message: string }> } };
      errors?: Array<{ message: string }>;
    };

    console.log("[createCart] Storefront API response:", JSON.stringify(data, null, 2));

    const userErrors = data?.data?.cartCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      console.error("[createCart] userErrors:", JSON.stringify(userErrors, null, 2));
    }

    const checkoutUrl = data?.data?.cartCreate?.cart?.checkoutUrl ?? null;
    console.log("[createCart] checkoutUrl:", checkoutUrl);
    return checkoutUrl;
  } catch (err) {
    console.error("[createCart] fetch failed:", err);
    return null;
  }
}
