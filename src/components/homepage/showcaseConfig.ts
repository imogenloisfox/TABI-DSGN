import { useGLTF } from "@react-three/drei";
import {
  ENGRAVING_SLIDER_CONFIG,
  type ProductCategory,
  type ProductVariant,
  type GemstoneId,
  type FinishType,
  type EngravingParams,
  type GemPosition,
} from "@/lib/customiser/types";
import { GEMSTONES, randomGemstoneIndex } from "@/data/gemstones";

/** Same mapping as BarSlider: percent 0–100 across slider min…max */
function engravingValueAtSliderPercent(
  min: number,
  max: number,
  percent: number,
): number {
  return min + (percent / 100) * (max - min);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShowcasePieceConfig {
  id:       string;
  variant:  ProductVariant;
  scale:    number;
  gemstone: GemstoneId;
  finish:   FinishType;
  // ── Engraving ──────────────────────────────────────────────────────────────
  engraving:       EngravingParams;   // main / left engraving
  engravingRight?: EngravingParams;   // earrings right earring only
  // ── Gem position overrides ─────────────────────────────────────────────────
  gemPosition?:      GemPosition;     // ringConcave gem slot
  gemPositionLeft?:  GemPosition;     // earrings left gem
  gemPositionRight?: GemPosition;     // earrings right gem
  category: ProductCategory;

  // ── Depth ──────────────────────────────────────────────────────────────────
  posZ: number;

  // ── Orbital path — smooth sine/cosine driven, NOT physics ─────────────────
  orbitCenterX: number;   // world-unit zone centre
  orbitCenterY: number;
  orbitRadiusX: number;   // drift extent around centre
  orbitRadiusY: number;
  orbitSpeedX:  number;   // frequency (rad/s) of X path
  orbitSpeedY:  number;
  orbitPhaseX:  number;   // offset so pieces never move in sync
  orbitPhaseY:  number;

  // ── Multi-axis tumble rotation — rate in radians/second ───────────────────
  spinSpeedX: number;
  spinSpeedY: number;
  spinSpeedZ: number;

  /**
   * Extra Euler rotation (radians), added on top of the bounded sine wobble each frame.
   * Use to turn the piece at “spawn” without changing orbit path (unlike orbitPhaseX/Y,
   * which also shift where the piece sits on its orbit).
   */
  spawnRotationX?: number;
  spawnRotationY?: number;
  spawnRotationZ?: number;

  // ── Collision box half-extents (world units) — for soft repulsion & debug viz
  colliderX: number;
  colliderY: number;
  colliderZ: number;
}

// ─── Asset map ────────────────────────────────────────────────────────────────

export const SHOWCASE_ASSETS: Record<ProductVariant, { metal: readonly string[]; gems: readonly string[] }> = {
  ringClassic: {
    metal: ["/models/RING-MOI.glb", "/models/RING-MOI-SETTING.glb"],
    gems:  ["/models/RING-MOI-GEMSTONE.glb"],
  },
  ringConcave: {
    metal: ["/models/RING-SUI.glb", "/models/RING-SUI-SETTING.glb"],
    gems:  ["/models/RING-SUI-GEMSTONE.glb"],
  },
  pendantOne: {
    metal: ["/models/PENDANT-SOI.glb", "/models/PENDANT-SOI-LINK.glb", "/models/PENDANT-SOI-SETTING.glb"],
    gems:  ["/models/PENDANT-SOI-GEMSTONE.glb"],
  },
  pendantTwo: {
    metal: ["/models/PENDANT-MOMENT.glb", "/models/PENDANT-MOMENT-SETTING.glb"],
    gems:  ["/models/PENDANT-MOMENT-GEMSTONE.glb"],
  },
  ringClassicNoGem: {
    metal: ["/models/RING-MOI.glb"],
    gems:  [],
  },
  ringConcaveNoGem: {
    metal: ["/models/RING-SUI.glb"],
    gems:  [],
  },
  pendantMesmo: {
    metal: ["/models/PENDANT-MESMO.glb", "/models/PENDANT-MESMO-SETTING.glb"],
    gems:  ["/models/PENDANT-MESMO-GEMSTONE.glb"],
  },
  earrings: {
    metal: ["/models/EARRING-LEFT.glb", "/models/EARRING-RIGHT.glb"],
    gems:  ["/models/EARRING-LEFT-GEMSTONE.glb", "/models/EARRING-RIGHT-GEMSTONE.glb"],
  },
};

// ─── Random gem picker ────────────────────────────────────────────────────────
// First paint: `HomepageScene` initial state. After customiser: App bumps
// `showcaseGemEpoch` on back. Order: ring classic, ring concave, SOI, MOMENT, MESMO.
// Earrings always use white — not included in the five drawn from `pickUniqueGems`.

export type ShowcaseRandomGems = [
  GemstoneId,
  GemstoneId,
  GemstoneId,
  GemstoneId,
  GemstoneId,
];

export function pickUniqueGems(): ShowcaseRandomGems {
  const arr = [...GEMSTONES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomGemstoneIndex(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 5).map((g) => g.id) as ShowcaseRandomGems;
}

/**
 * Same slot order as `buildShowcasePieces`: ring classic, ring concave, SOI, MOMENT, MESMO.
 * Used as defaults in remix presets; live remix applies a random gem (see CustomiserExperience).
 */
export const SHOWCASE_REMIX_GEMS: ShowcaseRandomGems = [
  "garnet",
  "amethyst",
  "citrine",
  "pink-tourmaline",
  "peridot",
];

// ─── Piece configurations ─────────────────────────────────────────────────────
// Orbital speeds are tuned ~30-40% slower than typical — thick-honey feel.
// spinSpeedX/Y/Z differ per axis per piece for organic, non-repetitive tumbling.

export function buildShowcasePieces(gems: ShowcaseRandomGems): ShowcasePieceConfig[] {
  const mesmoSlider = ENGRAVING_SLIDER_CONFIG.pendantMesmo;
  const mesmoEngraving: EngravingParams = {
    text:        "404",
    offsetX:     engravingValueAtSliderPercent(mesmoSlider.posX.min, mesmoSlider.posX.max, 59),
    offsetY:     engravingValueAtSliderPercent(mesmoSlider.posY.min, mesmoSlider.posY.max, 53),
    fontSize:    engravingValueAtSliderPercent(mesmoSlider.size.min, mesmoSlider.size.max, 68),
    rotation:    -180,
    lineSpacing: mesmoSlider.spacing!.default,
  };

  const moiSlider = ENGRAVING_SLIDER_CONFIG.ringClassic;
  const moiEngraving: EngravingParams = {
    text:        "X\n       E",
    offsetX:     engravingValueAtSliderPercent(moiSlider.posX.min, moiSlider.posX.max, 71),
    offsetY:     -0.08,
    fontSize:    engravingValueAtSliderPercent(moiSlider.size.min, moiSlider.size.max, 93),
    rotation:    -180,
    lineSpacing: 0.15,
  };

  return [
  {
    id:       "ring-classic",
    variant:  "ringClassic",
    scale:     1.1,
    gemstone: gems[0],
    finish:   "matte",
    engraving: moiEngraving,
    category: "ring",
    posZ:      2.0,
    orbitCenterX: -1.5,
    orbitCenterY:  1.5,
    orbitRadiusX:  -1.10,
    orbitRadiusY:  1.50,
    orbitSpeedX:   0.12,
    orbitSpeedY:   0.09,
    orbitPhaseX:   0.00,
    orbitPhaseY:   -4.37,
    spinSpeedX:    0.10,
    spinSpeedY:    0.26,
    spinSpeedZ:    0.10,
    colliderX:     1.00,
    colliderY:     1.02,
    colliderZ:     1.06,
  },
  {
    id:       "ring-concave",
    variant:  "ringConcave",
    scale:     1.35,
    gemstone: gems[1],
    finish:   "shiny",
    engraving:   { text: "Bisous", offsetX: 0.04, offsetY: 0.00, fontSize: 1.00, rotation: -180, lineSpacing: 1.0 },
    gemPosition: { x: 0.07, y: 0.25 },
    category: "ring",
    posZ:     -1.5,
    orbitCenterX:  5.5,
    orbitCenterY:  -1.0,
    orbitRadiusX:  1.90,
    orbitRadiusY:  -1.00,
    orbitSpeedX:   0.09,
    orbitSpeedY:   0.13,
    orbitPhaseX:   2.09,
    orbitPhaseY:   4.70,
    spinSpeedX:    0.20,
    spinSpeedY:    0.78,
    spinSpeedZ:    0.34,
    colliderX:     1.10,
    colliderY:     1.18,
    colliderZ:     1.04,
  },
  {
    id:       "pendant-classic",
    variant:  "pendantOne",
    scale:     1.2,
    gemstone: gems[2],
    finish:   "shiny",
    engraving: { text: "W\n   B", offsetX: 0.27, offsetY: -0.08, fontSize: 0.70, rotation: -180, lineSpacing: 0.55 },
    category: "pendant",
    posZ:      1.8,
    orbitCenterX:  0.8,
    orbitCenterY:  -0.3,
    orbitRadiusX:  0.15,
    orbitRadiusY:  0.70,
    orbitSpeedX:   0.08,
    orbitSpeedY:   0.11,
    orbitPhaseX:   2.19,
    orbitPhaseY:   4.14,
    spinSpeedX:    0.06,
    spinSpeedY:    0.32,
    spinSpeedZ:    0.48,
    colliderX:     0.94,
    colliderY:     1.12,
    colliderZ:     0.28,
  },
  {
    id:       "pendant-low",
    variant:  "pendantTwo",
    scale:     1.50,
    gemstone: gems[3],
    finish:   "matte",
    engraving: { text: "kiss\nme", offsetX: 0.03, offsetY: 0.02, fontSize: 0.71, rotation: -180, lineSpacing: 0.35 },
    category: "pendant",
    posZ:     -0.5,
    orbitCenterX: -2.0,
    orbitCenterY:  -4.0,
    orbitRadiusX:  0.85,
    orbitRadiusY:  0.95,
    orbitSpeedX:   0.11,
    orbitSpeedY:   0.08,
    orbitPhaseX:   2.05,
    orbitPhaseY:   4.71,
    spinSpeedX:    1.24,
    spinSpeedY:    0.6,
    spinSpeedZ:    0.12,
    colliderX:     0.72,
    colliderY:     1.48,
    colliderZ:     0.20,
  },
  {
    id:       "pendant-mesmo",
    variant:  "pendantMesmo",
    scale:     1.25,
    gemstone:  gems[4],
    finish:    "shiny",
    engraving: mesmoEngraving,
    category:  "pendant",
    posZ:      0.5,
    orbitCenterX:  2.4,
    orbitCenterY:  2.2,
    orbitRadiusX:  0.55,
    orbitRadiusY:  -0.65,
    orbitSpeedX:   0.095,
    orbitSpeedY:   0.085,
    orbitPhaseX:   0.85,
    orbitPhaseY:   -3.2,
    spinSpeedX:    0.07,
    spinSpeedY:    0.33,
    spinSpeedZ:    0.13,
    // Pitch so the pendant face reads more upward / toward camera at spawn (radians).
    spawnRotationX: -0.62,
    colliderX:     0.95,
    colliderY:     1.12,
    colliderZ:     0.28,
  },
  {
    id:       "earrings",
    variant:  "earrings",
    scale:     2.60,
    gemstone: "white-cz",
    finish:   "shiny",
    engraving:      { text: "Desire",   offsetX:  0.06, offsetY: -0.202, fontSize: 0.25, rotation:  -90, lineSpacing: 1.0 },
    engravingRight: { text: "Devotion", offsetX: -0.06, offsetY: -0.148, fontSize: 0.25, rotation:   90, lineSpacing: 1.0 },
    gemPositionLeft:  { x:  0.18,  y: 0.449 },
    gemPositionRight: { x: -0.195, y: 3.753 },
    category: "earrings",
    posZ:     -3.0,
    orbitCenterX:  -1.0,
    orbitCenterY:  1.0,
    orbitRadiusX:  -1.05,
    orbitRadiusY:  -0.85,
    orbitSpeedX:   0.08,
    orbitSpeedY:   0.09,
    orbitPhaseX:   5.50,
    orbitPhaseY:   -2.36,
    spinSpeedX:    0.18,
    spinSpeedY:    0.54,
    spinSpeedZ:    0.62,
    colliderX:     1.27,
    colliderY:     2.47,
    colliderZ:     0.11,
  },
  ]; // end buildShowcasePieces
}

// ─── Preload all showcase assets at module level ───────────────────────────────

Object.values(SHOWCASE_ASSETS).forEach(({ metal, gems }) => {
  [...metal, ...gems].forEach((url) => useGLTF.preload(url));
});
