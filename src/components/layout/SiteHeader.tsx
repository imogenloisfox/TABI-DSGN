"use client";

import type { RefObject } from "react";
import VanishButton from "@/components/ui/VanishButton";
import LoopParticleText from "@/components/ui/LoopParticleText";
import {
  CHROME_GREY,
  CHROME_HEADER_FONT,
  CHROME_TOP_PILL_BASE,
} from "@/lib/chromeUi";

/** Info / play chrome — invert on hover only (open state stays grey; no :active invert). */
const HEADER_CHROME_HOVER_INVERT = "";

interface SiteHeaderProps {
  infoOpen:       boolean;
  onInfoToggle:   () => void;
  playOpen?:      boolean;
  onPlayToggle?:  () => void;
  /** When false, the play control is hidden (e.g. customiser view). */
  showPlayButton?: boolean;
  onBack?:        () => void;
  /** Customiser: fires with a random preset; shown after info in the chrome row; omit on showcase. */
  onRemix?:          () => void;
  showRemixButton?:  boolean;
  /** Customiser: save and reset action pills — shown in header row on all screen sizes. */
  onSave?:    () => void;
  isSaving?:  boolean;
  onReset?:   () => void;
  /** Mobile customiser: share button in header row */
  onShare?:       () => void;
  shareLabel?:    string;
  shareDisabled?: boolean;
  /** Ref for outside-click detection on mobile share button */
  shareButtonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Left header cluster — TABI DSGN brand + info + play toggles.
 * Product strip lives independently in App.tsx (fixed top-right, never moves).
 */
export default function SiteHeader({
  infoOpen,
  onInfoToggle,
  playOpen = false,
  onPlayToggle,
  showPlayButton = true,
  onBack,
  onRemix,
  showRemixButton = false,
  onSave,
  isSaving = false,
  onReset,
  onShare,
  shareLabel = "share",
  shareDisabled = false,
  shareButtonRef,
}: SiteHeaderProps) {
  const isCustomiser = !!onBack;
  const tabiPill = onBack ? (
    <VanishButton
      onClick={onBack}
      className={`${CHROME_TOP_PILL_BASE} relative z-10 w-[80px] min-w-0 shrink-0 justify-center !bg-white text-[13.9px] tracking-[-0.3px] lowercase mobile-btn-hover mobile-btn-hover-f ${HEADER_CHROME_HOVER_INVERT}`}
      style={{ ...CHROME_HEADER_FONT, color: CHROME_GREY, fontSize: "13.9px" }}
    >
      tabi dsgn
    </VanishButton>
  ) : (
    <span
      className={`${CHROME_TOP_PILL_BASE} flex w-[80px] min-w-0 shrink-0 cursor-default items-center justify-center text-[13.9px] tracking-[-0.3px] select-none lowercase`}
      style={{ ...CHROME_HEADER_FONT, color: CHROME_GREY, boxShadow: "none", fontSize: "13.9px" }}
    >
      tabi dsgn
    </span>
  );

  return (
    <div className="flex items-start gap-0">
      <div className="shrink-0 self-start">
        {tabiPill}
      </div>

      {/* Pill row — scrolls horizontally on mobile if all pills don't fit */}
      <div className="flex items-center gap-0 self-start overflow-x-auto whitespace-nowrap">
        {/* Info — hidden on mobile when in customiser */}
        <VanishButton
          onClick={onInfoToggle}
          aria-expanded={infoOpen}
          aria-controls="site-info-columns"
          className={`${isCustomiser ? "hidden md:flex" : "flex"} ${CHROME_TOP_PILL_BASE} relative z-10 w-[80px] shrink-0 overflow-visible normal-case lowercase !bg-[#d9d9d9] text-[#2a2c2d] mobile-btn-hover mobile-btn-hover-d9 ${HEADER_CHROME_HOVER_INVERT}`}
          style={{ ...CHROME_HEADER_FONT }}
        >
          info
        </VanishButton>

        {/* Mobile customiser order: remix → reset → save → share */}
        {showRemixButton && onRemix ? (
          <button
            onClick={onRemix}
            className={`flex md:hidden ${CHROME_TOP_PILL_BASE} relative z-10 w-[80px] shrink-0 justify-center overflow-visible normal-case lowercase !bg-[#d9d9d9] !text-[#2a2c2d] mobile-btn-hover mobile-btn-hover-d9`}
            style={{ ...CHROME_HEADER_FONT }}
          >
            remix
          </button>
        ) : null}

        {onReset ? (
          <VanishButton
            onClick={onReset}
            className={`flex md:hidden ${CHROME_TOP_PILL_BASE} relative z-10 w-[80px] shrink-0 justify-center overflow-visible normal-case lowercase !bg-[#b1b1b1] !text-[#2a2c2d] mobile-btn-hover mobile-btn-hover-b1 ${HEADER_CHROME_HOVER_INVERT}`}
            style={{ ...CHROME_HEADER_FONT }}
          >
            reset
          </VanishButton>
        ) : null}

        {onSave ? (
          <>
            {/* Desktop save — #b1b1b1 */}
            <VanishButton
              onClick={onSave}
              disabled={isSaving}
              className={`hidden md:flex ${CHROME_TOP_PILL_BASE} relative z-10 w-[80px] shrink-0 justify-center overflow-visible normal-case lowercase !bg-[#b1b1b1] !text-[#2a2c2d] disabled:cursor-wait disabled:opacity-50 mobile-btn-hover mobile-btn-hover-b1 ${HEADER_CHROME_HOVER_INVERT}`}
              style={{ ...CHROME_HEADER_FONT }}
            >
              {isSaving ? "saving…" : "save"}
            </VanishButton>
            {/* Mobile save — #8d8d8d in customiser, #b1b1b1 otherwise */}
            <VanishButton
              onClick={onSave}
              disabled={isSaving}
              className={`flex md:hidden ${CHROME_TOP_PILL_BASE} relative z-10 w-[80px] shrink-0 justify-center overflow-visible normal-case lowercase !text-[#2a2c2d] disabled:cursor-wait disabled:opacity-50 mobile-btn-hover ${HEADER_CHROME_HOVER_INVERT}`}
              style={{ ...CHROME_HEADER_FONT, backgroundColor: isCustomiser ? "#8d8d8d" : "#b1b1b1" }}
            >
              {isSaving ? "saving…" : "save"}
            </VanishButton>
          </>
        ) : null}

        {/* Mobile customiser: share in header row */}
        {onShare ? (
          <button
            ref={shareButtonRef}
            type="button"
            onClick={onShare}
            disabled={shareDisabled}
            className={`flex md:hidden ${CHROME_TOP_PILL_BASE} relative z-10 w-[80px] shrink-0 justify-center overflow-visible normal-case lowercase !text-[#2a2c2d] mobile-btn-hover mobile-btn-hover-dark`}
            style={{ ...CHROME_HEADER_FONT, backgroundColor: "#676767" }}
          >
            {shareLabel}
          </button>
        ) : null}

        {showPlayButton && onPlayToggle ? (
          <VanishButton
            onClick={onPlayToggle}
            aria-expanded={playOpen}
            aria-controls="site-play-hint"
            className={`hidden md:flex ${CHROME_TOP_PILL_BASE} relative z-10 w-[80px] shrink-0 overflow-visible normal-case lowercase !bg-[#b1b1b1] text-[#2a2c2d] mobile-btn-hover mobile-btn-hover-b1 ${HEADER_CHROME_HOVER_INVERT}`}
            style={{ ...CHROME_HEADER_FONT }}
          >
            play
          </VanishButton>
        ) : null}
      </div>
    </div>
  );
}

/** Product strip — rendered independently at fixed top-right in App.tsx. */
export function ProductStrip() {
  return (
    <div className="inline-flex min-w-0 max-w-full select-none">
      <div className="flex min-w-0 items-stretch">
        <span
          className="flex h-[30px] w-[180px] shrink-0 items-center justify-center bg-[#8d8d8d] px-3 text-center text-[14px] font-bold leading-none lowercase tracking-normal"
          style={{ ...CHROME_HEADER_FONT, color: CHROME_GREY }}
        >
          select a product to start
        </span>
        <LoopParticleText
          words={["engraving", "customising", "designing", "personalising", "building"]}
          wrapperClassName="flex h-[30px] items-center bg-[#777777] px-3"
          className="text-[14px] font-bold leading-none lowercase tracking-normal text-[#e9e9e9]"
          style={{ ...CHROME_HEADER_FONT }}
        />
      </div>
    </div>
  );
}

/**
 * Clears fixed chrome (`top-4` + single 30px pill row, gap-0).
 * Showcase: extra breathing room below pills.
 * Customiser: apply `pt-[calc(1rem+30px)]` on the sidebar only so the preview canvas can use full viewport height.
 */
export const SITE_HEADER_TOP_PAD = "pt-[62px]";
/** Top inset under fixed chrome — use on customiser sidebar; preview column stays full height. */
export const SITE_HEADER_CUSTOMISER_TOP_PAD = "pt-[calc(1rem+30px)]";

export const INFO_SIDEBAR_OPACITY_TRANSITION =
  "transition-opacity duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]";
