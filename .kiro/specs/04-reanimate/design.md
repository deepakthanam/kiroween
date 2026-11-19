# Design: Reanimate

## Overview

The agents do the creative work; a pure state machine decides what happens next. The Surgeon never sees a pass or fail it produced itself: guards and the Witness produce those, and the orchestrator routes them.

```
QUEUED ─▶ EXHUMING ─▶ REANIMATING ─▶ PROVING ─▶ REVIVED | PARTIAL
              │            │  ▲          │
              ▼            ▼  │          ▼
           REFUSED      REPAIRING ◀──────┘ (mismatch, guard fail, load fail; max 3 rounds)
                           │
                           ▼
                        REFUSED (DIVERGENT_AFTER_REPAIR)
any non-terminal state ─▶ FAILED (AGENT_FAILED, TIMEOUT, ORIGINAL_MODIFIED, …)
```

## Components and interfaces

```ts
// core/run-machine.ts  (pure)
type RunState = "QUEUED" | "EXHUMING" | "REANIMATING" | "PROVING" | "REPAIRING" | "REVIVED" | "PARTIAL" | "REFUSED" | "FAILED";
type RunEvent =
  | { type: "start" } | { type: "exhumed" } | { type: "refused"; reason: ReasonCode }
  | { type: "surgeon_done" } | { type: "guard_failed"; diffs: SurfaceDiff[] } | { type: "load_failed"; error: string }
  | { type: "checks_passed" } | { type: "mismatch"; counterexampleId: number }
  | { type: "verdict"; verdict: "REVIVED" | "PARTIAL" | "REFUSED"; reasons: ReasonCode[] }
  | { type: "failed"; reason: ReasonCode };
interface RunContext { state: RunState; rounds: number; maxRounds: number; seq: number }
function transition(ctx: RunContext, ev: RunEvent): { ok: true; ctx: RunContext } | { ok: false; error: "ILLEGAL_TRANSITION" };

// core/surface-guard.ts  (pure)
function compareSurfaces(original: ActualSurface, revived: ActualSurface): SurfaceDiff[];   // empty = pass

// core/version.ts  (pure)
function nextPatch(version: string): string;                 // "1.2.3" → "1.2.4"; prerelease/build stripped
function revivedName(originalName: string): string;          // "@scope/x" → "@revenant/scope__x", "x" → "@revenant/x"

// pipeline/reanimate.ts
function reanimate(runDir: string, deps: { agents: AgentRunner; harness: Harness; http: HttpClient }): Promise<RunContext>;
function loadCheck(runDir: string): Promise<{ ok: boolean; error?: string }>;
function makeDiff(originalDir: string, revivedDir: string): Promise<string>;
function applyDiff(dir: string, diff: string): Promise<void>;

// pipeline/resurrect.ts
function resurrect(spec: { name: string; version: string }, opts: { replay?: string }): Promise<RunSummary>;
```

### Round accounting
`rounds` increments on every entry to `REPAIRING`, whatever the cause. When `rounds === maxRounds` and another failure event arrives, the machine moves to `REFUSED` with `DIVERGENT_AFTER_REPAIR` (for a mismatch) or `UNREPAIRABLE` (for guard or load failures).

### Counterexample handoff file
```json
{ "id": 2, "exportPath": "parse", "args": "<codec string>", "argsPreview": "[\"\\u0000\"]",
  "original": { "kind": "return", "value": "…" }, "revived": { "kind": "throw", "errorName": "TypeError" },
  "seed": 991, "fcPath": "12:3:0", "reproduce": "pnpm revenant prove runs/<id> --seed 991 --only parse" }
```
After each round the orchestrator replays all stored counterexamples directly (no generation) before the full run.

### Git inside `revived/`
The working copy is its own repository so each Surgeon change is a commit and the PR option is a plain push. The outer repository ignores `runs/` except `runs/replay/`.

## Data models

`SurfaceDiff`: `{ path, change: "added" | "removed" | "kind" | "length", original?, revived? }`.

`RunSummary`: `{ runId, name, version, revivedName, revivedVersion, verdict, reasons, rounds, reportPath, diffPath, durationMs }`.

## Correctness Properties

### Property 1: Surface guard is exact
*For any* two surfaces, `compareSurfaces` returns an empty list if and only if they have the same set of paths with equal kinds and function lengths; `compareSurfaces(a, a)` is always empty; and swapping the arguments turns every `added` into `removed` and the reverse.
**Validates: Requirements 3.1, 3.2**

### Property 2: Version and name rules
*For any* valid semver string `v`, `nextPatch(v)` is valid semver, is greater than `v` with prerelease and build removed, and has the same major and minor; *for any* valid npm package name, `revivedName` is a valid npm name in the `@revenant` scope and distinct inputs give distinct outputs.
**Validates: Requirements 4.2**

### Property 3: Only legal transitions change state
*For any* state and any event, `transition` either returns a state reachable by an edge in the design diagram or returns `ILLEGAL_TRANSITION` with the context unchanged.
**Validates: Requirements 6.1**

### Property 4: Terminal states are final
*For any* context in `REVIVED`, `PARTIAL`, `REFUSED` or `FAILED` and any event, `transition` returns `ILLEGAL_TRANSITION`.
**Validates: Requirements 6.2**

### Property 5: The repair loop terminates
*For any* sequence of events of any length, the number of entries into `REPAIRING` never exceeds `maxRounds`, and any sequence that keeps producing failure events reaches a terminal state.
**Validates: Requirements 5.2, 5.4**

### Property 6: Sequence numbers are strictly increasing
*For any* accepted sequence of events, the `seq` values of the emitted state-change events are strictly increasing with no gaps.
**Validates: Requirements 6.3**

### Property 7: Diff round trip
*For any* pair of small generated file trees (original, revived), applying `makeDiff(original, revived)` to a copy of the original yields a tree equal to revived.
**Validates: Requirements 7.1, 7.2**

### Property 8: The original survives the whole pipeline
*For any* replay bundle, after `resurrect --replay` finishes in any terminal state, the tree hash of `original/` equals the hash recorded at freeze time.
**Validates: Requirements 1.2**

### Property 9: Exit code matches verdict
*For any* run summary, the CLI exit code is 0, 1, 2 or 3 exactly as the verdict mapping specifies.
**Validates: Requirements 8.2**

## Error handling

- Any thrown error inside a stage becomes a `failed` event with a reason code; the machine moves to `FAILED`.
- The overall timeout is enforced by the orchestrator with an `AbortController` passed to agents, containers and HTTP.
- Pull-request creation failures do not change the verdict; they are recorded as a warning in `SUMMARY.md`.

## Testing strategy

- Properties 1 to 6 and 9 are pure. Property 5 uses fast-check's model-based commands over the state machine. Property 7 uses temp directories. Property 8 uses replay bundles.
- A scripted `FakeAgentRunner` that applies prepared patches (one good, one that breaks the API, one that introduces a divergence) drives example tests of each path through the repair loop without using credits.
