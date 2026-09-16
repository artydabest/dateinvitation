/**
 * Bouquet rendering for the keepsake PDF.
 *
 * Two ways to draw the wrap under her flowers:
 *  1. If `client/public/assets/bouquet-wrap.png` exists, it is used directly
 *     (white pixels become transparent so it composites on the card).
 *  2. Otherwise a vector "navy tissue cone" inspired by the reference photo
 *     is drawn: layered translucent folds in the same steel blue.
 *
 * Her picked flowers fan above the wrap either way, tucked behind its rim.
 */
import type { PDFDocument, PDFImage, PDFPage } from "pdf-lib";
import { rgb, degrees } from "pdf-lib";
import Jimp from "jimp";
import fsp from "node:fs/promises";
import path from "node:path";
import { serverRoot } from "../paths.js";

/* ── Blues sampled from the reference tissue photo ── */
const TISSUE = {
  deep: rgb(0.157, 0.267, 0.431), // #28446e — inner shadow fold
  base: rgb(0.255, 0.365, 0.537), // #415d89 — main body
  mid: rgb(0.353, 0.463, 0.627), // #5a76a0 — lit fold
  light: rgb(0.494, 0.588, 0.729), // #7e96ba — bright rim
};

function clientAssetPath(relPath: string): string {
  return path.join(serverRoot, "../client/public", relPath.replace(/^\/+/, ""));
}

/**
 * Load the optional custom wrap image with a white→alpha key applied.
 * Returns null when the file is absent or unreadable (fallback kicks in).
 */
export async function loadBouquetWrapImage(
  doc: PDFDocument,
): Promise<PDFImage | null> {
  try {
    const bytes = await fsp.readFile(clientAssetPath("/assets/bouquet-wrap.png"));
    const img = await Jimp.read(bytes);
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    // simple luminance key: near-white → transparent
    img.scan(0, 0, w, h, function (this: Jimp, x: number, y: number, idx: number) {
      const r = this.bitmap.data[idx]!;
      const g = this.bitmap.data[idx + 1]!;
      const b = this.bitmap.data[idx + 2]!;
      const lum = (r + g + b) / 3;
      if (lum > 242) {
        this.bitmap.data[idx + 3] = 0;
      } else if (lum > 200) {
        // feather the edge so cut-out doesn't look jaggy
        this.bitmap.data[idx + 3] = Math.round(255 * ((242 - lum) / 42));
      }
    });
    const keyed = await img.getBufferAsync("image/png");
    return doc.embedPng(keyed);
  } catch {
    return null;
  }
}

/** Draw the vector fallback: a fan of translucent tissue folds. */
function drawTissueCone(page: PDFPage, cx: number, topY: number, size: number) {
  // back layer — the taller sheets peeking behind
  const fold = (
    angleDeg: number,
    length: number,
    halfWidthDeg: number,
    color: ReturnType<typeof rgb>,
    opacity: number,
  ) => {
    const a = degrees(angleDeg - halfWidthDeg).angle;
    const b = degrees(angleDeg + halfWidthDeg).angle;
    const x1 = cx + Math.cos(a) * length;
    const y1 = topY + Math.sin(a) * length;
    const x2 = cx + Math.cos(b) * length;
    const y2 = topY + Math.sin(b) * length;
    page.drawSvgPath(`M ${cx} ${topY} L ${x1} ${y1} L ${x2} ${y2} Z`, {
      x: 0,
      y: 0,
      scale: 1,
      color,
      opacity,
      borderColor: color,
      borderWidth: 0.5,
      borderOpacity: opacity * 0.9,
    });
  };

  // outermost, darkest first; pdf-lib y grows upward so fan spans ~-10°..190°
  fold(28, size * 1.02, 11, TISSUE.deep, 0.95);
  fold(62, size * 1.06, 10, TISSUE.deep, 0.9);
  fold(152, size * 1.02, 11, TISSUE.deep, 0.95);
  fold(118, size * 1.06, 10, TISSUE.deep, 0.9);

  fold(45, size * 1.0, 12, TISSUE.base, 0.98);
  fold(90, size * 1.08, 12, TISSUE.base, 0.98);
  fold(135, size * 1.0, 12, TISSUE.base, 0.98);

  fold(70, size * 0.92, 9, TISSUE.mid, 0.95);
  fold(110, size * 0.92, 9, TISSUE.mid, 0.95);

  // inner sheen
  fold(88, size * 0.7, 8, TISSUE.light, 0.8);

  // cone pinch at the bottom
  page.drawSvgPath(
    `M ${cx - size * 0.16} ${topY - size * 0.12} L ${cx} ${topY - size * 0.3} L ${cx + size * 0.16} ${topY - size * 0.12} Z`,
    { x: 0, y: 0, scale: 1, color: TISSUE.deep, opacity: 0.95 },
  );
}

/**
 * Draw her bouquet: custom wrap image (or vector cone), flowers fanned
 * above it, tucked behind the rim.
 */
export function drawBouquet(
  page: PDFPage,
  wrap: PDFImage | null,
  flowers: { img: PDFImage; rotate: number }[],
  cx: number,
  baseY: number,
  layout: { spread: number; size: number; tilt: number },
) {
  if (wrap) {
    const h = (wrap.height / wrap.width) * layout.size * 1.15;
    const w = layout.size * 1.15;
    page.drawImage(wrap, { x: cx - w / 2, y: baseY - h * 0.62, width: w, height: h });
  } else {
    drawTissueCone(page, cx, baseY + 18, layout.size * 0.9);
  }

  // flowers: outermost first so center flowers layer on top
  const ordered = flowers
    .map((f, i) => ({ ...f, i }))
    .sort(
      (a, b) =>
        Math.abs(b.i - (flowers.length - 1) / 2) -
        Math.abs(a.i - (flowers.length - 1) / 2),
    );
  for (const { img, rotate, i } of ordered) {
    const offset = i - (flowers.length - 1) / 2;
    const w = layout.size * (1 - Math.abs(offset) * 0.09);
    const h = (img.height / img.width) * w;
    const x = cx + offset * layout.spread - w / 2;
    const y = baseY + 10 + (1 - Math.abs(offset) / Math.max(flowers.length, 1)) * 14;
    page.drawImage(img, { x, y, width: w, height: h, rotate: degrees(rotate + offset * layout.tilt) });
  }
}
