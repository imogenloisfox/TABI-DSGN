"use client";

import { useState, useRef, useEffect } from "react";
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

export default function PreviewShopPills({
  variant,
  onBuy,
  onSave: _onSave,
  shareUrl,
}: {
  variant: ProductVariant | null;
  onBuy?: (win?: Window | null, winName?: string) => Promise<void>;
  onSave?: () => Promise<void>;
  shareUrl?: string;
}) {
  const [isBuying, setIsBuying]   = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared]       = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const wrapperRef                = useRef<HTMLDivElement>(null);

  const gbp         = variant !== null ? PRODUCT_PRICE_GBP[variant] : null;
  const priceLabel  = gbp !== null ? formatPriceGbpLabel(gbp) : "—";
  const shopUrl     = getShopifyProductUrl(variant);
  const category    = variant !== null ? variantCategory(variant) : null;
  const priceBgClass = categoryPreviewPricePillBgClass(category);
  const productName = variant !== null ? (VARIANT_LABEL[variant] ?? variant) : null;

  useEffect(() => { if (!variant) setPopupOpen(false); }, [variant]);

  useEffect(() => {
    if (!popupOpen) return;
    // Only close on outside click for desktop — on mobile this races with button
    // taps and closes the popup before the click fires.
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [popupOpen]);

  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPopupOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popupOpen]);

  async function handleShare() {
    if (isSharing) return;
    if (!shareUrl) { console.warn("[share] shareUrl is empty"); return; }
    setIsSharing(true);
    try { await navigator.clipboard.writeText(shareUrl); } catch { /* unavailable */ }
    setShared(true);
    setIsSharing(false);
    setTimeout(() => setShared(false), 2000);
  }

  function handleCheckout() {
    if (!onBuy || isBuying) return;
    // Open the checkout window synchronously here (direct click handler) so
    // popup blockers treat it as a user gesture. Pass it into onBuy so it
    // doesn't try to open a second window after the async work completes.
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const winName = `tabi_checkout_${Date.now()}`;
    let win: Window | null = null;
    if (!isMobile) {
      const origin = window.location.origin;
      win = window.open("about:blank", winName);
      if (win) {
        win.document.write(`<!DOCTYPE html><html><head><title>tabi dsgn</title>
          <style>
            @font-face{font-family:"ABC Diatype";src:url("${origin}/fonts/ABCDiatype-Bold.otf") format("opentype");font-weight:500;font-style:normal;font-display:swap}
            body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
            background:#ffffff;font-family:"ABC Diatype",ui-sans-serif,system-ui,sans-serif}
            .brand{font-size:14px;font-weight:500;color:#2a2c2d;letter-spacing:-0.3px;
            text-transform:lowercase;animation:pulse 1.8s ease-in-out infinite}
            @keyframes pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}
          </style>
          </head><body><div class="brand">tabi dsgn</div></body></html>`);
        win.document.close();
      }
    }
    onBuy(win, winName).finally(() => { setIsBuying(false); setPopupOpen(false); });
  }

  const buyPill = onBuy ? (
    <div className="relative">
      <button
        type="button"
        className={`${CHROME_TOP_PILL_BASE} buy-pill-link w-[120px] shrink-0 overflow-hidden tabular-nums lowercase select-none`}
        style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
        onClick={() => setPopupOpen((o) => !o)}
        disabled={isBuying}
      >
        <span className="buy-pill-label">{isBuying ? "..." : "buy"}</span>
      </button>
    </div>
  ) : shopUrl ? (
    <PreviewBuyPillLink href={shopUrl} />
  ) : (
    <button
      type="button"
      disabled
      title="Add shopifyVariantId on the product in products.ts or set NEXT_PUBLIC_SHOPIFY_STORE_URL"
      className={`${CHROME_TOP_PILL_BASE} ${PILL_W} !cursor-not-allowed !bg-[#2a2c2d] !text-[#ffffff]`}
      style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
    >
      buy
    </button>
  );

  return (
    <>
      {/* Mobile */}
      <div ref={wrapperRef} className="md:hidden flex flex-col gap-0">
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
        {/* Mobile popup stacks below in document flow */}
        {popupOpen && variant && onBuy && (
          <div className="flex flex-row gap-0">
            <button
              type="button"
              className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-d9 w-[120px] shrink-0 justify-center lowercase !text-[#2a2c2d]`}
              style={{ ...CHROME_HEADER_FONT, backgroundColor: "#d9d9d9" }}
              onClick={handleShare}
              disabled={isSharing}
            >
              <span>{isSharing ? "..." : shared ? "copied!" : "share"}</span>
            </button>
            <button
              type="button"
              className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-b1 w-[120px] shrink-0 justify-center lowercase !text-[#2a2c2d]`}
              style={{ ...CHROME_HEADER_FONT, backgroundColor: "#b1b1b1" }}
              onClick={handleCheckout}
              disabled={isBuying}
            >
              <span>{isBuying ? "..." : "checkout"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop — popup completely replaces the chrome */}
      <div ref={wrapperRef} className="hidden md:flex flex-col gap-0" onMouseLeave={() => setPopupOpen(false)}>
        {popupOpen && variant && onBuy ? (
          <>
            {productName && (
              <div
                className={`${CHROME_TOP_PILL_BASE} w-[240px] shrink-0 justify-center normal-case lowercase whitespace-nowrap !text-[#2a2c2d] select-none !cursor-default !bg-[#ffffff]`}
                style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
              >
                {productName}
              </div>
            )}
            {/* Bottom row: share + checkout */}
            <div className="flex flex-row gap-0">
              <button
                type="button"
                className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-d9 w-[120px] shrink-0 justify-center lowercase !text-[#2a2c2d]`}
                style={{ ...CHROME_HEADER_FONT, backgroundColor: "#d9d9d9" }}
                onClick={handleShare}
                disabled={isSharing}
              >
                <span>{isSharing ? "..." : shared ? "copied!" : "share"}</span>
              </button>
              <button
                type="button"
                className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-b1 w-[120px] shrink-0 justify-center lowercase !text-[#2a2c2d]`}
                style={{ ...CHROME_HEADER_FONT, backgroundColor: "#b1b1b1" }}
                onClick={handleCheckout}
                disabled={isBuying}
              >
                <span>{isBuying ? "..." : "checkout"}</span>
              </button>
            </div>
          </>
        ) : (
          <>
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
              {onBuy ? (
                <button
                  type="button"
                  className={`${CHROME_TOP_PILL_BASE} buy-pill-link w-[120px] shrink-0 overflow-hidden tabular-nums lowercase select-none`}
                  style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
                  onClick={() => setPopupOpen(true)}
                  disabled={isBuying}
                >
                  <span className="buy-pill-label">{isBuying ? "..." : "buy"}</span>
                </button>
              ) : shopUrl ? (
                <PreviewBuyPillLink href={shopUrl} />
              ) : (
                <button type="button" disabled className={`${CHROME_TOP_PILL_BASE} ${PILL_W} !cursor-not-allowed !bg-[#2a2c2d] !text-[#ffffff]`} style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}>buy</button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
