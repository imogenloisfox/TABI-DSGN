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

  // ── SOI pendant presets ──────────────────────────────────────────────────────
  {
    id:      "preset-pendantOne-G-M",
    variant: "pendantOne",
    finish:  "shiny",
    engraving: {
      text:        "G\n     M",
      offsetX:      0.296,
      offsetY:     -0.056,
      fontSize:     0.502,
      rotation:    -180,
      lineSpacing:  0.5,
    },
  },
  {
    id:      "preset-pendantOne-C-D",
    variant: "pendantOne",
    finish:  "matte",
    engraving: {
      text:        "   C\nD",
      offsetX:      0.216,
      offsetY:     -0.056,
      fontSize:     0.690,
      rotation:    -180,
      lineSpacing:  0.6,
    },
  },
  {
    id:      "preset-pendantOne-Miss-H",
    variant: "pendantOne",
    finish:  "shiny",
    engraving: {
      text:        "Miss\nH",
      offsetX:      0.08,
      offsetY:      0.0,
      fontSize:     0.553,
      rotation:    -180,
      lineSpacing:  0.7,
    },
  },
  {
    id:      "preset-pendantOne-m-q",
    variant: "pendantOne",
    finish:  "matte",
    engraving: {
      text:        "   m\nq",
      offsetX:      0.2,
      offsetY:      0.184,
      fontSize:     0.92,
      rotation:    -180,
      lineSpacing:  0.3,
    },
  },

  // ── MOMENT pendant presets ───────────────────────────────────────────────────
  {
    id:      "preset-pendantTwo-sl33p",
    variant: "pendantTwo",
    finish:  "matte",
    engraving: {
      text:        "sl33p",
      offsetX:      0.032,
      offsetY:      0.032,
      fontSize:     0.567,
      rotation:    -180,
      lineSpacing:  0.6,
    },
  },
  {
    id:      "preset-pendantTwo-9-9-9",
    variant: "pendantTwo",
    finish:  "matte",
    engraving: {
      text:        "9\n 9\n  9",
      offsetX:      0.184,
      offsetY:      0.032,
      fontSize:     0.711,
      rotation:    -180,
      lineSpacing:  0.6,
    },
  },
  {
    id:      "preset-pendantTwo-the-world-is-yours",
    variant: "pendantTwo",
    finish:  "shiny",
    engraving: {
      text:        "The\nWorld\nisYours",
      offsetX:      0.032,
      offsetY:      0.04,
      fontSize:     0.337,
      rotation:    -180,
      lineSpacing:  0.7,
    },
  },
  {
    id:      "preset-pendantTwo-P-X",
    variant: "pendantTwo",
    finish:  "matte",
    engraving: {
      text:        "P\n X",
      offsetX:      0.232,
      offsetY:      0.008,
      fontSize:     0.567,
      rotation:    -180,
      lineSpacing:  0.552,
    },
  },

  // ── MESMO pendant presets ────────────────────────────────────────────────────
  {
    id:      "preset-pendantMesmo-jil",
    variant: "pendantMesmo",
    finish:  "shiny",
    engraving: {
      text:        "jil",
      offsetX:      0.04,
      offsetY:      0.048,
      fontSize:     0.711,
      rotation:    -180,
      lineSpacing:  0.6,
    },
  },
  {
    id:      "preset-pendantMesmo-lucky",
    variant: "pendantMesmo",
    finish:  "matte",
    engraving: {
      text:        "lucky",
      offsetX:      0.056,
      offsetY:      0.032,
      fontSize:     0.618,
      rotation:    -180,
      lineSpacing:  0.6,
    },
  },
  {
    id:      "preset-pendantMesmo-stunt-girl",
    variant: "pendantMesmo",
    finish:  "shiny",
    engraving: {
      text:        "stunt\ngirl",
      offsetX:      0.08,
      offsetY:      0.072,
      fontSize:     0.56,
      rotation:    -180,
      lineSpacing:  0.452,
    },
  },
  {
    id:      "preset-pendantMesmo-F-L",
    variant: "pendantMesmo",
    finish:  "matte",
    engraving: {
      text:        "F\n   L",
      offsetX:      0.264,
      offsetY:     -0.032,
      fontSize:     0.589,
      rotation:    -180,
      lineSpacing:  0.348,
    },
  },

  // ── Ring presets ─────────────────────────────────────────────────────────────
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
