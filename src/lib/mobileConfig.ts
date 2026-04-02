import type { ProductVariant } from "@/lib/customiser/types";

// ─── MOBILE Y POSITION OFFSETS ────────────────────────────────────────────────
// Edit these to fix vertical positioning per product on screens < 768px.
// Positive = move up, Negative = move down.
// Values are in world units (same scale as the zoom curve yClose/yBase/yFar values).

export const MOBILE_Y_OFFSETS: Partial<Record<ProductVariant, number>> = {
  ringClassic:      0,
  ringConcave:      0,
  ringClassicNoGem: 0,
  ringConcaveNoGem: 0,
  pendantOne:       0,  // increase if SOI pendant appears too low
  pendantTwo:       0,  // increase if MOMENT pendant appears too low
  pendantMesmo:     0,  // increase if MESMO pendant appears too low
  earrings:         0,
};
