/**
 * The keepsake — a styled A5 invitation PDF, built with pdf-lib so it works
 * everywhere (no headless browser, no external service). Drawn with the
 * site's palette so it looks like a card from the same garden.
 *
 * Emoji is deliberately avoided in text: standard PDF fonts are WinAnsi-only.
 * The personality comes from embedded art + drawn shapes instead.
 *
 * Art is embedded once per (file, pixel-size) pair and cached across
 * requests — the stock PNGs are huge, and re-encoding them on every
 * download was what made this endpoint crawl.
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
import crypto from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { serverRoot } from "../paths.js";
import { env } from "../env.js";
import { drawBouquet } from "./bouquetArt.service.js";
import {
  ACTIVITY_OPTIONS,
} from "../../../shared/invitation.config.js";
import {
  formatPretty,
  formatTimePretty,
  isValidDateString,
  isValidTimeString,
} from "../utils/time.js";

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

/* ══════════════ Stateless signed links (no database needed) ══════════════
 * The RSVP store is in-memory on Render's free tier, so stored invitations
 * vanish on restart — and a DB-backed PDF link would 404 after any deploy.
 * Instead the link itself carries the full card state, HMAC-signed so it
 * can't be forged or tampered with. The PDF regenerates on every request.
 * ════════════════════════════════════════════════════════════════════ */

