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
