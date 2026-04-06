"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { EngravingGroup, FinishType, ProductVariant } from "@/lib/customiser/types";
import type { EngravingParams } from "@/lib/customiser/types";

// EngravingTarget = engraving canvas key: ring/pendant groups + per-earring keys
export type EngravingTarget = EngravingGroup | "earringLeft" | "earringRight";

// Desktop canvas dimensions — also used by CANVAS_FOR_PIECE (safe-zone fraction computation).
const CANVAS_SIZE_DESKTOP: Record<EngravingTarget, { w: number; h: number }> = {
  ring:         { w: 2048, h: 512  },
  pendant:      { w: 1024, h: 1024 },
  earringLeft:  { w: 512,  h: 2048 },
  earringRight: { w: 512,  h: 2048 },
};

export const CANVAS_SIZE = CANVAS_SIZE_DESKTOP;

// ─── Safe zone margins (fraction of canvas dimension) ─────────────────────────

export interface SafeZoneMargins {
  top:    number;
  bottom: number;
  left:   number;
  right:  number;
}

/** Set to `true` to draw the dashed safe-zone frame on the 3D tint texture (bump export stays clean). */
export const SHOW_ENGRAVING_SAFE_ZONE_GUIDE = false;

// ─── Per-piece safe zone insets (canvas pixels per side) ──────────────────────
// Each jewellery piece has its own entry. Edit the pixel numbers here to move
// the boundary guide and tune when the out-of-bounds warning fires.
// Canvas sizes for reference:
//   ringClassic / ringConcave   →  2048 × 512
//   pendantOne  / pendantTwo    →  2048 × 2048
//   earringLeft / earringRight  →  512  × 2048
export type PieceSafeZoneKey = Exclude<ProductVariant, "earrings"> | "earringLeft" | "earringRight";

// Always reference desktop dimensions so getSafeZone() fractions are consistent
// regardless of whether CANVAS_SIZE was scaled down for mobile.
const CANVAS_FOR_PIECE: Record<PieceSafeZoneKey, { w: number; h: number }> = {
  ringClassic:      CANVAS_SIZE_DESKTOP.ring,
  ringConcave:      CANVAS_SIZE_DESKTOP.ring,
  ringClassicNoGem: CANVAS_SIZE_DESKTOP.ring,
  ringConcaveNoGem: CANVAS_SIZE_DESKTOP.ring,
  pendantOne:       CANVAS_SIZE_DESKTOP.pendant,
  pendantTwo:       CANVAS_SIZE_DESKTOP.pendant,
  pendantMesmo:     CANVAS_SIZE_DESKTOP.pendant,
  earringLeft:      CANVAS_SIZE_DESKTOP.earringLeft,
  earringRight:     CANVAS_SIZE_DESKTOP.earringRight,
};

const SAFE_ZONE_PX: Record<PieceSafeZoneKey, SafeZoneMargins> = {
  ringClassic:      { top: 25,  bottom: 25,  left: 400,  right: 400  },
  // Concave rings: horizontal keep-out removed — only top/bottom safe margins (see checkTextOutOfBounds).
  ringConcave:      { top: 50, bottom: 50, left: 0, right: 0 },
  ringClassicNoGem: { top: 25,  bottom: 25,  left: 400,  right: 400  },
  ringConcaveNoGem: { top: 50, bottom: 50, left: 10, right: 10 },
  // Pixel values halved from their 2048×2048 originals to preserve the same
  // fractional safe-zone margins now that pendant canvas is 1024×1024.
  pendantOne:       { top: 25, bottom:  30, left: 30, right: 30 },
  pendantTwo:       { top: 100, bottom: 90, left: 30, right: 30 },
  pendantMesmo:     { top: 20, bottom:  20, left: 60, right: 60 },
  earringLeft:      { top: 50, bottom: 565, left: 65,  right: 65  },
  earringRight:     { top: 50, bottom: 565, left: 65,  right: 65  },
};

export function getSafeZone(key: PieceSafeZoneKey): SafeZoneMargins {
  const px      = SAFE_ZONE_PX[key];
  const { w, h } = CANVAS_FOR_PIECE[key];
  return { top: px.top/h, bottom: px.bottom/h, left: px.left/w, right: px.right/w };
}

// Fallback fraction-based map used when no variant is supplied (e.g. exports)
export const SAFE_ZONE: Record<EngravingTarget, SafeZoneMargins> = {
  ring:         getSafeZone("ringClassic"),
  pendant:      getSafeZone("pendantOne"),
  earringLeft:  getSafeZone("earringLeft"),
  earringRight: getSafeZone("earringRight"),
};

