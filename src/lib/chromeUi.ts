import type { CSSProperties } from "react";
import type React from "react";
import type { ProductCategory } from "@/lib/customiser/types";
import { uiFontStyle } from "@/lib/uiFont";

/**
 * COLOUR HIERARCHY
 * Three greyscale levels, each owned by a product category. Left = lightest (homepage header reference):
 *   tabi dsgn (#ffffff) | info (#d9d9d9) | play (#b1b1b1)
 *
 *   Ring     → category row #d9d9d9; subtype + metal + ring size #d9d9d9 · #2a2c2d (selected → #676767 / #ffffff)
 *   Pendant  → category row #b1b1b1; subtype + metal #b1b1b1 · #2a2c2d (selected → #676767 / #ffffff)
 *   Earrings → category row #8d8d8d; metal #8d8d8d · #2a2c2d (selected → #676767 / #ffffff)
 *
 * Customiser aside section labels (jewellery, metal, gemstone header, engraving, …) → #ffffff.
 * BarSlider rail #ffffff; fill ring #d9d9d9 | pendant #b1b1b1 | earrings #8d8d8d. Engraving text fields → #ffffff.
 * Toolbar buttons: hover + active → #676767 surface, #ffffff label (`customiserToolbarInvertInteraction`).
 * Customiser sidebar reset/export row → ring #d9d9d9 | pendant #b1b1b1 | earrings #8d8d8d (text #2a2c2d).
 *
 * Text is always #2a2c2d on the lighter surface, flipping to #ffffff on hover/selection
 * (inverted surface #676767). Earrings use the same invert surface with #ffffff label when selected.
 */

/** Header / chrome label colour (top bar, product strip) */
export const CHROME_GREY = "#2a2c2d";

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
/** Top fixed chrome (SiteHeader) — white base; info / play / menu override with !bg-* */
export const CHROME_TOP_PILL_BASE =
  "inline-flex h-[30px] cursor-pointer items-center justify-center border-0 bg-[#ffffff] px-3 text-[14px] font-bold shadow-none outline-none";

/**
 * Customiser sidebar buttons only — swap to dark surface + light label on hover / press.
 * `enabled:` so disabled controls (e.g. export while busy) do not invert.
 */
export const customiserToolbarInvertInteraction = "mobile-btn-hover";

/**
 * Use with `mobile-btn-hover` so hover / active / focus / selected label colours match surface
 * (desktop + mobile header + customiser pills).
 */
