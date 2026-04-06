"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import type {
  CustomiserState,
  ProductCategory,
  ProductVariant,
  FinishType,
  GemstoneId,
  EngravingParams,
  GemPosition,
  UKRingSize,
} from "@/lib/customiser/types";
import {
  INITIAL_STATE,
  ENGRAVING_DEFAULTS,
  ENGRAVING_DEFAULTS_EARRING,
  EARRING_GEM_POSITION_DEFAULT,
  variantEngravingGroup,
  variantIsRing,
  variantIsPendant,
  productUsesGemstone,
  variantUsesGemColour,
} from "@/lib/customiser/types";
import { createShopifyCart, addToCartFormPost } from "@/lib/shopify/createCart";
import { upload } from "@vercel/blob/client";
import { getShopifyProductUrl } from "@/lib/shopifyProductUrl";
import { buildStateFromPreset, captureCurrentAsPreset, REMIX_PRESETS } from "@/lib/remixPresets";
import type { RemixPreset } from "@/lib/remixPresets";
import { useEngravingTexture, CANVAS_SIZE } from "@/hooks/useEngravingTexture";
import { getGemstone, pickRandomGemstoneId } from "@/data/gemstones";
import { exportSpecSheet } from "@/lib/customiser/exportSpecSheet";
import type { SceneCanvasHandle } from "@/components/preview/scene/SceneCanvas";
import StartPrompt from "./StartPrompt";
import ProductSelector from "./ProductSelector";
import InitialStep from "./InitialStep";
import FinishStep from "./FinishStep";
import GemstoneStep from "./GemstoneStep";
import RingSizeStep from "./RingSizeStep";
import PreviewStage from "@/components/preview/PreviewStage";
import StageLayout from "@/components/layout/StageLayout";
import VanishButton from "@/components/ui/VanishButton";
import {
  CHROME_HEADER_FONT,
  SIDEBAR_BUTTON_ROW_2,
  SIDEBAR_CONTROL_COLUMN,
  customiserToolbarActionPillClass,
} from "@/lib/chromeUi";
import { EARRING_GEM_BOUNDS } from "@/lib/customiser/types";
import BarSlider from "./BarSlider";
import { FLOATING_PANEL_MOTION_MS } from "@/lib/floatingPanelMotion";

// Fallback variant per category when no specific variant is provided
const CATEGORY_DEFAULT_VARIANT: Record<ProductCategory, ProductVariant> = {
  ring:     "ringClassic",
  pendant:  "pendantOne",
  earrings: "earrings",
};

function buildInitialState(initialCategory?: ProductCategory, initialVariant?: ProductVariant): CustomiserState {
  if (!initialCategory) return INITIAL_STATE;
  const variant = initialVariant ?? CATEGORY_DEFAULT_VARIANT[initialCategory];
  return {
    ...INITIAL_STATE,
    view:     "workspace",
    category: initialCategory,
    variant,
    engraving: ENGRAVING_DEFAULTS[variantEngravingGroup(variant)],
  };
}

export interface CustomiserActions {
  save:  () => void;
  reset: () => void;
  buy:   () => Promise<void>;
  remix: () => void;
}

interface CustomiserExperienceProps {
  initialCategory?: ProductCategory;
  initialVariant?:  ProductVariant;
  onBack?:          () => void;
  exiting?:         boolean;
  /** Measured height of fixed left stack (info/play + pills) — clears sidebar under chrome. */
  leftChromeStackPx?: number;
  /** Set by App when the user clicks “remix” — epoch change triggers a full state swap. */
  remixSignal?:     { preset: RemixPreset; epoch: number } | null;
  /** Fires when the user clicks remix in the sidebar. */
  onRemix?:         () => void;
  /** Called once on mount with stable save/reset wrappers; called with null on unmount. */
  onRegisterActions?: (actions: CustomiserActions | null) => void;
  /** Fires when the save/export async operation starts (true) and finishes (false). */
  onSavingChange?: (saving: boolean) => void;
  /** Fires whenever the active variant changes (toolbar, remix) — lets App keep mobile pills in sync. */
  onVariantChange?: (variant: ProductVariant | null) => void;
}

