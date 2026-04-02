"use client";

import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,

} from "react";
import type { CustomiserActions } from "./customiser/CustomiserExperience";
import type { ProductCategory, ProductVariant } from "@/lib/customiser/types";
import { REMIX_PRESETS } from "@/lib/remixPresets";
import type { RemixPreset } from "@/lib/remixPresets";
import HomepageScene from "./homepage/HomepageScene";
import CustomiserExperience from "./customiser/CustomiserExperience";
import SiteHeader, { ProductStrip } from "./layout/SiteHeader";
import InfoColumns from "./ui/InfoColumns";
import PlayHintPanel from "./ui/PlayHintPanel";
import {
  FLOATING_PANEL_MOTION_MS,
  FLOATING_PANEL_EASING,
} from "@/lib/floatingPanelMotion";

type Panel = "info" | "play";

/** Site header pill row height — default inset before ResizeObserver runs. */
const LEFT_CHROME_PILL_ROW_PX = 30;

/**
 * Accordion shell — info/play panels share one container; max-height transition
 * drives open/close. All moving elements share the same 0.3s easing so nothing lags.
 */
function FloatingPanels({ panel }: { panel: Panel | null }) {
  const [display, setDisplay] = useState<Panel | null>(panel);

  useEffect(() => {
    if (panel !== null) {
      setDisplay(panel);
      return;
    }
    // Keep DOM mounted during close animation, then unmount
    const id = window.setTimeout(() => setDisplay(null), FLOATING_PANEL_MOTION_MS);
    return () => clearTimeout(id);
  }, [panel]);

  const isOpen = panel !== null;
  const showContent = display !== null;

  const transition = `max-height ${FLOATING_PANEL_MOTION_MS}ms ${FLOATING_PANEL_EASING}`;

  return (
    <div
      className="w-max max-w-full overflow-hidden"
      style={{
        maxHeight: isOpen ? 300 : 0,
        transition,
      }}
      aria-hidden={!isOpen}
    >
      {showContent && (
        <div className="relative w-max max-w-full">
          <div
            id="site-info-columns"
            role="region"
            aria-label="About this tool"
            aria-hidden={display !== "info"}
            className={display === "info" ? "pointer-events-auto" : "hidden"}
          >
            <InfoColumns />
          </div>
          <div
            id="site-play-hint"
            role="region"
            aria-label="How to use the home screen"
            aria-hidden={display !== "play"}
            className={display === "play" ? "pointer-events-auto" : "hidden"}
          >
            <PlayHintPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView]                         = useState<"showcase" | "customiser">("showcase");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedVariant, setSelectedVariant]   = useState<ProductVariant | null>(null);
  const [transitioning, setTransitioning]       = useState(false);
  const [activePanel, setActivePanel]           = useState<Panel | null>(null);
  const [remixSignal, setRemixSignal]           = useState<{ preset: RemixPreset; epoch: number } | null>(null);
  /** Increment when returning to showcase so homepage re-rolls gems (reliable vs `exiting` edge timing). */
  const [showcaseGemEpoch, setShowcaseGemEpoch] = useState(0);
  const [customiserActions, setCustomiserActions] = useState<CustomiserActions | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const leftGroupRef = useRef<HTMLDivElement>(null);
  const [leftChromeStackPx, setLeftChromeStackPx] = useState(LEFT_CHROME_PILL_ROW_PX);

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
    setTransitioning(true);
    setActivePanel(null);
    setTimeout(() => {
      setRemixSignal(null);
      setSelectedCategory(category);
      setSelectedVariant(variant);
      setView("customiser");
      setTransitioning(false);
    }, 550);
  }, [transitioning]);

  const handleBack = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    setActivePanel(null);
    setTimeout(() => {
      setView("showcase");
      setSelectedCategory(null);
      setSelectedVariant(null);
      setRemixSignal(null);
      setShowcaseGemEpoch((e) => e + 1);
      setTransitioning(false);
    }, 550);
  }, [transitioning]);

  const handleRemix = useCallback(() => {
    const currentId = remixSignal?.preset.id;
    const pool = REMIX_PRESETS.length > 1
      ? REMIX_PRESETS.filter((p) => p.id !== currentId)
      : REMIX_PRESETS;
    const preset = pool[Math.floor(Math.random() * pool.length)];
    setRemixSignal((prev) => ({ preset, epoch: (prev?.epoch ?? 0) + 1 }));
  }, [remixSignal]);

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
            onSave={customiserActions?.save}
            isSaving={isSaving}
            onReset={customiserActions?.reset}
          />
        </div>
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
          onRegisterActions={setCustomiserActions}
          onSavingChange={setIsSaving}
        />
      )}
    </div>
  );
}
