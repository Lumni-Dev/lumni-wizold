import { execSync } from "node:child_process";

if (process.env.CI || process.env.VERCEL) process.exit(0);

try {
  execSync("git rev-parse --git-dir", { stdio: "ignore" });
  execSync("git config core.hooksPath .githooks", { stdio: "inherit" });
} catch {
}
