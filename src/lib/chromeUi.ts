import type { CSSProperties } from "react";
import type { ProductCategory } from "@/lib/customiser/types";
import { uiFontStyle } from "@/lib/uiFont";

/**
 * COLOUR HIERARCHY
 * Three greyscale levels, each owned by a product category. Left = lightest (homepage header reference):
 *   tabi dsgn (#ffffff) | info (#d9d9d9) | play (#b1b1b1)
 *
 *   Ring     → category row #d9d9d9; subtype + metal + ring size #d9d9d9 · #2a2c2d (selected → #7a7a7a / #ffffff)
 *   Pendant  → category row #b1b1b1; subtype + metal #b1b1b1 · #2a2c2d (selected → #7a7a7a / #ffffff)
 *   Earrings → category row #8d8d8d; metal #8d8d8d · #2a2c2d (selected → #7a7a7a / #ffffff)
 *
 * Customiser aside section labels (jewellery, metal, gemstone header, engraving, …) → #ffffff.
 * BarSlider rail #ffffff; fill ring #d9d9d9 | pendant #b1b1b1 | earrings #8d8d8d. Engraving text fields → #ffffff.
 * Toolbar buttons: hover + active → #7a7a7a surface, #ffffff label (`customiserToolbarInvertInteraction`).
 * Customiser sidebar reset/export row → ring #d9d9d9 | pendant #b1b1b1 | earrings #8d8d8d (text #2a2c2d).
 *
 * Text is always #2a2c2d on the lighter surface, flipping to #ffffff on hover/selection
 * (inverted surface #7a7a7a). Earrings use the same invert surface with #ffffff label when selected.
 */

/** Header / chrome label colour (top bar, product strip) */
export const CHROME_GREY = "#2a2c2d";
export const CHROME_IVORY = "#fffff0";

/** ABC Diatype bold — chrome pills (info, play, product strip, customiser controls) */
export const CHROME_HEADER_FONT: CSSProperties = {
  ...uiFontStyle,
  fontWeight: 700,
};

/** ABC Diatype regular (weight only); size comes from Tailwind (e.g. stepLabelClass 14px rows). */
export const CHROME_LABEL_FONT: CSSProperties = {
  ...uiFontStyle,
  fontWeight: 400,
};

/**
 * Base 30px chrome pill (white background). Pair with chromePillInactive / chromePillActive
 * or override background for one-off cases.
 */