export function mobileBtnHoverSurfaceModifier(bg: string | undefined | null): string {
  const raw = bg?.trim();
  if (!raw) return "";
  const u = raw.toUpperCase().replace(/^#/, "");
  if (u === "FFFFFF" || u === "FFF") return " mobile-btn-hover-f";
  if (u === "D9D9D9") return " mobile-btn-hover-d9";
  if (u === "B1B1B1") return " mobile-btn-hover-b1";
  return "";
}

/** Selected state is handled via `data-active` + CSS / inline styles — no extra class needed. */
export const customiserToolbarSelectedInvert = "";


// ─── Mobile pill/chip class builders ─────────────────────────────────────────
// Same visual appearance as desktop idle/selected but with no hover or active
// colour transitions. Used exclusively in md:hidden mobile panel renders.

const RING_CTRL_PILL_MOBILE =
  `inline-flex h-[30px] cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none lowercase mobile-btn-hover`;

// Mobile pill/chip base classes — NO bg/color classes; colours set via inline style
// so that CSS var(--btn-bg)/var(--btn-color) can lock :active without fighting !important.
export const ringJewelleryVariantPillDefaultMobile  = `${RING_CTRL_PILL_MOBILE} min-w-0 w-full max-w-full truncate`;
export const ringJewelleryVariantPillSelectedMobile = `${RING_CTRL_PILL_MOBILE} min-w-0 w-full max-w-full truncate`;
export const pendantJewelleryVariantPillDefaultMobile  = `${RING_CTRL_PILL_MOBILE} min-w-0 w-full max-w-full truncate`;
export const pendantJewelleryVariantPillSelectedMobile = `${RING_CTRL_PILL_MOBILE} min-w-0 w-full max-w-full truncate`;
export const ringMetalFinishPillDefaultMobile  = RING_CTRL_PILL_MOBILE;
export const ringMetalFinishPillSelectedMobile = RING_CTRL_PILL_MOBILE;
export const pendantMetalFinishPillDefaultMobile  = RING_CTRL_PILL_MOBILE;
export const pendantMetalFinishPillSelectedMobile = RING_CTRL_PILL_MOBILE;
export const earringMetalFinishPillDefaultMobile  = RING_CTRL_PILL_MOBILE;
export const earringMetalFinishPillSelectedMobile = RING_CTRL_PILL_MOBILE;

const RING_CTRL_CHIP_MOBILE =
  `inline-flex h-[30px] min-w-[30px] cursor-pointer items-center justify-center border-0 px-1.5 text-[12px] font-bold shadow-none outline-none lowercase bg-[#ffffff] chip-hover`;

export const ringSizeChipDefaultMobile  = `${RING_CTRL_CHIP_MOBILE} !text-[12.5px]`;
export const ringSizeChipSelectedMobile = `${RING_CTRL_CHIP_MOBILE} !text-[12.5px] !bg-[#d9d9d9]`;
export const ringGemSwatchChipDefaultMobile  = RING_CTRL_CHIP_MOBILE;
export const ringGemSwatchChipSelectedMobile = `${RING_CTRL_CHIP_MOBILE} !bg-[#d9d9d9]`;
export const pendantGemSwatchChipDefaultMobile  = RING_CTRL_CHIP_MOBILE;
export const pendantGemSwatchChipSelectedMobile = `${RING_CTRL_CHIP_MOBILE} !bg-[#d9d9d9]`;

// Mobile colours — returned as inline style objects so they beat any CSS class
export const MOBILE_BTN_COLOURS = {
  ring:     { bg: "#ffffff", color: "#2a2c2d" },
  pendant:  { bg: "#d9d9d9", color: "#2a2c2d" },
  earrings: { bg: "#b1b1b1", color: "#2a2c2d" },
  generic:  { bg: "#ffffff", color: "#2a2c2d" },
} as const;

export function mobileBtnStyle(bg: string, color: string): React.CSSProperties {
  return { backgroundColor: bg, color, ["--btn-bg" as string]: bg, ["--btn-color" as string]: color, ["--chip-bg" as string]: bg };
}

// Mobile category pill — no bg/color classes, colours via inline style
export function categoryPillClassMobile(_category: ProductCategory, _isSelected: boolean): string {
  return `${RING_CTRL_PILL_MOBILE} min-w-0 w-full max-w-full`;
}
export function categoryPillStyleMobile(category: ProductCategory, _isSelected: boolean): React.CSSProperties {
  switch (category) {
    case "ring":     return mobileBtnStyle("#ffffff", "#2a2c2d");
    case "pendant":  return mobileBtnStyle("#d9d9d9", "#2a2c2d");
    case "earrings": return mobileBtnStyle("#b1b1b1", "#2a2c2d");
  }
}

/** Reset / save (PDF) — equal halves of 240px chip grid (parent: grid-cols-2 max-w-[240px]). */
const CUSTOMISER_TOOLBAR_ACTION_PILL_BASE =
  `inline-flex h-[30px] min-w-0 w-full cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none lowercase text-[#2a2c2d] ${customiserToolbarInvertInteraction}`;

/** Reset / save — fixed desktop colours: reset #d9d9d9, save #b1b1b1 */
export function customiserToolbarActionPillClass(category: ProductCategory, action?: "reset" | "save"): string {
  if (action === "reset") return `${CUSTOMISER_TOOLBAR_ACTION_PILL_BASE} !bg-[#8d8d8d]`;
  if (action === "save")  return `${CUSTOMISER_TOOLBAR_ACTION_PILL_BASE} !bg-[#676767]`;
  // fallback (mobile or unknown)
  switch (category) {
    case "ring":     return `${CUSTOMISER_TOOLBAR_ACTION_PILL_BASE} !bg-[#d9d9d9]`;
    case "pendant":  return `${CUSTOMISER_TOOLBAR_ACTION_PILL_BASE} !bg-[#b1b1b1]`;
    case "earrings": return `${CUSTOMISER_TOOLBAR_ACTION_PILL_BASE} !bg-[#8d8d8d]`;
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

/** Shared 30px control row (ring subtype, metal finish). */
const RING_CTRL_PILL =
  `inline-flex h-[30px] cursor-pointer items-center justify-center border-0 px-3 text-[14px] font-bold shadow-none outline-none lowercase ${customiserToolbarInvertInteraction}`;

/** Ring — jewellery subtype; width from parent grid (240px ÷ 4). */
const RING_JEWELLERY_VARIANT_PILL =
  `${RING_CTRL_PILL} min-w-0 w-full max-w-full truncate !text-[#2a2c2d]`;

export const ringJewelleryVariantPillDefault = RING_JEWELLERY_VARIANT_PILL;

export const ringJewelleryVariantPillSelected =
  `${RING_CTRL_PILL} min-w-0 w-full max-w-full truncate`;

/** Ring — metal finish; bg set via inline style on desktop, mobileBtnStyle on mobile */
const RING_METAL_FINISH_PILL =
  `${RING_CTRL_PILL} !text-[#2a2c2d]`;

export const ringMetalFinishPillDefault = RING_METAL_FINISH_PILL;

export const ringMetalFinishPillSelected = RING_CTRL_PILL;

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
  `inline-flex h-[30px] min-w-[30px] cursor-pointer items-center justify-center border-0 px-1.5 text-[12px] font-bold shadow-none outline-none lowercase chip-hover`;

/** Ring — UK size letters at 12.5px */
export const ringSizeChipDefault  = `${RING_CTRL_CHIP} !text-[12.5px] bg-[#ffffff]`;
export const ringSizeChipSelected = `${RING_CTRL_CHIP} !text-[12.5px] bg-[#d9d9d9]`;

/** Ring — gem swatch outer; inner square keeps gem colour */
export const ringGemSwatchChipDefault  = `${RING_CTRL_CHIP} bg-[#ffffff] !text-[#2a2c2d]`;
export const ringGemSwatchChipSelected = `${RING_CTRL_CHIP} bg-[#d9d9d9] !text-[#2a2c2d]`;

/** Pendant — gem swatch outer (#ffffff) */
const PENDANT_GEM_SWATCH_CHIP =
  `${RING_CTRL_CHIP} bg-[#ffffff] text-[#2a2c2d]`;

/** Pendant — jewellery subtype; width from parent grid (240px ÷ 3). */
const PENDANT_JEWELLERY_VARIANT_PILL =
  `${RING_CTRL_PILL} min-w-0 w-full max-w-full truncate !text-[#2a2c2d]`;

export const pendantJewelleryVariantPillDefault = PENDANT_JEWELLERY_VARIANT_PILL;

export const pendantJewelleryVariantPillSelected =
  `${RING_CTRL_PILL} min-w-0 w-full max-w-full truncate`;

/** Pendant — metal finish; selected state matches until selection styling is defined */
const PENDANT_METAL_FINISH_PILL =
  `${RING_CTRL_PILL} !text-[#2a2c2d]`;

export const pendantMetalFinishPillDefault = PENDANT_METAL_FINISH_PILL;

export const pendantMetalFinishPillSelected = RING_CTRL_PILL;

/** Pendant — gemstone swatch selected (dark frame around gem colour) */
export const pendantGemSwatchChipSelected =
  `${RING_CTRL_CHIP} bg-[#d9d9d9]`;

/** Earrings — metal finish; selected state matches until selection styling is defined */
const EARRING_METAL_FINISH_PILL =
  `${RING_CTRL_PILL} !text-[#2a2c2d]`;

export const earringMetalFinishPillDefault = EARRING_METAL_FINISH_PILL;

export const earringMetalFinishPillSelected = RING_CTRL_PILL;

/** Wider CTA pill (start screen) */
export const chromePillCta = `${chromePillInactive} !px-6`;

/** Square / compact chrome chip (ring sizes, gemstone swatches) */
export const chromeChipInactive =
  `inline-flex h-[30px] min-w-[30px] cursor-pointer items-center justify-center border-0 bg-[#ffffff] px-1.5 text-[12px] font-bold text-[#2a2c2d] shadow-none outline-none lowercase chip-hover`;

/** Pendant customiser — gem swatch idle */
export const chromeChipInactivePendant = PENDANT_GEM_SWATCH_CHIP;

/** Shared layout for 30px section label chips (background + width set per use). */
const STEP_LABEL_BOX_CORE =
  "flex h-[30px] shrink-0 items-center justify-center border-0 px-3 text-center text-[14px] leading-none lowercase text-[#2a2c2d] tracking-normal shadow-none outline-none";

const STEP_LABEL_WIDTH_STANDARD = "w-[80px] max-w-full";
const STEP_LABEL_WIDTH_METAL_FINISH = "w-[135px] max-w-full";
const STEP_LABEL_WIDTH_EARRING = "w-[120px] max-w-full";

export type StepLabelWidthMode = "standard" | "metalFinish" | "earring";

/** Customiser aside section label chip (jewellery, metal, engraving, …). */
export const stepLabelBoxClass = `${STEP_LABEL_BOX_CORE} ${STEP_LABEL_WIDTH_STANDARD} bg-[#ffffff]`;

/** Section title row — always white; category kept for call-site consistency / future use. */
export function stepLabelClassForCategory(
  _category: ProductCategory | null,
  widthMode: StepLabelWidthMode = "standard",
): string {
  const w =
    widthMode === "metalFinish" ? STEP_LABEL_WIDTH_METAL_FINISH
    : widthMode === "earring"   ? STEP_LABEL_WIDTH_EARRING
    : STEP_LABEL_WIDTH_STANDARD;
  return `${STEP_LABEL_BOX_CORE} ${w} bg-[#ffffff]`;
}

/** Step section titles (pendant default) — prefer stepLabelClassForCategory when category is known. */
export const stepLabelClass = stepLabelBoxClass;
