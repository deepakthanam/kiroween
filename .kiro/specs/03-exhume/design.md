# Design: Exhume

## Overview

Exhume is a short pipeline with one agent step in the middle and deterministic steps on both sides of it.

```
freeze ─▶ triage ─▶ discover surface ─▶ [coroner agent] ─▶ validate ─▶ exhumed
  │          │             │                                   │
INTEGRITY  REFUSED    ORIGINAL_UNLOADABLE              retry once, then MODEL_INVALID
```

## Components and interfaces

```ts
// pipeline/freeze.ts
function freeze(spec: { name: string; version: string }, runDir: string, deps: { http: HttpClient }): Promise<{ treeHash: string }>;
function safeExtract(tarball: Buffer, targetDir: string): Promise<void>;       // rejects traversal, links, devices
function verifyIntegrity(tarball: Buffer, integrity: string): boolean;         // SRI sha512 / sha1

// core/triage.ts  (pure: source text in, findings out)
interface Finding { rule: RuleId; severity: "refuse" | "warn"; file: string; line: number }
function scanSource(files: { path: string; text: string }[], pkgJson: unknown): Finding[];
function triageVerdict(findings: Finding[]): { refused: boolean; reasons: ReasonCode[] };

// core/node-major.ts
function selectNodeMajor(pkg: { engines?: string; publishedAt: string }): number;   // table lookup, pure

// pipeline/surface.ts
function discoverSurface(runDir: string): Promise<ActualSurface>;
function validateModel(actual: ActualSurface, model: unknown): { ok: true; model: SurfaceModel } | { ok: false; errors: ModelError[] };  // pure

// pipeline/agent-runner.ts
interface AgentRunner {
  run(req: { agent: "coroner" | "surgeon" | "witness"; prompt: string; cwd: string; timeoutMs: number }): Promise<{ exitCode: number; transcriptPath: string }>;
}
class KiroCliRunner implements AgentRunner {}   // spawns the Kiro CLI in headless mode
class ReplayRunner implements AgentRunner {}    // copies a stored bundle
```

### Source scanning
Parse each `.js` file with `@babel/parser` in tolerant mode (old code may be sloppy). Detect `require("x")`, `import … from "x"`, and member expressions such as `Math.random`. If a file cannot be parsed, fall back to a regular-expression scan and add a `PARSE_FALLBACK` warning. Dynamic `require(variable)` is a `refuse` finding with reason `DYNAMIC_REQUIRE`.

### Running the Coroner headless
`KiroCliRunner` spawns: `kiro-cli chat --no-interactive --agent coroner --trust-tools=<list> "<prompt>"` with `KIRO_API_KEY` in the environment and `cwd` at the repository root. The prompt names the run directory. Confirm the exact flags with `kiro-cli chat --help` during task 4.1 and keep them in one constant. The agent's own permission rules limit where it can write; the runner additionally snapshots the hash of `original/` before and after and fails the stage if it changed.

### Validation rules (`validateModel`)
1. Schema valid.
2. `modelled ∪ excluded` equals the set of function exports in the actual surface; the two sets are disjoint.
3. No path outside the actual surface.
4. `params.length ≥ actual.length` for each modelled export.
5. Every exclusion has a reason from the fixed enum.

### Replay bundles
`runs/replay/<name>/` holds `run.json`, `surface.actual.json`, the agent outputs for each stage, `events.jsonl` and the final report. `ReplayRunner` copies the stage's files and returns exit code 0.

## Data models

`run.json`: `{ runId, name, version, nodeMajor, treeHash, state, triage: { findings, refused, reasons }, createdAt, stages: { exhume, reanimate, prove } }`.

`surface.actual.json`: `{ exports: [{ path, kind: "function" | "object" | "string" | …, length? }] }`.

## Correctness Properties

### Property 1: Extraction never escapes
*For any* tar archive whose entry names are arbitrary strings (including `..` segments, absolute paths, backslashes and null bytes) and whose entries may be links, `safeExtract` writes no file outside the target directory and creates no links.
**Validates: Requirements 1.3**

### Property 2: Integrity detects any change
*For any* byte buffer and any single-byte modification of it, `verifyIntegrity` accepts the original against its own hash and rejects the modified buffer.
**Validates: Requirements 1.1, 1.2**

### Property 3: Banned modules are always flagged
*For any* generated JavaScript source that contains a `require` or `import` of a banned module at any position, `scanSource` returns a `refuse` finding for it with the correct line; *for any* source generated without such a reference, it returns none for that rule.
**Validates: Requirements 2.1**

### Property 4: Triage verdict follows findings
*For any* list of findings, `triageVerdict` refuses if and only if at least one finding has severity `refuse`, and warnings alone never refuse.
**Validates: Requirements 2.3, 2.4**

### Property 5: Node major selection is total and in range
*For any* `engines` string (valid or not) and any publish date, `selectNodeMajor` returns a major from the supported table and never throws.
**Validates: Requirements 3.2**

### Property 6: Model validation is exact
*For any* actual surface `A` and model `M` built from sets of paths, `validateModel` succeeds if and only if the modelled and excluded sets are disjoint, their union equals the function exports of `A`, and every modelled export has enough parameters.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Replay is idempotent
*For any* stored bundle, running the exhume stage with `ReplayRunner` twice yields artefacts that are byte-identical after removing timestamp fields.
**Validates: Requirements 6.1, 6.2**

### Property 8: The original is untouched
*For any* run of the exhume stage against a fixture package (replay runner), the tree hash of `original/` after the stage equals the hash recorded at freeze time.
**Validates: Requirements 1.4**

## Error handling

- Each stage writes a terminal event (`exhumed`, `refused`, `failed`) with a reason code to `events.jsonl`.
- Agent failure keeps partial outputs under `runs/<runId>/spec/` and records the transcript path.
- A hash change in `original/` after an agent stage is a hard failure, `ORIGINAL_MODIFIED`, regardless of what else succeeded.

## Testing strategy

- Properties 1 to 6 are pure or use a temp directory. Properties 7 and 8 use `ReplayRunner` with a bundle built from the `pure-math` fixture.
- One live example run of the Coroner on `pure-math` is executed manually in Phase 3 and stored as the first replay bundle.