export const CHROME_BTN_BASE =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 bg-[#ffffff] px-3 text-[14px] font-bold shadow-none outline-none";

/** Top fixed chrome (SiteHeader) — white base; info / play / menu override with !bg-* */
export const CHROME_TOP_PILL_BASE =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 bg-[#ffffff] px-3 text-[14px] font-bold shadow-none outline-none";

/**
 * Customiser sidebar buttons only — swap to dark surface + light label on hover / press.
 * `enabled:` so disabled controls (e.g. export while busy) do not invert.
 */
export const customiserToolbarInvertInteraction =
  "transition-[color,background-color] duration-150 ease-out enabled:hover:!bg-[#7a7a7a] enabled:hover:!text-[#ffffff] enabled:active:!bg-[#7a7a7a] enabled:active:!text-[#ffffff]";

/**
 * Stays inverted after click until another option is chosen — same colours as hover,
 * but pinned so the active tool stays obvious.
 */
export const customiserToolbarSelectedInvert =
  "transition-[color,background-color] duration-150 ease-out !bg-[#7a7a7a] !text-[#ffffff] enabled:hover:!bg-[#7a7a7a] enabled:hover:!text-[#ffffff] enabled:active:!bg-[#7a7a7a] enabled:active:!text-[#ffffff]";

/** Reset / save (PDF) — equal halves of 240px chip grid (parent: grid-cols-2 max-w-[240px]). */
const CUSTOMISER_TOOLBAR_ACTION_PILL_BASE =
  `inline-flex h-[30px] min-w-0 w-full cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none lowercase text-[#2a2c2d] ${customiserToolbarInvertInteraction}`;

/** Reset / save — background matches active jewellery category */
export function customiserToolbarActionPillClass(category: ProductCategory): string {
  switch (category) {
    case "ring":
      return `${CUSTOMISER_TOOLBAR_ACTION_PILL_BASE} !bg-[#d9d9d9]`;
    case "pendant":
      return `${CUSTOMISER_TOOLBAR_ACTION_PILL_BASE} !bg-[#b1b1b1]`;
    case "earrings":
      return `${CUSTOMISER_TOOLBAR_ACTION_PILL_BASE} !bg-[#8d8d8d]`;
  }
}

/**
 * Preview footer price pill — always white (matches top chrome pills).
 */
export function categoryPreviewPricePillBgClass(_category: ProductCategory | null): string {
  return "!bg-[#ffffff]";
}

export const chromePillInactive =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 bg-[#d9d9d9] px-3 text-[14px] font-bold shadow-none outline-none text-[#2a2c2d] lowercase";

/** Ring sidebar — ring-row chrome (matches category “ring” pill surface). */
export const chromePillInactiveRing =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 bg-[#d9d9d9] px-3 text-[14px] font-bold shadow-none outline-none text-[#2a2c2d] lowercase";

/** Shared 30px control row (ring subtype, metal finish). */
const RING_CTRL_PILL =
  `inline-flex h-[30px] cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none lowercase ${customiserToolbarInvertInteraction}`;

/** Ring — jewellery subtype; width from parent grid (240px ÷ 4). */
const RING_JEWELLERY_VARIANT_PILL =
  `${RING_CTRL_PILL} min-w-0 w-full max-w-full truncate !bg-[#d9d9d9] !text-[#2a2c2d]`;

export const ringJewelleryVariantPillDefault = RING_JEWELLERY_VARIANT_PILL;

export const ringJewelleryVariantPillSelected =
  `${RING_CTRL_PILL} min-w-0 w-full max-w-full truncate ${customiserToolbarSelectedInvert}`;

/** Ring — metal finish; selected state matches until selection styling is defined */
const RING_METAL_FINISH_PILL =
  `${RING_CTRL_PILL} !bg-[#d9d9d9] !text-[#2a2c2d]`;

export const ringMetalFinishPillDefault = RING_METAL_FINISH_PILL;

export const ringMetalFinishPillSelected =
  `${RING_CTRL_PILL} ${customiserToolbarSelectedInvert}`;

/**
 * Customiser aside: inner column max 240px — same width as 8×30px ring size / gem swatch rows.
 * Use SIDEBAR_BUTTON_ROW_* for pill rows so buttons share that width exactly.
 */
export const SIDEBAR_CONTROL_COLUMN = "w-full max-w-[240px]";

/** Full-width grid row aligned to chip grid (240px cap). */
export const SIDEBAR_BUTTON_ROW_2 = "grid w-full max-w-[240px] grid-cols-2 gap-0";
export const SIDEBAR_BUTTON_ROW_3 = "grid w-full max-w-[240px] grid-cols-3 gap-0";
export const SIDEBAR_BUTTON_ROW_4 = "grid w-full max-w-[240px] grid-cols-4 gap-0";

/** 30×30 chips — gem swatches at 12px; ring size letters at 12.5px (RING_SIZE_CHIP). */
const RING_CTRL_CHIP =
  `inline-flex h-[30px] min-w-[30px] cursor-pointer items-center justify-center border-0 px-1.5 text-[12px] font-bold shadow-none outline-none lowercase ${customiserToolbarInvertInteraction}`;

/** Ring — UK size letters at 12.5px */
const RING_SIZE_CHIP =
  `${RING_CTRL_CHIP} !text-[12.5px] !bg-[#d9d9d9] !text-[#2a2c2d]`;

export const ringSizeChipDefault = RING_SIZE_CHIP;

export const ringSizeChipSelected =
  `${RING_CTRL_CHIP} !text-[12.5px] ${customiserToolbarSelectedInvert}`;

/** Ring — gem swatch outer (#d9d9d9); inner square keeps gem colour */
const RING_GEM_SWATCH_CHIP =
  `${RING_CTRL_CHIP} !bg-[#d9d9d9] text-[#2a2c2d]`;

export const ringGemSwatchChipDefault = RING_GEM_SWATCH_CHIP;

export const ringGemSwatchChipSelected =
  `${RING_CTRL_CHIP} ${customiserToolbarSelectedInvert}`;

/** Pendant — gem swatch outer (#b1b1b1) */
const PENDANT_GEM_SWATCH_CHIP =
  `${RING_CTRL_CHIP} !bg-[#b1b1b1] text-[#2a2c2d]`;

/** Pendant — jewellery subtype; width from parent grid (240px ÷ 3). */
const PENDANT_JEWELLERY_VARIANT_PILL =
  `${RING_CTRL_PILL} min-w-0 w-full max-w-full truncate !bg-[#b1b1b1] !text-[#2a2c2d]`;

export const pendantJewelleryVariantPillDefault = PENDANT_JEWELLERY_VARIANT_PILL;

export const pendantJewelleryVariantPillSelected =
  `${RING_CTRL_PILL} min-w-0 w-full max-w-full truncate ${customiserToolbarSelectedInvert}`;

/** Pendant — metal finish; selected state matches until selection styling is defined */
const PENDANT_METAL_FINISH_PILL =
  `${RING_CTRL_PILL} !bg-[#b1b1b1] !text-[#2a2c2d]`;

export const pendantMetalFinishPillDefault = PENDANT_METAL_FINISH_PILL;

export const pendantMetalFinishPillSelected =
  `${RING_CTRL_PILL} ${customiserToolbarSelectedInvert}`;

/** Pendant — gemstone swatch selected (dark frame around gem colour) */
export const pendantGemSwatchChipSelected =
  `${RING_CTRL_CHIP} ${customiserToolbarSelectedInvert}`;

export const chromePillActive =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none !bg-[#b1b1b1] text-[#ffffff] lowercase";

/** Earrings — legacy pill (category “earrings” row unchanged separately) */
export const chromePillInactiveEarring =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 bg-[#b1b1b1] px-3 text-[14px] font-bold shadow-none outline-none text-[#2a2c2d] lowercase";

/** Earrings — metal finish; selected state matches until selection styling is defined */
const EARRING_METAL_FINISH_PILL =
  `${RING_CTRL_PILL} !bg-[#8d8d8d] !text-[#2a2c2d]`;

export const earringMetalFinishPillDefault = EARRING_METAL_FINISH_PILL;

export const earringMetalFinishPillSelected =
  `${RING_CTRL_PILL} ${customiserToolbarSelectedInvert}`;

/** Wider CTA pill (start screen) */
export const chromePillCta = `${chromePillInactive} !px-6`;

/** Square / compact chrome chip (ring sizes, gemstone swatches) */
export const chromeChipInactive =
  `inline-flex h-[30px] min-w-[30px] cursor-pointer items-center justify-center border-0 bg-[#ffffff] px-1.5 text-[12px] font-bold text-[#2a2c2d] shadow-none outline-none lowercase ${customiserToolbarInvertInteraction}`;

/** Pendant customiser — gem swatch idle */
export const chromeChipInactivePendant = PENDANT_GEM_SWATCH_CHIP;

export const chromeChipActive =
  "inline-flex h-[30px] min-w-[30px] cursor-pointer items-center justify-center border-0 px-1.5 text-[12px] font-bold shadow-none outline-none !bg-[#7a7a7a] text-[#ffffff] lowercase";

/** Shared layout for 30px section label chips (background + width set per use). */
const STEP_LABEL_BOX_CORE =
  "flex h-[30px] shrink-0 items-center justify-center border-0 px-3 text-center text-[14px] leading-none lowercase text-[#2a2c2d] tracking-normal shadow-none outline-none";

const STEP_LABEL_WIDTH_STANDARD = "w-[80px] max-w-full";
const STEP_LABEL_WIDTH_METAL_FINISH = "w-[135px] max-w-full";

export type StepLabelWidthMode = "standard" | "metalFinish" | "earring";

/** Customiser aside section label chip (jewellery, metal, engraving, …). */
export const stepLabelBoxClass = `${STEP_LABEL_BOX_CORE} ${STEP_LABEL_WIDTH_STANDARD} bg-[#ffffff]`;

/** Section title row — always white; category kept for call-site consistency / future use. */
export function stepLabelClassForCategory(
  _category: ProductCategory | null,
  widthMode: StepLabelWidthMode = "standard",
): string {
  const w =
    widthMode === "metalFinish" || widthMode === "earring"
      ? STEP_LABEL_WIDTH_METAL_FINISH
      : STEP_LABEL_WIDTH_STANDARD;
  return `${STEP_LABEL_BOX_CORE} ${w} bg-[#ffffff]`;
}

/** Step section titles (pendant default) — prefer stepLabelClassForCategory when category is known. */
export const stepLabelClass = stepLabelBoxClass;
