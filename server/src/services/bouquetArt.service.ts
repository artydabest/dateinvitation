/**
 * Bouquet rendering for the keepsake PDF — a faithful port of the landing
 * page's bouquet (client/src/components/Bouquet.tsx):
 *
 *  • flowers are placed in the same fixed cluster slots (BOUQUET_SLOTS),
 *    overlapping in a gathered bunch around the cone axis — later slots
 *    draw on top, exactly like the DOM stacking on the web;
 *  • the pastel pink paper cone (.bq-wrap — blush gradient, apex pointing
 *    DOWN) is drawn LAST, ON TOP, so its wide mouth covers the stems.
 *
 * Coordinates mirror the web component 1:1 (px → pt via scale `k`):
 *  - flower bottoms sit STEM_Y − slot.y above the cone's apex;
 *  - the cone is 46 × 54 with its mouth at the top.
 */
import type { PDFImage, PDFPage } from "pdf-lib";
import { degrees, rgb } from "pdf-lib";

/* ── .bq-wrap gradient colors (index.css: #f6d7dd → #f3c4cd → #e9aebc) ── */
const CONE = {
  base: rgb(0.953, 0.769, 0.804), // #f3c4cd — mid of the gradient
  deep: rgb(0.914, 0.682, 0.737), // #e9aebc — dark end (bottom/right)
  light: rgb(0.965, 0.843, 0.867), // #f6d7dd — light end (top/left)
};

/**
 * Overlapping arrangement slots — fanned up and out from the cone's
 * center axis (x/y offsets from the cone axis, s = size scale, r = tilt).
 * Copied verbatim from BOUQUET_SLOTS in Bouquet.tsx.
 */
const BOUQUET_SLOTS = [
  { x: 0, y: -34, s: 0.95, r: -14 },
  { x: -24, y: -22, s: 0.9, r: 12 },
  { x: 24, y: -24, s: 0.88, r: -8 },
  { x: -10, y: -44, s: 0.8, r: 6 },
  { x: 14, y: -40, s: 0.78, r: -18 },
  { x: -32, y: -30, s: 0.72, r: 20 },
  { x: 32, y: -32, s: 0.7, r: 10 },
  { x: 4, y: -20, s: 0.68, r: -4 },
  { x: -18, y: -8, s: 0.62, r: 16 },
  { x: 20, y: -10, s: 0.6, r: -12 },
  { x: -36, y: -14, s: 0.58, r: 24 },
  { x: 36, y: -16, s: 0.56, r: -22 },
] as const;

/** Flower size before slot scale (pt, matches web's 56px × ~0.78 print scale). */
const FLOWER_PT = 44;
/** Where flower stems tuck into the cone (pt above the cone apex, web: 30px). */
const STEM_Y = 30;

/** The .bq-wrap cone: apex pointing DOWN, wide mouth at the top. */
function drawPinkCone(page: PDFPage, cx: number, apexY: number, k: number) {
  const w = 46 * k; // web: 46px wide
  const h = 54 * k; // web: 54px tall
  const hw = w / 2;

  // main triangle: mouth at the top (apexY + h), apex at the bottom (apexY)
  page.drawSvgPath(`M 0 0 L ${-hw} ${-h} L ${hw} ${-h} Z`, {
    x: cx,
    y: apexY,
    color: CONE.base,
    opacity: 0.97,
    borderColor: CONE.deep,
    borderWidth: 0.5,
    borderOpacity: 0.4,
  });

  // darker right face — approximates the 160° gradient's dark end
  page.drawSvgPath(`M 0 0 L ${hw} ${-h} L ${hw * 0.2} ${-h * 0.55} Z`, {
    x: cx,
    y: apexY,
    color: CONE.deep,
    opacity: 0.5,
  });

  // lighter left face — the gradient's light end
  page.drawSvgPath(`M 0 0 L ${-hw} ${-h} L ${-hw * 0.25} ${-h * 0.6} Z`, {
    x: cx,
    y: apexY,
    color: CONE.light,
    opacity: 0.6,
  });
}

/**
 * Draw her bouquet exactly like the landing page: flowers clustered in the
 * fixed slots, then the pink cone drawn ON TOP covering the stems.
 *
 * `cx` is the cone's center axis; `baseY` is the cone's apex (bottom).
 */
export function drawBouquet(
  page: PDFPage,
  flowers: { img: PDFImage; rotate: number }[],
  cx: number,
  baseY: number,
  k = 1,
) {
  // DOM order: later slots stack on top (no re-ordering — that's the web look)
  for (const [i, f] of flowers.slice(0, BOUQUET_SLOTS.length).entries()) {
    const slot = BOUQUET_SLOTS[i]!;
    const w = FLOWER_PT * slot.s * k;
    const h = (f.img.height / f.img.width) * w;
    // flower's bottom edge sits STEM_Y − slot.y above the apex (web: bottom:
    // STEM_Y, then translated up by −slot.y)
    const x = cx + slot.x * k - w / 2;
    const y = baseY + (STEM_Y - slot.y) * k;
    page.drawImage(f.img, {
      x,
      y,
      width: w,
      height: h,
      rotate: degrees(slot.r),
    });
  }

  // the cone wrap, ON TOP — its wide mouth covers the stems (like .bq-wrap)
  drawPinkCone(page, cx, baseY, k);
}
