import type { CustomiserState } from "@/lib/customiser/types";
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

function buildLineItemAttributes(state: CustomiserState): Array<{ key: string; value: string }> {
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
    if (state.engravingLeft.text) attrs.push({ key: "Left Engraving", value: state.engravingLeft.text });
    if (state.engravingRight.text) attrs.push({ key: "Right Engraving", value: state.engravingRight.text });
  } else {
    if (state.engraving.text) attrs.push({ key: "Engraving", value: state.engraving.text });
  }

  // Technical attributes — prefixed with _ so Shopify hides them from customers
  // but they remain visible in the admin order view for the jeweller.
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
 * Form-POST fallback: submits directly to Shopify's /cart/add endpoint with
 * all customisation as line item properties, targeting an already-open window.
 * Does not require the Storefront API — works as long as the product is published.
 * Returns true if the form was submitted successfully.
 */
export function addToCartFormPost(
  windowName: string,
  state: CustomiserState,
  specPdfUrl?: string | null,
): boolean {
  if (!state.variant) return false;
  const product   = PRODUCTS[state.variant];
  const variantId = product.shopifyVariantId;
  if (!variantId) return false;

  // Derive store base from the product's storefront URL (e.g. https://tabidsgn.com)
  const storeBase = product.storefrontProductUrl
    ? new URL(product.storefrontProductUrl).origin
    : process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL;
  if (!storeBase) return false;

  const attrs = buildLineItemAttributes(state);
  if (specPdfUrl) attrs.push({ key: "_spec_pdf", value: specPdfUrl });

  const form = document.createElement("form");
  form.method  = "POST";
  form.action  = `${storeBase}/cart/add`;
  form.target  = windowName;
  form.style.display = "none";

  const addInput = (name: string, value: string) => {
    const el = document.createElement("input");
    el.type  = "hidden";
    el.name  = name;
    el.value = value;
    form.appendChild(el);
  };

  addInput("id",        variantId);
  addInput("quantity",  "1");
  addInput("return_to", "/checkout");
  for (const { key, value } of attrs) {
    addInput(`properties[${key}]`, value);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  return true;
}

/**
 * Creates a Shopify cart via the Storefront API with all customisation details
 * attached as line item properties, then returns the checkout URL.
 *
 * Returns null if the product has no `shopifyVariantId`, env vars are missing,
 * or the API call fails — callers should fall back to the plain product page URL.
 */
export async function createShopifyCart(state: CustomiserState, specPdfUrl?: string | null, previewUrl?: string | null): Promise<string | null> {
  if (!state.variant || !state.finish) return null;

  const product = PRODUCTS[state.variant];
  const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL;
  const token    = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  if (!storeUrl || !token) return null;

  // Resolve the real variant GID by product handle — guards against the stored
  // shopifyVariantId being a product ID rather than a variant ID.
  const handleQuery = `
    query variantByHandle($handle: String!) {
      product(handle: $handle) {
        variants(first: 1) { edges { node { id } } }
      }
    }
  `;
  let merchandiseId: string | null = null;
  try {
    const hRes = await fetch(`${storeUrl}/api/${STOREFRONT_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({ query: handleQuery, variables: { handle: product.shopifyHandle } }),
    });
    const hData = (await hRes.json()) as { data?: { product?: { variants?: { edges?: Array<{ node?: { id?: string } }> } } } };
    merchandiseId = hData?.data?.product?.variants?.edges?.[0]?.node?.id ?? null;
    console.log("[createCart] resolved merchandiseId for", product.shopifyHandle, "→", merchandiseId);
  } catch (err) {
    console.error("[createCart] handle lookup failed:", err);
  }
  if (!merchandiseId) return null;
  const attributes    = buildLineItemAttributes(state);
  if (specPdfUrl) {
    attributes.push({ key: "_spec_pdf", value: specPdfUrl });
  }
  if (previewUrl) {
    attributes.push({ key: "_design_preview", value: previewUrl });
  }

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
      body: JSON.stringify({
        query,
        variables: { input: { lines: [{ quantity: 1, merchandiseId, attributes }] } },
      }),
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
