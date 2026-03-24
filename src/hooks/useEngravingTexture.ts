"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { EngravingGroup, FinishType } from "@/lib/customiser/types";
import type { EngravingParams } from "@/lib/customiser/types";

// EngravingTarget = engraving canvas key: ring/pendant groups + per-earring keys
export type EngravingTarget = EngravingGroup | "earringLeft" | "earringRight";

const CANVAS_SIZE: Record<EngravingTarget, { w: number; h: number }> = {
  ring:         { w: 2048, h: 512  },
  pendant:      { w: 2048, h: 2048 },
  earringLeft:  { w: 512,  h: 2048 },
  earringRight: { w: 512,  h: 2048 },
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

function loadFont(): Promise<void> {
  if (fontLoaded) return Promise.resolve();
  if (fontLoading)  return fontLoading;
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
  drawText(ctx, params, w, h, "#ffffff");
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
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < mask.length; i++) {
    if (edgeMask[i] === 1 && Math.random() < 0.003) {
      const col = i % w;
      const row = Math.floor(i / w);
      ctx.fillRect(col, row, 2, 2);
    }
  }
}

function drawBumpEngraved(ctx: CanvasRenderingContext2D, params: EngravingParams, w: number, h: number) {
  if (!params.text) { ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, w, h); return; }
  drawMaskedLines(ctx, params, w, h, [0, 0, 0], [190, 190, 190]);
}

function drawTintEngraved(ctx: CanvasRenderingContext2D, params: EngravingParams, w: number, h: number, grooveTint: string) {
  if (!params.text) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); return; }
  drawMaskedLines(ctx, params, w, h, [255, 255, 255], hexToRgb(grooveTint));
}

// ── Texture helper ────────────────────────────────────────────────────────────

function makeTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex    = new THREE.CanvasTexture(canvas);
  tex.wrapS    = THREE.RepeatWrapping;
  tex.repeat.x = -1;
  tex.offset.x = 1;
  return tex;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface EngravingTextures {
  bumpMap:      THREE.CanvasTexture;
  colorTintMap: THREE.CanvasTexture;
  exportPNG:    () => void;
}

interface TextureState {
  product: EngravingTarget;
  bump:    THREE.CanvasTexture;
  tint:    THREE.CanvasTexture;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useEngravingTexture(
  params:        EngravingParams,
  product:       EngravingTarget | null,
  finish:        FinishType | null,
  tintOverride?: string,
  exportFilename?: string,
): EngravingTextures | null {
  const [texState, setTexState] = useState<TextureState | null>(null);

  const bumpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bumpTexRef    = useRef<THREE.CanvasTexture | null>(null);
  const tintTexRef    = useRef<THREE.CanvasTexture | null>(null);
  const productRef    = useRef<EngravingTarget | null>(null);

  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsRef     = useRef<EngravingParams>(params);
  const grooveTintRef = useRef<string>("");
  const prevTextRef   = useRef<string>(params.text);

  const grooveTint      = tintOverride ?? GROOVE_TINT[finish ?? "default"];
  paramsRef.current     = params;
  grooveTintRef.current = grooveTint;

  // ── Product change: recreate canvases + textures ────────────────────────────
  useEffect(() => {
    if (!product) { setTexState(null); return; }

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

    bumpCanvas.getContext("2d")!.fillStyle = "#000"; bumpCanvas.getContext("2d")!.fillRect(0,0,w,h);
    tintCanvas.getContext("2d")!.fillStyle = "#fff"; tintCanvas.getContext("2d")!.fillRect(0,0,w,h);

    const bump = makeTex(bumpCanvas);
    const tint = makeTex(tintCanvas);
    bumpTexRef.current = bump;
    tintTexRef.current = tint;

    setTexState({ product, bump, tint });
  }, [product]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // ── Redraw engraved textures ────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const p = productRef.current;
    if (!p || !bumpCanvasRef.current || !tintCanvasRef.current) return;
    const { w, h } = CANVAS_SIZE[p];
    loadFont().then(() => {
      if (!bumpCanvasRef.current || !tintCanvasRef.current) return;
      drawBumpEngraved(bumpCanvasRef.current.getContext("2d")!, paramsRef.current, w, h);
      drawTintEngraved(tintCanvasRef.current.getContext("2d")!, paramsRef.current, w, h, grooveTintRef.current);
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
    tCtx.fillStyle = "#fff"; tCtx.fillRect(0, 0, tintCanvasRef.current.width, tintCanvasRef.current.height);
    if (bumpTexRef.current) bumpTexRef.current.needsUpdate = true;
    if (tintTexRef.current) tintTexRef.current.needsUpdate = true;

    const textChanged = params.text !== prevTextRef.current;
    prevTextRef.current = params.text;

    if (textChanged) {
      debounceRef.current = setTimeout(redraw, 60);
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    } else {
      redraw();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, product, grooveTint]);

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
    exportPNG,
  };
}
