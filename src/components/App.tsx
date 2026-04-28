"use client";

import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import type { CustomiserActions } from "./customiser/CustomiserExperience";
import type { CustomiserState, ProductCategory, ProductVariant } from "@/lib/customiser/types";
import type { BagItem } from "@/lib/bag";
import { decodeShareState } from "@/lib/shareLink";
import type { RemixPreset } from "@/lib/remixPresets";
import HomepageScene from "./homepage/HomepageScene";
import CustomiserExperience from "./customiser/CustomiserExperience";
import SiteHeader, { ProductStrip } from "./layout/SiteHeader";
import InfoColumns from "./ui/InfoColumns";
import PlayHintPanel from "./ui/PlayHintPanel";
import { upload } from "@vercel/blob/client";
import { createShopifyCart } from "@/lib/shopify/createCart";
import { exportSpecSheet } from "@/lib/customiser/exportSpecSheet";
import { CANVAS_SIZE } from "@/hooks/useEngravingTexture";
import {
  productUsesGemstone,
  variantIsRing,
  ENGRAVING_SLIDER_CONFIG,
} from "@/lib/customiser/types";
import { getGemstone } from "@/data/gemstones";
import { PRODUCT_PRICE_GBP, formatPriceGbpLabel } from "@/lib/productPricing";
import {
  CHROME_HEADER_FONT,
  CHROME_TOP_PILL_BASE,
} from "@/lib/chromeUi";
import {
  FLOATING_PANEL_MOTION_MS,
  FLOATING_PANEL_EASING,
} from "@/lib/floatingPanelMotion";

type Panel = "info" | "play";

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

/** Site header pill row height — default inset before ResizeObserver runs. */
const LEFT_CHROME_PILL_ROW_PX = 30;

/**
 * Single accordion panel — each panel (info/play) gets its own instance so both
 * can animate simultaneously when switching: one collapses while the other expands.
 */
