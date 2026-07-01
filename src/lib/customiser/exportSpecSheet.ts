/**
 * TABI DSGN — PDF export (Save)
 *
 * Page 1 — Design preview (when `heroFrontView` is set)
 *   Large face-on render at current orbit zoom (matches live preview scale).
 *
 * Page 2 (or 1 if no hero) — Specification sheet
 *   Three camera captures (left / front / right) + bump preview + order summary.
 *
 * ─── Update BAND_DIMENSIONS below when real measurements change ──────────────
 */

import { jsPDF } from "jspdf";
import { loadFont, getSafeZone, type SafeZoneMargins } from "@/hooks/useEngravingTexture";

// ─── Band dimensions — real measured values ───────────────────────────────────

export const BAND_DIMENSIONS = {
  ring_classic:    { circumferenceMM: 52.5, heightMM: 17 },
  ring_concave:    { circumferenceMM: 52.5, heightMM: 17 },
  pendant_classic: { widthMM: 15,           heightMM: 17 },
  pendant_low:     { widthMM: null as null,  heightMM: null as null },
  earring_left:    { widthMM: 11,            heightMM: 47 },
  earring_right:   { widthMM: 11,            heightMM: 47 },
};

// ─── Ring size lookup table ───────────────────────────────────────────────────

export const RING_SIZE_DATA: Record<string, {
  diameterMM:      number;
  circumferenceMM: number;
  euSize:          number;
  usSize:          number;
}> = {
  F:  { diameterMM: 14.0, circumferenceMM: 44.0, euSize: 44,   usSize: 3    },
  G:  { diameterMM: 14.4, circumferenceMM: 45.2, euSize: 45,   usSize: 3.5  },
  H:  { diameterMM: 14.8, circumferenceMM: 46.5, euSize: 46,   usSize: 4    },
  I:  { diameterMM: 15.2, circumferenceMM: 47.8, euSize: 47.5, usSize: 4.5  },
  J:  { diameterMM: 15.6, circumferenceMM: 49.0, euSize: 49,   usSize: 5    },
  K:  { diameterMM: 16.0, circumferenceMM: 50.2, euSize: 50,   usSize: 5.5  },
  L:  { diameterMM: 16.3, circumferenceMM: 51.2, euSize: 51,   usSize: 5.75 },
  M:  { diameterMM: 16.7, circumferenceMM: 52.5, euSize: 52.5, usSize: 6.25 },
  N:  { diameterMM: 17.1, circumferenceMM: 53.8, euSize: 54,   usSize: 6.75 },
  O:  { diameterMM: 17.5, circumferenceMM: 55.0, euSize: 55,   usSize: 7.25 },
  P:  { diameterMM: 17.9, circumferenceMM: 56.2, euSize: 56.5, usSize: 7.75 },
  Q:  { diameterMM: 18.3, circumferenceMM: 57.5, euSize: 57.5, usSize: 8.25 },
  R:  { diameterMM: 18.7, circumferenceMM: 58.7, euSize: 59,   usSize: 8.75 },
  S:  { diameterMM: 19.1, circumferenceMM: 60.0, euSize: 60.5, usSize: 9.25 },
  T:  { diameterMM: 19.5, circumferenceMM: 61.3, euSize: 62,   usSize: 9.75 },
  U:  { diameterMM: 19.9, circumferenceMM: 62.5, euSize: 63,   usSize: 10.25},
  V:  { diameterMM: 20.3, circumferenceMM: 63.8, euSize: 64.5, usSize: 10.75},
  W:  { diameterMM: 20.7, circumferenceMM: 65.1, euSize: 66,   usSize: 11.25},
  X:  { diameterMM: 21.1, circumferenceMM: 66.3, euSize: 67.5, usSize: 11.75},
  Y:  { diameterMM: 21.5, circumferenceMM: 67.6, euSize: 69,   usSize: 12.25},
  Z:  { diameterMM: 21.9, circumferenceMM: 68.9, euSize: 70.5, usSize: 12.75},
};

// ─── Variant display names ────────────────────────────────────────────────────

const VARIANT_LABELS: Record<string, string> = {
  ringClassic:      "MOI",
  ringConcave:      "SUI",
  ringClassicNoGem: "MEUS",
  ringConcaveNoGem: "EGO (no stone)",
  pendantOne:       "SOI",
  pendantTwo:       "MOMENT",
  pendantMesmo:     "MESMO",
  earrings:         "Earrings",
};

