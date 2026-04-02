export type ProductCategory = "ring" | "pendant" | "earrings";

export type ProductVariant =
  | "ringClassic"
  | "ringConcave"
  | "ringClassicNoGem"
  | "ringConcaveNoGem"
  | "pendantOne"
  | "pendantTwo"
  | "pendantMesmo"
  | "earrings";

/** Checkout / summary: no configurable centre stone for these */
export function productUsesGemstone(variant: ProductVariant | null): boolean {
  if (variant === null) return false;
  if (variant === "earrings") return false;
  if (variant === "ringClassicNoGem" || variant === "ringConcaveNoGem") return false;
  return true;
}

export type EngravingGroup = "ring" | "pendant";

export function variantCategory(variant: ProductVariant): ProductCategory {
  if (variant === "earrings") return "earrings";
  if (variant.startsWith("ring")) return "ring";
  return "pendant";
}

export function variantEngravingGroup(variant: ProductVariant): EngravingGroup {
  if (variant.startsWith("pendant")) return "pendant";
  return "ring";
}

/** Gemstone colour picker — not for earrings or pieces with no centre stone */
export function variantUsesGemColour(variant: ProductVariant): boolean {
  return variant !== "earrings" && productUsesGemstone(variant);
}

/** Only the single concave ring gets Gem X/Y position sliders */
export function variantHasGemSliders(variant: ProductVariant): boolean {
  return variant === "ringConcave";
}

export interface EngravingParams {
  text:        string;
  offsetX:     number; // -0.5 … 0.5 (fraction of canvas width)
  offsetY:     number; // -0.5 … 0.5 (fraction of canvas height)
  fontSize:    number; // fraction of canvas height, e.g. 0.25
  rotation:    number; // degrees
  lineSpacing: number; // line-height multiplier, e.g. 1.2
}

export type GemstoneId =
  | "garnet"
  | "topaz"
  | "citrine"
  | "peridot"
  | "white-cz"
  | "smoky-quartz"
  | "green-quartz"
  | "amethyst"
  | "pink-tourmaline"
  | "hessonite";

export type FinishType = "shiny" | "matte";

