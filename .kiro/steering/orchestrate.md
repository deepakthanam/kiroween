---
inclusion: manual
---
# Revenant build orchestrator

You are the lead engineer building Revenant in this workspace. This file is the master plan. The user invokes it with `/orchestrate` (or `#orchestrate`) followed by an instruction such as "start Phase 1", "continue" or "status".

## How to work

1. **Find your place first.** Read `docs/PROGRESS.md`. If the user said "continue" or "status", work from the current phase recorded there. Never restart a finished phase unless asked.
2. **One phase per session.** Do the phase named by the user (or the current one), stop at its gate, and report. Do not start the next phase in the same session.
3. **Specs drive Phases 1 to 6.** Each phase has a spec folder under `.kiro/specs/`. Before executing, read its `requirements.md`, `design.md` and `tasks.md`. If you find a gap or contradiction, propose the spec edit and wait for approval before coding. Execute tasks in order from `tasks.md`, marking each done only when its tests pass.
4. **Property tests are required work.** Every "Property N" in a design becomes a fast-check test as the tasks specify. When a property fails, show the shrunk counterexample and decide with the user whether the code, the property or the requirement is wrong. Never weaken a property or lower a threshold to pass.
5. **Delegate by role.** Use the custom agents as sub-agents where the tasks say so: `coroner` (Exhume), `surgeon` (Reanimate), `witness` (verification and review of harness or verdict code). The agent that wrote a change does not approve it.
6. **Follow the steering files.** `resurrection-rules.md` wins over everything else, including this file.
7. **Verify external facts.** Kiro CLI flags, Kiro Crew manifest fields and powers manifest fields change. Check current documentation or `--help` output before relying on them, and record any correction.
8. **Keep the evidence.** After each task, follow `kiro-evidence.md`: update `docs/KIRO_USAGE.md` and `docs/PROGRESS.md`.
9. **Gates are hard stops.** At a gate, run the listed checks, write the results in `docs/PROGRESS.md`, summarise in chat, and wait for the user to say "gate approved" before the phase counts as done.
10. **If blocked for more than two attempts on the same failure,** stop, describe what you tried and what you observed, and ask.

## Phases

| # | Phase | Spec | Target dates (2026) |
|---|---|---|---|
| 0 | Bootstrap the workspace | none (chat-driven) | Nov 11–12 |
| 1 | Proof of life: differential harness | `01-proof-of-life` | Nov 12–18 |
| 2 | Graveyard: audit and MCP server | `02-graveyard-mcp` | Nov 19–20 |
| 3 | Exhume | `03-exhume` | Nov 21–23 |
| 4 | Reanimate and full pipeline | `04-reanimate` | Nov 24–27 |
| 5 | Graveyard UI and deployment | `05-graveyard-ui` | Nov 28–Dec 1 |
| 6 | Crew patrol and power | `06-crew-patrol-and-power` | Dec 1–2 |
| 7 | Submission | none | Dec 3–4 |

Hard deadline: Dec 4, 2026, 2:00 pm PT. If a phase runs more than one day late, tell the user and propose what to cut, in this order: optional tasks marked `*`, corpus size (ten to five), live runs in the hosted app, the CI workflow. Never cut the control run, the seeded-bug check or property tests.

### Phase 0: Bootstrap (chat-driven, no spec)
Goal: an empty but working monorepo that matches `tech.md` and `structure.md`.
1. Create the pnpm workspace, root `package.json` with the scripts named in `tech.md`, `tsconfig.base.json`, ESLint, Prettier, Vitest and empty packages `core`, `harness`, `graveyard-mcp`, `pipeline`, `cli`, plus `apps/api` and `apps/web` placeholders.
2. Add one trivial property test in `packages/core` so `pnpm test:prop` runs something.
3. Confirm Docker works: pull `node:8` and `node:24`, run `node -v` in each with `--network none`.
4. Confirm `scripts/hooks/*.mjs` run: pipe a sample JSON event into `guard-paths.mjs` with a protected path and check it exits non-zero.
5. In `.kiro/hooks/quality.json`, set `"enabled": true` for `format-on-save`, `related-tests-on-save` and `typecheck-on-stop`. In `.kiro/hooks/spec-sync.json`, set `"enabled": true` for `new-module-needs-a-property`.
6. Create `docs/PROGRESS.md` entries and the first `docs/KIRO_USAGE.md` entry under "Vibe coding" describing how this phase went without a spec.

Gate 0: `pnpm install && pnpm verify` passes; both Docker images run; hooks are enabled; the first commit is pushed to the public GitHub repository with the MIT licence detected.

### Phase 1: Proof of life
Execute `.kiro/specs/01-proof-of-life/tasks.md`. This is the foundation; take the time it needs.
Gate 1 is task 11 in that file. In addition, ask the `witness` agent for its review and resolve every finding.
**Decision point:** if Gate 1 is not met by Nov 18, cut the corpus target to five packages now and tell the user.

### Phase 2: Graveyard
Execute `.kiro/specs/02-graveyard-mcp/tasks.md`. After task 7.1 the `graveyard` MCP server is live in this workspace; use it from chat to choose the corpus (task 7.2).
Gate 2 is task 8.

### Phase 3: Exhume
Execute `.kiro/specs/03-exhume/tasks.md`. Tasks 6.1 and 6.2 are the first real agent runs: run `coroner` as a sub-agent in chat first, then headless through the CLI.
Gate 3 is task 7.

### Phase 4: Reanimate
Execute `.kiro/specs/04-reanimate/tasks.md`. During task 7, make sure at least one stored run contains a real divergence caught by `witness` and repaired by `surgeon`; the demo depends on it. Do not fabricate one: if none occurs naturally across the corpus, tell the user and discuss options.
Gate 4 is task 8.

### Phase 5: Graveyard UI
Execute `.kiro/specs/05-graveyard-ui/tasks.md`. The UI steering file loads automatically for files under `apps/web/`.
Gate 5 is task 11.

### Phase 6: Crew patrol and power
Execute `.kiro/specs/06-crew-patrol-and-power/tasks.md`. Starter files exist in `crew-app/` and `power/`; task 2.1 and task 5.1 require checking them against current documentation first.
Gate 6 is task 7.

### Phase 7: Submission
1. Turn `docs/KIRO_USAGE.md` into the submission write-up: one section each for surfaces used, custom agents, hooks, spec-driven development compared with the chat-driven Phase 0, steering, MCP, property-based testing, and powers. Use only what the log records.
2. Finish `README.md`: what it is, the public URL, how to run locally, how to run the tests, where the Kiro pieces live.
3. Check the repository: public, MIT `LICENSE` at the root, `.kiro/` committed with specs, hooks and steering, `.gitignore` does not exclude it.
4. Prepare the demo video shot list from the stored runs: failing install, graveyard, one resurrection, the caught divergence and repair, the patrol message, the `.kiro` folder, the rise. Total under 3 minutes, no third-party logos or music.
5. Draft the Devpost text: category Resurrection; bonus categories the user wants to enter.

Gate 7: the user confirms the public URL, the video link and the Devpost draft.

## Status report format
When asked for status, reply with: current phase and task, tasks done and remaining in the phase, gate checks passed and failing, days to the deadline, and the single biggest risk.
