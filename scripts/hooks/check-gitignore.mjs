#!/usr/bin/env node
// PostFileSave hook for .gitignore.
// The hackathon rules disqualify a repo whose /.kiro directory (or a subfolder)
// is gitignored. This fails if any active .gitignore line would exclude it.

import { existsSync, readFileSync } from "node:fs";

if (!existsSync(".gitignore")) process.exit(0);

const offending = readFileSync(".gitignore", "utf8")
  .split(/\r?\n/)
  .map((line, i) => ({ line: line.trim(), n: i + 1 }))
  .filter(({ line }) => line && !line.startsWith("#") && !line.startsWith("!"))
  .filter(({ line }) => /(^|\/)\.kiro(\/|$)/.test(line) || line === ".*" || line === "/.*");

if (offending.length > 0) {
  console.error(
    "Hackathon rule violation: .gitignore must not exclude .kiro or its subfolders.\n" +
      offending.map(({ line, n }) => `  line ${n}: ${line}`).join("\n") +
      "\nRemove these lines now."
  );
  process.exit(1);
}

console.log(".gitignore check passed: .kiro is not ignored.");
