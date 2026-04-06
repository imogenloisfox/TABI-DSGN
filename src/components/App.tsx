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
import type { ProductCategory, ProductVariant } from "@/lib/customiser/types";
import type { RemixPreset } from "@/lib/remixPresets";
import HomepageScene from "./homepage/HomepageScene";
import CustomiserExperience from "./customiser/CustomiserExperience";
import SiteHeader, { ProductStrip } from "./layout/SiteHeader";
import InfoColumns from "./ui/InfoColumns";
import PlayHintPanel from "./ui/PlayHintPanel";
import PreviewShopPills from "./preview/PreviewShopPills";
import {
  FLOATING_PANEL_MOTION_MS,
  FLOATING_PANEL_EASING,
} from "@/lib/floatingPanelMotion";

type Panel = "info" | "play";

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

  // Mount immediately on open; keep mounted during close animation, then unmount.
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const id = window.setTimeout(() => setMounted(false), FLOATING_PANEL_MOTION_MS);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Measure whenever content mounts or resizes (font load, wrap, breakpoint) so max-height never clips.
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
      style={{
        maxHeight: isOpen ? contentHeight : 0,
        transition,
      }}
    >
      {mounted && (
        <div ref={contentRef}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Stacks info and play panels; each animates independently so switching is simultaneous. */
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

export default function App() {
  const [view, setView]                         = useState<"showcase" | "customiser">("showcase");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedVariant, setSelectedVariant]   = useState<ProductVariant | null>(null);
  const [transitioning, setTransitioning]       = useState(false);
  const [activePanel, setActivePanel]           = useState<Panel | null>(null);
  const [remixSignal, setRemixSignal]           = useState<{ preset: RemixPreset; epoch: number } | null>(null);
  const lastActionWasRemixRef = useRef(false);
  /** Increment when returning to showcase so homepage re-rolls gems (reliable vs `exiting` edge timing). */
  const [showcaseGemEpoch, setShowcaseGemEpoch] = useState(0);
  const [customiserActions, setCustomiserActions] = useState<CustomiserActions | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [liveVariant, setLiveVariant] = useState<ProductVariant | null>(null);
  const leftGroupRef = useRef<HTMLDivElement>(null);
  const [leftChromeStackPx, setLeftChromeStackPx] = useState(LEFT_CHROME_PILL_ROW_PX);

  // Remove the static HTML loader once React has mounted
  useEffect(() => {
    const loader = document.getElementById("initial-loader");
    if (loader) loader.remove();
  }, []);

  // Hard reload when page is restored from bfcache (back-forward cache) — on
  // mobile Safari this causes a frozen/blank WebGL canvas because the GL context
  // is destroyed but React never reinitialises it. A hard reload restores the
  // full page cleanly.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
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

  // Close on Escape
  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePanel(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  // Close on click outside the left group (panels + buttons)
  useEffect(() => {
    if (!overlayOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (leftGroupRef.current && !leftGroupRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    // Use capture so we catch clicks on the canvas too
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [overlayOpen]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-transparent">

      {/* Right: product strip — desktop only; on mobile the strip overlaps the header pills */}
      <div className="fixed top-4 right-4 z-50 hidden md:block">
        <ProductStrip />
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
          />
        </div>

        {/* Mobile price/buy — inside the flex column so the panel pushes them down naturally */}
        {view === "customiser" && (
          <div className="shrink-0 md:hidden">
            <PreviewShopPills variant={liveVariant} onBuy={customiserActions?.buy} />
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
          onBack={handleBack}
          exiting={transitioning}
          leftChromeStackPx={leftChromeStackPx}
          remixSignal={remixSignal}
          onRemix={handleRemix}
          onRegisterActions={setCustomiserActions}
          onSavingChange={setIsSaving}
          onVariantChange={setLiveVariant}
        />
      )}
    </div>
  );
}
