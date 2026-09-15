/**
 * Turns the user-supplied JPEGs into transparent, autocropped PNGs:
 *   pompompurin holding flowers.jpg            → characters/pompompurin.png
 *   🖤 Kuromi holding a purple bouquet 💜.jpg   → characters/kuromi.png
 *   blue lily.jpg                              → flowers/lily.png
 *   another lily.jpg                           → flowers/lily-alt.png
 *
 * Background removal = flood fill from the borders (protects dark/white
 * pixels INSIDE the characters, unlike a global color key), then a 1px
 * alpha erosion to eat the leftover JPG fringe, then autocrop with pad.
 *
 * Run: node scripts/process-characters.mjs
 */
import fs from "node:fs";
import path from "node:path";
import jimpPkg from "jimp";
const Jimp = jimpPkg.default?.Jimp ?? jimpPkg.default;

const DOWNLOADS = "C:/Users/Roshan/Downloads";
const OUT = "client/public/assets";

/** Queue-based flood fill from all border pixels; clears pixels whose
 *  color is within `tol` (0–255 euclidean distance) of the sampled
 *  border/corner background colors. */
function clearBackground(img, { tol = 34, soften = true } = {}) {
  const { width: w, height: h, data } = img.bitmap;
  const clear = new Uint8Array(w * h);
  const queue = [];

  const refs = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4].map((i) => ({
    r: data[i],
    g: data[i + 1],
    b: data[i + 2],
  }));
  const near = (i) =>
    refs.some((ref) => {
      const dr = data[i] - ref.r;
      const dg = data[i + 1] - ref.g;
      const db = data[i + 2] - ref.b;
      return Math.sqrt(dr * dr + dg * dg + db * db) <= tol;
    });

  const tryPush = (x, y) => {
    const p = y * w + x;
    if (clear[p]) return;
    if (near(p * 4)) {
      clear[p] = 1;
      queue.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  while (queue.length) {
    const p = queue.pop();
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) tryPush(x - 1, y);
    if (x < w - 1) tryPush(x + 1, y);
    if (y > 0) tryPush(x, y - 1);
    if (y < h - 1) tryPush(x, y + 1);
  }

  for (let p = 0; p < w * h; p++) {
    if (clear[p]) data[p * 4 + 3] = 0;
  }

  // soften: fade pixels that touch ≥2 cleared pixels (softer cutout edge)
  if (soften) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (clear[p] || data[p * 4 + 3] === 0) continue;
        let clearedNeighbors = 0;
        if (x > 0 && clear[p - 1]) clearedNeighbors++;
        if (x < w - 1 && clear[p + 1]) clearedNeighbors++;
        if (y > 0 && clear[p - w]) clearedNeighbors++;
        if (y < h - 1 && clear[p + w]) clearedNeighbors++;
        if (clearedNeighbors >= 2) data[p * 4 + 3] = 140;
      }
    }
  }
}

/** Erode 1px: any opaque pixel adjacent to ≥2 fully transparent pixels
 *  becomes transparent. Eats the anti-aliased JPG halo. */
function erodeAlpha(img) {
  const { width: w, height: h, data } = img.bitmap;
  const a = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) a[p] = data[p * 4 + 3];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (a[p] === 0) continue;
      let transparentNeighbors = 0;
      if (x > 0 && a[p - 1] === 0) transparentNeighbors++;
      if (x < w - 1 && a[p + 1] === 0) transparentNeighbors++;
      if (y > 0 && a[p - w] === 0) transparentNeighbors++;
      if (y < h - 1 && a[p + w] === 0) transparentNeighbors++;
      if (transparentNeighbors >= 2) data[p * 4 + 3] = 0;
    }
  }
}

/** Fade alpha to 0 over the last `px` rows — hides stems cut off by the
 *  source photo's edge (bouquets shot to the frame bottom). */
function fadeBottom(img, px = 36) {
  const { width: w, height: h, data } = img.bitmap;
  const start = Math.max(0, h - px);
  for (let y = start; y < h; y++) {
    const k = (y - start) / Math.max(1, px - 1); // 0 → 1 toward the edge
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4 + 3;
      data[i] = Math.round(data[i] * (1 - k));
    }
  }
}

/** Autocrop to the opaque bounding box, keeping `pad` px of margin. */
function autocrop(img, pad = 2) {
  const { width: w, height: h, data } = img.bitmap;
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("image became fully transparent — wrong tolerance?");
  const x = Math.max(0, minX - pad);
  const y = Math.max(0, minY - pad);
  const cw = Math.min(w - 1, maxX + pad) - x + 1;
  const ch = Math.min(h - 1, maxY + pad) - y + 1;
  img.crop(x, y, cw, ch);
}

const jobs = [
  {
    src: "pompompurin holding flowers.jpg",
    out: "characters/pompompurin.png",
    tol: 44, // white bg + white cone wrap → wider tolerance
  },
  {
    src: "🖤 Kuromi holding a purple bouquet 💜.jpg",
    out: "characters/kuromi.png",
    tol: 30,
  },
  { src: "blue lily.jpg", out: "flowers/lily.png", tol: 26 },
  { src: "another lily.jpg", out: "flowers/lily-alt.png", tol: 26 },
  {
    // white-on-white: low tolerance so the white petals survive
    src: "Pink gypsophila bouquet on white background, delicate baby's breath flowers, romantic floral arrangement for wedding and greeting card design Stock Photo.jpg",
    out: "flowers/babys-breath.png",
    tol: 16,
    maxSize: 900,
    // source photo cuts the stems at the frame edge — dissolve them out
    fadeBottom: 40,
  },
  {
    src: "Download Pink Lily Flower with White Spots Isolated for free.jpg",
    out: "flowers/small-pink.png",
    tol: 24,
    maxSize: 900,
  },
  {
    // white line-art on white bg — flood fill keeps the white body opaque
    src: "fatahh.jpg",
    out: "characters/fatahh.png",
    tol: 22,
  },
];

for (const job of jobs) {
  const outPath = path.join(OUT, job.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const img = await Jimp.read(path.join(DOWNLOADS, job.src));
  if (job.maxSize) {
    const { width, height } = img.bitmap;
    const scale = Math.min(1, job.maxSize / Math.max(width, height));
    if (scale < 1) img.resize(Math.round(width * scale), Jimp.AUTO);
  }
  clearBackground(img, { tol: job.tol });
  erodeAlpha(img);
  if (job.fadeBottom) fadeBottom(img, job.fadeBottom);
  autocrop(img, 3);
  await img.writeAsync(outPath);

  const { width, height } = img.bitmap;
  console.log(`✓ ${job.out}  ${width}x${height}`);
}

console.log("done.");
