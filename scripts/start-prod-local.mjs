import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PORT = process.env.PORT ?? "3016";

for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
}

process.env.PORT = PORT;
const child = spawn("npm", ["run", "start"], {
  cwd: ROOT,
  env: process.env,
  stdio: "inherit",
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
