# 🖼 How to add your own images

Everything here is referenced from **`shared/invitation.config.ts` → `ASSETS`**.
Drop a file in the right folder, keep the name (or change the path in the
config), and the site picks it up — **no component code changes needed**.

Any image left missing renders a built-in hand-drawn SVG fallback, so the
site never breaks while you're collecting assets.

```
assets/
  characters/     ← the real Pompompurin goes here (pompompurin.png)
  flowers/        ← cherry-red-hibiscus.png, sunflower.png, lily.png,
                    babys-breath.png, small-pink.png
  stickers/       ← NO-popup stickers: pleading, sad, website, shy,
                    snacks, defeated (.png)
  photos/         ← personal photos (polaroids, if you add any)
  decorations/    ← hearts and misc accents (heart.png)
```

**Transparent PNGs work best.** The supplied cherry-red hibiscus already
lives at `flowers/cherry-red-hibiscus.png`.