// ─── Date / slug helpers ──────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function makeOrderRef(): string {
  const now = new Date();
  return `TABI-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function formatDateTime(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function fileDateSlug(): string {
  const now = new Date();
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

// ─── Measurement calculation ──────────────────────────────────────────────────

interface EngravingMeasurements {
  gapTopMM:       number;
  gapBottomMM:    number;
  gapLeftMM:      number;
  gapRightMM:     number;
  letterHeightMM: number;
  blockWidthMM:   number;
  blockHeightMM:  number;
}

/**
 * Measures the engraving text bounding box in real mm by mapping from canvas
 * pixel coordinates. Measurements are pre-rotation (unrotated bounding box).
 */
function measureEngraving(
  text:         string,
  offsetX:      number,
  offsetY:      number,
  fontSize:     number,
  lineSpacing:  number,
  canvasW:      number,
  canvasH:      number,
  realWidthMM:  number,
  realHeightMM: number,
): EngravingMeasurements {
  const temp    = document.createElement("canvas");
  temp.width    = canvasW;
  temp.height   = canvasH;
  const ctx     = temp.getContext("2d")!;
  const fsPx    = fontSize * canvasH;
  const lhPx    = fsPx * (lineSpacing || 1.0);
  ctx.font      = `${fsPx}px 'ClassiqueScript', serif`;

  const lines = (text || "").split("\n");
  let maxW    = 0;
  for (const line of lines) {
    const m = ctx.measureText(line || " ");
    maxW    = Math.max(maxW, m.width);
  }

  // Cap height: ascent of a full-caps string
  const capM         = ctx.measureText("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  const capHeightPx  = capM.actualBoundingBoxAscent ?? fsPx * 0.7;

  const blockW = maxW;
  const blockH = lines.length * lhPx;
  const cx     = (0.5 + offsetX) * canvasW;
  const cy     = (0.5 + offsetY) * canvasH;

  const textLeft   = cx - blockW / 2;
  const textRight  = cx + blockW / 2;
  const textTop    = cy - blockH / 2;
  const textBottom = cy + blockH / 2;

  const pxW = (px: number) => (px / canvasW) * realWidthMM;
  const pxH = (px: number) => (px / canvasH) * realHeightMM;

  return {
    gapTopMM:       Math.max(0, pxH(textTop)),
    gapBottomMM:    Math.max(0, pxH(canvasH - textBottom)),
    gapLeftMM:      Math.max(0, pxW(textLeft)),
    gapRightMM:     Math.max(0, pxW(canvasW - textRight)),
    letterHeightMM: pxH(capHeightPx),
    blockWidthMM:   pxW(blockW),
    blockHeightMM:  pxH(blockH),
  };
}

// ─── Diagram canvas drawing ───────────────────────────────────────────────────

interface EngravingSpec {
  text:        string;
  offsetX:     number;
  offsetY:     number;
  fontSize:    number;
  rotation:    number;
  lineSpacing: number;
}

/** Red dimension arrow (horizontal) */
function dimArrowH(
  ctx:    CanvasRenderingContext2D,
  x1:     number,
  x2:     number,
  y:      number,
  label:  string,
  color = "#cc2200",
) {
  const AH = 3;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = 0.75;

  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  // Arrowheads
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1+AH, y-AH/2); ctx.lineTo(x1+AH, y+AH/2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2-AH, y-AH/2); ctx.lineTo(x2-AH, y+AH/2); ctx.closePath(); ctx.fill();

  ctx.font         = 'bold 18px "Geist Mono", sans-serif';
  ctx.fillStyle    = "#000000";
  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, (x1 + x2) / 2, y + 6);
  ctx.restore();
}

/** Red dimension arrow (vertical) */
function dimArrowV(
  ctx:    CanvasRenderingContext2D,
  x:      number,
  y1:     number,
  y2:     number,
  label:  string,
  color = "#cc2200",
) {
  const AH = 3;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = 0.75;

  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x-AH/2, y1+AH); ctx.lineTo(x+AH/2, y1+AH); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x-AH/2, y2-AH); ctx.lineTo(x+AH/2, y2-AH); ctx.closePath(); ctx.fill();

  ctx.save();
  ctx.translate(x + 9, (y1 + y2) / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font         = 'bold 18px "Geist Mono", sans-serif';
  ctx.fillStyle    = "#000000";
  ctx.textAlign    = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, 0, 0);
  ctx.restore();

  ctx.restore();
}

/**
 * Creates a high-resolution annotated flat diagram canvas for one piece.
 * Shows: grey band, engraving text, green safe-zone rectangle with mm annotations,
 * red band dimension arrows, and engraving block dimensions.
 * Returns null if dimensions are unknown (pendant_low TBC).
 */
function createDiagramCanvas(
  isEarringPair: boolean,
  realWidthMM:   number | null,
  realHeightMM:  number | null,
  leftEng:       EngravingSpec,
  rightEng:      EngravingSpec | null,
  safeZoneLeft:  SafeZoneMargins | null,
  safeZoneRight: SafeZoneMargins | null,
): HTMLCanvasElement | null {
  if (realWidthMM === null || realHeightMM === null) return null;

  // Canvas px dimensions — leave generous margins for dimension arrows
  const MARGIN      = 160; // px on all sides
  const ANNO_BOTTOM = 140; // extra space below for dimension arrows + margin summary
  const ANNO_RIGHT  = 140;

  const maxBandPxW = isEarringPair ? 400 : 900;
  const maxBandPxH = 500;

  let scale: number;
  if (isEarringPair) {
    const totalRealW = realWidthMM * 2 + realWidthMM * 0.6;
    scale = Math.min(maxBandPxW / totalRealW, maxBandPxH / realHeightMM);
  } else {
    scale = Math.min(maxBandPxW / realWidthMM, maxBandPxH / realHeightMM);
  }

  const bandPxW = Math.round(realWidthMM  * scale);
  const bandPxH = Math.round(realHeightMM * scale);
  const gap     = Math.round(realWidthMM  * scale * 0.6);

  const totalBandW = isEarringPair ? bandPxW * 2 + gap : bandPxW;
  const CW = totalBandW + MARGIN * 2 + ANNO_RIGHT;
  const CH = bandPxH    + MARGIN * 2 + ANNO_BOTTOM;

  const canvas  = document.createElement("canvas");
  canvas.width  = CW;
  canvas.height = CH;
  const ctx     = canvas.getContext("2d")!;

  ctx.fillStyle = "#f9f9f9";
  ctx.fillRect(0, 0, CW, CH);

  const bandX = MARGIN;
  const bandY = MARGIN;

  const rects: { x: number; eng: EngravingSpec; sz: SafeZoneMargins | null; label?: string }[] =
    isEarringPair
      ? [
          { x: bandX,                 eng: leftEng,   sz: safeZoneLeft,               label: "LEFT"  },
          { x: bandX + bandPxW + gap, eng: rightEng!, sz: safeZoneRight ?? safeZoneLeft, label: "RIGHT" },
        ]
      : [{ x: bandX, eng: leftEng, sz: safeZoneLeft }];

  for (const { x: rx, eng, sz, label } of rects) {
    // ── Band rectangle (match app surface + line colour) ─────────────────────
    ctx.fillStyle   = "#f9f9f9";
    ctx.strokeStyle = "#d9d9da";
    ctx.lineWidth   = 1;
    ctx.fillRect(rx, bandY, bandPxW, bandPxH);
    ctx.strokeRect(rx, bandY, bandPxW, bandPxH);

    // Side label (earrings only)
    if (label) {
      ctx.fillStyle    = "#000000";
      ctx.font         = '16px "Geist Mono", sans-serif';
      ctx.textAlign    = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, rx + bandPxW / 2, bandY - 8);
    }

    // ── Green safe-zone box ───────────────────────────────────────────────────
    if (sz) {
      const szX = rx    + sz.left   * bandPxW;
      const szY = bandY + sz.top    * bandPxH;
      const szW = bandPxW * (1 - sz.left  - sz.right);
      const szH = bandPxH * (1 - sz.top   - sz.bottom);

      // Semi-transparent green fill
      ctx.save();
      ctx.fillStyle = "rgba(0,153,68,0.10)";
      ctx.fillRect(szX, szY, szW, szH);
      ctx.restore();

      // Thick dashed green border
      ctx.save();
      ctx.strokeStyle = "#009944";
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([6, 3.5]);
      ctx.strokeRect(szX, szY, szW, szH);
      ctx.setLineDash([]);
      ctx.restore();

      // mm values
      const szTopMM    = (sz.top    * realHeightMM).toFixed(1);
      const szBottomMM = (sz.bottom * realHeightMM).toFixed(1);
      const szLeftMM   = (sz.left   * realWidthMM ).toFixed(1);
      const szRightMM  = (sz.right  * realWidthMM ).toFixed(1);
      const safeWmm    = (realWidthMM  * (1 - sz.left  - sz.right )).toFixed(1);
      const safeHmm    = (realHeightMM * (1 - sz.top   - sz.bottom)).toFixed(1);

      // Labels outside the band so they're always legible over engraving text
      ctx.save();
      ctx.fillStyle    = "#000000";
      ctx.textAlign    = "center";
      // "SAFE ENGRAVING ZONE" + size above the green box (in the margin area)
      ctx.font         = 'bold 16px "Geist Mono", sans-serif';
      ctx.textBaseline = "bottom";
      ctx.fillText(
        `SAFE ENGRAVING ZONE — ${safeWmm} × ${safeHmm}mm`,
        szX + szW / 2, szY - 10,
      );
      // Margin distances below the band
      ctx.font         = '14px "Geist Mono", sans-serif';
      ctx.textBaseline = "top";
      ctx.fillText(
        `T: ${szTopMM}mm  ·  B: ${szBottomMM}mm  ·  L: ${szLeftMM}mm  ·  R: ${szRightMM}mm`,
        rx + bandPxW / 2, bandY + bandPxH + 10,
      );
      ctx.restore();
    }

    // ── Engraving text ────────────────────────────────────────────────────────
    if (eng.text) {
      const cx    = rx + (0.5 + eng.offsetX) * bandPxW;
      const cy    = bandY + (0.5 + eng.offsetY) * bandPxH;
      const fs    = Math.max(10, eng.fontSize * bandPxH);
      const lh    = fs * (eng.lineSpacing ?? 1.0);
      const lines = eng.text.split("\n");

      // In the diagram, draw text right-side-up for readability.
      // Rings/pendants use rotation=-180° as a texture artifact; earrings (±90°) keep
      // their rotation since the text genuinely runs along the earring's long axis.
      const normRot   = ((eng.rotation % 360) + 360) % 360;
      const diagRot   = (normRot === 90 || normRot === 270) ? eng.rotation : 0;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((diagRot * Math.PI) / 180);
      ctx.font         = `${fs}px 'ClassiqueScript', 'Didot', serif`;
      ctx.fillStyle    = "#000000";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha  = 0.9;
      const startY = -(lines.length - 1) * lh / 2;
      lines.forEach((line, i) => {
        if (line.trim()) ctx.fillText(line, 0, startY + i * lh);
      });
      ctx.restore();

    }
  }

  // ── Red band dimension arrows ─────────────────────────────────────────────

  dimArrowH(ctx, bandX, bandX + bandPxW, bandY + bandPxH + 55,
    `${realWidthMM}mm`, "#cc2200");

  const rightEdge = isEarringPair ? bandX + bandPxW * 2 + gap : bandX + bandPxW;
  dimArrowV(ctx, rightEdge + 55, bandY, bandY + bandPxH,
    `${realHeightMM}mm`, "#cc2200");

  // ── Title / legend ────────────────────────────────────────────────────────
  ctx.fillStyle    = "#000000";
  ctx.font         = 'bold 22px "Geist Mono", sans-serif';
  ctx.textAlign    = "left";
  ctx.textBaseline = "top";
  ctx.fillText("TECHNICAL FLAT PLAN", 24, 24);
  ctx.font      = '13px "Geist Mono", sans-serif';
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "Pale panel = full band  ·  Green = safe engraving zone  ·  Red = band dimensions  ·  All measurements in mm",
    24, 52,
  );


  return canvas;
}

// ─── Bump page canvas (bump map + ruler) ─────────────────────────────────────

function createBumpPageCanvas(
  bumpCanvas:     HTMLCanvasElement | null,
  bumpCanvasRight: HTMLCanvasElement | null | undefined,
  isEarring:      boolean,
  variant:        string | null,
  ringSize:       string | null,
): HTMLCanvasElement {
  const OUT_W  = 1600;
  const RULER_H = 80;
  const PAD     = 40;

  const srcH   = bumpCanvas ? bumpCanvas.height : 400;
  const srcW   = bumpCanvas ? bumpCanvas.width  : 800;
  const aspect = srcW / srcH;

  let imgH: number;
  let imgW: number;

  if (isEarring && bumpCanvasRight) {
    // Two side-by-side earring canvases
    const singleW = Math.floor((OUT_W - PAD * 3) / 2);
    imgW = singleW;
    imgH = Math.round(singleW / aspect);
  } else {
    imgW = OUT_W - PAD * 2;
    imgH = Math.round(imgW / aspect);
  }

  const OUT_H = PAD + imgH + RULER_H + PAD;
  const canvas = document.createElement("canvas");
  canvas.width  = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f9f9f9";
  ctx.fillRect(0, 0, OUT_W, OUT_H);

  // Rings and pendants engrave with rotation=-180° (texture is inside-out for 3D mapping).
  // Flip 180° here so the bump map reads right-side-up for the engraver.
  const needsFlip = variant === "ringClassic" || variant === "ringConcave"
                 || variant === "ringClassicNoGem" || variant === "ringConcaveNoGem"
                 || variant === "pendantOne"  || variant === "pendantTwo"
                 || variant === "pendantMesmo";

  /** Draw a canvas image, optionally flipped 180° */
  function drawBump(src: HTMLCanvasElement, x: number, y: number, w: number, h: number) {
    if (needsFlip) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(src, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(src, x, y, w, h);
    }
  }

  if (bumpCanvas) {
    if (isEarring && bumpCanvasRight) {
      const x1 = PAD;
      const x2 = PAD + imgW + PAD;
      drawBump(bumpCanvas,       x1, PAD, imgW, imgH);
      drawBump(bumpCanvasRight,  x2, PAD, imgW, imgH);

      // Labels
      ctx.fillStyle    = "#000000";
      ctx.font         = '18px "Geist Mono", sans-serif';
      ctx.textAlign    = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("LEFT",  x1 + imgW / 2, PAD - 6);
      ctx.fillText("RIGHT", x2 + imgW / 2, PAD - 6);

      // Borders
      ctx.strokeStyle = "#d9d9da"; ctx.lineWidth = 0.5;
      ctx.strokeRect(x1 - 1, PAD - 1, imgW + 2, imgH + 2);
      ctx.strokeRect(x2 - 1, PAD - 1, imgW + 2, imgH + 2);

      drawRuler(ctx, PAD, PAD + imgH + 10, imgW * 2 + PAD,
        BAND_DIMENSIONS.earring_left.heightMM, RULER_H - 20);
    } else {
      drawBump(bumpCanvas, PAD, PAD, imgW, imgH);
      ctx.strokeStyle = "#d9d9da"; ctx.lineWidth = 0.5;
      ctx.strokeRect(PAD - 1, PAD - 1, imgW + 2, imgH + 2);

      const isPendantLow = variant === "pendantTwo";
      const isRing       = variant === "ringClassic" || variant === "ringConcave"
        || variant === "ringClassicNoGem" || variant === "ringConcaveNoGem";
      const isPendant    = variant === "pendantOne" || variant === "pendantMesmo";

      if (isPendantLow) {
        ctx.fillStyle    = "#000000";
        ctx.font         = '16px "Geist Mono", sans-serif';
        ctx.textAlign    = "left";
        ctx.textBaseline = "top";
        ctx.fillText("Dimensions TBC — ruler will be added once measurements are confirmed",
          PAD, PAD + imgH + 14);
      } else {
        let rulerMM: number;
        if (isRing && ringSize && RING_SIZE_DATA[ringSize]) {
          rulerMM = RING_SIZE_DATA[ringSize].circumferenceMM;
        } else if (isPendant) {
          rulerMM = BAND_DIMENSIONS.pendant_classic.widthMM;
        } else {
          rulerMM = RING_SIZE_DATA["M"].circumferenceMM;
        }
        drawRuler(ctx, PAD, PAD + imgH + 10, imgW, rulerMM, RULER_H - 20);
      }
    }
  } else {
    ctx.fillStyle    = "#f9f9f9";
    ctx.fillRect(PAD, PAD, OUT_W - PAD * 2, imgH);
    ctx.fillStyle    = "#000000";
    ctx.font         = '20px "Geist Mono", sans-serif';
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No bump map available", OUT_W / 2, PAD + imgH / 2);
  }

  return canvas;
}

/** mm ruler */
function drawRuler(
  ctx:     CanvasRenderingContext2D,
  x:       number,
  y:       number,
  widthPx: number,
  totalMM: number,
  rulerH:  number,
) {
  const pxPerMm       = widthPx / totalMM;
  const rawInterval   = totalMM / 10;
  const niceIntervals = [1, 2, 5, 10, 20];
  const tickInterval  = niceIntervals.find((v) => v >= rawInterval) ?? 10;
  const minorInterval = tickInterval / 2;
  const majorH = rulerH * 0.45;
  const minorH = rulerH * 0.22;

  ctx.save();
  ctx.strokeStyle  = "#d9d9da";
  ctx.fillStyle    = "#000000";
  ctx.font         = '14px "Geist Mono", sans-serif';
  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  ctx.lineWidth    = 0.75;

  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + widthPx, y); ctx.stroke();

  for (let mm = 0; mm <= totalMM; mm += minorInterval) {
    const px      = x + mm * pxPerMm;
    const isMajor = mm % tickInterval === 0;
    ctx.lineWidth = isMajor ? 0.75 : 0.5;
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + (isMajor ? majorH : minorH)); ctx.stroke();
    if (isMajor) ctx.fillText(`${mm}`, px, y + majorH + 3);
  }
  // End label
  ctx.textAlign = "right";
  ctx.fillText(`${totalMM}mm`, x + widthPx, y + majorH + rulerH * 0.15);
  ctx.restore();
}

// ─── jsPDF helper — page header ───────────────────────────────────────────────

function addPageHeader(
  doc:          jsPDF,
  W:            number,
  PAD:          number,
  orderRef:     string,
  pageNum:      number,
  totalPages:   number,
  pageTitle:    string,
  dateTimeStr:  string,
) {
  const H_BAR = 12; // mm

  doc.setFillColor(217, 217, 218);
  doc.rect(0, 0, W, H_BAR, "F");

  const headerInk = [0, 0, 0] as const;

  // Left: logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(headerInk[0], headerInk[1], headerInk[2]);
  doc.text("TABI DSGN", PAD, H_BAR / 2 + 1.5, { baseline: "middle" });

  // Center: page title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(headerInk[0], headerInk[1], headerInk[2]);
  doc.text(pageTitle, W / 2, H_BAR / 2 + 1.5, { align: "center", baseline: "middle" });

  // Right: order ref + date + page
  doc.setFont("courier", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(headerInk[0], headerInk[1], headerInk[2]);
  doc.text(
    `${orderRef}  ·  ${dateTimeStr}  ·  ${pageNum} / ${totalPages}`,
    W - PAD, H_BAR / 2 + 1.5,
    { align: "right", baseline: "middle" },
  );

  // Hairline rule
  doc.setDrawColor(217, 217, 218);
  doc.setLineWidth(0.1);
  doc.line(0, H_BAR, W, H_BAR);
}

// ─── jsPDF helper — fit-image ─────────────────────────────────────────────────

function addImageFitted(
  doc:    jsPDF,
  dataURL: string,
  imgW:   number,  // native px
  imgH:   number,
  x:      number,  // mm
  y:      number,
  maxW:   number,  // mm
  maxH:   number,
): { usedW: number; usedH: number } {
  const aspect = imgW / imgH;
  let dw = maxW;
  let dh = maxW / aspect;
  if (dh > maxH) { dh = maxH; dw = maxH * aspect; }
  const dx = x + (maxW - dw) / 2;
  doc.addImage(dataURL, "PNG", dx, y, dw, dh);
  return { usedW: dw, usedH: dh };
}

// ─── Public params type ───────────────────────────────────────────────────────

export interface ExportSpecSheetParams {
  variant:           string | null;
  finish:            string | null;
  gemstoneLabel:     string | null;
  ringSize:          string | null;
  /** When provided, pages are added to this existing doc instead of creating a new one. */
  _doc?:             jsPDF;
  /** Page number offset when appending to an existing doc. */
  _pageOffset?:      number;
  /** Total pages in the full multi-item doc — overrides per-item TOTAL_PAGES when set. */
  _totalPages?:      number;
  /** True for the first item in a multi-item doc — suppresses the addPage() call. */
  _isFirstItem?:     boolean;
  // Left / main engraving
  engravingText:     string;
  engravingOffsetX:  number;
  engravingOffsetY:  number;
  engravingFontSize: number;
  engravingRotation: number;
  engravingSpacing?: number;
  // Right earring (earrings only)
  engravingRightText?:     string;
  engravingRightOffsetX?:  number;
  engravingRightOffsetY?:  number;
  engravingRightFontSize?: number;
  engravingRightRotation?: number;
  engravingRightSpacing?:  number;
  /** Gem position offsets — ring/pendant uses gemPosition; earrings use left + right. */
  gemPosition?:      { x: number; y: number };
  gemPositionLeft?:  { x: number; y: number };
  gemPositionRight?: { x: number; y: number };
  /** High-res front (θ=0) PNG data URL for PDF page 1 — optional. */
  heroFrontView: string | null;
  // Three-angle camera captures
  renderViews: { front: string; left: string; right: string } | null;
  // Bump map canvases
  bumpCanvas:        HTMLCanvasElement | null;
  bumpCanvasRight?:  HTMLCanvasElement | null;
  canvasTarget:      string;
  /** Shareable design link to include in the PDF. */
  shareUrl?:         string;
  /** When true, returns the PDF as a Blob instead of triggering a browser download. */
  returnBlob?:       boolean;
}

// ─── Helper — get image pixel dimensions from dataURL ─────────────────────────

function imageDimensions(dataURL: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img  = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src    = dataURL;
  });
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportSpecSheet(params: ExportSpecSheetParams): Promise<Blob | void> {
  await loadFont();

  const {
    variant,
    finish,
    gemstoneLabel,
    ringSize,
    engravingText,
    engravingOffsetX,
    engravingOffsetY,
    engravingFontSize,
    engravingRotation,
    engravingSpacing,
    engravingRightText,
    engravingRightOffsetX,
    engravingRightOffsetY,
    engravingRightFontSize,
    engravingRightRotation,
    engravingRightSpacing,
    gemPosition,
    gemPositionLeft,
    gemPositionRight,
    heroFrontView,
    renderViews,
    bumpCanvas,
    bumpCanvasRight,
    canvasTarget,
    shareUrl,
    _doc: existingDoc,
    _pageOffset: pageOffset = 0,
    _totalPages: totalPagesOverride,
    _isFirstItem: isFirstItem = false,
  } = params;

  const isRing    = variant === "ringClassic" || variant === "ringConcave"
    || variant === "ringClassicNoGem" || variant === "ringConcaveNoGem";
  const isEarring = variant === "earrings";

  // Orientation: portrait for earrings, landscape for everything else
  const orientation = isEarring ? "portrait" : "landscape";
  const W = orientation === "landscape" ? 297 : 210; // mm
  const H = orientation === "landscape" ? 210 : 297;
  const PAD    = 12;
  const HBAR   = 12; // header bar height
  const CONTENT_Y = HBAR + 5; // top of content area

  const orderRef    = makeOrderRef();
  const dateStr     = formatDateTime();
  const hasHero     = Boolean(heroFrontView);
  const itemPages   = hasHero ? 2 : 1;
  const TOTAL_PAGES = totalPagesOverride ?? itemPages;

  const doc = existingDoc ?? new jsPDF({ orientation, unit: "mm", format: "a4" });
  // When appending to an existing doc, add a new page — unless this is the first item
  // (the doc was just created with page 1 already)
  if (existingDoc && !isFirstItem) doc.addPage("a4", orientation);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — Large front view (optional)
  // ═══════════════════════════════════════════════════════════════════════════
  if (hasHero && heroFrontView) {
    addPageHeader(doc, W, PAD, orderRef, pageOffset + 1, TOTAL_PAGES, "DESIGN — FRONT VIEW", dateStr);
    const contentTop = HBAR + 4;
    const heroPad   = isEarring ? 4 : PAD;
    const heroMaxW  = W - heroPad * 2;
    const heroMaxH  = H - contentTop - heroPad;
    const heroDims  = await imageDimensions(heroFrontView);
    addImageFitted(
      doc, heroFrontView,
      heroDims.w, heroDims.h,
      heroPad, contentTop, heroMaxW, heroMaxH,
    );
    doc.addPage("a4", orientation);
  }

  // ── Real-world dimensions for this variant ──────────────────────────────────
  let realWidthMM:  number | null = null;
  let realHeightMM: number | null = null;

  if (variant === "ringClassic" || variant === "ringClassicNoGem") {
    realWidthMM  = ringSize && RING_SIZE_DATA[ringSize]
      ? RING_SIZE_DATA[ringSize].circumferenceMM
      : BAND_DIMENSIONS.ring_classic.circumferenceMM;
    realHeightMM = BAND_DIMENSIONS.ring_classic.heightMM;
  } else if (variant === "ringConcave" || variant === "ringConcaveNoGem") {
    realWidthMM  = ringSize && RING_SIZE_DATA[ringSize]
      ? RING_SIZE_DATA[ringSize].circumferenceMM
      : BAND_DIMENSIONS.ring_concave.circumferenceMM;
    realHeightMM = BAND_DIMENSIONS.ring_concave.heightMM;
  } else if (variant === "pendantOne" || variant === "pendantMesmo") {
    realWidthMM  = BAND_DIMENSIONS.pendant_classic.widthMM;
    realHeightMM = BAND_DIMENSIONS.pendant_classic.heightMM;
  } else if (variant === "pendantTwo") {
    realWidthMM  = BAND_DIMENSIONS.pendant_low.widthMM;
    realHeightMM = BAND_DIMENSIONS.pendant_low.heightMM;
  } else if (isEarring) {
    realWidthMM  = BAND_DIMENSIONS.earring_left.widthMM;
    realHeightMM = BAND_DIMENSIONS.earring_left.heightMM;
  }

  // ── Engraving measurements (only if bump canvas and real dims are available) ─
  let leftMeasurements:  EngravingMeasurements | undefined;
  let rightMeasurements: EngravingMeasurements | undefined;

  if (bumpCanvas && realWidthMM !== null && realHeightMM !== null) {
    leftMeasurements = measureEngraving(
      engravingText, engravingOffsetX, engravingOffsetY,
      engravingFontSize, engravingSpacing ?? 1.0,
      bumpCanvas.width, bumpCanvas.height,
      realWidthMM, realHeightMM,
    );
  }
  if (isEarring && bumpCanvasRight && realWidthMM !== null && realHeightMM !== null) {
    rightMeasurements = measureEngraving(
      engravingRightText ?? "", engravingRightOffsetX ?? 0, engravingRightOffsetY ?? 0,
      engravingRightFontSize ?? engravingFontSize, engravingRightSpacing ?? 1.0,
      bumpCanvasRight.width, bumpCanvasRight.height,
      realWidthMM, realHeightMM,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Spec sheet page (page 2 if hero exists, else page 1)
  // ═══════════════════════════════════════════════════════════════════════════
  const specPageNum = pageOffset + (hasHero ? 2 : 1);
  addPageHeader(doc, W, PAD, orderRef, specPageNum, TOTAL_PAGES,
    "SPECIFICATION — ENGRAVING & ORDER DETAIL", dateStr);

  const LEFT_COL_W  = orientation === "landscape" ? 182 : 118;
  const RIGHT_COL_X = orientation === "landscape" ? PAD + LEFT_COL_W + 5 : PAD + LEFT_COL_W + 5;
  const RIGHT_COL_W = orientation === "landscape" ? W - RIGHT_COL_X - PAD : W - RIGHT_COL_X - PAD;

  // Vertical divider
  doc.setDrawColor(217, 217, 218);
  doc.setLineWidth(0.1);
  doc.line(PAD + LEFT_COL_W + 2, CONTENT_Y, PAD + LEFT_COL_W + 2, H - PAD);

  // ── Three camera captures ─────────────────────────────────────────────────
  let captureY = CONTENT_Y;
  const captureLabel = (txt: string, cx: number, cy: number) => {
    doc.setFont("courier", "normal");
    doc.setFontSize(5);
    doc.setTextColor(0, 0, 0);
    doc.text(txt.toUpperCase(), cx, cy, { align: "center" });
  };

  // Small "CUSTOMER PREVIEW" section header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(0, 0, 0);
  doc.text("CUSTOMER PREVIEW", PAD, captureY + 3);
  captureY += 5;

  if (renderViews) {
    const imgW3 = (LEFT_COL_W - 4) / 3; // 3 images, 2 × 2mm gaps
    const views = [
      { url: renderViews.left,  label: "Left View"  },
      { url: renderViews.front, label: "Front View" },
      { url: renderViews.right, label: "Right View" },
    ];

    // Get dimensions of first image to determine row height
    const firstDims = await imageDimensions(renderViews.front);
    const captureAspect = firstDims.w / firstDims.h;
    const maxCaptureH = orientation === "landscape" ? 68 : 50;
    let rowH = imgW3 / captureAspect;
    if (rowH > maxCaptureH) rowH = maxCaptureH;

    for (let i = 0; i < views.length; i++) {
      const { url, label } = views[i];
      const ix = PAD + i * (imgW3 + 2);
      const dims = await imageDimensions(url);
      const iAspect = dims.w / dims.h;
      // Fit image within imgW3 × rowH box preserving aspect ratio
      let iW = imgW3;
      let iH = iW / iAspect;
      if (iH > rowH) {
        iH = rowH;
        iW = iH * iAspect;
      }
      const iy = captureY + (rowH - iH) / 2;
      const ixi = ix + (imgW3 - iW) / 2; // centre horizontally in column
      doc.addImage(url, "PNG", ixi, iy, iW, iH);
      // Thin border
      doc.setDrawColor(217, 217, 218);
      doc.setLineWidth(0.1);
      doc.rect(ixi, iy, iW, iH);
      captureLabel(label, ix + imgW3 / 2, captureY + rowH + 3.5);
    }
    captureY += rowH + 6;
  } else {
    // Placeholder
    doc.setFillColor(249, 249, 249);
    doc.rect(PAD, captureY, LEFT_COL_W, 50, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("3D render unavailable", PAD + LEFT_COL_W / 2, captureY + 26, { align: "center" });
    captureY += 54;
  }

  // ── Bump map — left column, below camera renders ─────────────────────────
  if (bumpCanvas) {
    doc.setFont("courier", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(0, 0, 0);
    doc.text("ENGRAVING BUMP MAP — PRODUCTION FILE", PAD, captureY + 3);
    captureY += 6;

    const bumpPageCanvas = createBumpPageCanvas(
      bumpCanvas, bumpCanvasRight, isEarring, variant, ringSize,
    );
    const bumpAvailW = LEFT_COL_W;
    const bumpAvailH = H - PAD - captureY - 10; // 10mm for notes below
    const { usedH: bumpUsedH } = addImageFitted(
      doc, bumpPageCanvas.toDataURL("image/png"),
      bumpPageCanvas.width, bumpPageCanvas.height,
      PAD, captureY, bumpAvailW, bumpAvailH,
    );
    captureY += bumpUsedH + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(0, 0, 0);
    doc.text("White = engrave  ·  Black = no engrave", PAD, captureY);
    captureY += 3.5;

    if (isRing && ringSize) {
      const mCirc   = RING_SIZE_DATA["M"].circumferenceMM;
      const selCirc = RING_SIZE_DATA[ringSize]?.circumferenceMM ?? mCirc;
      const factor  = (selCirc / mCirc).toFixed(3);
      doc.setFont("courier", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Size M preview — scale ×${factor} for size ${ringSize} (${selCirc}mm circ).`,
        PAD, captureY,
      );
    }
  }

  // ── Right column / order summary ──────────────────────────────────────────
  let sy  = CONTENT_Y;
  const summaryX = RIGHT_COL_X;
  const maxSW    = RIGHT_COL_W;

  function sLabel(text: string) {
    doc.setFont("courier", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(0, 0, 0);
    doc.text(text.toUpperCase(), summaryX, sy);
    sy += 3.5;
  }

  function sValue(text: string, bold = false, italic = false) {
    doc.setFont("helvetica", italic ? "italic" : bold ? "bold" : "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, maxSW);
    doc.text(lines, summaryX, sy);
    sy += lines.length * 4.2 + 1;
  }

  function sDivider() {
    doc.setDrawColor(217, 217, 218);
    doc.setLineWidth(0.1);
    doc.line(summaryX, sy, summaryX + maxSW, sy);
    sy += 3;
  }

  sLabel("Piece");
  sValue(VARIANT_LABELS[variant ?? ""] ?? variant ?? "—", true);
  sDivider();

  if (isRing) {
    sLabel("Ring Size");
    if (ringSize && RING_SIZE_DATA[ringSize]) {
      const rs = RING_SIZE_DATA[ringSize];
      sValue(`Size ${ringSize} — Ø${rs.diameterMM}mm — ${rs.circumferenceMM}mm circ — EU ${rs.euSize} — US ${rs.usSize}`);
    } else {
      sValue("Not selected");
    }
    sDivider();
  }

  sLabel("Finish");
  sValue(finish ? finish.charAt(0).toUpperCase() + finish.slice(1) : "—");
  sDivider();

  if (!isEarring) {
    sLabel("Stone");
    sValue(gemstoneLabel ?? "—");
    sDivider();
  }

  if (!isEarring && gemPosition) {
    sLabel("Stone Position");
    sValue(`X ${gemPosition.x.toFixed(3)}  ·  Y ${gemPosition.y.toFixed(3)}`);
    sDivider();
  }
  if (isEarring && (gemPositionLeft || gemPositionRight)) {
    sLabel("Stone Position");
    if (gemPositionLeft)  sValue(`Left  —  X ${gemPositionLeft.x.toFixed(3)}  ·  Y ${gemPositionLeft.y.toFixed(3)}`);
    if (gemPositionRight) sValue(`Right  —  X ${gemPositionRight.x.toFixed(3)}  ·  Y ${gemPositionRight.y.toFixed(3)}`);
    sDivider();
  }

  sLabel("Engraving Text");
  const engLines = (engravingText || "(none)").split("\n");
  for (const line of engLines) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(line || "(blank)", summaryX, sy);
    sy += 5;
  }
  if (isEarring && engravingRightText) {
    doc.setFont("courier", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(0, 0, 0);
    doc.text("RIGHT:", summaryX, sy); sy += 3;
    for (const line of engravingRightText.split("\n")) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(line || "(blank)", summaryX, sy);
      sy += 5;
    }
  }
  sy += 1;
  sDivider();

  sLabel("Engraving Parameters");
  const leftPrefix = isEarring ? "Left — " : "";
  sValue(
    `${leftPrefix}Size ${engravingFontSize.toFixed(2)}  ·  Pos X ${engravingOffsetX.toFixed(2)}` +
    `  ·  Pos Y ${engravingOffsetY.toFixed(2)}` +
    (engravingSpacing !== undefined ? `  ·  Spacing ${engravingSpacing.toFixed(2)}` : "") +
    `  ·  Rotation ${engravingRotation}°`
  );
  if (isEarring && engravingRightText !== undefined) {
    sValue(
      `Right — Size ${(engravingRightFontSize ?? engravingFontSize).toFixed(2)}` +
      `  ·  Pos X ${(engravingRightOffsetX ?? 0).toFixed(2)}` +
      `  ·  Pos Y ${(engravingRightOffsetY ?? 0).toFixed(2)}` +
      (engravingRightSpacing !== undefined ? `  ·  Spacing ${engravingRightSpacing.toFixed(2)}` : "") +
      `  ·  Rotation ${engravingRightRotation ?? engravingRotation}°`
    );
  }
  sDivider();

  sLabel("Canvas Resolution");
  sValue(canvasTarget);
  sDivider();

  // Measurements section
  if (leftMeasurements) {
    sLabel("Engraving Measurements");
    sValue(`Block: ${leftMeasurements.blockWidthMM.toFixed(1)} × ${leftMeasurements.blockHeightMM.toFixed(1)}mm`);
    sValue(`Top gap: ${leftMeasurements.gapTopMM.toFixed(1)}mm  ·  Bottom: ${leftMeasurements.gapBottomMM.toFixed(1)}mm`);
    sValue(`Left gap: ${leftMeasurements.gapLeftMM.toFixed(1)}mm  ·  Right: ${leftMeasurements.gapRightMM.toFixed(1)}mm`);
    sValue(`Letter cap height: ${leftMeasurements.letterHeightMM.toFixed(1)}mm`);
    sDivider();
  }
  if (rightMeasurements) {
    sLabel("Engraving Measurements — Right");
    sValue(`Block: ${rightMeasurements.blockWidthMM.toFixed(1)} × ${rightMeasurements.blockHeightMM.toFixed(1)}mm`);
    sValue(`Top gap: ${rightMeasurements.gapTopMM.toFixed(1)}mm  ·  Bottom: ${rightMeasurements.gapBottomMM.toFixed(1)}mm`);
    sValue(`Letter cap height: ${rightMeasurements.letterHeightMM.toFixed(1)}mm`);
    sDivider();
  }

  // Scale note
  if (isRing && ringSize) {
    const mCirc   = RING_SIZE_DATA["M"].circumferenceMM;
    const selCirc = RING_SIZE_DATA[ringSize]?.circumferenceMM ?? mCirc;
    const factor  = (selCirc / mCirc).toFixed(3);
    sLabel("Scale Note");
    sValue(
      `Preview at size M (${mCirc}mm). ` +
      `Selected: ${ringSize} = ${selCirc}mm. ` +
      `Scale factor: ×${factor}`,
    );
  } else if (variant === "pendantTwo") {
    sLabel("Scale Note");
    sValue("MOMENT — dimensions TBC.");
  }

  // ── Share link ────────────────────────────────────────────────────────────
  if (shareUrl) {
    sDivider();
    sLabel("Design Link");
    sValue(shareUrl);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  {
    const footerY = H - PAD / 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(0, 0, 0);
    doc.text(
      "Engraving preview modelled at size M. Adjust proportionally for other sizes. For production use only.",
      W / 2, footerY, { align: "center" },
    );
  }

  // ── Save or return PDF ────────────────────────────────────────────────────
  if (existingDoc) return; // caller owns the doc — don't save here
  const pieceSlug = (variant ?? "piece").replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
  const sizeSlug  = isRing && ringSize ? `-${ringSize.toLowerCase()}` : "";
  const filename  = `TABI-save-${pieceSlug}${sizeSlug}-${fileDateSlug()}.pdf`;
  if (params.returnBlob) {
    return doc.output("blob");
  }
  doc.save(filename);
}

// ─── Multi-item export — one PDF with pages for every bag item ────────────────

export interface MultiItemSpecParams {
  variant:           string | null;
  finish:            string | null;
  gemstoneLabel:     string | null;
  ringSize:          string | null;
  engravingText:     string;
  engravingOffsetX:  number;
  engravingOffsetY:  number;
  engravingFontSize: number;
  engravingRotation: number;
  engravingSpacing?: number;
  engravingRightText?:     string;
  engravingRightOffsetX?:  number;
  engravingRightOffsetY?:  number;
  engravingRightFontSize?: number;
  engravingRightRotation?: number;
  engravingRightSpacing?:  number;
  gemPosition?:      { x: number; y: number };
  gemPositionLeft?:  { x: number; y: number };
  gemPositionRight?: { x: number; y: number };
  heroFrontView:     string | null;
  renderViews:       { front: string; left: string; right: string } | null;
  bumpCanvas:        HTMLCanvasElement | null;
  bumpCanvasRight?:  HTMLCanvasElement | null;
  canvasTarget:      string;
  shareUrl?:         string;
}

export async function exportMultiItemSpecSheet(items: MultiItemSpecParams[]): Promise<Blob | null> {
  if (items.length === 0) return null;
  await loadFont();

  // Count total pages across all items
  let totalPages = 0;
  for (const item of items) {
    totalPages += item.heroFrontView ? 2 : 1;
  }

  // Use the orientation of the first item to initialise the doc
  const firstIsEarring = items[0].variant === "earrings";
  const firstOrientation = firstIsEarring ? "portrait" : "landscape";
  const doc = new jsPDF({ orientation: firstOrientation, unit: "mm", format: "a4" });

  let pageOffset = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await exportSpecSheet({
      ...item,
      returnBlob:   false,
      _doc:         doc,
      _pageOffset:  pageOffset,
      _totalPages:  totalPages,
      _isFirstItem: i === 0,
    });
    pageOffset += item.heroFrontView ? 2 : 1;
  }

  return doc.output("blob");
}