export const UK_RING_SIZES = ['F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] as const;
export type UKRingSize = typeof UK_RING_SIZES[number];

export function variantIsRing(variant: ProductVariant | null): boolean {
  return (
    variant === "ringClassic"
    || variant === "ringConcave"
    || variant === "ringClassicNoGem"
    || variant === "ringConcaveNoGem"
  );
}

export function variantIsPendant(variant: ProductVariant | null): boolean {
  return variant !== null && variant !== "earrings" && variant.startsWith("pendant");
}

export type AppView = "start" | "workspace";

export interface GemPosition { x: number; y: number; }

export interface GemBounds {
  minX: number; maxX: number;
  minY: number; maxY: number;
}

/** Only ringConcave has gem position sliders
 *  X maps to Y-axis rotation (orbit around band) — range -0.4…0.4 keeps gem on front half
 *  Y maps to vertical translate along the band */
export const CONCAVE_GEM_BOUNDS: GemBounds = {
  minX: -1, maxX: 1,
  minY: -0.45, maxY: 0.45,
};

/** Per-earring gem position slider bounds */
export const EARRING_GEM_BOUNDS: GemBounds = {
  minX: -0.75, maxX: 0.75,
  minY: -0.2, maxY: 5.7,
};

export interface CustomiserState {
  view:              AppView;
  category:          ProductCategory | null;
  variant:           ProductVariant | null;
  engraving:         EngravingParams;
  engravingLeft:     EngravingParams;
  engravingRight:    EngravingParams;
  gemstone:          GemstoneId | null;
  finish:            FinishType | null;
  gemPosition:       GemPosition;
  gemPositionLeft:   GemPosition;
  gemPositionRight:  GemPosition;
  ringSize:          UKRingSize | null;
}

// ─── Per-variant engraving slider configuration ───────────────────────────────
// Single source of truth for all slider ranges and default values.
// spacing: null means the spacing slider is hidden entirely (earrings).

export interface EngravingSliderRange {
  min:     number;
  max:     number;
  default: number;
}

export interface EngravingSliderConfig {
  posX:    EngravingSliderRange;
  posY:    EngravingSliderRange;
  size:    EngravingSliderRange;
  spacing: EngravingSliderRange | null;
}

export const ENGRAVING_SLIDER_CONFIG: Record<ProductVariant, EngravingSliderConfig> = {
  ringClassic: {
    posX:    { min: -0.4, max: 0.4, default: 0.04 }, // 55% of range
    posY:    { min: -0.4, max: 0.4, default: 0.0  }, // 50%
    size:    { min: 0.2,  max: 1.2, default: 0.7  }, // 50%
    spacing: { min: 0.3,  max: 0.7, default: 0.6  },
  },
  ringConcave: {
    posX:    { min: -0.4, max: 0.4, default: 0.04 }, // 55%
    posY:    { min: -0.4, max: 0.4, default: 0.0  }, // 50%
    size:    { min: 0.2,  max: 1.2, default: 0.7  }, // 50%
    spacing: { min: 0.3,  max: 0.7, default: 0.6  },
  },
  pendantOne: {
    posX:    { min: -0.4, max: 0.4, default: 0.08 }, // 60%
    posY:    { min: -0.4, max: 0.4, default: 0.0  }, // 50%
    size:    { min: 0.2,  max: 0.92, default: 0.56 }, // 50%
    spacing: { min: 0.3,  max: 0.7, default: 0.6  },
  },
  pendantTwo: {
    posX:    { min: -0.4, max: 0.4, default: 0.08 }, // 60%
    posY:    { min: -0.4, max: 0.4, default: 0.0  }, // 50%
    size:    { min: 0.2,  max: 0.92, default: 0.56 }, // 50%
    spacing: { min: 0.3,  max: 0.7, default: 0.6  },
  },
  ringClassicNoGem: {
    posX:    { min: -0.4, max: 0.4, default: 0.04 },
    posY:    { min: -0.4, max: 0.4, default: 0.0  },
    size:    { min: 0.2,  max: 1.2, default: 0.7  },
    spacing: { min: 0.3,  max: 0.7, default: 0.6  },
  },
  ringConcaveNoGem: {
    posX:    { min: -0.4, max: 0.4, default: 0.04 },
    posY:    { min: -0.4, max: 0.4, default: 0.0  },
    size:    { min: 0.2,  max: 1.2, default: 0.7  },
    spacing: { min: 0.3,  max: 0.7, default: 0.6  },
  },
  pendantMesmo: {
    posX:    { min: -0.4, max: 0.4, default: 0.08 },
    posY:    { min: -0.4, max: 0.4, default: 0.0  },
    size:    { min: 0.2,  max: 0.92, default: 0.56 },
    spacing: { min: 0.3,  max: 0.7, default: 0.6  },
  },
  earrings: {
    posX:    { min: -0.3, max: 0.3, default: 0.0 },
    posY:    { min: -0.4, max: 0.2, default: 0.0 },
    size:    { min: 0.1,  max: 0.4, default: 0.25 },
    spacing: null,
  },
};

// ─── Engraving defaults (derived from slider config) ─────────────────────────

export const ENGRAVING_DEFAULTS: Record<EngravingGroup, EngravingParams> = {
  ring: {
    text:        "",
    offsetX:     ENGRAVING_SLIDER_CONFIG.ringClassic.posX.default,
    offsetY:     ENGRAVING_SLIDER_CONFIG.ringClassic.posY.default,
    fontSize:    ENGRAVING_SLIDER_CONFIG.ringClassic.size.default,
    rotation:    -180,
    lineSpacing: ENGRAVING_SLIDER_CONFIG.ringClassic.spacing!.default,
  },
  pendant: {
    text:        "",
    offsetX:     ENGRAVING_SLIDER_CONFIG.pendantOne.posX.default,
    offsetY:     ENGRAVING_SLIDER_CONFIG.pendantOne.posY.default,
    fontSize:    ENGRAVING_SLIDER_CONFIG.pendantOne.size.default,
    rotation:    -180,
    lineSpacing: ENGRAVING_SLIDER_CONFIG.pendantOne.spacing!.default,
  },
};

export const ENGRAVING_DEFAULTS_EARRING: Record<"earringLeft" | "earringRight", EngravingParams> = {
  // posX 53%, posY 52%, size 50% of earring slider ranges
  earringLeft: {
    text:        "",
    offsetX:      0.018,  // 53% of -0.3…0.3
    offsetY:     -0.088,  // 52% of -0.4…0.2
    fontSize:     0.25,   // 50% of 0.1…0.4
    rotation:    -90,
    lineSpacing:  1.0,
  },
  // posX 47%, posY 45%, size 43% of earring slider ranges
  earringRight: {
    text:        "",
    offsetX:     -0.018,  // 47% of -0.3…0.3
    offsetY:     -0.13,   // 45% of -0.4…0.2
    fontSize:     0.229,  // 43% of 0.1…0.4
    rotation:     90,
    lineSpacing:  1.0,
  },
};

// Earring gem position defaults — gemX 50%, gemY 3% of EARRING_GEM_BOUNDS ranges
export const EARRING_GEM_POSITION_DEFAULT: GemPosition = { x: 0, y: -0.023 };

export const DEFAULT_ENGRAVING: EngravingParams = ENGRAVING_DEFAULTS.ring;

export const INITIAL_STATE: CustomiserState = {
  view:           "start",
  category:       null,
  variant:        null,
  engraving:      ENGRAVING_DEFAULTS.ring,
  engravingLeft:  ENGRAVING_DEFAULTS_EARRING.earringLeft,
  engravingRight: ENGRAVING_DEFAULTS_EARRING.earringRight,
  gemstone:          "white-cz",
  finish:            "shiny",
  gemPosition:       { x: 0, y: 0 },
  gemPositionLeft:   EARRING_GEM_POSITION_DEFAULT,
  gemPositionRight:  EARRING_GEM_POSITION_DEFAULT,
  ringSize:          "M",
};

/** Default workspace state for Ring Classic — used by resetAll() */
export const RESET_STATE: CustomiserState = {
  view:           "workspace",
  category:       "ring",
  variant:        "ringClassic",
  engraving:      ENGRAVING_DEFAULTS.ring,
  engravingLeft:  ENGRAVING_DEFAULTS_EARRING.earringLeft,
  engravingRight: ENGRAVING_DEFAULTS_EARRING.earringRight,
  gemstone:          "white-cz",
  finish:            "shiny",
  gemPosition:       { x: 0, y: 0 },
  gemPositionLeft:   EARRING_GEM_POSITION_DEFAULT,
  gemPositionRight:  EARRING_GEM_POSITION_DEFAULT,
  ringSize:          "M",
};
