import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const rootDir = process.cwd();
const distDir = resolve(rootDir, "dist");

function ensureCopied(relativePath) {
  const sourcePath = resolve(rootDir, relativePath);
  const destinationPath = resolve(distDir, relativePath);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required path: ${relativePath}`);
  }

  cpSync(sourcePath, destinationPath, { recursive: true });
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

[
  "index.html",
  "aprs_map.html",
  "src",
  "public"
].forEach(ensureCopied);

console.log(`Static site prepared in ${join(distDir)}`);
