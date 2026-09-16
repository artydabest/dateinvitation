/**
 * The keepsake — a styled A5 invitation PDF, built with pdf-lib so it works
 * everywhere (no headless browser, no external service). Drawn with the
 * site's palette so it looks like a card from the same garden.
 *
 * Emoji is deliberately avoided in text: standard PDF fonts are WinAnsi-only.
 * The personality comes from embedded art + drawn shapes instead.
 *
 * Art is embedded at full resolution — no downscaling — so the keepsake
 * stays crisp when zoomed or printed. Larger file, worth it.
 */
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import fsp from "node:fs/promises";
import path from "node:path";
import { serverRoot } from "../paths.js";

/* ── The site palette (mirrors client/tailwind.config.cjs) ── */
const C = {
  cream: rgb(0.98, 0.961, 0.933), // #faf5ee
  paper: rgb(1, 0.992, 0.973), // #fffdf8
  blush: rgb(0.965, 0.843, 0.867), // #f6d7dd
  blushdeep: rgb(0.914, 0.682, 0.737), // #e9aebc
  powder: rgb(0.737, 0.839, 0.918), // #bcd6ea
  cherry: rgb(0.784, 0.063, 0.18), // #c8102e
  leaf: rgb(0.478, 0.58, 0.443), // #7a9471
  ink: rgb(0.263, 0.208, 0.157), // #433528
  cocoa: rgb(0.42, 0.341, 0.267), // #6b5744
  custard: rgb(0.969, 0.843, 0.455), // #f7d774
};

/** A5 portrait, points. */
const PAGE_W = 419.53;
const PAGE_H = 595.28;

/** Points each static artwork is drawn at. */
export const ART_DRAW_WIDTHS = {
  sunflower: 92,
  smallPink: 62,
  lily: 88,
  pom: 58,
  kuromi: 46,
} as const;

/** Flower PNG per shared flower type (keys of FLOWER_TYPES). */
const FLOWER_FILES: Record<string, string> = {
  cherryRedHibiscus: "/assets/flowers/cherry-red-hibiscus.png",
  sunflower: "/assets/flowers/sunflower.png",
  lily: "/assets/flowers/lily.png",
  lilyAlt: "/assets/flowers/lily-alt.png",
  babysBreath: "/assets/flowers/babys-breath.png",
  smallPink: "/assets/flowers/small-pink.png",
};

export interface KeepsakeInput {
  datePretty: string; // "Saturday, September 19, 2026"
  timePretty: string; // "6:30 PM"
  activityName: string | null;
  activityPlace: string | null;
  /** Flowers she picked in the garden — drawn as her bouquet. */
  pickedFlowers: { id: string; type: string }[];
}

/** Resolve a file inside client/public (assets live there in dev + prod). */
function clientAssetPath(relPath: string): string {
  // Join, not resolve: relPath has a leading slash, and path.resolve would
  // treat that as filesystem-absolute and drop the base directory.
  return path.join(serverRoot, "../client/public", relPath.replace(/^\/+/, ""));
}

/** Embed a PNG at full resolution; null if missing/corrupt. */
async function embedBestEffort(
  doc: PDFDocument,
  relPath: string,
): Promise<PDFImage | null> {
  try {
    const bytes = await fsp.readFile(clientAssetPath(relPath));
    return await doc.embedPng(bytes);
  } catch {
    return null;
  }
}

/** Centered text helper. */
function drawCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color = C.ink,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_W - width) / 2, y, size, font, color });
}

/** Faux letter-spaced small label: "T H E   D A Y". */
function spaced(text: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((ch) => (ch === " " ? "  " : ch))
    .join(" ");
}

function drawDashedLine(
  page: PDFPage,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color = C.leaf,
) {
  page.drawLine({
    start: from,
    end: to,
    thickness: 1,
    color,
    dashArray: [1, 4],
    opacity: 0.8,
  });
}

