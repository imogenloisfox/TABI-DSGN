"use client";

import { variantCategory, type ProductVariant } from "@/lib/customiser/types";
import {
  CHROME_HEADER_FONT,
  CHROME_TOP_PILL_BASE,
  categoryPreviewPricePillBgClass,
} from "@/lib/chromeUi";
import { PRODUCT_PRICE_GBP, formatPriceGbpLabel } from "@/lib/productPricing";
import { getShopifyProductUrl } from "@/lib/shopifyProductUrl";
import PreviewBuyPillLink from "@/components/preview/PreviewBuyPillLink";
import {
  FLOATING_PANEL_MOTION_MS,
  FLOATING_PANEL_EASING,
} from "@/lib/floatingPanelMotion";

const PILL_W =
  "w-[120px] shrink-0 justify-center tabular-nums normal-case lowercase !text-[#2a2c2d] select-none";

export default function PreviewShopPills({ variant, topOffsetPx }: { variant: ProductVariant | null; topOffsetPx?: number }) {
  const gbp = variant !== null ? PRODUCT_PRICE_GBP[variant] : null;
  const priceLabel = gbp !== null ? formatPriceGbpLabel(gbp) : "—";
  const shopUrl = getShopifyProductUrl(variant);
  const category = variant !== null ? variantCategory(variant) : null;
  const priceBgClass = categoryPreviewPricePillBgClass(category);

  // Mobile: top-left, slides down when info panel opens
  const extraOffset = topOffsetPx !== undefined ? Math.max(0, topOffsetPx - 30) : 0;

  const pills = (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-label={gbp !== null ? `Price ${formatPriceGbpLabel(gbp)}` : "No piece selected"}
        className={`${CHROME_TOP_PILL_BASE} ${PILL_W} !cursor-default ${priceBgClass}`}
        style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
      >
        {priceLabel}
      </div>

      {shopUrl ? (
        <PreviewBuyPillLink href={shopUrl} />
      ) : (
        <button
          type="button"
          disabled
          title="Add storefrontProductUrl on the product in products.ts or set NEXT_PUBLIC_SHOPIFY_STORE_URL"
          className={`${CHROME_TOP_PILL_BASE} ${PILL_W} !cursor-not-allowed !bg-[#2a2c2d] !text-[#ffffff] opacity-50`}
          style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
        >
          buy
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Mobile: top-left, moves down with info panel */}
      <div
        className="md:hidden fixed top-[46px] left-4 z-[100] flex flex-row items-center gap-0"
        style={{
          transform: `translateY(${extraOffset}px)`,
          transition: `transform ${FLOATING_PANEL_MOTION_MS}ms ${FLOATING_PANEL_EASING}`,
        }}
      >
        {pills}
      </div>

      {/* Desktop: bottom-left, same padding as header */}
      <div className="hidden md:flex fixed bottom-4 left-4 z-[100] flex-row items-center gap-0">
        {pills}
      </div>
    </>
  );
}
