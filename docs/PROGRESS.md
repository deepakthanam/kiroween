# Progress

## Current phase
Phase 0: Bootstrap. All checks passed (auto) on 2026-11-11. Waiting for the next session to start Phase 1.

Deadline: Dec 4, 2026, 2:00 pm PT.

## Phase log

| # | Phase | Target | Started | Gate approved | Notes |
|---|---|---|---|---|---|
| 0 | Bootstrap | Nov 11–12 | Nov 11 | passed (auto) Nov 11 | See gate results below |
| 1 | Proof of life | Nov 12–18 | | | |
| 2 | Graveyard | Nov 19–20 | | | |
| 3 | Exhume | Nov 21–23 | | | |
| 4 | Reanimate | Nov 24–27 | | | |
| 5 | Graveyard UI | Nov 28–Dec 1 | | | |
| 6 | Crew patrol and power | Dec 1–2 | | | |
| 7 | Submission | Dec 3–4 | | | |

## Gate results

### Gate 0 (2026-11-11)
- `pnpm install --frozen-lockfile && pnpm verify`: passed (eslint, `tsc --noEmit`, Vitest: 1 file, 2 tests).
- `pnpm test:prop`: passed (2 property tests, 100 runs each).
- `pnpm revenant`: prints the placeholder message.
- Docker, `--network none --memory 512m --cpus 1 --pids-limit 128 --read-only --tmpfs /tmp`: `node:8` printed `v8.17.0`, `node:24` printed `v24.22.3`.
- `guard-paths.mjs`: exit 2 for `corpus/originals/...` and `runs/abc/original/...`, exit 0 for `packages/core/src/a.ts`. `check-gitignore.mjs`: exit 0.
- Hooks enabled: `format-on-save`, `related-tests-on-save`, `typecheck-on-stop`, `new-module-needs-a-property`. All hook JSON files parse.
- Repository `deepakthanam/kiroween` is public, default branch `main`, `LICENSE` is MIT. GitHub shows the licence only after the first push; see Open questions.

## Corpus tracker

| Package | Version | Exhume | Reanimate | Proof of life | Verdict | Notes |
|---|---|---|---|---|---|---|

## Open questions
- First commit push: depends on whether Git has stored GitHub credentials. If the push fails, it needs the user's login.
- The empty `revenant/` directory at the repo root is locked by the IDE. Delete it when possible.

## Links
- Public URL:
- Repository: https://github.com/deepakthanam/kiroween
- Demo video:
