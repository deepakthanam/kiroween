---
name: resurrect-package
description: Resurrect one dead npm package with Revenant and report the verdict with its evidence. Use when the user asks to revive, resurrect, fix or fork an abandoned or broken dependency.
---
# Resurrect a dead package

## Before starting
- Confirm the exact `name@version` with the user.
- Call `package_vitals` and check eligibility. If the package is ineligible (native addon, install scripts, side effects, too large), explain the reason and stop.
- Check that Docker is running and the `revenant` CLI is installed (`revenant --version`). If either is missing, give the install step and stop.

## Steps
1. Run `revenant resurrect <name@version>`. It runs three stages: exhume, reanimate, proof of life. It can take several minutes.
2. While it runs, relay stage changes from the command output. Do not speculate about the result.
3. When it ends, read `runs/<runId>/SUMMARY.md` and `equivalence-report.json`.
4. Report, in this order:
   - The verdict word exactly as written: `REVIVED`, `PARTIAL` or `REFUSED`, with reason codes.
   - Cases run, exports covered and excluded, control result, seeded-bug catch rate.
   - Any counterexample, in its shrunk form, and whether a repair round fixed it.
   - Where the diff, the reverse-engineered spec and the report are.
5. For `REVIVED`, show how to use the revived package (the `@revenant/<name>` fork in `runs/<runId>/revived/`) and suggest the user review the diff before adopting it.
6. For `PARTIAL` or `REFUSED`, explain what the reason code means and what the user's options are. Do not present it as a success.

## Rules
- Never edit anything under `runs/<runId>/original/`.
- Never change thresholds, case counts or the surface model to obtain a better verdict.
- Describe the result as "evidence of equivalence over N generated cases". Do not use "proof", "guaranteed" or "identical".
- If the user asks you to fix a divergence by hand, restore the original behaviour, including when that behaviour is a bug, and rerun `revenant prove`.
