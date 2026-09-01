import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SIM = join(ROOT, ".sim-art");
const OUT = join(ROOT, "public", "art-manifest.json");

execFileSync("npx", ["tsc", "-p", join(HERE, "tsconfig.art-manifest.json")], {
  cwd: ROOT,
  stdio: ["ignore", "ignore", "inherit"],
  shell: true,
});

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) request = join(SIM, request.slice(2));
  return resolveFilename.call(this, request, ...rest);
};

const require = createRequire(import.meta.url);
const { scanArtManifestFromDisk } = require(join(SIM, "models/repositories/art.repository.js"));

const manifest = await scanArtManifestFromDisk();
writeFileSync(OUT, JSON.stringify(manifest));
console.log("Wrote public/art-manifest.json");
