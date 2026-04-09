"use client";

import { useState, useEffect } from "react";
import { variantCategory, type ProductVariant } from "@/lib/customiser/types";
import {
  CHROME_HEADER_FONT,
  CHROME_TOP_PILL_BASE,
  categoryPreviewPricePillBgClass,
} from "@/lib/chromeUi";
import { PRODUCT_PRICE_GBP, formatPriceGbpLabel } from "@/lib/productPricing";
import { getShopifyProductUrl } from "@/lib/shopifyProductUrl";

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

export default function PreviewShopPills({
  variant,
  onAddToBag,
  onSave: _onSave,
  shareUrl,
  hideProductName,
}: {
  variant:          ProductVariant | null;
  onAddToBag?:      () => void;
  onSave?:          () => Promise<void>;
  shareUrl?:        string;
  hideProductName?: boolean;
}) {
  const [added, setAdded]       = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared]     = useState(false);

  const gbp          = variant !== null ? PRODUCT_PRICE_GBP[variant] : null;
  const priceLabel   = gbp !== null ? formatPriceGbpLabel(gbp) : "—";
  const shopUrl      = getShopifyProductUrl(variant);
  const category     = variant !== null ? variantCategory(variant) : null;
  const priceBgClass = categoryPreviewPricePillBgClass(category);
  const productName  = variant !== null ? (VARIANT_LABEL[variant] ?? variant) : null;

  // Reset "added" flash when variant changes
  useEffect(() => { setAdded(false); }, [variant]);

  function handleAddToBag() {
    if (!onAddToBag || added) return;
    onAddToBag();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  async function handleShare() {
    if (isSharing || !shareUrl) { console.warn("[share] shareUrl is empty"); return; }
    setIsSharing(true);
    try { await navigator.clipboard.writeText(shareUrl); } catch { /* unavailable */ }
    setShared(true);
    setIsSharing(false);
    setTimeout(() => setShared(false), 2000);
  }

  const buyLabel = added ? "added" : "buy";

  const buyButton = onAddToBag ? (
    <button
      type="button"
      className={`${CHROME_TOP_PILL_BASE} buy-pill-link w-[120px] shrink-0 overflow-hidden tabular-nums lowercase select-none`}
      style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
      onClick={handleAddToBag}
      disabled={!variant}
    >
      <span className="buy-pill-label">{buyLabel}</span>
    </button>
  ) : shopUrl ? (
    <a
      href={shopUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${CHROME_TOP_PILL_BASE} buy-pill-link w-[120px] shrink-0 overflow-hidden tabular-nums lowercase select-none`}
      style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
    >
      <span className="buy-pill-label">buy</span>
    </a>
  ) : (
    <button
      type="button"
      disabled
      className={`${CHROME_TOP_PILL_BASE} ${PILL_W} !cursor-not-allowed !bg-[#2a2c2d] !text-[#ffffff]`}
      style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
    >
      buy
    </button>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-0">
        {!hideProductName && productName && (
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
          {buyButton}
        </div>
      </div>

      {/* Desktop */}
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
          <div
            role="status"
            aria-live="polite"
            aria-label={gbp !== null ? `Price ${formatPriceGbpLabel(gbp)}` : "No piece selected"}
            className={`${CHROME_TOP_PILL_BASE} ${PILL_W} !cursor-default ${priceBgClass}`}
            style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
          >
            {priceLabel}
          </div>
          {buyButton}
        </div>
      </div>
    </>
  );
}