const FONT_FAMILY = "ClassiqueScript";
const FONT_URL    = "/fonts/ClassiqueScript.otf";

const GROOVE_TINT: Record<NonNullable<FinishType> | "default", string> = {
  shiny:   "#4a4a4a",
  matte:   "#2a2a2a",
  default: "#4a4a4a",
};

let fontLoaded = false;
let fontLoading: Promise<void> | null = null;

export function loadFont(): Promise<void> {
  if (fontLoaded) return Promise.resolve();
  if (fontLoading) return fontLoading;
  fontLoading = new FontFace(FONT_FAMILY, `url(${FONT_URL})`)
    .load()
    .then((face) => {
      document.fonts.add(face);
      fontLoaded = true;
    })
    .catch(() => {
      console.warn("Failed to load engraving font — falling back to serif.");
    });
  return fontLoading;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  params: EngravingParams,
  w: number,
  h: number,
  colour: string
) {
  if (!params.text) return;

  const cx = w * 0.5 + params.offsetX * w;
  const cy = h * 0.5 + params.offsetY * h;
  const fs = params.fontSize * h;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((params.rotation * Math.PI) / 180);
  ctx.font         = `${fs}px "${FONT_FAMILY}", serif`;
  ctx.fillStyle    = colour;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";

  const lines       = params.text.split("\n");
  const lineHeight  = fs * params.lineSpacing;
  const blockHeight = lines.length * lineHeight;
  const startY      = -(blockHeight / 2) + lineHeight / 2;
  lines.forEach((line, i) => {
    if (line.trim()) ctx.fillText(line, 0, startY + i * lineHeight);
  });
  ctx.restore();
}

// ─── Safe-zone helpers ────────────────────────────────────────────────────────

/**
 * Returns true if any rendered pixel of the text extends outside the safe zone.
 * Uses pixel scanning on an off-screen canvas so script-font descenders,
 * ascenders, and rotated glyphs are all captured accurately on every side.
 * Must be called after the font is loaded.
 */
/** Dashed rectangle in canvas pixels — drawn on tint texture only when SHOW_ENGRAVING_SAFE_ZONE_GUIDE */
function drawSafeZoneGuide(
  ctx: CanvasRenderingContext2D,
  w:   number,
  h:   number,
  sz:  SafeZoneMargins,
) {
  const x  = sz.left * w;
  const y  = sz.top * h;
  const rw = w * (1 - sz.left - sz.right);
  const rh = h * (1 - sz.top - sz.bottom);
  if (rw <= 1 || rh <= 1) return;

  const lw = Math.max(1, Math.round(Math.min(w, h) / 800));
  ctx.save();
  ctx.strokeStyle = "rgba(0, 190, 70, 0.92)";
  ctx.lineWidth   = lw;
  ctx.setLineDash([7 * (w / 2048), 5 * (w / 2048)]);
  ctx.strokeRect(x + lw / 2, y + lw / 2, rw - lw, rh - lw);
  ctx.restore();
}

export function checkTextOutOfBounds(
  params: EngravingParams,
  w:      number,
  h:      number,
  sz:     SafeZoneMargins,
): boolean {
  if (!params.text) return false;

  const temp    = document.createElement("canvas");
  temp.width    = w;
  temp.height   = h;
  const ctx     = temp.getContext("2d", { willReadFrequently: true })!;

  // Draw text exactly as the engraving renderer does
  drawText(ctx, params, w, h, "#f9f9f9");

  // Scan alpha channel to find the true rendered bounding box
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w, maxX = -1, minY = h, maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // No pixels rendered at all (e.g. whitespace only)
  if (maxX === -1) return false;

  return (
    minX < sz.left   * w ||
    maxX > w * (1 - sz.right)  ||
    minY < sz.top    * h ||
    maxY > h * (1 - sz.bottom)
  );
}


// ── Engraved — noise texture via masked pixel pass ────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function drawMaskedLines(
  ctx:   CanvasRenderingContext2D,
  params: EngravingParams,
  w:     number,
  h:     number,
  bgRgb: [number, number, number],
  fgRgb: [number, number, number],
) {
  // Extract text alpha mask — blur softens edges for smooth bump transitions
  ctx.clearRect(0, 0, w, h);
  ctx.filter = "blur(0.5px)";
  drawText(ctx, params, w, h, "#f9f9f9");
  ctx.filter = "none";
  const maskPixels = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8ClampedArray(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = maskPixels[i * 4 + 3];

  // Flat fill: fgRgb inside text, bgRgb outside
  ctx.clearRect(0, 0, w, h);
  const baseImg = ctx.getImageData(0, 0, w, h);
  const bd      = baseImg.data;
  for (let i = 0; i < mask.length; i++) {
    const px  = i * 4;
    const rgb = mask[i] > 0 ? fgRgb : bgRgb;
    bd[px] = rgb[0]; bd[px + 1] = rgb[1]; bd[px + 2] = rgb[2]; bd[px + 3] = 255;
  }
  // Per-pixel noise inside text mask
  const d = baseImg.data;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] > 0) {
      const px    = i * 4;
      const noise = (Math.random() - 0.5) * 80;
      const val   = Math.max(0, Math.min(255, d[px] + noise));
      d[px] = d[px + 1] = d[px + 2] = val;
    }
  }
  // Edge mask — pixels inside text that border the outside
  const edgeMask = new Uint8ClampedArray(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (mask[i] > 0) {
        if (mask[i - 1] === 0 || mask[i + 1] === 0 || mask[i - w] === 0 || mask[i + w] === 0) {
          edgeMask[i] = 1;
        }
      }
    }
  }

  // Sparkle points — edge only, varied brightness
  for (let i = 0; i < mask.length; i++) {
    if (edgeMask[i] === 1 && Math.random() < 0.08) {
      const px = i * 4;
      const v = 200 + Math.floor(Math.random() * 56);
      d[px] = d[px + 1] = d[px + 2] = v;
    }
  }
  ctx.putImageData(baseImg, 0, 0);

  // Ultra-bright 2px clusters — edge only, rare large flash points
  ctx.fillStyle = "#f9f9f9";
  for (let i = 0; i < mask.length; i++) {
    if (edgeMask[i] === 1 && Math.random() < 0.003) {
      const col = i % w;
      const row = Math.floor(i / w);
      ctx.fillRect(col, row, 2, 2);
    }
  }
}

export function drawBumpEngraved(ctx: CanvasRenderingContext2D, params: EngravingParams, w: number, h: number) {
  if (!params.text) { ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, w, h); return; }
  drawMaskedLines(ctx, params, w, h, [0, 0, 0], [217, 217, 218]);
}

function drawTintEngraved(ctx: CanvasRenderingContext2D, params: EngravingParams, w: number, h: number, grooveTint: string) {
  if (!params.text) { ctx.fillStyle = "#f9f9f9"; ctx.fillRect(0, 0, w, h); return; }
  drawMaskedLines(ctx, params, w, h, [249, 249, 249], hexToRgb(grooveTint));
}

// ── Texture helper ────────────────────────────────────────────────────────────

function makeTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex    = new THREE.CanvasTexture(canvas);
  tex.wrapS    = THREE.RepeatWrapping;
  tex.repeat.x = -1;
  tex.offset.x = 1;
  return tex;
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface EngravingTextures {
  bumpMap:      THREE.CanvasTexture;
  colorTintMap: THREE.CanvasTexture;
  bumpCanvas:   HTMLCanvasElement | null;
  tintCanvas:   HTMLCanvasElement | null;
  exportPNG:    () => void;
  isOutOfBounds: boolean;
}

