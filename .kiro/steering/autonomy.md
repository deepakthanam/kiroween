---
inclusion: always
---
# Autonomous mode

The user wants this build to run without interruption. This file overrides any instruction in `orchestrate.md`, in a spec's `tasks.md`, or in a hook prompt that says to ask, confirm, wait for approval or pause at a checkpoint.

## Do not ask. Decide, record, continue.
- Never ask the user to choose between options, confirm a plan, approve a spec edit or approve a design. Pick the option that best fits the steering files and the spec, and keep going.
- Record each decision that a reasonable reviewer might question as one line in `docs/DECISIONS.md`: date, decision, reason, how to reverse it.
- Do not end a turn with a question or an offer ("Shall I…", "Would you like…"). End a turn only when the phase is finished or a stop condition below is met.

## Installations and tooling
- Install whatever the task needs without asking: `pnpm install`, `pnpm add`, `npx playwright install`, `docker pull`, and similar. Prefer versions that `tech.md` names; otherwise use the latest stable release.
- Add a dependency when the design calls for it. Note it in `docs/DECISIONS.md` if the design did not name it.
- If a tool is missing on the machine (Docker, pnpm, Node), try the standard install once. If that fails, treat it as a stop condition.

## Checkpoints and gates
- A checkpoint task is not a pause. Run its checks, write the results in `docs/PROGRESS.md`, and continue to the next task.
- At a phase gate: run every check. If all pass, mark the gate "passed (auto)" in `docs/PROGRESS.md`, commit with a message naming the phase, and stop there so the next phase starts in a fresh session. Do not wait for "gate approved".
- Where a task says to ask the user to review something (a reverse-engineered spec, the corpus list, the visual design), do your own review against the steering files, record what you checked, and continue.
- If a spec has a gap or contradiction, fix the spec file yourself, note the change in `docs/KIRO_USAGE.md`, and continue.

## Stop only for these
1. A secret or account action only the user can supply (`KIRO_API_KEY`, `GITHUB_TOKEN`, a deployment login, creating the repository).
2. The same failure three times in a row after three different attempts. Report what was tried and what was observed.
3. A gate check that still fails after you have tried to fix it.
4. Any action that would break a rule in `resurrection-rules.md`, lower a threshold or case count, or weaken a property test to get a pass. These are never done autonomously.
5. Anything destructive outside this workspace, a force push, or publishing a package.

When you stop, say which condition applies in the first line.

## Still required
- Property tests, the control run and the seeded-bug check are never skipped to save time.
- A failing property is investigated and fixed in the code first. Changing the property or the requirement instead is allowed only when the spec is demonstrably wrong; record the counterexample and the reason in `docs/KIRO_USAGE.md`.
- Keep `docs/PROGRESS.md` and `docs/KIRO_USAGE.md` current so the user can see what happened while away.