export default function CustomiserExperience({
  initialCategory,
  initialVariant,
  onBack,
  exiting = false,
  leftChromeStackPx = 30,
  remixSignal = null,
  onRemix,
  onRegisterActions,
  onSavingChange,
  onVariantChange,
}: CustomiserExperienceProps) {
  const [state, setState] = useState<CustomiserState>(() => buildInitialState(initialCategory, initialVariant));
  const [isGenerating, setIsGenerating] = useState(false);

  // Notify parent (App → SiteHeader) when save state changes
  useEffect(() => { onSavingChange?.(isGenerating); }, [isGenerating, onSavingChange]);

  // Notify parent whenever variant changes (toolbar, remix) so mobile pills stay in sync
  useEffect(() => { onVariantChange?.(state.variant); }, [state.variant, onVariantChange]);

  const [cameraResetSignal, setCameraResetSignal] = useState(0);

  // Reset rotation to default when variant changes — mobile only
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) {
      setCameraResetSignal((n) => n + 1);
    }
  }, [state.variant]);

  // 5ms pulse — noticeable but subtle on supported devices; silently no-ops elsewhere.
  const haptic = useCallback(() => { navigator.vibrate?.(5); }, []);

  // ── Mobile bottom tab bar + floating panels ──────────────────────────────
  type MobileTab = "jewellery" | "variant" | "gemstone" | "engraving" | "metal" | "size";
  const [activeTab, setActiveTab] = useState<MobileTab | null>(null);
  // For slide-down exit: keep the panel mounted during close animation
  const [renderedTab, setRenderedTab] = useState<MobileTab | null>(null);
  const [panelExiting, setPanelExiting] = useState(false);
  const panelExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closePanel = useCallback(() => {
    if (!renderedTab) return;
    setPanelExiting(true);
    panelExitTimerRef.current = setTimeout(() => {
      setRenderedTab(null);
      setPanelExiting(false);
    }, 300);
  }, [renderedTab]);

  // Sync activeTab → renderedTab, handling open/switch/close
  useEffect(() => {
    if (panelExitTimerRef.current) {
      clearTimeout(panelExitTimerRef.current);
      panelExitTimerRef.current = null;
    }
    if (activeTab) {
      setPanelExiting(false);
      setRenderedTab(activeTab);
    } else {
      closePanel();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggleTab = useCallback((tab: MobileTab) => {
    haptic();
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, [haptic]);

  // Imperative handle for three-angle camera captures
  const captureHandleRef = useRef<SceneCanvasHandle | null>(null);

  // Fade-in on mount
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /** OOB toast: tap to hide; any engraving text change or variant switch shows it again if still OOB */
  const [oobBannerDismissed, setOobBannerDismissed] = useState(false);
  useEffect(() => {
    setOobBannerDismissed(false);
  }, [
    state.engraving.text,
    state.engravingLeft.text,
    state.engravingRight.text,
    state.variant,
  ]);

  const handleCaptureReady = useCallback((handle: SceneCanvasHandle | null) => {
    captureHandleRef.current = handle;
  }, []);

  // ── Reset the current piece customisation without changing product or variant ─
  const resetAll = useCallback(() => {
    haptic();
    setState((prev) => ({
      ...prev,
      engraving:        ENGRAVING_DEFAULTS[variantEngravingGroup(prev.variant ?? "ringClassic")],
      engravingLeft:    ENGRAVING_DEFAULTS_EARRING.earringLeft,
      engravingRight:   ENGRAVING_DEFAULTS_EARRING.earringRight,
      finish:           "shiny",
      gemstone:         "white-cz",
      gemPosition:      { x: 0, y: 0 },
      gemPositionLeft:  EARRING_GEM_POSITION_DEFAULT,
      gemPositionRight: EARRING_GEM_POSITION_DEFAULT,
      ringSize:         "M",
    }));
  }, [haptic]);

  const enterWorkspace = useCallback(() => {
    setState((prev) => ({ ...prev, view: "workspace" }));
  }, []);

  const setVariant = useCallback((category: ProductCategory, variant: ProductVariant) => {
    haptic();
    setState((prev) => ({
      ...prev,
      category,
      variant,
      engraving:      ENGRAVING_DEFAULTS[variantEngravingGroup(variant)],
      engravingLeft:  ENGRAVING_DEFAULTS_EARRING.earringLeft,
      engravingRight: ENGRAVING_DEFAULTS_EARRING.earringRight,
      gemstone:         "white-cz",
      gemPosition:      { x: 0, y: 0 },
      gemPositionLeft:  EARRING_GEM_POSITION_DEFAULT,
      gemPositionRight: EARRING_GEM_POSITION_DEFAULT,
      ringSize:         "M",
    }));
  }, [haptic]);

  const setRingSize = useCallback((ringSize: UKRingSize) => {
    setState((prev) => ({ ...prev, ringSize }));
  }, []);

  const setEngraving = useCallback((engraving: EngravingParams) => {
    setState((prev) => ({ ...prev, engraving }));
  }, []);

  const setEngravingLeft = useCallback((engravingLeft: EngravingParams) => {
    setState((prev) => ({ ...prev, engravingLeft }));
  }, []);

  const setEngravingRight = useCallback((engravingRight: EngravingParams) => {
    setState((prev) => ({ ...prev, engravingRight }));
  }, []);

  // Engraving-only remix — picks a random preset for the current product, applies text + position only.
  // Last index tracked per variant so the same preset is never shown twice in a row.
  const lastEngravingIdxRef = useRef<Record<string, number>>({});

  const handleEngravingRemix = useCallback(() => {
    const variant = state.variant;
    if (!variant) return;
    const matching = REMIX_PRESETS.filter((p) => p.variant === variant);
    if (matching.length === 0) return;

    const lastIdx = lastEngravingIdxRef.current[variant] ?? -1;
    let idx: number;
    if (matching.length === 1) {
      idx = 0;
    } else {
      do { idx = Math.floor(Math.random() * matching.length); }
      while (idx === lastIdx);
    }
    lastEngravingIdxRef.current[variant] = idx;
    const p = matching[idx];

    if (variant === "earrings") {
      setState((prev) => ({
        ...prev,
        engravingLeft:    p.engravingLeft    ? { ...prev.engravingLeft,  ...p.engravingLeft  } : prev.engravingLeft,
        engravingRight:   p.engravingRight   ? { ...prev.engravingRight, ...p.engravingRight } : prev.engravingRight,
        gemPositionLeft:  p.gemPositionLeft  ?? prev.gemPositionLeft,
        gemPositionRight: p.gemPositionRight ?? prev.gemPositionRight,
      }));
    } else if (p.engraving) {
      setState((prev) => ({
        ...prev,
        engraving: { ...prev.engraving, ...p.engraving },
        ...(variantUsesGemColour(variant) && { gemstone: pickRandomGemstoneId(prev.gemstone ?? undefined) }),
      }));
    }
    haptic();
  }, [state.variant, haptic]);

  const setFinish = useCallback((finish: FinishType) => {
    haptic();
    setState((prev) => ({ ...prev, finish }));
  }, [haptic]);

  const setGemstone = useCallback((gemstone: GemstoneId) => {
    setState((prev) => ({ ...prev, gemstone }));
  }, []);

  const setGemPosition = useCallback((gemPosition: GemPosition) => {
    setState((prev) => ({ ...prev, gemPosition }));
  }, []);

  const setGemPositionLeft = useCallback((gemPositionLeft: GemPosition) => {
    setState((prev) => ({ ...prev, gemPositionLeft }));
  }, []);

  const setGemPositionRight = useCallback((gemPositionRight: GemPosition) => {
    setState((prev) => ({ ...prev, gemPositionRight }));
  }, []);

  const isEarrings = state.variant === "earrings";
  const isRing     = variantIsRing(state.variant);
  const isPendant  = variantIsPendant(state.variant);
  /** BarSlider: ring #d9d9d9 / pendant #b1b1b1 / earrings #8d8d8d fill on #ffffff rail */
  const sliderTrackMode = isRing ? "ring" : isPendant ? "pendant" : "default";

  // Main engraving texture — ring/pendant group, null for earrings
  const engravingTextures = useEngravingTexture(
    state.engraving,
    state.variant && !isEarrings ? variantEngravingGroup(state.variant) : null,
    state.finish,
    undefined,
    undefined,
    state.variant,
  );

  // Per-earring textures
  const earringLeftTextures = useEngravingTexture(
    state.engravingLeft,
    isEarrings ? "earringLeft" : null,
    state.finish,
    undefined,
    "engraving-left-earring.png",
  );

  const earringRightTextures = useEngravingTexture(
    state.engravingRight,
    isEarrings ? "earringRight" : null,
    state.finish,
    undefined,
    "engraving-right-earring.png",
  );

  // Combined out-of-bounds flag for the preview overlay
  const anyOutOfBounds = isEarrings
    ? ((earringLeftTextures?.isOutOfBounds ?? false) || (earringRightTextures?.isOutOfBounds ?? false))
    : (engravingTextures?.isOutOfBounds ?? false);

  const handleExportSpec = useCallback(async () => {
    if (isGenerating) return;
    haptic();
    setIsGenerating(true);

    try {
      let heroFrontView: string | null = null;
      let renderViews: { front: string; left: string; right: string } | null = null;
      if (captureHandleRef.current) {
        heroFrontView = await captureHandleRef.current.captureHeroFront();
        renderViews = await captureHandleRef.current.captureAngles();
      }

      const bumpCanvas      = isEarrings
        ? (earringLeftTextures?.bumpCanvas  ?? null)
        : (engravingTextures?.bumpCanvas    ?? null);
      const bumpCanvasRight = isEarrings
        ? (earringRightTextures?.bumpCanvas ?? null)
        : undefined;

      const variant     = state.variant;
      const engTarget   = isEarrings ? "earringLeft" as const
                        : variant?.startsWith("pendant") ? "pendant" as const
                        : "ring" as const;
      const { w, h }    = CANVAS_SIZE[engTarget];
      const canvasLabel = `${engTarget} (${w}×${h})`;

      const engraving   = isEarrings ? state.engravingLeft : state.engraving;

      await exportSpecSheet({
        variant,
        heroFrontView,
        finish:            state.finish,
        gemstoneLabel:
          variant && productUsesGemstone(variant) && state.gemstone
            ? (getGemstone(state.gemstone)?.label ?? null)
            : null,
        ringSize:          isRing ? (state.ringSize ?? null) : null,
        engravingText:     engraving.text,
        engravingOffsetX:  engraving.offsetX,
        engravingOffsetY:  engraving.offsetY,
        engravingFontSize: engraving.fontSize,
        engravingRotation: engraving.rotation,
        engravingSpacing:  engraving.lineSpacing,
        engravingRightText:     isEarrings ? state.engravingRight.text         : undefined,
        engravingRightOffsetX:  isEarrings ? state.engravingRight.offsetX      : undefined,
        engravingRightOffsetY:  isEarrings ? state.engravingRight.offsetY      : undefined,
        engravingRightFontSize: isEarrings ? state.engravingRight.fontSize     : undefined,
        engravingRightRotation: isEarrings ? state.engravingRight.rotation     : undefined,
        engravingRightSpacing:  isEarrings ? state.engravingRight.lineSpacing  : undefined,
        gemPosition:      !isEarrings ? state.gemPosition      : undefined,
        gemPositionLeft:  isEarrings  ? state.gemPositionLeft  : undefined,
        gemPositionRight: isEarrings  ? state.gemPositionRight : undefined,
        renderViews,
        bumpCanvas,
        bumpCanvasRight,
        canvasTarget: canvasLabel,
      });
    } catch (err) {
      console.error("PDF save failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [
    state, isEarrings, isRing, isGenerating, haptic,
    engravingTextures, earringLeftTextures, earringRightTextures,
  ]);

  const handleBuy = useCallback(async () => {
    // Open the tab immediately while still inside the user gesture — popup blockers
    // kill window.open() called after an await, so we grab the handle first and
    // navigate it once the cart creation is done.
    const winName = `tabi_checkout_${Date.now()}`;
    const win = window.open("about:blank", winName);

    // Write a branded loading page so the customer sees "tabi dsgn" pulsing, not a blank page.
    if (win) {
      const origin = window.location.origin;
      win.document.write(`<!DOCTYPE html><html><head><title>tabi dsgn</title>
        <style>
          @font-face{font-family:"ABC Diatype";src:url("${origin}/fonts/ABCDiatype-Bold.otf") format("opentype");font-weight:500;font-style:normal;font-display:swap}
          @font-face{font-family:"ABC Diatype";src:url("${origin}/fonts/ABCDiatype-Bold.otf") format("opentype");font-weight:700;font-style:normal;font-display:swap}
          body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
          background:#ffffff;font-family:"ABC Diatype",ui-sans-serif,system-ui,sans-serif}
          .brand{font-size:14px;font-weight:500;color:#2a2c2d;letter-spacing:-0.3px;
          text-transform:lowercase;animation:pulse 1.8s ease-in-out infinite}
          @keyframes pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}
        </style>
        </head><body><div class="brand">tabi dsgn</div></body></html>`);
      win.document.close();
    }

    // Step 1: Capture 3D renders, generate spec PDF, and upload it.
    let specPdfUrl: string | null = null;
    try {
      let heroFrontView: string | null = null;
      let renderViews: { front: string; left: string; right: string } | null = null;
      if (captureHandleRef.current) {
        heroFrontView = await captureHandleRef.current.captureHeroFront();
        renderViews   = await captureHandleRef.current.captureAngles();
      }

      const bumpCanvas      = isEarrings ? (earringLeftTextures?.bumpCanvas  ?? null) : (engravingTextures?.bumpCanvas    ?? null);
      const bumpCanvasRight = isEarrings ? (earringRightTextures?.bumpCanvas ?? null) : undefined;
      const variant         = state.variant;
      const engTarget       = isEarrings ? "earringLeft" as const : variant?.startsWith("pendant") ? "pendant" as const : "ring" as const;
      const { w, h }        = CANVAS_SIZE[engTarget];
      const engraving       = isEarrings ? state.engravingLeft : state.engraving;

      const pdfBlob = await exportSpecSheet({
        variant,
        heroFrontView,
        finish:            state.finish,
        gemstoneLabel:     variant && productUsesGemstone(variant) && state.gemstone ? (getGemstone(state.gemstone)?.label ?? null) : null,
        ringSize:          isRing ? (state.ringSize ?? null) : null,
        engravingText:     engraving.text,
        engravingOffsetX:  engraving.offsetX,
        engravingOffsetY:  engraving.offsetY,
        engravingFontSize: engraving.fontSize,
        engravingRotation: engraving.rotation,
        engravingSpacing:  engraving.lineSpacing,
        engravingRightText:     isEarrings ? state.engravingRight.text        : undefined,
        engravingRightOffsetX:  isEarrings ? state.engravingRight.offsetX     : undefined,
        engravingRightOffsetY:  isEarrings ? state.engravingRight.offsetY     : undefined,
        engravingRightFontSize: isEarrings ? state.engravingRight.fontSize    : undefined,
        engravingRightRotation: isEarrings ? state.engravingRight.rotation    : undefined,
        engravingRightSpacing:  isEarrings ? state.engravingRight.lineSpacing : undefined,
        gemPosition:      !isEarrings ? state.gemPosition      : undefined,
        gemPositionLeft:  isEarrings  ? state.gemPositionLeft  : undefined,
        gemPositionRight: isEarrings  ? state.gemPositionRight : undefined,
        renderViews,
        bumpCanvas,
        bumpCanvasRight,
        canvasTarget: `${engTarget} (${w}×${h})`,
        returnBlob: true,
      });
      if (pdfBlob instanceof Blob) {
        const blob = await upload(`specs/spec-${Date.now()}.pdf`, pdfBlob, {
          access: "public",
          handleUploadUrl: "/api/upload-spec",
          contentType: "application/pdf",
        });
        specPdfUrl = blob.url;
      }
    } catch (err) {
      console.error("[buy] Spec upload failed — continuing to checkout:", err);
    }

    // Step 2: Create Shopify cart with spec PDF URL attached.
    const checkoutUrl = await createShopifyCart(state, specPdfUrl);
    if (checkoutUrl && win) {
      win.location.href = checkoutUrl;
    } else {
      const posted = addToCartFormPost(winName, state, specPdfUrl);
      if (!posted && win) win.close();
    }
  }, [state, isEarrings, isRing, engravingTextures, earringLeftTextures, earringRightTextures]);

  // Register stable wrappers with App so header save/reset buttons can call them.
  // Refs always point to the latest version — safe with a mount-only effect.
  const handleExportSpecRef = useRef(handleExportSpec);
  handleExportSpecRef.current = handleExportSpec;
  const resetAllRef = useRef(resetAll);
  resetAllRef.current = resetAll;
  const handleBuyRef = useRef(handleBuy);
  handleBuyRef.current = handleBuy;
  const handleEngravingRemixRef = useRef(handleEngravingRemix);
  handleEngravingRemixRef.current = handleEngravingRemix;
  useEffect(() => {
    onRegisterActions?.({ save: () => handleExportSpecRef.current(), reset: () => resetAllRef.current(), buy: () => handleBuyRef.current(), remix: () => handleEngravingRemixRef.current() });
    return () => { onRegisterActions?.(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply remix preset whenever the signal epoch changes — gem colour is re-rolled
  // so each remix differs from the stone currently on screen (presets only supply layout defaults).
  useEffect(() => {
    if (!remixSignal) return;
    setState((prev) => {
      const next = buildStateFromPreset(remixSignal.preset);
      if (next.variant && variantUsesGemColour(next.variant)) {
        next.gemstone = pickRandomGemstoneId(prev.gemstone ?? undefined);
      }
      return next;
    });
  }, [remixSignal]);

  // Dev helper: call window.__copyRemixPreset() in the browser console to
  // copy the current design as a RemixPreset literal ready to paste into remixPresets.ts
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as Record<string, unknown>).__copyRemixPreset = () => {
      const preset = captureCurrentAsPreset(state);
      if (!preset) { console.warn("[remix] No variant selected"); return; }
      navigator.clipboard.writeText(JSON.stringify(preset, null, 2)).then(() => {
        console.log("[remix] Copied preset to clipboard:\n", JSON.stringify(preset, null, 2));
      });
    };
  }, [state]);

  const toolbarCategory: ProductCategory = state.category ?? "ring";

  // Count visible mobile footer tabs so ring-size chip row can match the strip width exactly
  const visibleTabCount = [
    true, // jewellery always visible
    !!state.category && state.category !== "earrings", // variant (ring/pendant)
    !!state.variant && (isEarrings || (productUsesGemstone(state.variant) && variantUsesGemColour(state.variant))), // gemstone
    !!state.variant, // engraving
    !!state.variant, // metal
    isRing, // size
  ].filter(Boolean).length;

  /** Bumps after chrome height settles (debounced — avoids spamming resync while padding tracks each frame). */
  const [previewLayoutEpoch, setPreviewLayoutEpoch] = useState(0);
  const layoutEpochSkipMountRef = useRef(false);
  useEffect(() => {
    if (!layoutEpochSkipMountRef.current) {
      layoutEpochSkipMountRef.current = true;
      return;
    }
    const id = window.setTimeout(() => {
      setPreviewLayoutEpoch((n) => n + 1);
    }, FLOATING_PANEL_MOTION_MS + 40);
    return () => window.clearTimeout(id);
  }, [leftChromeStackPx]);

  return (
    <div
      className="relative h-dvh w-full transition-opacity duration-500 ease-out"
      style={{ opacity: exiting ? 0 : visible ? 1 : 0 }}
    >

    <StageLayout
      view={state.view}
      startScreen={<StartPrompt onStart={enterWorkspace} />}
      workspace={
        <div className="flex h-full flex-col bg-[#e9e9e9]">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent md:flex-row">
            {/* Desktop sidebar — hidden on mobile */}
            <aside
              id="customiser-sidebar"
              className="hidden md:flex shrink-0 flex-col overflow-hidden bg-[#e9e9e9] h-full w-[275px]"
              style={{ paddingTop: `calc(1rem + ${leftChromeStackPx}px + 30px)` }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                <div className={SIDEBAR_CONTROL_COLUMN}>
                  <ProductSelector
                    selectedCategory={state.category}
                    selectedVariant={state.variant}
                    onSelect={setVariant}
                  />
                  {state.variant && (
                    <>
                    <FinishStep
                      category={state.category}
                      selected={state.finish}
                      onSelect={setFinish}
                    />
                    {isRing && (
                      <RingSizeStep
                        selected={state.ringSize}
                        onSelect={setRingSize}
                      />
                    )}
                    {state.variant && productUsesGemstone(state.variant) && (
                      <GemstoneStep
                        category={state.category}
                        variant={state.variant}
                        selected={state.gemstone}
                        onSelect={setGemstone}
                        gemPosition={state.gemPosition}
                        onGemPositionChange={setGemPosition}
                        sliderTrackMode={sliderTrackMode}
                      />
                    )}
                    <InitialStep
                      category={state.category}
                      variant={state.variant}
                      autoFocusFirstEngraving
                      value={state.engraving}
                      onChange={setEngraving}
                      valueLeft={state.engravingLeft}
                      onChangeLeft={setEngravingLeft}
                      valueRight={state.engravingRight}
                      onChangeRight={setEngravingRight}
                      gemPositionLeft={state.gemPositionLeft}
                      onGemPositionLeftChange={setGemPositionLeft}
                      gemPositionRight={state.gemPositionRight}
                      onGemPositionRightChange={setGemPositionRight}
                      outOfBounds={isEarrings ? false : (engravingTextures?.isOutOfBounds ?? false)}
                      outOfBoundsLeft={isEarrings ? (earringLeftTextures?.isOutOfBounds ?? false) : false}
                      outOfBoundsRight={isEarrings ? (earringRightTextures?.isOutOfBounds ?? false) : false}
                      sliderTrackMode={sliderTrackMode}
                    />
                    <div className={`${SIDEBAR_BUTTON_ROW_2} py-0`}>
                      <button
                        onClick={handleEngravingRemix}
                        className="inline-flex h-[30px] min-w-0 w-full cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none lowercase remix-btn"
                        style={{ ...CHROME_HEADER_FONT }}
                      >
                        <span className="remix-label">remix</span>
                      </button>
                      <VanishButton
                        onClick={resetAll}
                        className={`${customiserToolbarActionPillClass(toolbarCategory, "save")} min-w-0`}
                        style={{ ...CHROME_HEADER_FONT, boxShadow: "none" }}
                      >
                        reset
                      </VanishButton>
                    </div>
                    </>
                  )}
                </div>
              </div>
            </aside>

            {/* ── Mobile backdrop — removed so touch passes through for 3D rotation.
                 Panel closes when user taps the active toolbar button again. ── */}

            {/* ── Mobile floating panel — slides up on open, down on close ── */}
            {renderedTab && (
              <div
                key={renderedTab}
                className="mobile-ui-panel fixed bottom-[calc(30px+16px+env(safe-area-inset-bottom))] left-4 z-30 md:hidden"
                style={{
                  opacity: panelExiting ? 0 : 1,
                  transform: panelExiting ? "translateY(12px)" : "translateY(0)",
                  transition: panelExiting
                    ? "opacity 300ms cubic-bezier(0.76,0,0.24,1), transform 300ms cubic-bezier(0.76,0,0.24,1)"
                    : undefined,
                  animation: !panelExiting ? "mobileTabFadeIn 300ms cubic-bezier(0.76,0,0.24,1) both" : undefined,
                }}
              >
                {renderedTab === "jewellery" && (
                  <ProductSelector
                    selectedCategory={state.category}
                    selectedVariant={state.variant}
                    onSelect={(cat, variant) => { setVariant(cat, variant); if (cat === "earrings") setActiveTab(null); else setActiveTab("variant"); }}
                    showLabel={false}
                    mobileLayout
                    categoriesOnly
                    mobile
                  />
                )}
                {renderedTab === "variant" && state.category && state.category !== "earrings" && (
                  <ProductSelector
                    selectedCategory={state.category}
                    selectedVariant={state.variant}
                    onSelect={setVariant}
                    showLabel={false}
                    mobileLayout
                    variantsOnly
                    mobile
                  />
                )}
                {renderedTab === "gemstone" && state.variant && !isEarrings && productUsesGemstone(state.variant) && (
                  <div style={{ backgroundColor: "#b1b1b1" }}>
                    <GemstoneStep
                      category={state.category}
                      variant={state.variant}
                      selected={state.gemstone}
                      onSelect={setGemstone}
                      gemPosition={state.gemPosition}
                      onGemPositionChange={setGemPosition}
                      sliderTrackMode="mobileEngraving"
                      showLabel={false}
                      singleRow
                      mobile
                    />
                  </div>
                )}
                {renderedTab === "gemstone" && isEarrings && (
                  <div className="flex w-[240px] flex-col gap-0" style={{ backgroundColor: "#b1b1b1" }}>
                    <BarSlider label="Gem L X" value={state.gemPositionLeft.x} min={EARRING_GEM_BOUNDS.minX} max={EARRING_GEM_BOUNDS.maxX} step={0.01} trackMode="mobileEngraving" onChange={(v) => setGemPositionLeft({ ...state.gemPositionLeft, x: v })} />
                    <BarSlider label="Gem L Y" value={state.gemPositionLeft.y} min={EARRING_GEM_BOUNDS.minY} max={EARRING_GEM_BOUNDS.maxY} step={0.01} trackMode="mobileEngraving" onChange={(v) => setGemPositionLeft({ ...state.gemPositionLeft, y: v })} />
                    <BarSlider label="Gem R X" value={state.gemPositionRight.x} min={EARRING_GEM_BOUNDS.minX} max={EARRING_GEM_BOUNDS.maxX} step={0.01} trackMode="mobileEngraving" onChange={(v) => setGemPositionRight({ ...state.gemPositionRight, x: v })} />
                    <BarSlider label="Gem R Y" value={state.gemPositionRight.y} min={EARRING_GEM_BOUNDS.minY} max={EARRING_GEM_BOUNDS.maxY} step={0.01} trackMode="mobileEngraving" onChange={(v) => setGemPositionRight({ ...state.gemPositionRight, y: v })} />
                  </div>
                )}
                {renderedTab === "engraving" && state.variant && (
                  <div style={{ backgroundColor: "#b1b1b1" }}>
                    <InitialStep
                      category={state.category}
                      variant={state.variant}
                      autoFocusFirstEngraving={false}
                      value={state.engraving}
                      onChange={setEngraving}
                      valueLeft={state.engravingLeft}
                      onChangeLeft={setEngravingLeft}
                      valueRight={state.engravingRight}
                      onChangeRight={setEngravingRight}
                      gemPositionLeft={state.gemPositionLeft}
                      onGemPositionLeftChange={setGemPositionLeft}
                      gemPositionRight={state.gemPositionRight}
                      onGemPositionRightChange={setGemPositionRight}
                      outOfBounds={isEarrings ? false : (engravingTextures?.isOutOfBounds ?? false)}
                      outOfBoundsLeft={isEarrings ? (earringLeftTextures?.isOutOfBounds ?? false) : false}
                      outOfBoundsRight={isEarrings ? (earringRightTextures?.isOutOfBounds ?? false) : false}
                      sliderTrackMode="mobileEngraving"
                      slidersFirst
                      compact
                      showLabel={false}
                      hideGemPositionSliders={isEarrings}
                    />
                  </div>
                )}
                {renderedTab === "metal" && state.variant && (
                  <FinishStep
                    category={state.category}
                    selected={state.finish}
                    onSelect={setFinish}
                    showLabel={false}
                    fixedWidth
                    mobile
                  />
                )}

                {renderedTab === "size" && isRing && (
                  <RingSizeStep
                    selected={state.ringSize}
                    onSelect={setRingSize}
                    showLabel={false}
                    mobileLayout
                    mobile
                    mobileRowWidthPx={typeof window !== "undefined" ? Math.min(visibleTabCount * 80, window.innerWidth - 32) : visibleTabCount * 80}
                  />
                )}

              </div>
            )}

            {/* ── Mobile tab bar — fixed bottom, scrollable pill row ── */}
            <div
              className="mobile-ui-footer fixed inset-x-0 bottom-0 z-40 flex items-end gap-0 bg-transparent md:hidden"
              style={{
                paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
                paddingLeft: 16,
                paddingRight: 16,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              } as React.CSSProperties}
            >
              {(
                [
                  { id: "jewellery" as MobileTab, label: "jewellery", bg: "#FFFFFF", show: true },
                  { id: "variant" as MobileTab, label: "type", bg: "#FFFFFF", show: !!state.category && state.category !== "earrings" },
                  { id: "gemstone" as MobileTab, label: "gemstone", bg: "#D9D9D9", show: !!state.variant && (isEarrings || (productUsesGemstone(state.variant) && variantUsesGemColour(state.variant!))) },
                  { id: "engraving" as MobileTab, label: "engraving", bg: "#B1B1B1", show: !!state.variant },
                  { id: "metal" as MobileTab, label: "metal", bg: "#8D8D8D", show: !!state.variant },
                  { id: "size" as MobileTab, label: "ring size", bg: "#676767", show: isRing },
                ] as const
              )
                .filter((t) => t.show)
                .map((t) => (
                  <VanishButton
                    key={t.id}
                    onClick={() => toggleTab(t.id)}
                    className={`inline-flex h-[30px] w-[80px] shrink-0 items-center justify-center border-0 text-[14px] font-bold lowercase shadow-none outline-none text-[#2a2c2d] mobile-btn-hover${/^#d9d9d9$/i.test(t.bg) ? " mobile-btn-hover-d9" : /^#ffffff$/i.test(t.bg) ? " mobile-btn-hover-f" : /^#b1b1b1$/i.test(t.bg) ? " mobile-btn-hover-b1" : ""}`}
                    style={{ ...CHROME_HEADER_FONT, backgroundColor: t.bg, color: "#2a2c2d", ["--btn-bg" as string]: t.bg, ["--btn-color" as string]: "#2a2c2d" }}
                    data-active={activeTab === t.id ? "true" : undefined}
                  >
                    {t.label}
                  </VanishButton>
                ))}
            </div>

            {/* Canvas — pb clears mobile tab bar (30px pill + 16px padding + safe-area); desktop full height */}
            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#e9e9e9] pb-[calc(30px+16px+env(safe-area-inset-bottom))] md:!pb-0">
              <PreviewStage
                variant={state.variant}
                finish={state.finish}
                gemstone={state.gemstone}
                onBuy={handleBuy}
                bumpMap={isEarrings ? (earringLeftTextures?.bumpMap ?? null) : (engravingTextures?.bumpMap ?? null)}
                colorTintMap={isEarrings ? (earringLeftTextures?.colorTintMap ?? null) : (engravingTextures?.colorTintMap ?? null)}
                bumpMapRight={earringRightTextures?.bumpMap ?? null}
                colorTintMapRight={earringRightTextures?.colorTintMap ?? null}
                gemPosition={state.gemPosition}
                gemPositionLeft={state.gemPositionLeft}
                gemPositionRight={state.gemPositionRight}
                onCaptureReady={handleCaptureReady}
                cameraResetSignal={cameraResetSignal}
                previewLayoutEpoch={previewLayoutEpoch}
              />

              {/* Out-of-bounds advisory — bottom centre; tap to dismiss until text or variant changes */}
              {anyOutOfBounds && !isGenerating && !oobBannerDismissed && (
                <div className="pointer-events-none absolute inset-x-0 bottom-24 md:bottom-8 md:right-[220px] z-20 flex justify-center px-4">
                  <button
                    type="button"
                    aria-label="Dismiss safe zone warning"
                    onClick={() => setOobBannerDismissed(true)}
                    className="oob-advisory-pulse flex h-[30px] items-center justify-center border-0 border-transparent bg-[#ffffff] px-4 py-0 text-center lowercase shadow-none outline-none"
                    style={CHROME_HEADER_FONT}
                  >
                    <p className="text-center text-[14px] font-bold tracking-normal text-[#2a2c2d]">
                      Engraving outside safe zone — you can still proceed
                    </p>
                  </button>
                </div>
              )}

              {/* Generating overlay */}
              {isGenerating && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <div className="border-0 bg-[#ffffff] px-5 py-3 shadow-none" style={CHROME_HEADER_FONT}>
                    <p className="text-[14px] font-bold tracking-normal text-[#676767]">
                      Saving PDF…
                    </p>
                    <p className="mt-1 text-[10px] font-bold tracking-normal text-[#676767]">
                      Please do not interact with the canvas
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      }
    />
    </div>
  );
}
