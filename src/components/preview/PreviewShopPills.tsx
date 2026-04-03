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
const PILL_W =
  "w-[120px] shrink-0 justify-center tabular-nums normal-case lowercase !text-[#2a2c2d] select-none";

const VARIANT_LABEL: Record<string, string> = {
  ringClassic:      "moi ring",
  ringConcave:      "sui ring",
  ringClassicNoGem: "meus ring",
  ringConcaveNoGem: "ego ring",
  pendantOne:       "soi pendant",
  pendantTwo:       "moment pendant",
  pendantMesmo:     "mesmo pendant",
  earrings:         "earrings",
};

export default function PreviewShopPills({ variant }: { variant: ProductVariant | null }) {
  const gbp = variant !== null ? PRODUCT_PRICE_GBP[variant] : null;
  const priceLabel = gbp !== null ? formatPriceGbpLabel(gbp) : "—";
  const shopUrl = getShopifyProductUrl(variant);
  const category = variant !== null ? variantCategory(variant) : null;
  const priceBgClass = categoryPreviewPricePillBgClass(category);
  const productName = variant !== null ? (VARIANT_LABEL[variant] ?? variant) : null;

  const buyPill = shopUrl ? (
    <PreviewBuyPillLink href={shopUrl} />
  ) : (
    <button
      type="button"
      disabled
      title="Add storefrontProductUrl on the product in products.ts or set NEXT_PUBLIC_SHOPIFY_STORE_URL"
      className={`${CHROME_TOP_PILL_BASE} ${PILL_W} !cursor-not-allowed !bg-[#2a2c2d] !text-[#ffffff]`}
      style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
    >
      buy
    </button>
  );

  const desktopPills = (
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
      {buyPill}
    </>
  );

  return (
    <>
      {/* Mobile: name on top (240px), price + buy below (120+120=240px) */}
      <div className="md:hidden flex flex-col gap-0">
        {productName && (
          <div
            className={`${CHROME_TOP_PILL_BASE} w-[240px] shrink-0 justify-center normal-case lowercase whitespace-nowrap !text-[#2a2c2d] select-none !cursor-default !bg-[#ffffff]`}
            style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
          >
            {productName}
          </div>
        )}
        <div className="flex flex-row gap-0">
          <div
            role="status"
            aria-live="polite"
            aria-label={gbp !== null ? `Price ${formatPriceGbpLabel(gbp)}` : "No piece selected"}
            className={`${CHROME_TOP_PILL_BASE} w-[120px] shrink-0 justify-center tabular-nums whitespace-nowrap !cursor-default !bg-[#ffffff] !text-[#2a2c2d] select-none`}
            style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
          >
            {priceLabel}
          </div>
          {buyPill}
        </div>
      </div>

      {/* Desktop: name on top, price + buy below */}
      <div className="hidden md:flex flex-col gap-0">
        {productName && (
          <div
            className={`${CHROME_TOP_PILL_BASE} w-[240px] shrink-0 justify-center normal-case lowercase whitespace-nowrap !text-[#2a2c2d] select-none !cursor-default !bg-[#ffffff]`}
            style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
          >
            {productName}
          </div>
        )}
        <div className="flex flex-row items-center gap-0">
          {desktopPills}
        </div>
      </div>
    </>
  );
}