interface TextureState {
  product: EngravingTarget;
  bump:    THREE.CanvasTexture;
  tint:    THREE.CanvasTexture;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useEngravingTexture(
  params:          EngravingParams,
  product:         EngravingTarget | null,
  finish:          FinishType | null,
  tintOverride?:   string,
  exportFilename?: string,
  variant?:        ProductVariant | null,
): EngravingTextures | null {
  const [texState,      setTexState]      = useState<TextureState | null>(null);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  const bumpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bumpTexRef    = useRef<THREE.CanvasTexture | null>(null);
  const tintTexRef    = useRef<THREE.CanvasTexture | null>(null);
  const productRef    = useRef<EngravingTarget | null>(null);
  const variantRef    = useRef<ProductVariant | null | undefined>(variant);

  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsRef     = useRef<EngravingParams>(params);
  const grooveTintRef = useRef<string>("");
  const prevTextRef   = useRef<string>(params.text);

  const grooveTint      = tintOverride ?? GROOVE_TINT[finish ?? "default"];
  paramsRef.current     = params;
  variantRef.current    = variant;
  grooveTintRef.current = grooveTint;

  // ── Product change: recreate canvases + textures ────────────────────────────
  useEffect(() => {
    if (!product) { setTexState(null); setIsOutOfBounds(false); return; }

    const { w, h } = CANVAS_SIZE[product];
    productRef.current = product;

    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }

    bumpTexRef.current?.dispose();
    tintTexRef.current?.dispose();
    bumpTexRef.current = null;
    tintTexRef.current = null;

    const bumpCanvas = makeCanvas(w, h);
    const tintCanvas = makeCanvas(w, h);
    bumpCanvasRef.current = bumpCanvas;
    tintCanvasRef.current = tintCanvas;

    const bumpInitCtx = bumpCanvas.getContext("2d", { willReadFrequently: true })!;
    bumpInitCtx.fillStyle = "#000"; bumpInitCtx.fillRect(0, 0, w, h);
    const tintInitCtx = tintCanvas.getContext("2d", { willReadFrequently: true })!;
    tintInitCtx.fillStyle = "#f9f9f9"; tintInitCtx.fillRect(0, 0, w, h);

    const bump = makeTex(bumpCanvas);
    const tint = makeTex(tintCanvas);
    bumpTexRef.current = bump;
    tintTexRef.current = tint;

    setIsOutOfBounds(false);
    setTexState({ product, bump, tint });
  }, [product]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // ── Redraw engraved textures + safe-zone check ──────────────────────────────
  const redraw = useCallback(() => {
    const p = productRef.current;
    if (!p || !bumpCanvasRef.current || !tintCanvasRef.current) return;
    const { w, h } = CANVAS_SIZE[p];
    const v = variantRef.current;
    const sz = (v && v !== "earrings")
      ? getSafeZone(v as PieceSafeZoneKey)
      : (p === "earringLeft" || p === "earringRight")
        ? getSafeZone(p)
        : SAFE_ZONE[p];

    loadFont().then(() => {
      if (!bumpCanvasRef.current || !tintCanvasRef.current) return;
      const prms = paramsRef.current;

      drawBumpEngraved(bumpCanvasRef.current.getContext("2d")!, prms, w, h);
      const tintCtx = tintCanvasRef.current.getContext("2d")!;
      drawTintEngraved(tintCtx, prms, w, h, grooveTintRef.current);
      if (SHOW_ENGRAVING_SAFE_ZONE_GUIDE) drawSafeZoneGuide(tintCtx, w, h, sz);

      // Safe-zone check via pixel scanning — all sides captured accurately
      const oob = prms.text ? checkTextOutOfBounds(prms, w, h, sz) : false;
      setIsOutOfBounds(oob);


      if (bumpTexRef.current) bumpTexRef.current.needsUpdate = true;
      if (tintTexRef.current) tintTexRef.current.needsUpdate = true;
    });
  }, []);

  // ── Params change: clear to blank, redraw engraved ─────────────────────────
  useEffect(() => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    if (!product || !bumpCanvasRef.current || !tintCanvasRef.current) return;

    const bCtx = bumpCanvasRef.current.getContext("2d")!;
    bCtx.fillStyle = "#000"; bCtx.fillRect(0, 0, bumpCanvasRef.current.width, bumpCanvasRef.current.height);
    const tCtx = tintCanvasRef.current.getContext("2d")!;
    tCtx.fillStyle = "#f9f9f9"; tCtx.fillRect(0, 0, tintCanvasRef.current.width, tintCanvasRef.current.height);
    if (bumpTexRef.current) bumpTexRef.current.needsUpdate = true;
    if (tintTexRef.current) tintTexRef.current.needsUpdate = true;

    // Clear warning immediately when text is empty
    if (!params.text) setIsOutOfBounds(false);

    const textChanged = params.text !== prevTextRef.current;
    prevTextRef.current = params.text;

    if (textChanged) {
      debounceRef.current = setTimeout(redraw, 60);
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    } else {
      redraw();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, product, grooveTint, variant]);

  const exportPNG = useCallback(() => {
    if (!bumpCanvasRef.current) return;
    const link    = document.createElement("a");
    link.download = exportFilename ?? "engraving-bump.png";
    link.href     = bumpCanvasRef.current.toDataURL("image/png");
    link.click();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportFilename]);

  if (!product || texState?.product !== product) return null;

  return {
    bumpMap:      texState.bump,
    colorTintMap: texState.tint,
    bumpCanvas:   bumpCanvasRef.current,
    tintCanvas:   tintCanvasRef.current,
    exportPNG,
    isOutOfBounds,
  };
}
