import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const distDir = resolve(projectRoot, "dist");
const indexPath = resolve(distDir, "index.html");
const notFoundPath = resolve(distDir, "404.html");
const redirectsPath = resolve(distDir, "_redirects");

mkdirSync(distDir, { recursive: true });
copyFileSync(indexPath, notFoundPath);
writeFileSync(redirectsPath, "/* /index.html 200\n", "utf8");
