---
name: audit-lockfile
description: Audit an npm lockfile for dead, abandoned or deprecated dependencies using the graveyard tools. Use when the user asks whether any dependency is dead, unmaintained, deprecated or risky, or asks for a dependency health check.
---
# Audit a lockfile for dead dependencies

## Steps
1. Find the lockfile. Prefer `package-lock.json` at the workspace root. If there are several, ask which project the user means.
2. Call the `audit_lockfile` tool from the `graveyard` server with the lockfile path.
3. Present the result:
   - One line of totals: packages checked, `DEAD`, `DYING`, `ALIVE`.
   - A table of `DEAD` packages: name, version, dead score, reasons, direct or transitive, eligible for resurrection (yes or no, with the reason when no).
   - `DYING` packages as a short list of names only, unless the user asks for detail.
4. If any source was unavailable, say which one and that scores are based on incomplete vitals.
5. For each direct dependency that is `DEAD`, check whether a maintained replacement is the better answer and say so. Resurrection is for cases with no good replacement or when a drop-in is needed quickly.
6. Offer to resurrect eligible candidates with the `resurrect-package` skill. Do not start a resurrection without the user asking for it.

## Rules
- Report only what the tools returned. Do not judge package health from memory.
- Never say a package is safe. Say what the vitals show.
- If the graveyard server is not available, say so and stop.
