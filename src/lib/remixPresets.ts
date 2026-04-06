import type {
  CustomiserState,
  ProductVariant,
  GemstoneId,
  FinishType,
  UKRingSize,
  EngravingParams,
  GemPosition,
} from "@/lib/customiser/types";
import {
  ENGRAVING_DEFAULTS,
  ENGRAVING_DEFAULTS_EARRING,
  EARRING_GEM_POSITION_DEFAULT,
  variantCategory,
  variantEngravingGroup,
  variantUsesGemColour,
} from "@/lib/customiser/types";
import { buildShowcasePieces, SHOWCASE_REMIX_GEMS } from "@/components/homepage/showcaseConfig";

export interface RemixPreset {
  id:               string;
  variant:          ProductVariant;
  finish:           FinishType;
  gemstone?:        GemstoneId;
  gemPosition?:     GemPosition;
  gemPositionLeft?: GemPosition;
  gemPositionRight?:GemPosition;
  engraving?:       EngravingParams;
  engravingLeft?:   EngravingParams;
  engravingRight?:  EngravingParams;
  ringSize?:        UKRingSize;
}

/** Convert a preset into a full CustomiserState ready to apply. */
export function buildStateFromPreset(preset: RemixPreset): CustomiserState {
  const category = variantCategory(preset.variant);
  const engGroup  = variantEngravingGroup(preset.variant);
  return {
    view:              "workspace",
    category,
    variant:           preset.variant,
    engraving:         preset.engraving        ?? ENGRAVING_DEFAULTS[engGroup],
    engravingLeft:     preset.engravingLeft    ?? ENGRAVING_DEFAULTS_EARRING.earringLeft,
    engravingRight:    preset.engravingRight   ?? ENGRAVING_DEFAULTS_EARRING.earringRight,
    gemstone:          preset.gemstone         ?? "white-cz",
    finish:            preset.finish,
    gemPosition:       preset.gemPosition      ?? { x: 0, y: 0 },
    gemPositionLeft:   preset.gemPositionLeft  ?? EARRING_GEM_POSITION_DEFAULT,
    gemPositionRight:  preset.gemPositionRight ?? EARRING_GEM_POSITION_DEFAULT,
    ringSize:          preset.ringSize         ?? "M",
  };
}

/**
 * Dev helper — call window.__copyRemixPreset() in the browser console while
 * in the customiser to copy the current state as a RemixPreset literal.
 * Paste the result directly into REMIX_PRESETS below.
 */
export function captureCurrentAsPreset(state: CustomiserState): RemixPreset | null {
  if (!state.variant) return null;
  return {
    id:               `preset-${state.variant}-${Date.now()}`,
    variant:          state.variant,
    finish:           state.finish   ?? "shiny",
    ...(state.gemstone  != null && { gemstone: state.gemstone }),
    gemPosition:      state.gemPosition,
    gemPositionLeft:  state.gemPositionLeft,
    gemPositionRight: state.gemPositionRight,
    engraving:        state.engraving,
    engravingLeft:    state.engravingLeft,
    engravingRight:   state.engravingRight,
    ...(state.ringSize  != null && { ringSize: state.ringSize }),
  };
}

// ─── Remix pool ────────────────────────────────────────────────────────────────
// Same designs as the homepage `buildShowcasePieces` (engraving, finish, gem positions).
// Gem colours use `SHOWCASE_REMIX_GEMS` — homepage still randomises per visit.

function remixPresetsFromShowcase(): RemixPreset[] {
  return buildShowcasePieces(SHOWCASE_REMIX_GEMS).map((piece) => {
    if (piece.variant === "earrings") {
      return {
        id:               piece.id,
        variant:          piece.variant,
        finish:           piece.finish,
        engravingLeft:    piece.engraving,
        engravingRight:   piece.engravingRight!,
        gemPositionLeft:  piece.gemPositionLeft ?? EARRING_GEM_POSITION_DEFAULT,
        gemPositionRight: piece.gemPositionRight ?? EARRING_GEM_POSITION_DEFAULT,
      };
    }

    const preset: RemixPreset = {
      id:        piece.id,
      variant:   piece.variant,
      finish:    piece.finish,
      engraving: piece.engraving,
    };
    if (variantUsesGemColour(piece.variant)) {
      preset.gemstone = piece.gemstone;
    }
    if (piece.gemPosition) {
      preset.gemPosition = piece.gemPosition;
    }
    return preset;
  });
}

// ─── Engraving-only remix presets ─────────────────────────────────────────────
// Keyed by ProductVariant. Each entry lists 5 engraving designs scoped to the
// piece's safe zone. Remix cycles these without touching finish, stone, or gem position.

export interface EngravingRemixPreset {
  text:        string;
  offsetX:     number;
  offsetY:     number;
  fontSize:    number;
  lineSpacing: number;
  // Earrings only:
  leftText?:   string;
  rightText?:  string;
}

