/**
 * Bouquet rendering for the keepsake PDF — mirrors the landing page's
 * arrangement (client/src/components/Bouquet.tsx): her picked flowers
 * fanned and overlapping in a loose gathered bunch, stems tucked into a
 * small pastel pink paper cone that sits on top.
 *
 * No wrap photo, no Jimp pixel passes — just the flower PNGs (embedded
 * once per type, resized per draw size via the cache in
 * invitationPdf.service) and a few translucent vector folds.
 */
import type { PDFImage, PDFPage } from "pdf-lib";
import { rgb, degrees } from "pdf-lib";

/* ── The site's pastel pink, sampled from the .bq-wrap cone in index.css
 *    (linear-gradient(160deg, #f6d7dd → #f3c4cd → #e9aebc)) ── */
const CONE = {
  deep: rgb(0.914, 0.682, 0.737), // #e9aebc — inner shadow fold
  base: rgb(0.965, 0.843, 0.867), // #f6d7dd — main body
  light: rgb(0.996, 0.914, 0.929), // #fee9ed — lit fold
};

/** Draw the small pink paper cone (the landing page's .bq-wrap). */
function drawPinkCone(page: PDFPage, cx: number, apexY: number, height: number) {
  // drawSvgPath flips y (SVG +y renders upward), so negative y = down the page.
  const halfTop = height * 0.42;

  // back sheet — slightly taller and wider, peeking behind the front fold
  page.drawSvgPath(
    `M 0 0 L ${-halfTop * 0.86} ${-height * 1.12} L ${halfTop * 1.1} ${-height * 1.04} Z`,
    {
      x: cx,
      y: apexY,
      color: CONE.base,
      opacity: 0.92,
      borderColor: CONE.base,
      borderWidth: 0.5,
      borderOpacity: 0.9,
    },
  );

  // main front fold — the triangle you see on the landing page
  page.drawSvgPath(`M 0 0 L ${-halfTop} ${-height} L ${halfTop} ${-height} Z`, {
    x: cx,
    y: apexY,
    color: CONE.base,
    opacity: 0.95,
    borderColor: CONE.deep,
    borderWidth: 0.6,
    borderOpacity: 0.55,
  });

  // lit fold — a sheen on the left face
  page.drawSvgPath(`M 0 0 L ${-halfTop * 0.9} ${-height} L ${-halfTop * 0.28} ${-height * 0.82} Z`, {
    x: cx,
    y: apexY,
    color: CONE.light,
    opacity: 0.85,
  });

  // shadow fold — right face
  page.drawSvgPath(`M 0 0 L ${halfTop * 0.3} ${-height * 0.86} L ${halfTop * 0.96} ${-height * 0.98} Z`, {
    x: cx,
    y: apexY,
    color: CONE.deep,
    opacity: 0.4,
  });
}

/**
 * Draw her bouquet like the landing page: flowers fanned and overlapping
 * around the cone axis (outermost first so center flowers layer on top),
 * with the small pink cone drawn last so its mouth covers the stems.
 *
 * `cx` is the cone's center axis; `baseY` is where the cone's apex sits.
 */
export function drawBouquet(
  page: PDFPage,
  flowers: { img: PDFImage; rotate: number }[],
  cx: number,
  baseY: number,
  layout: { spread: number; size: number; tilt: number },
) {
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
    const y = baseY - 10 + (1 - Math.abs(offset) / Math.max(flowers.length, 1)) * 14;
    page.drawImage(img, { x, y, width: w, height: h, rotate: degrees(rotate + offset * layout.tilt) });
  }

  // the cone wrap, ON TOP — its mouth covers the stems (like .bq-wrap)
  drawPinkCone(page, cx, baseY, layout.size * 0.78);
}
