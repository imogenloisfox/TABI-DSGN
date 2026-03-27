import { useGLTF } from "@react-three/drei";
import type {
  ProductCategory,
  ProductVariant,
  GemstoneId,
  FinishType,
  EngravingParams,
  GemPosition,
} from "@/lib/customiser/types";
import { GEMSTONES } from "@/data/gemstones";

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

  // ── Collision box half-extents (world units) — for soft repulsion & debug viz
  colliderX: number;
  colliderY: number;
  colliderZ: number;
}

// ─── Asset map ────────────────────────────────────────────────────────────────

export const SHOWCASE_ASSETS: Record<ProductVariant, { metal: readonly string[]; gems: readonly string[] }> = {
  ringClassic: {
    metal: ["/models/ring.glb", "/models/ring-setting.glb"],
    gems:  ["/models/ring-gemstone.glb"],
  },
  ringConcave: {
    metal: ["/models/Concave-Ring-v1.glb", "/models/CircleGem-Setting-v1.glb"],
    gems:  ["/models/CircleGem-v1.glb"],
  },
  pendantOne: {
    metal: ["/models/pendant.glb", "/models/Pendant-Chain-Hook.glb", "/models/pendant-setting.glb"],
    gems:  ["/models/pendant-gemstone.glb"],
  },
  pendantTwo: {
    metal: ["/models/Pendant-Mini.glb", "/models/Pendant-Setting-Low.glb"],
    gems:  ["/models/Pendant-Gemstone-Low.glb"],
  },
  earrings: {
    metal: ["/models/Earring-Left-v1.glb", "/models/Earring-Right-v1.glb"],
    gems:  ["/models/Earring-Gemstone-v1.glb", "/models/Earring-Gemstone-v2.glb"],
  },
};

// ─── Random gem picker ────────────────────────────────────────────────────────
// Called on each HomepageScene mount so gems change on every visit (page load
// or "back" from the customiser). Earrings are excluded — they always use white.

export type FourGems = [GemstoneId, GemstoneId, GemstoneId, GemstoneId];

export function pickUniqueGems(): FourGems {
  const shuffled = [...GEMSTONES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).map((g) => g.id) as FourGems;
}

// ─── Piece configurations ─────────────────────────────────────────────────────
// Orbital speeds are tuned ~30-40% slower than typical — thick-honey feel.
// spinSpeedX/Y/Z differ per axis per piece for organic, non-repetitive tumbling.

export function buildShowcasePieces(gems: FourGems): ShowcasePieceConfig[] {
  return [
  {
    id:       "ring-classic",
    variant:  "ringClassic",
    scale:     1.1,
    gemstone: gems[0],
    finish:   "matte",
    engraving: { text: "X\n       E", offsetX: 0.18, offsetY: -0.08, fontSize: 1.18, rotation: -180, lineSpacing: 0.15 },
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
    gemPosition: { x: 0.07, y: 0.16 },
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
    id:       "earrings",
    variant:  "earrings",
    scale:     2.60,
    gemstone: "white-cz",
    finish:   "shiny",
    engraving:      { text: "Desire",   offsetX:  0.06, offsetY: -0.20, fontSize: 0.25, rotation:  -90, lineSpacing: 1.0 },
    engravingRight: { text: "Devotion", offsetX: -0.06, offsetY: -0.15, fontSize: 0.25, rotation:   90, lineSpacing: 1.0 },
    gemPositionLeft:  { x:  0.18, y: 0.46 },
    gemPositionRight: { x: -0.18, y: 3.75 },
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
