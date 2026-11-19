# Kiro usage log

Factual, dated notes on how Kiro was used. This file becomes the "How we used Kiro" section of the submission. Add two to four lines per entry: what was asked, which feature did the work, what it caught or saved, what went wrong.

## Surfaces (IDE, CLI, Web, Crew)
How each surface was used and how they differed.

## Vibe coding
Phase 0 was built by chat without a spec. What that was like, and how it compared with the spec-driven phases.

### 2026-11-11: Phase 0 bootstrap (chat, no spec)
- Asked: `/orchestrate` then "Start Phase 0". The manual `orchestrate.md` steering file supplied the plan, and `autonomy.md` (always included) removed the approval pauses.
- The chat agent scaffolded the pnpm workspace, seven placeholder packages, ESLint, Prettier, Vitest and one fast-check property.
- Things that went wrong: `npm install -g pnpm` failed on an existing `pnpx` shim, and the agent first installed TypeScript 7, which `typescript-eslint` does not support yet; it was pinned back to 5.9. The project was also nested one folder too deep in the cloned repo and had to be moved up. All are recorded in `docs/DECISIONS.md`.
- The Docker daemon was not running at the start of the session. After the user started Docker Desktop, both images ran with `--network none`.
- The `guard-paths.mjs` hook script was exercised directly with piped JSON: exit 2 for protected paths, exit 0 otherwise. Four hooks were switched on afterwards.

## Spec-driven development
How the specs were structured (six specs, one per phase), what Kiro changed when it reviewed them, how task execution went.

## Property-based testing
Which requirements got properties, and every counterexample found: the shrunk input, and whether the code, the property or the requirement was changed. Note any issue a unit test would have missed.

## Steering
Which steering files mattered most, and which inclusion modes (always, fileMatch, manual) were used for what.

## Agent hooks
Which workflows were automated, and what each hook caught or prevented.

## Custom agents
`coroner`, `surgeon`, `witness`: where each was used (IDE sub-agent, CLI headless, Crew), and the effect of scoping their write permissions.

## MCP
What the graveyard server made possible that would otherwise have been hard.

## Powers
What the Revenant power packages, and any existing powers used during the build.

## Corrections to the starter kit
Anything in the starter files that had to be changed to match current Kiro documentation.