function FloatingPanel({
  id,
  label,
  isOpen,
  onHeight,
  children,
}: {
  id: string;
  label: string;
  isOpen: boolean;
  onHeight?: (h: number) => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(isOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const id = window.setTimeout(() => setMounted(false), FLOATING_PANEL_MOTION_MS);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setContentHeight(h);
      onHeight?.(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted, onHeight]);

  const transition = `max-height ${FLOATING_PANEL_MOTION_MS}ms ${FLOATING_PANEL_EASING}`;

  return (
    <div
      id={id}
      role="region"
      aria-label={label}
      aria-hidden={!isOpen}
      className="overflow-hidden"
      style={{ maxHeight: isOpen ? contentHeight : 0, transition }}
    >
      {mounted && <div ref={contentRef}>{children}</div>}
    </div>
  );
}

function FloatingPanels({
  panel,
  onPanelHeight,
}: {
  panel: Panel | null;
  onPanelHeight?: (h: number) => void;
}) {
  return (
    <>
      <FloatingPanel
        id="site-info-columns"
        label="About this tool"
        isOpen={panel === "info"}
        onHeight={panel === "info" ? onPanelHeight : undefined}
      >
        <InfoColumns />
      </FloatingPanel>
      <FloatingPanel
        id="site-play-hint"
        label="How to use the home screen"
        isOpen={panel === "play"}
        onHeight={panel === "play" ? onPanelHeight : undefined}
      >
        <PlayHintPanel />
      </FloatingPanel>
    </>
  );
}

/** Cart dropdown — shows bag items + total + checkout (only rendered when bag is non-empty) */
function CartDropdown({
  bag,
  onCheckout,
  isCheckingOut,
  onViewItem,
  compact,
  mobileFullWidth,
}: {
  bag: BagItem[];
  onCheckout: () => void;
  isCheckingOut: boolean;
  onViewItem: (item: BagItem) => void;
  /** Compact = no view button, stacked layout */
  compact?: boolean;
  /** Full row width on mobile so no visual gap */
  mobileFullWidth?: boolean;
}) {
  const total = bag.reduce((sum, item) => sum + item.price, 0);

  if (compact) {
    const fw = mobileFullWidth ? "w-[400px]" : "w-[160px]";
    return (
      <div className={`flex flex-col gap-0 ${fw}`}>
        {bag.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-f ${fw} shrink-0 justify-center !bg-[#ffffff] !text-[#2a2c2d] select-none whitespace-nowrap overflow-hidden lowercase`}
            style={{ ...CHROME_HEADER_FONT }}
            onClick={() => onViewItem(item)}
          >
            {item.label}
          </button>
        ))}
        <div
          className={`${CHROME_TOP_PILL_BASE} ${fw} shrink-0 justify-center !cursor-default !bg-[#ffffff] !text-[#2a2c2d] select-none tabular-nums`}
          style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
        >
          {formatPriceGbpLabel(total)}
        </div>
        <button
          type="button"
          className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-b1 ${fw} shrink-0 justify-center lowercase !text-[#2a2c2d]`}
          style={{ ...CHROME_HEADER_FONT, backgroundColor: "#b1b1b1" }}
          onClick={onCheckout}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? "..." : "checkout"}
        </button>
      </div>
    );
  }

  // Desktop: item name + view button side by side, total + checkout side by side
  return (
    <div className="flex flex-col gap-0 w-[240px]">
      {bag.map((item) => (
        <div key={item.id} className="flex flex-row gap-0">
          <div
            className={`${CHROME_TOP_PILL_BASE} w-[180px] shrink-0 justify-center !cursor-default !bg-[#ffffff] !text-[#2a2c2d] select-none whitespace-nowrap overflow-hidden`}
            style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
          >
            {item.label}
          </div>
          <button
            type="button"
            className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-d9 w-[60px] shrink-0 justify-center lowercase !text-[#2a2c2d]`}
            style={{ ...CHROME_HEADER_FONT, backgroundColor: "#d9d9d9" }}
            onClick={() => onViewItem(item)}
          >
            view
          </button>
        </div>
      ))}
      <div className="flex flex-row gap-0">
        <div
          className={`${CHROME_TOP_PILL_BASE} w-[120px] shrink-0 justify-center !cursor-default !bg-[#ffffff] !text-[#2a2c2d] select-none tabular-nums`}
          style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
        >
          {formatPriceGbpLabel(total)}
        </div>
        <button
          type="button"
          className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-b1 w-[120px] shrink-0 justify-center lowercase !text-[#2a2c2d]`}
          style={{ ...CHROME_HEADER_FONT, backgroundColor: "#b1b1b1" }}
          onClick={onCheckout}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? "..." : "checkout"}
        </button>
      </div>
    </div>
  );
}

/** Share popup — shows URL; clicking the box copies + notifies parent */
function ShareLinkBox({
  url,
  onCopied,
  compact,
  mobileFullWidth,
}: {
  url: string;
  onCopied: () => void;
  compact?: boolean;
  mobileFullWidth?: boolean;
}) {
  const [clicked, setClicked] = useState(false);
  async function handleClick() {
    try { await navigator.clipboard.writeText(url); } catch { /* unavailable */ }
    setClicked(true);
    onCopied();
  }
  const w = mobileFullWidth ? "w-[400px]" : compact ? "w-[160px]" : "w-[240px]";
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${CHROME_TOP_PILL_BASE} ${w} shrink-0 justify-start px-3 select-none whitespace-nowrap overflow-hidden`}
      style={{
        ...CHROME_HEADER_FONT,
        boxShadow: "none",
        fontSize: 10,
        backgroundColor: "#ffffff",
        color: clicked ? "#2a2c2d" : "#b1b1b1",
        transition: "color 150ms ease",
      }}
      title={url}
    >
      <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
    </button>
  );
}

/** Branded loading tab content */
function brandedLoadingHtml(origin: string): string {
  return `<!DOCTYPE html><html><head><title>tabi dsgn</title>
    <style>
      @font-face{font-family:"ABC Diatype";src:url("${origin}/fonts/ABCDiatype-Bold.otf") format("opentype");font-weight:500;font-style:normal;font-display:swap}
      body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
      background:#ffffff;font-family:"ABC Diatype",ui-sans-serif,system-ui,sans-serif}
      .brand{font-size:14px;font-weight:500;color:#2a2c2d;letter-spacing:-0.3px;
      text-transform:lowercase;animation:pulse 1.8s ease-in-out infinite}
      @keyframes pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}
    </style>
    </head><body><div class="brand">tabi dsgn</div></body></html>`;
}

export default function App() {
  const [view, setView]                         = useState<"showcase" | "customiser">("showcase");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedVariant, setSelectedVariant]   = useState<ProductVariant | null>(null);
  const [restoredShareState, setRestoredShareState] = useState<Partial<CustomiserState> | null>(null);
  const [transitioning, setTransitioning]       = useState(false);
  const [activePanel, setActivePanel]           = useState<Panel | null>(null);
  const [remixSignal, setRemixSignal]           = useState<{ preset: RemixPreset; epoch: number } | null>(null);
  const lastActionWasRemixRef = useRef(false);
  const [showcaseGemEpoch, setShowcaseGemEpoch] = useState(0);
  const [customiserActions, setCustomiserActions] = useState<CustomiserActions | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [liveVariant, setLiveVariant] = useState<ProductVariant | null>(null);
  const [liveShareUrl, setLiveShareUrl] = useState<string>("");
  const [sceneReady, setSceneReady] = useState(false);
  const leftGroupRef = useRef<HTMLDivElement>(null);
  const [leftChromeStackPx, setLeftChromeStackPx] = useState(LEFT_CHROME_PILL_ROW_PX);

  // Bag state — persisted in sessionStorage so it survives in-tab navigation
  const BAG_KEY = "tabi-bag";
  const [bag, setBag] = useState<BagItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(BAG_KEY);
      return stored ? (JSON.parse(stored) as BagItem[]) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch { /* full */ }
  }, [bag]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartEmptyFlash, setCartEmptyFlash] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [mobileBuyFlash, setMobileBuyFlash] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const cartRefMobile = useRef<HTMLDivElement>(null);
  const shareRefMobile = useRef<HTMLDivElement>(null);
  const mobileShareBtnRef = useRef<HTMLButtonElement>(null);

  const handleAddToBag = useCallback((item: BagItem) => {
    setBag((prev) => [...prev, item]);
  }, []);

  // Close cart on outside click
  useEffect(() => {
    if (!cartOpen) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (cartRef.current?.contains(t) || cartRefMobile.current?.contains(t)) return;
      setCartOpen(false);
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [cartOpen]);

  // Close share popup on outside click
  useEffect(() => {
    if (!shareOpen) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      // Desktop: share button + dropdown live inside cartRef/shareRef
      if (cartRef.current?.contains(t)) return;
      if (shareRef.current?.contains(t)) return;
      // Mobile: share link box in cartRefMobile, share button in SiteHeader
      if (cartRefMobile.current?.contains(t)) return;
      if (shareRefMobile.current?.contains(t)) return;
      if (mobileShareBtnRef.current?.contains(t)) return;
      setShareOpen(false);
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [shareOpen]);

  // View a bag item — navigate to its share URL to reload the design
  const handleViewBagItem = useCallback((item: BagItem) => {
    setCartOpen(false);
    if (item.shareUrl) {
      window.location.href = item.shareUrl;
    }
  }, []);

  // Checkout all bag items
  const handleCheckoutAll = useCallback(() => {
    if (bag.length === 0 || isCheckingOut) return;
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const winName = `tabi_checkout_${Date.now()}`;

    // Open tab synchronously before async work
    let win: Window | null = null;
    if (!isMobile) {
      win = window.open("about:blank", winName);
      if (win) {
        win.document.write(brandedLoadingHtml(window.location.origin));
        win.document.close();
      }
    }

    setIsCheckingOut(true);
    setCartOpen(false);

    (async () => {
      try {
        // Capture 3D renders for the current design (only the live scene can be captured)
        let liveCapture: { heroFrontView: string | null; renderViews: { front: string; left: string; right: string } | null } = { heroFrontView: null, renderViews: null };
        if (customiserActions?.captureRenderViews) {
          try { liveCapture = await customiserActions.captureRenderViews(); } catch { /* non-fatal */ }
        }
        const liveItem = bag[bag.length - 1]; // most recent = current design in scene

        // Generate + upload PDFs for all items in parallel
        const pdfUrls = await Promise.all(
          bag.map(async (item) => {
            try {
              const { state } = item;
              const isCurrentItem = item === liveItem;
              const isEarrings = state.variant === "earrings";
              const isRing = state.variant ? variantIsRing(state.variant) : false;
              const engTarget = isEarrings ? "earringLeft" as const : state.variant?.startsWith("pendant") ? "pendant" as const : "ring" as const;
              const { w, h } = CANVAS_SIZE[engTarget];
              const engraving = isEarrings ? state.engravingLeft : state.engraving;

              const blob = await exportSpecSheet({
                variant: state.variant,
                heroFrontView: isCurrentItem ? liveCapture.heroFrontView : null,
                renderViews: isCurrentItem ? liveCapture.renderViews : null,
                bumpCanvas: null,
                finish: state.finish,
                gemstoneLabel: state.variant && productUsesGemstone(state.variant) && state.gemstone
                  ? (getGemstone(state.gemstone)?.label ?? null) : null,
                ringSize: isRing ? (state.ringSize ?? null) : null,
                engravingText: engraving.text,
                engravingOffsetX: engraving.offsetX,
                engravingOffsetY: engraving.offsetY,
                engravingFontSize: engraving.fontSize,
                engravingRotation: engraving.rotation,
                engravingSpacing: engraving.lineSpacing,
                engravingRightText: isEarrings ? state.engravingRight.text : undefined,
                engravingRightOffsetX: isEarrings ? state.engravingRight.offsetX : undefined,
                engravingRightOffsetY: isEarrings ? state.engravingRight.offsetY : undefined,
                engravingRightFontSize: isEarrings ? state.engravingRight.fontSize : undefined,
                engravingRightRotation: isEarrings ? state.engravingRight.rotation : undefined,
                engravingRightSpacing: isEarrings ? state.engravingRight.lineSpacing : undefined,
                gemPosition: !isEarrings ? state.gemPosition : undefined,
                gemPositionLeft: isEarrings ? state.gemPositionLeft : undefined,
                gemPositionRight: isEarrings ? state.gemPositionRight : undefined,
                canvasTarget: `${engTarget} (${w}×${h})`,
                shareUrl: item.shareUrl,
                returnBlob: true,
              });
              if (!(blob instanceof Blob)) return null;
              return upload(`specs/spec-${Date.now()}.pdf`, blob, {
                access: "public",
                handleUploadUrl: "/api/upload-spec",
                contentType: "application/pdf",
              }).then((b) => b.url).catch(() => null);
            } catch {
              return null;
            }
          })
        );

        const checkoutUrl = await createShopifyCart(bag, pdfUrls);

        if (checkoutUrl) {
          if (isMobile) {
            window.location.href = checkoutUrl;
          } else if (win) {
            win.location.href = checkoutUrl;
          }
          // Bag persists until browser refresh — don't clear here
        } else {
          if (win) win.close();
        }
      } catch (err) {
        console.error("[checkout] failed:", err);
        if (win) win.close();
      } finally {
        setIsCheckingOut(false);
      }
    })();
  }, [bag, isCheckingOut]);

  // Decode ?d= share param after mount
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("d");
    if (!d) return;
    const decoded = decodeShareState(d);
    history.replaceState({}, "", "/");
    if (!decoded?.variant || !decoded?.category) return;
    setRestoredShareState(decoded);
    setSelectedCategory(decoded.category);
    setSelectedVariant(decoded.variant);
    setLiveVariant(decoded.variant);
    setView("customiser");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loader = document.getElementById("initial-loader");
    if (loader) loader.remove();
  }, []);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useLayoutEffect(() => {
    const el = leftGroupRef.current;
    if (!el) return;
    const measure = () => setLeftChromeStackPx(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handlePieceClick = useCallback((category: ProductCategory, variant: ProductVariant) => {
    if (transitioning) return;
    lastActionWasRemixRef.current = false;
    setTransitioning(true);
    setActivePanel(null);
    setTimeout(() => {
      setRemixSignal(null);
      setSelectedCategory(category);
      setSelectedVariant(variant);
      setLiveVariant(variant);
      setSceneReady(false);
      setView("customiser");
      setTransitioning(false);
    }, 550);
  }, [transitioning]);

  const handleBack = useCallback(() => {
    if (transitioning) return;
    lastActionWasRemixRef.current = false;
    setTransitioning(true);
    setActivePanel(null);
    setTimeout(() => {
      setView("showcase");
      setSelectedCategory(null);
      setSelectedVariant(null);
      setLiveVariant(null);
      setRemixSignal(null);
      setShowcaseGemEpoch((e) => e + 1);
      setTransitioning(false);
    }, 550);
  }, [transitioning]);

  const handleRemix = useCallback(() => {
    if (view === "customiser" && customiserActions?.remix) {
      lastActionWasRemixRef.current = false;
      customiserActions.remix();
    }
  }, [view, customiserActions]);

  const handleInfoToggle = useCallback(() => {
    setActivePanel((p) => (p === "info" ? null : "info"));
  }, []);

  const handlePlayToggle = useCallback(() => {
    if (view !== "showcase") return;
    setActivePanel((p) => (p === "play" ? null : "play"));
  }, [view]);

  const showPlay = view === "showcase";
  const floatingPanel: Panel | null =
    activePanel === "play" && !showPlay ? null : activePanel;

  const overlayOpen =
    activePanel === "info" || (showPlay && activePanel === "play");

  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActivePanel(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (leftGroupRef.current && !leftGroupRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [overlayOpen]);

  const inCustomiser = view === "customiser";

  const handleCartClick = useCallback(() => {
    setShareOpen(false);
    if (bag.length === 0) {
      setCartEmptyFlash(true);
      setTimeout(() => setCartEmptyFlash(false), 1200);
      return;
    }
    setCartOpen((o) => !o);
  }, [bag.length]);

  const handleShareClick = useCallback(() => {
    if (!liveShareUrl) return;
    setCartOpen(false);
    setShareCopied(false);
    setShareOpen((o) => !o);
  }, [liveShareUrl]);

  /** Mobile share — copy link directly, flash "copied", no popup */
  const handleMobileShareCopy = useCallback(async () => {
    if (!liveShareUrl) return;
    try { await navigator.clipboard.writeText(liveShareUrl); } catch { /* unavailable */ }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1500);
  }, [liveShareUrl]);

  const handleShareCopied = useCallback(() => {
    setShareCopied(true);
    setTimeout(() => { setShareCopied(false); setShareOpen(false); }, 1500);
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-transparent">

      {/* Right: product strip + cart/share (customiser only) — desktop only */}
      <div className="fixed top-4 right-4 z-50 hidden md:flex flex-col items-end gap-0">
        <ProductStrip />
        {inCustomiser && (
          <div ref={cartRef} className="flex flex-col items-end gap-0 mt-[30px]">
            {/* Button row — fixed width, never shifts */}
            <div ref={shareRef} className="flex flex-row gap-0">
              <button
                type="button"
                className={`${CHROME_TOP_PILL_BASE} buy-pill-link w-[120px] shrink-0 justify-center lowercase select-none`}
                style={{ ...CHROME_HEADER_FONT }}
                onClick={handleCartClick}
              >
                <span className="buy-pill-label">
                  {cartEmptyFlash ? "empty" : bag.length > 0 ? `cart ${bag.length}` : "cart"}
                </span>
              </button>
              <button
                type="button"
                className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-f w-[120px] shrink-0 justify-center lowercase !text-[#2a2c2d]`}
                style={{ ...CHROME_HEADER_FONT, backgroundColor: "#ffffff" }}
                onClick={handleShareClick}
                disabled={!liveShareUrl}
              >
                {shareCopied ? "copied" : "share"}
              </button>
            </div>
            {/* Dropdowns — below the button row, right-aligned */}
            {cartOpen && bag.length > 0 && (
              <CartDropdown bag={bag} onCheckout={handleCheckoutAll} isCheckingOut={isCheckingOut} onViewItem={handleViewBagItem} />
            )}
            {shareOpen && liveShareUrl && (
              <ShareLinkBox url={liveShareUrl} onCopied={handleShareCopied} />
            )}
          </div>
        )}
      </div>

      {/* Left: floating info panel stacked above TABI DSGN | info buttons */}
      <div
        ref={leftGroupRef}
        className="fixed top-4 left-4 z-40 flex min-h-0 w-max max-w-full flex-col items-start gap-0 isolate"
      >
        <FloatingPanels panel={floatingPanel} />

        <div className="shrink-0">
          <SiteHeader
            infoOpen={activePanel === "info"}
            onInfoToggle={handleInfoToggle}
            playOpen={showPlay && activePanel === "play"}
            onPlayToggle={handlePlayToggle}
            showPlayButton={view === "showcase"}
            onBack={view === "customiser" ? handleBack : undefined}
            showRemixButton={view === "customiser"}
            onRemix={handleRemix}
            onSave={customiserActions?.save ? () => { lastActionWasRemixRef.current = false; customiserActions.save(); } : undefined}
            isSaving={isSaving}
            onReset={customiserActions?.reset ? () => { lastActionWasRemixRef.current = false; customiserActions.reset(); } : undefined}
            onShare={view === "customiser" ? handleMobileShareCopy : undefined}
            shareLabel={shareCopied ? "copied" : "share"}
            shareDisabled={!liveShareUrl}
            shareButtonRef={mobileShareBtnRef}
          />
        </div>

        {/* Mobile: price+buy+cart row, cart dropdown right-aligned — all stacked, no gap */}
        {view === "customiser" && (
          <div
            ref={cartRefMobile}
            className="shrink-0 md:hidden flex flex-col items-start gap-0 w-[400px]"
            style={{ opacity: sceneReady ? 1 : 0, transition: "opacity 0.3s ease" }}
          >
            {/* Price + buy + cart — single row */}
            <div className="flex flex-row gap-0">
              <div
                role="status"
                aria-live="polite"
                className={`${CHROME_TOP_PILL_BASE} w-[120px] shrink-0 justify-center tabular-nums whitespace-nowrap !cursor-default !bg-[#ffffff] !text-[#2a2c2d] select-none`}
                style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
              >
                {liveVariant && PRODUCT_PRICE_GBP[liveVariant] != null
                  ? formatPriceGbpLabel(PRODUCT_PRICE_GBP[liveVariant]!)
                  : "—"}
              </div>
              <button
                type="button"
                className={`${CHROME_TOP_PILL_BASE} buy-pill-link w-[120px] shrink-0 overflow-hidden tabular-nums lowercase select-none`}
                style={{ ...CHROME_HEADER_FONT }}
                onClick={() => {
                  if (!customiserActions?.addToBag || mobileBuyFlash) return;
                  customiserActions.addToBag();
                  setMobileBuyFlash(true);
                  setTimeout(() => setMobileBuyFlash(false), 1500);
                }}
                disabled={!liveVariant}
              >
                <span className="buy-pill-label">{mobileBuyFlash ? "added" : "buy"}</span>
              </button>
              <button
                type="button"
                className={`${CHROME_TOP_PILL_BASE} mobile-btn-hover mobile-btn-hover-dark w-[160px] shrink-0 justify-center lowercase !text-[#2a2c2d] select-none`}
                style={{ ...CHROME_HEADER_FONT, backgroundColor: "#676767" }}
                onClick={handleCartClick}
              >
                {cartEmptyFlash ? "empty" : bag.length > 0 ? `cart ${bag.length}` : "cart"}
              </button>
            </div>
            {/* Cart dropdown — right-aligned under cart button, 160px */}
            {cartOpen && bag.length > 0 && (
              <div className="self-end">
                <CartDropdown bag={bag} onCheckout={handleCheckoutAll} isCheckingOut={isCheckingOut} onViewItem={handleViewBagItem} compact />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Always mounted — prevents HDRI/GLB reload on back-navigation */}
      <HomepageScene
        onPieceClick={handlePieceClick}
        exiting={view === "customiser" || transitioning}
        showcaseGemEpoch={showcaseGemEpoch}
      />

      {view === "customiser" && selectedCategory && (
        <CustomiserExperience
          initialCategory={selectedCategory}
          initialVariant={selectedVariant ?? undefined}
          initialSharedState={restoredShareState ?? undefined}
          onBack={handleBack}
          exiting={transitioning}
          leftChromeStackPx={leftChromeStackPx}
          remixSignal={remixSignal}
          onRemix={handleRemix}
          onRegisterActions={setCustomiserActions}
          onSavingChange={setIsSaving}
          onVariantChange={setLiveVariant}
          onShareUrlChange={setLiveShareUrl}
          onSceneReady={() => setSceneReady(true)}
          onAddToBag={handleAddToBag}
        />
      )}
    </div>
  );
}
