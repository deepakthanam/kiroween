#!/usr/bin/env node
// PreToolUse hook for write tools.
// Kiro passes the event as JSON on STDIN. The exact shape of tool_input differs
// by tool, so this checks the whole serialized input for protected paths
// instead of relying on a specific field name.
// Exit 0 = allow. Non-zero = block the tool call; STDERR goes back to the agent.

import { readFileSync } from "node:fs";

const PROTECTED = [
  /corpus[\\/]+originals[\\/]/,
  /runs[\\/]+[^\\/"']+[\\/]+original[\\/]/,
];

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  process.exit(0); // no STDIN: nothing to check
}

let event;
try {
  event = JSON.parse(raw);
} catch {
  process.exit(0); // not JSON: do not block on a hook parsing problem
}

const haystack = JSON.stringify(event?.tool_input ?? event ?? {});
const hit = PROTECTED.find((re) => re.test(haystack));

if (hit) {
  console.error(
    "Blocked by protect-originals hook: frozen original packages are read-only " +
      "(corpus/originals/** and runs/*/original/**). Work on runs/<runId>/revived/ instead. " +
      "See .kiro/steering/resurrection-rules.md."
  );
  process.exit(2);
}

process.exit(0);
