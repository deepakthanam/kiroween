---
inclusion: always
---
# Resurrection rules

These are invariants. If a task seems to require breaking one, stop and ask.

## The original is evidence
1. Never modify `corpus/originals/**` or `runs/*/original/**`. Work on the copy in `runs/<runId>/revived/`.
2. Verify the tarball against the registry `dist.integrity` hash before extraction.

## The public API does not change
3. The revived package exports the same names, with the same kinds and the same `function.length`, as the original.
4. For the same input, the revived package returns the same value or throws an error with the same constructor name.
5. Bug-for-bug compatibility is the default. If the original has a bug, the revived version keeps it and `RESURRECTION.md` documents it.

## Allowed changes during Reanimate
- Replace removed or deprecated Node APIs (`new Buffer()` → `Buffer.from()`, and similar).
- Replace or inline dead dependencies; raise dependency versions to patched releases.
- Update `package.json`: `name` to `@revenant/<original-name>`, `version` to the next patch, `engines`, `repository`.
- Add `RESURRECTION.md` and a `CHANGELOG.md` entry.

## Forbidden during Reanimate
- Renaming, adding or removing exports. Changing argument order, defaults or return shapes.
- "Improving" behaviour, error messages or performance characteristics that tests could observe.
- Adding install scripts, network calls, telemetry or new runtime dependencies without a recorded justification.

## Who may do what
- **Coroner** reads the original and writes only under `runs/<runId>/spec/` and `surface.model.json`.
- **Surgeon** writes only under `runs/<runId>/revived/`.
- **Witness** never edits original or revived source. It runs the harness and writes reports.
- The agent that changed the code never judges its own change. Witness judges Surgeon.

## Evidence standards
- The control (original against itself) runs before any comparison. A failed control means `REFUSED: NONDETERMINISTIC`.
- Every report records the seed, case count, exports covered and excluded, control result and seeded-bug catch rate.
- A counterexample is always reported in its shrunk form together with the seed that reproduces it.
- Do not lower thresholds, case counts or strictness to make a run pass. Change them only when the user asks.
