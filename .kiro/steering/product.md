---
inclusion: always
---
# Product: Revenant

Revenant brings abandoned npm packages back to life and produces evidence that the revived version behaves like the original.

## Who it is for
Developers and teams whose dependency tree contains unmaintained packages that break on current Node or carry unpatched advisories.

## The three stages
1. **Exhume**: reverse-engineer a dead package into a spec and a machine-readable API surface model.
2. **Reanimate**: upgrade it to the current Node LTS and patched dependencies without changing its public API.
3. **Proof of life**: run original and revived side by side in sandboxed containers and compare outputs for the same generated inputs.

## Verdict vocabulary (use these exact words everywhere)
- `REVIVED`: equivalence evidence found, control passed, seeded-bug catch rate at or above threshold.
- `PARTIAL`: revived and loads, but evidence is weak or some exports are excluded. Always carries a reason code.
- `REFUSED`: Revenant declines. Always carries a reason code (for example `NONDETERMINISTIC`, `NATIVE_ADDON`, `SIDE_EFFECTS`, `DIVERGENT_AFTER_REPAIR`).

Refusing is a feature. Never present a `PARTIAL` or `REFUSED` result as success.

## Honesty rule
The product reports **evidence of equivalence over N generated cases**. It never says "proof", "guaranteed" or "identical" in UI copy, reports, docs or commit messages.

## Scope for the hackathon build
- In scope: npm packages that export pure functions, no native addons, no network, filesystem or child-process use.
- Out of scope: publishing to npm, stateful class APIs (stretch only), other ecosystems.

## Surfaces
- Web app ("the graveyard"): upload a lockfile, see a tombstone per dead package, watch one rise.
- `revenant` CLI: `audit`, `exhume`, `reanimate`, `prove`, `resurrect`.
- Graveyard MCP server: lets any agent audit a lockfile and fetch package vitals.
- Kiro power: the workflow packaged for other Kiro users.
- Kiro Crew app: nightly graveyard patrol.

## Hackathon constraints (Kiroween 2026, Resurrection category)
- Submission deadline: Dec 4, 2026, 2:00 pm PT.
- `/.kiro` stays committed at the repo root. Never add it or any subfolder to `.gitignore`.
- Public GitHub repo with an MIT `LICENSE` file at the root.
- Demo video under 3 minutes, no third-party logos or unlicensed music.
- Keep `docs/KIRO_USAGE.md` current; it becomes the submission write-up.
