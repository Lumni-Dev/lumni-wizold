#!/usr/bin/env node
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = typeof input.command === "string" ? input.command : "";

const allow = () => {
  process.stdout.write(JSON.stringify({ permission: "allow" }));
};

if (!/\bgit\b[^\n]*\bcommit\b/.test(command)) {
  allow();
  process.exit(0);
}

const cleaned = command
  .replace(/\r\nCo-authored-by:[^\n]*Cursor[^\n]*/gi, "")
  .replace(/\nCo-authored-by:[^\n]*Cursor[^\n]*/gi, "")
  .replace(/\r\nCo-authored-by:[^\n]*cursoragent@cursor\.com[^\n]*/gi, "")
  .replace(/\nCo-authored-by:[^\n]*cursoragent@cursor\.com[^\n]*/gi, "");

if (cleaned === command) {
  allow();
  process.exit(0);
}

process.stdout.write(
  JSON.stringify({
    permission: "allow",
    updated_input: { ...input, command: cleaned },
  }),
);
