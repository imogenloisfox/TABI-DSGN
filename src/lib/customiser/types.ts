export type ProductCategory = "ring" | "pendant" | "earrings";

export type ProductVariant =
  | "ringClassic"
  | "ringConcave"
  | "ringConcaveTriple"
  | "pendantClassic"
  | "pendantLowSet"
  | "earrings";

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

/** All non-earring variants show the gemstone colour picker */
export function variantUsesGemColour(variant: ProductVariant): boolean {
  return variant !== "earrings";
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
}

export const ENGRAVING_DEFAULTS: Record<EngravingGroup, EngravingParams> = {
  ring:    { text: "", offsetX: 0.02, offsetY:  0.00, fontSize: 0.80, rotation: -180, lineSpacing: 1.0 },
  pendant: { text: "", offsetX: 0.05, offsetY:  0.00, fontSize: 0.75, rotation: -180, lineSpacing: 1.0 },
};

export const ENGRAVING_DEFAULTS_EARRING: Record<"earringLeft" | "earringRight", EngravingParams> = {
  earringLeft:  { text: "", offsetX: 0.00, offsetY: -0.15, fontSize: 0.28, rotation:  90, lineSpacing: 1.0 },
  earringRight: { text: "", offsetX: 0.00, offsetY: -0.15, fontSize: 0.28, rotation: -90, lineSpacing: 1.0 },
};

export const DEFAULT_ENGRAVING: EngravingParams = ENGRAVING_DEFAULTS.ring;

export const INITIAL_STATE: CustomiserState = {
  view:           "start",
  category:       null,
  variant:        null,
  engraving:      ENGRAVING_DEFAULTS.ring,
  engravingLeft:  ENGRAVING_DEFAULTS_EARRING.earringLeft,
  engravingRight: ENGRAVING_DEFAULTS_EARRING.earringRight,
  gemstone:          "white-cz",
  finish:            null,
  gemPosition:       { x: 0, y: 0 },
  gemPositionLeft:   { x: 0, y: 0 },
  gemPositionRight:  { x: 0, y: 0 },
};