/** Compact URL-safe token: "d{date}t{time}a{activity}f{types}|sig". */
export function buildPdfToken(
  input: Pick<KeepsakeInput, "datePretty" | "timePretty"> & {
    selectedDate: string;
    selectedTime: string;
    activityId: string | null;
    pickedFlowers: { id: string; type: string }[];
  },
): string {
  const types = input.pickedFlowers.map((f) => f.type);
  const payload = [
    input.selectedDate,
    input.selectedTime,
    input.activityId ?? "-",
    types.join(","),
  ].join("~");
  const sig = crypto
    .createHmac("sha256", env.pdfLinkSecret)
    .update(payload)
    .digest("base64url")
    .slice(0, 24);
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/** Verify a token and rebuild the card input; null if tampered/invalid. */
export async function parsePdfToken(
  token: string,
): Promise<KeepsakeInput | null> {
  const [payloadB64 = "", sig = ""] = token.split(".");
  if (!payloadB64 || !sig) return null;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expected = crypto
      .createHmac("sha256", env.pdfLinkSecret)
      .update(payload)
      .digest("base64url")
      .slice(0, 24);
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const [selectedDate = "", selectedTime = "", activityId = "", flowerTypes = ""] =
    payload.split("~");
  if (!isValidDateString(selectedDate) || !isValidTimeString(selectedTime)) {
    return null;
  }

  const activity =
    activityId !== "-"
      ? ACTIVITY_OPTIONS.find((a) => a.id === activityId) ?? null
      : null;
  const types = flowerTypes ? flowerTypes.split(",").filter((t) => t in FLOWER_FILES) : [];

  return {
    datePretty: formatPretty(selectedDate),
    timePretty: formatTimePretty(selectedTime),
    activityName: activity?.name ?? null,
    activityPlace: activity?.place ?? null,
    // ids are irrelevant to the drawing; give each type a stable pseudo-id
    pickedFlowers: types.map((type, i) => ({ id: `t${i}`, type })),
  };
}

/** Resolve a file inside client/public (assets live there in dev + prod). */
function clientAssetPath(relPath: string): string {
  // Join, not resolve: relPath has a leading slash, and path.resolve would
  // treat that as filesystem-absolute and drop the base directory.
  return path.join(serverRoot, "../client/public", relPath.replace(/^\/+/, ""));
}

/* ── Embedded-art cache ──────────────────────────────────────────────────
 * Embedding a PNG decodes + re-encodes every pixel, and the stock flower
 * art is 0.3–2 MP per file. Doing that on every PDF request is seconds of
 * CPU — so each (file, draw-width) pair is embedded exactly once, resized
 * to its draw size, and reused by every later request. Two graceful
 * degenerations: if the sharp preprocessor is unavailable we embed the
 * original bytes (crisp, just bigger); if a file is missing we skip it.
 * ──────────────────────────────────────────────────────────────────── */

/** One entry per embedded art image for this process. */
const artCache = new Map<string, PDFImage>();

/** Best-effort sharp import; sharp is optional so deploys stay light. */
async function loadSharp(): Promise<typeof import("sharp") | null> {
  try {
    // CJS interop: the callable factory can sit on .default or the namespace
    const mod = (await import("sharp")) as unknown as {
      default?: typeof import("sharp");
    };
    return mod.default ?? (mod as unknown as typeof import("sharp"));
  } catch {
    return null;
  }
}

/** Read + preprocess asset bytes to a natural aspect at ~3× draw width. */
async function loadPreprocessedBytes(
  relPath: string,
  targetPx: number,
): Promise<{ bytes: Buffer; width: number; height: number } | null> {
  try {
    const raw = await fsp.readFile(clientAssetPath(relPath));
    const sharp = await loadSharp();
    if (!sharp) return { bytes: raw, width: 0, height: 0 };

    const meta = await sharp(raw).metadata();
    const srcW = meta.width ?? 0;
    const srcH = meta.height ?? 0;
    if (srcW <= 0 || srcH <= 0) return { bytes: raw, width: 0, height: 0 };

    const width = Math.max(1, Math.min(srcW, Math.ceil(targetPx * 3)));
    const height = Math.max(1, Math.round((width * srcH) / srcW));
    const bytes = await sharp(raw)
      .resize(width, height, { fit: "inside" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return { bytes, width, height };
  } catch {
    return null;
  }
}

/** Embed an asset at draw width `w` (cached per file+size); null if missing. */
async function embedArt(
  doc: PDFDocument,
  relPath: string,
  w: number,
): Promise<PDFImage | null> {
  const key = `${relPath}@${Math.round(w)}`;
  const hit = artCache.get(key);
  if (hit) return hit;

  const prepared = await loadPreprocessedBytes(relPath, w);
  if (!prepared) return null;

  let img: PDFImage;
  try {
    img = await doc.embedPng(prepared.bytes);
  } catch {
    return null;
  }
  artCache.set(key, img);
  return img;
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

/** Finished PDFs per exact input — repeat downloads skip the rebuild. */
const pdfCache = new Map<string, Uint8Array>();

/** Build the full keepsake PDF bytes. */
export async function buildInvitationPdf(
  input: KeepsakeInput,
): Promise<Uint8Array> {
  const cacheKey = [
    input.datePretty,
    input.timePretty,
    input.activityName ?? "",
    input.activityPlace ?? "",
    input.pickedFlowers.map((f) => f.type).join(","),
  ].join("|");
  const cached = pdfCache.get(cacheKey);
  if (cached) return cached;

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

  /* ── Static art (embedded once per size, resized; missing files skipped) ── */
  const [sunflower, lily, smallPink, pom, kuromi] = await Promise.all([
    embedArt(doc, "/assets/flowers/sunflower.png", ART_DRAW_WIDTHS.sunflower),
    embedArt(doc, "/assets/flowers/lily.png", ART_DRAW_WIDTHS.lily),
    embedArt(doc, "/assets/flowers/small-pink.png", ART_DRAW_WIDTHS.smallPink),
    embedArt(doc, "/assets/characters/pompompurin.png", ART_DRAW_WIDTHS.pom),
    embedArt(doc, "/assets/characters/kuromi.png", ART_DRAW_WIDTHS.kuromi),
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

  /* ── Her bouquet — her flowers gathered into the pink cone ── */
  if (input.pickedFlowers.length > 0) {
    drawCentered(page, spaced("your bouquet"), body, 7.5, y - 6, C.cocoa);

    // embed one image per distinct flower type she picked (cached per size)
    const types = [...new Set(input.pickedFlowers.map((f) => f.type))].filter(
      (t): t is string => t in FLOWER_FILES,
    );
    const imgs = new Map<string, PDFImage | null>(
      await Promise.all(
        types.map(async (t) => [t, await embedArt(doc, FLOWER_FILES[t]!, 44)] as const),
      ),
    );

    const flowers = input.pickedFlowers
      .slice(0, 12)
      .flatMap((f) => {
        const img = imgs.get(f.type);
        return img ? [{ img, rotate: 0 }] : [];
      });

    // scale the bunch down when a lower section start leaves less room
    // above the footer (footer sits at y=46; keep ~18pt clearance)
    const k = Math.max(0.7, Math.min(1, (y - 64) / 158));
    if (flowers.length > 0) {
      // cone apex near the bottom of the section; the bunch rises above it
      drawBouquet(page, flowers, PAGE_W / 2, y - 122 * k, k);
    }

    drawCentered(
      page,
      "every flower you picked, saved forever",
      italic,
      9.5,
      y - 136 * k,
      C.cocoa,
    );
    y -= 158 * k;
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

  const bytes = await doc.save();

  pdfCache.set(cacheKey, bytes);
  if (pdfCache.size > 32) {
    // drop the oldest (Map iterates in insertion order)
    pdfCache.delete(pdfCache.keys().next().value!);
  }
  return bytes;
}