export const ENGRAVING_REMIX_PRESETS: Partial<Record<string, EngravingRemixPreset[]>> = {
  ringClassic: [
    { text: "amor",     offsetX:  0.00, offsetY:  0.00, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "forever",  offsetX: -0.016, offsetY: 0.016, fontSize: 0.45, lineSpacing: 0.6 },
    { text: "moi",      offsetX:  0.04, offsetY:  0.00, fontSize: 0.65, lineSpacing: 0.6 },
    { text: "sempre",   offsetX:  0.00, offsetY: -0.016, fontSize: 0.50, lineSpacing: 0.6 },
    { text: "toujours", offsetX: -0.032, offsetY: 0.016, fontSize: 0.40, lineSpacing: 0.6 },
  ],
  ringClassicNoGem: [
    { text: "amor",     offsetX:  0.00, offsetY:  0.00, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "forever",  offsetX: -0.016, offsetY: 0.016, fontSize: 0.45, lineSpacing: 0.6 },
    { text: "moi",      offsetX:  0.04, offsetY:  0.00, fontSize: 0.65, lineSpacing: 0.6 },
    { text: "sempre",   offsetX:  0.00, offsetY: -0.016, fontSize: 0.50, lineSpacing: 0.6 },
    { text: "toujours", offsetX: -0.032, offsetY: 0.016, fontSize: 0.40, lineSpacing: 0.6 },
  ],
  ringConcave: [
    { text: "luna",   offsetX:  0.00, offsetY:  0.00, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "étoile", offsetX: -0.016, offsetY: 0.00, fontSize: 0.50, lineSpacing: 0.6 },
    { text: "soir",   offsetX:  0.016, offsetY: 0.016, fontSize: 0.60, lineSpacing: 0.6 },
    { text: "nuit",   offsetX:  0.00, offsetY: -0.016, fontSize: 0.65, lineSpacing: 0.6 },
    { text: "ciel",   offsetX:  0.032, offsetY:  0.00, fontSize: 0.58, lineSpacing: 0.6 },
  ],
  ringConcaveNoGem: [
    { text: "luna",   offsetX:  0.00, offsetY:  0.00, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "étoile", offsetX: -0.016, offsetY: 0.00, fontSize: 0.50, lineSpacing: 0.6 },
    { text: "soir",   offsetX:  0.016, offsetY: 0.016, fontSize: 0.60, lineSpacing: 0.6 },
    { text: "nuit",   offsetX:  0.00, offsetY: -0.016, fontSize: 0.65, lineSpacing: 0.6 },
    { text: "ciel",   offsetX:  0.032, offsetY:  0.00, fontSize: 0.58, lineSpacing: 0.6 },
  ],
  pendantOne: [
    { text: "âme",     offsetX: 0.08, offsetY:  0.00, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "lumière", offsetX: 0.064, offsetY: 0.016, fontSize: 0.45, lineSpacing: 0.6 },
    { text: "grace",   offsetX: 0.08, offsetY:  0.00, fontSize: 0.50, lineSpacing: 0.6 },
    { text: "bloom",   offsetX: 0.096, offsetY:-0.016, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "divine",  offsetX: 0.064, offsetY: 0.016, fontSize: 0.48, lineSpacing: 0.6 },
  ],
  pendantTwo: [
    { text: "âme",     offsetX: 0.08, offsetY:  0.00, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "lumière", offsetX: 0.064, offsetY: 0.016, fontSize: 0.45, lineSpacing: 0.6 },
    { text: "grace",   offsetX: 0.08, offsetY:  0.00, fontSize: 0.50, lineSpacing: 0.6 },
    { text: "bloom",   offsetX: 0.096, offsetY:-0.016, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "divine",  offsetX: 0.064, offsetY: 0.016, fontSize: 0.48, lineSpacing: 0.6 },
  ],
  pendantMesmo: [
    { text: "doux",    offsetX: 0.08, offsetY:  0.00, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "soie",    offsetX: 0.064, offsetY: 0.00, fontSize: 0.60, lineSpacing: 0.6 },
    { text: "velours", offsetX: 0.048, offsetY: 0.016, fontSize: 0.45, lineSpacing: 0.6 },
    { text: "perle",   offsetX: 0.08, offsetY: -0.016, fontSize: 0.55, lineSpacing: 0.6 },
    { text: "nacre",   offsetX: 0.096, offsetY: 0.00, fontSize: 0.50, lineSpacing: 0.6 },
  ],
  earrings: [
    { text: "",  leftText: "oui",  rightText: "non",  offsetX: 0.00, offsetY:  0.00, fontSize: 0.25, lineSpacing: 0.6 },
    { text: "",  leftText: "sol",  rightText: "luna", offsetX: 0.00, offsetY: -0.016, fontSize: 0.28, lineSpacing: 0.6 },
    { text: "",  leftText: "jour", rightText: "nuit", offsetX: 0.00, offsetY:  0.016, fontSize: 0.22, lineSpacing: 0.6 },
    { text: "",  leftText: "toi",  rightText: "moi",  offsetX: 0.00, offsetY:  0.00, fontSize: 0.30, lineSpacing: 0.6 },
    { text: "",  leftText: "or",   rightText: "feu",  offsetX: 0.00, offsetY: -0.016, fontSize: 0.28, lineSpacing: 0.6 },
  ],
};

export const REMIX_PRESETS: RemixPreset[] = [
  ...remixPresetsFromShowcase(),
  {
    id:      "preset-ringConcaveNoGem-loves-me",
    variant: "ringConcaveNoGem",
    finish:  "matte",
    engraving: {
      text: [
        "she loves me, she loves me not",
        "she loves me, she loves me not",
        "she loves me, she loves me not",
        "she loves me, she loves me not",
        "she loves me, she loves me not",
      ].join("\n"),
      offsetX:     0.008,  // 51% of -0.4…0.4
      offsetY:     0.0,    // 50% of -0.4…0.4
      fontSize:    0.32,   // 12% of 0.2…1.2
      rotation:    -180,
      lineSpacing: 0.452,  // 38% of 0.3…0.7
    },
  },
  {
    id:      "preset-ringClassicNoGem-angel-of-mine",
    variant: "ringClassicNoGem",
    finish:  "shiny",
    engraving: {
      text:        "Angel\nof mine",
      offsetX:      0.024,  // 53% of -0.4…0.4
      offsetY:      0.032,  // 54% of -0.4…0.4
      fontSize:     0.61,   // 41% of 0.2…1.2
      rotation:    -180,
      lineSpacing:  0.552,  // 63% of 0.3…0.7
    },
  },
];