function drawDashedFrame(page: PDFPage, m: number) {
  const x1 = m;
  const y1 = m;
  const x2 = PAGE_W - m;
  const y2 = PAGE_H - m;
  drawDashedLine(page, { x: x1, y: y1 }, { x: x2, y: y1 });
  drawDashedLine(page, { x: x2, y: y1 }, { x: x2, y: y2 });
  drawDashedLine(page, { x: x2, y: y2 }, { x: x1, y: y2 });
  drawDashedLine(page, { x: x1, y: y2 }, { x: x1, y: y1 });
}

/** Soft tinted panel behind a section. */
function drawPanel(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  color: ReturnType<typeof rgb>,
) {
  page.drawRectangle({ x, y, width: w, height: h, color, opacity: 0.45 });
  // thin deeper edge on top and bottom for a letterpress feel
  page.drawLine({
    start: { x, y },
    end: { x: x + w, y },
    thickness: 0.8,
    color,
    opacity: 0.9,
  });
  page.drawLine({
    start: { x, y: y + h },
    end: { x: x + w, y: y + h },
    thickness: 0.8,
    color,
    opacity: 0.9,
  });
}

/** Build the full keepsake PDF bytes. */
export async function buildInvitationPdf(
  input: KeepsakeInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("It's a date — the invitation");
  doc.setSubject("A very important appointment");
  doc.setCreator("dateinvitation");

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const page = doc.addPage([PAGE_W, PAGE_H]);

  /* ── Background + paper card ── */
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.cream });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: PAGE_W - 48,
    height: PAGE_H - 48,
    color: C.paper,
    opacity: 0.96,
  });
  drawDashedFrame(page, 34);

  /* ── Washi tape strips across the top corners ── */
  page.drawRectangle({
    x: 34,
    y: PAGE_H - 52,
    width: 96,
    height: 20,
    rotate: degrees(-4),
    color: C.blush,
    opacity: 0.85,
  });
  page.drawRectangle({
    x: PAGE_W - 130,
    y: PAGE_H - 50,
    width: 96,
    height: 20,
    rotate: degrees(3),
    color: C.powder,
    opacity: 0.85,
  });

  /* ── Static art (downscaled to print size; missing files are skipped) ── */
  const [sunflower, lily, smallPink, pom, kuromi] = await Promise.all([
    embedBestEffort(doc, "/assets/flowers/sunflower.png"),
    embedBestEffort(doc, "/assets/flowers/lily.png"),
    embedBestEffort(doc, "/assets/flowers/small-pink.png"),
    embedBestEffort(doc, "/assets/characters/pompompurin.png"),
    embedBestEffort(doc, "/assets/characters/kuromi.png"),
  ]);

  const drawImg = (
    img: PDFImage | null,
    x: number,
    y: number,
    w: number,
    rotateDeg = 0,
  ) => {
    if (!img) return;
    const h = (img.height / img.width) * w;
    page.drawImage(img, { x, y, width: w, height: h, rotate: degrees(rotateDeg) });
  };

  drawImg(sunflower, 40, PAGE_H - 175, ART_DRAW_WIDTHS.sunflower, -10);
  drawImg(smallPink, PAGE_W - 104, PAGE_H - 132, ART_DRAW_WIDTHS.smallPink, 14);
  drawImg(lily, PAGE_W - 128, 118, ART_DRAW_WIDTHS.lily, 9);
  drawImg(pom, 44, 92, ART_DRAW_WIDTHS.pom, -4);
  drawImg(kuromi, 108, 98, ART_DRAW_WIDTHS.kuromi, 6);

  /* ── Headline ── */
  drawCentered(page, spaced("the invitation"), body, 8.5, PAGE_H - 118, C.cocoa);
  drawCentered(page, "It's a date", bold, 34, PAGE_H - 156, C.ink);
  drawCentered(
    page,
    "wait— really?? okay okay.",
    italic,
    11,
    PAGE_H - 174,
    C.cherry,
  );
  drawCentered(page, "Sakshi & Roshan", italic, 22, PAGE_H - 204, C.cherry);

  drawDashedLine(
    page,
    { x: PAGE_W / 2 - 60, y: PAGE_H - 224 },
    { x: PAGE_W / 2 + 60, y: PAGE_H - 224 },
  );

  /* ── Day + time, on a blush panel ── */
  const panelX = 64;
  const panelW = PAGE_W - 128;
  let y = PAGE_H - 252; // top of the panel content
  drawPanel(page, panelX, y - 86, panelW, 96, C.blush);
  drawCentered(page, spaced("the day"), body, 7.5, y, C.cocoa);
  drawCentered(page, input.datePretty, serifBold, 16, y - 19);
  drawCentered(page, spaced("the time"), body, 7.5, y - 50, C.cocoa);
  drawCentered(page, input.timePretty, serifBold, 16, y - 69);
  y -= 104;

  /* ── Optional activity, on a powder panel ── */
  if (input.activityName) {
    drawPanel(page, panelX, y - 52, panelW, 62, C.powder);
    drawCentered(page, spaced("the main activity"), body, 7.5, y - 4, C.cocoa);
    drawCentered(page, input.activityName, italic, 15, y - 23);
    if (input.activityPlace) {
      drawCentered(page, input.activityPlace, body, 8.5, y - 38, C.cocoa);
    }
    y -= input.activityPlace ? 74 : 62;
  } else {
    y -= 6;
  }

  /* ── Her bouquet — the flowers she picked, fanned and tied ── */
  if (input.pickedFlowers.length > 0) {
    drawCentered(page, spaced("your bouquet"), body, 7.5, y - 6, C.cocoa);

    // embed one image per distinct flower type she picked (best effort)
    const types = [...new Set(input.pickedFlowers.map((f) => f.type))].filter(
      (t): t is string => t in FLOWER_FILES,
    );
    const imgs = new Map<string, PDFImage | null>(
      await Promise.all(
        types.map(async (t) => [t, await embedBestEffort(doc, FLOWER_FILES[t]!)] as const),
      ),
    );

    // fan them out: center flower highest, alternating sides, slight tilt
    const flowers = input.pickedFlowers.slice(0, 12);
    const cx = PAGE_W / 2;
    const baseY = y - 92;
    const gap = Math.min(26, 120 / Math.max(flowers.length, 1));
    // draw outer flowers first so the center ones sit on top
    const order = flowers
      .map((f, i) => ({ f, i }))
      .sort((a, b) => Math.abs(a.i - (flowers.length - 1) / 2) * -1 - Math.abs(b.i - (flowers.length - 1) / 2) * -1)
      .map((o) => o.i)
      .reverse();
    for (const i of order) {
      const f = flowers[i]!;
      const img = imgs.get(f.type);
      if (!img) continue;
      const offset = i - (flowers.length - 1) / 2;
      const w = 40 - Math.abs(offset) * 3.5;
      const fx = cx + offset * gap - w / 2;
      const fy = baseY + 14 - Math.abs(offset) * 4.5;
      const h = (img.height / img.width) * w;
      page.drawImage(img, {
        x: fx,
        y: fy,
        width: w,
        height: h,
        rotate: degrees(offset * 2.2),
      });
    }

    // a little leaf bow under the fan
    page.drawCircle({ x: cx - 5, y: baseY + 4, size: 4.5, color: C.leaf });
    page.drawCircle({ x: cx + 5, y: baseY + 4, size: 4.5, color: C.leaf });
    page.drawCircle({ x: cx, y: baseY + 6, size: 3, color: C.leaf });

    drawCentered(
      page,
      "every flower you picked, saved forever",
      italic,
      9.5,
      baseY - 14,
      C.cocoa,
    );
    y = baseY - 34;
  }

  /* ── Footer ── */
  drawCentered(
    page,
    "P.S. i ain't splitting the bill, just so you know.",
    italic,
    9,
    46,
    C.cocoa,
  );

  /* ── Folio — like a page number, out in the margin below the frame ── */
  drawCentered(page, "— the first of many —", italic, 8.5, 22, C.cocoa);

  return doc.save();
}
