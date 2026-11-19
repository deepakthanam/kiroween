#!/usr/bin/env node
// Journal hook. Usage: node scripts/hooks/journal.mjs <task|session>
// Appends one JSON line per event to docs/kiro-journal.jsonl. On session start it
// also prints the "Current phase" block of docs/PROGRESS.md, which Kiro adds to
// the agent's context (STDOUT of a hook that exits 0 is given to the agent).

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";

const kind = process.argv[2] ?? "event";

let event = {};
try {
  const raw = readFileSync(0, "utf8");
  if (raw.trim()) event = JSON.parse(raw);
} catch {
  // STDIN missing or not JSON: still log the event with no payload.
}

// Keep the journal small and free of file contents or secrets.
const keep = ["hook_event_name", "session_id", "cwd", "tool_name", "task", "task_id", "task_name", "spec", "status"];
const slim = Object.fromEntries(Object.entries(event).filter(([k]) => keep.includes(k)));

mkdirSync("docs", { recursive: true });
appendFileSync(
  "docs/kiro-journal.jsonl",
  JSON.stringify({ at: new Date().toISOString(), kind, ...slim }) + "\n"
);

if (kind === "session" && existsSync("docs/PROGRESS.md")) {
  const progress = readFileSync("docs/PROGRESS.md", "utf8");
  const start = progress.indexOf("## Current phase");
  if (start !== -1) {
    const rest = progress.slice(start);
    const next = rest.indexOf("\n## ", 1);
    console.log(next === -1 ? rest.trim() : rest.slice(0, next).trim());
  }
}
