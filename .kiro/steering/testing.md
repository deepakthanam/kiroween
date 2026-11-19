---
inclusion: fileMatch
fileMatchPattern: ["**/*.test.ts", "**/*.prop.test.ts", "packages/harness/**", "packages/core/**"]
---
# Testing conventions

## Property-based tests
- Library: `fast-check` with Vitest (`fc.assert(fc.property(...))`, or `fc.asyncProperty` for container calls).
- One property test per correctness property in the spec's `design.md`. Start the test with a comment that ties it back:
  `// Feature: <spec-folder>, Property <N>: <title>. Validates: Requirements <ids>`
- Minimum 100 runs per property. Container-backed properties may use 25 runs locally and 100 in CI.
- Log the seed and path on failure. Never commit a property with a fixed seed unless it is a regression test named `regression-<issue>`.
- Write generators that reach edge values: empty string, `-0`, `NaN`, very long arrays, unicode surrogates, `__proto__` keys, nested depth 5+.
- Do not weaken a property to make it pass. If a property fails, report the shrunk counterexample and decide with the user whether the code, the property or the requirement is wrong.
- Do not mock the unit under test. Use the synthetic packages in `corpus/fixtures/` for the harness.

## Example tests
- Use them for specific regressions and for documented examples from a package README.
- Keep them small; a property covers the general case.

## Container-backed tests
- Tag with `describe.skipIf(!process.env.DOCKER)` so the pure suite runs anywhere.
- Always tear containers down in `afterAll`, including on failure.

## HTTP
- Tests run with `REVENANT_FIXTURES=replay`. A test that needs a new recording says so in its name and is recorded deliberately, never by default.

## What "done" means for a task
`pnpm verify` passes, new behaviour has a property or example test, and the task's requirement ids appear in the test comment.
