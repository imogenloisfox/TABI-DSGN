import type {
  CustomiserState,
  ProductVariant,
  FinishType,
  GemstoneId,
  UKRingSize,
} from "@/lib/customiser/types";
import {
  UK_RING_SIZES,
  variantCategory,
  ENGRAVING_DEFAULTS,
  ENGRAVING_DEFAULTS_EARRING,
  EARRING_GEM_POSITION_DEFAULT,
  variantEngravingGroup,
  INITIAL_STATE,
} from "@/lib/customiser/types";

const KNOWN_VARIANTS: ProductVariant[] = [
  "ringClassic", "ringConcave", "ringClassicNoGem", "ringConcaveNoGem",
  "pendantOne", "pendantTwo", "pendantMesmo", "earrings",
];

const KNOWN_GEMSTONES: GemstoneId[] = [
  "garnet", "topaz", "citrine", "peridot", "white-cz",
  "smoky-quartz", "green-quartz", "amethyst", "pink-tourmaline", "hessonite",
];

type EngTuple = [string, number, number, number, number, number];

interface ShareLinkPayload {
  v:   string;
  f:   string;
  g:   string | null;
  rs:  string | null;
  e:   EngTuple;
  el:  EngTuple;
  er:  EngTuple;
  gp:  [number, number];
  gpl: [number, number];
  gpr: [number, number];
}

function toEngTuple(p: CustomiserState["engraving"]): EngTuple {
  const r = (n: number) => Math.round(n * 10000) / 10000;
  return [p.text, r(p.offsetX), r(p.offsetY), r(p.fontSize), r(p.rotation), r(p.lineSpacing)];
}

function fromEngTuple(t: EngTuple): CustomiserState["engraving"] {
  return { text: t[0], offsetX: t[1], offsetY: t[2], fontSize: t[3], rotation: t[4], lineSpacing: t[5] };
}

/** Encode a CustomiserState into a base64url string and return the full shareable URL. */
export function encodeShareState(state: CustomiserState): string {
  if (!state.variant || !state.finish) return "";

  const payload: ShareLinkPayload = {
    v:   state.variant,
    f:   state.finish,
    g:   state.gemstone,
    rs:  state.ringSize,
    e:   toEngTuple(state.engraving),
    el:  toEngTuple(state.engravingLeft),
    er:  toEngTuple(state.engravingRight),
    gp:  [Math.round(state.gemPosition.x * 10000) / 10000, Math.round(state.gemPosition.y * 10000) / 10000],
    gpl: [Math.round(state.gemPositionLeft.x * 10000) / 10000, Math.round(state.gemPositionLeft.y * 10000) / 10000],
    gpr: [Math.round(state.gemPositionRight.x * 10000) / 10000, Math.round(state.gemPositionRight.y * 10000) / 10000],
  };

  const json = JSON.stringify(payload);
  // base64url encode
  const encoded = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://tabidsgn.tools";
  return `${origin}/?d=${encoded}`;
}

/** Decode a ?d= param back into a partial CustomiserState. Returns null on any failure. */
export function decodeShareState(param: string): Partial<CustomiserState> | null {
  try {
    const json = decodeURIComponent(escape(atob(param.replace(/-/g, "+").replace(/_/g, "/"))));
    const p = JSON.parse(json) as Partial<ShareLinkPayload>;

    if (!p.v || !KNOWN_VARIANTS.includes(p.v as ProductVariant)) return null;
    if (!p.f || (p.f !== "shiny" && p.f !== "matte")) return null;

    const variant  = p.v as ProductVariant;
    const finish   = p.f as FinishType;
    const gemstone = p.g && KNOWN_GEMSTONES.includes(p.g as GemstoneId) ? (p.g as GemstoneId) : null;
    const ringSize = p.rs && (UK_RING_SIZES as readonly string[]).includes(p.rs) ? (p.rs as UKRingSize) : null;

    const engDefault      = ENGRAVING_DEFAULTS[variantEngravingGroup(variant)];
    const engEarringLeft  = ENGRAVING_DEFAULTS_EARRING.earringLeft;
    const engEarringRight = ENGRAVING_DEFAULTS_EARRING.earringRight;

    const engraving      = Array.isArray(p.e)  && p.e.length  === 6 ? fromEngTuple(p.e  as EngTuple) : engDefault;
    const engravingLeft  = Array.isArray(p.el) && p.el.length === 6 ? fromEngTuple(p.el as EngTuple) : engEarringLeft;
    const engravingRight = Array.isArray(p.er) && p.er.length === 6 ? fromEngTuple(p.er as EngTuple) : engEarringRight;

    const gemPosition      = Array.isArray(p.gp)  && p.gp.length  === 2 ? { x: p.gp[0],  y: p.gp[1]  } : INITIAL_STATE.gemPosition;
    const gemPositionLeft  = Array.isArray(p.gpl) && p.gpl.length === 2 ? { x: p.gpl[0], y: p.gpl[1] } : EARRING_GEM_POSITION_DEFAULT;
    const gemPositionRight = Array.isArray(p.gpr) && p.gpr.length === 2 ? { x: p.gpr[0], y: p.gpr[1] } : EARRING_GEM_POSITION_DEFAULT;

    return {
      view:     "workspace",
      category: variantCategory(variant),
      variant,
      finish,
      gemstone,
      ringSize,
      engraving,
      engravingLeft,
      engravingRight,
      gemPosition,
      gemPositionLeft,
      gemPositionRight,
    };
  } catch {
    return null;
  }
}
