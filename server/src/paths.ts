import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to the server package root (the folder holding
 * server/package.json), found by walking up from this source file.
 *
 * Works identically under tsx (…/server/src/index.ts) and the compiled build
 * (…/server/dist/server/src/index.js — the layout that results from rootDir
 * including ../shared). Falls back to process.cwd() if detection fails.
 */
function findServerRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
          name?: string;
        };
        if (pkg.name === "server") return dir;
      } catch {
        // unreadable package.json — keep walking up
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // reached the filesystem root
    dir = parent;
  }
  return process.cwd();
}

export const serverRoot = findServerRoot(
  path.dirname(fileURLToPath(import.meta.url)),
);
