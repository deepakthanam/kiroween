# Design: Proof of life (differential equivalence harness)

## Overview

Two long-lived containers ("sides") each run a probe that loads one version of a package. The host generates calls with fast-check, sends each call to both sides, and compares encoded outcomes. fast-check drives the loop, so shrinking comes for free: when a property fails, fast-check re-runs smaller calls against the same two sides until it finds a minimal one.

```
host (Node 24)                                   containers (--network none)
┌───────────────────────────────┐   JSONL stdin   ┌─────────────────────────┐
│ surface model → arbitraries   │ ───────────────▶│ probe.js + original pkg │ node:<old>
│ fc.asyncProperty(call => …)   │ ◀─────────────── └─────────────────────────┘
│ compare(encoded outcomes)     │   JSONL stdout  ┌─────────────────────────┐
│ verdict(control, diff, mut.)  │ ───────────────▶│ probe.js + revived pkg  │ node:24
└───────────────────────────────┘ ◀─────────────── └─────────────────────────┘
```

## Architecture

| Module | Package | Responsibility |
|---|---|---|
| `codec.ts` | core | Canonical encode/decode, structural equality |
| `codec.es5.js` | harness/probe | ES5 encoder embedded in the probe; same output as `codec.ts` |
| `surface-model.ts` | core | zod schema for the surface model; generator vocabulary |
| `arbitraries.ts` | harness | Compile a generator spec into a fast-check arbitrary |
| `probe.js` | harness/probe | In-container runner: `load`, `list`, `call` |
| `side.ts` | harness | Start/stop one container, request/response correlation, timeouts, restart |
| `differential.ts` | harness | Run the property for each export, collect mismatches |
| `control.ts` | harness | Original-versus-original run |
| `mutator.ts` | harness | Generate mutants with Babel transforms |
| `seeded.ts` | harness | Run the comparison per mutant, compute catch rate |
| `verdict.ts` | core | Pure verdict function |
| `report.ts` | core | Report schema, Markdown renderer, banned-word check |

## Components and interfaces

```ts
// core/surface-model.ts
type Gen =
  | { kind: "string"; maxLength?: number; unicode?: boolean }
  | { kind: "integer"; min?: number; max?: number }
  | { kind: "float"; allowNaN?: boolean; allowInfinity?: boolean }
  | { kind: "boolean" } | { kind: "null" } | { kind: "undefined" }
  | { kind: "literal"; value: string | number | boolean | null }
  | { kind: "array"; of: Gen; maxLength?: number }
  | { kind: "record"; fields: Record<string, Gen>; optional?: string[] }
  | { kind: "dictionary"; values: Gen }
  | { kind: "oneOf"; options: Gen[] }
  | { kind: "json" }      // any JSON-serializable value
  | { kind: "anything" }; // JSON plus edge values, Date, RegExp, Buffer

interface ExportModel {
  path: string;                       // "default", "parse", "utils.trim"
  params: { name: string; gen: Gen; optional?: boolean }[];
  examples?: { args: unknown[]; note?: string }[];
}
interface SurfaceModel {
  package: string; version: string; nodeMajor: number;
  exports: ExportModel[];
  excluded: { path: string; reason: ExclusionReason }[];
}

// harness/side.ts
interface Side {
  list(): Promise<ExportInfo[]>;
  call(call: Call): Promise<Outcome>;   // never rejects for package errors
  restart(): Promise<void>;
  dispose(): Promise<void>;
}
function startSide(opts: { pkgDir: string; nodeMajor: number; label: "original" | "revived" | "mutant" }): Promise<Side>;

// harness/differential.ts
interface DiffResult {
  seed: number; runsPerExport: number;
  perExport: { path: string; runs: number; mismatches: number }[];
  counterexamples: { path: string; call: Call; a: Outcome; b: Outcome; seed: number; fcPath: string }[];
}
function runDifferential(a: Side, b: Side, model: SurfaceModel, opts: { runs: number; seed: number; strict: boolean }): Promise<DiffResult>;

// core/verdict.ts
function verdict(input: { control: DiffResult | null; diff: DiffResult | null; seeded: SeededResult | null; excluded: number; threshold: number }): { verdict: "REVIVED" | "PARTIAL" | "REFUSED"; reasons: ReasonCode[] };
```

### Probe protocol (one JSON object per line)
- Host → probe: `{"t":"list"}` or `{"t":"call","id":17,"path":"parse","args":"<codec string>"}`
- Probe → host: `{"t":"list","exports":[…]}` or `{"t":"out","id":17,"kind":"return","value":"<codec string>","async":false}`
- The probe writes protocol lines to file descriptor 3 if available, otherwise stdout with a sentinel prefix, so package `console.log` output cannot corrupt the stream.

### Docker invocation
`docker run --rm -i --network none --memory 512m --cpus 1 --pids-limit 128 --read-only --tmpfs /tmp -v <pkgDir>:/pkg:ro -v <probeDir>:/probe:ro node:<major> node /probe/probe.js /pkg`

### Mutation operators (fixed set)
Arithmetic swap (`+`↔`-`, `*`↔`/`), comparison boundary (`<`↔`<=`, `>`↔`>=`), equality flip (`===`↔`!==`), boolean literal flip, numeric literal off-by-one, string literal empty, conditional negation, return-value drop for non-void returns. Mutants are chosen deterministically from the seed.

## Data models

`equivalence-report.json`:
```json
{
  "package": "name", "originalVersion": "1.2.3", "revivedVersion": "1.2.4",
  "nodeOriginal": 8, "nodeRevived": 24,
  "seed": 123456, "strict": false,
  "control": { "runs": 500, "mismatches": 0 },
  "comparison": { "runsPerExport": 1000, "perExport": [], "counterexamples": [] },
  "seededBugs": { "generated": 20, "viable": 17, "caught": 15, "catchRate": 0.882 },
  "excluded": [{ "path": "x", "reason": "USES_TIMERS" }],
  "verdict": "REVIVED", "reasons": [],
  "generatedAt": "ISO-8601"
}
```

## Correctness Properties

*A property is a statement that should hold for all valid inputs. Each one below becomes one property-based test.*

### Property 1: Codec round trip
*For any* supported JavaScript value `v`, `decode(encode(v))` is structurally equal to `v`, preserving `-0`, `NaN`, array holes and key order.
**Validates: Requirements 3.1, 3.2**

### Property 2: Encoding is a faithful equality
*For any* two supported values `a` and `b`, `encode(a) === encode(b)` if and only if `a` and `b` are structurally equal.
**Validates: Requirements 3.3**

### Property 3: Host and probe encoders agree
*For any* supported value `v` expressible in ES5, the ES5 probe encoder and the host encoder produce byte-identical strings.
**Validates: Requirements 3.4**

### Property 4: Codec never throws
*For any* value, including ones over the depth or size limit, `encode` returns a string and does not throw.
**Validates: Requirements 3.5**

### Property 5: Generators honour the model
*For any* valid generator spec `g`, every value produced by `compile(g)` satisfies the validator derived from `g`.
**Validates: Requirements 4.1**

### Property 6: Seed determinism
*For any* surface model, case count and seed, generating the call sequence twice yields identical sequences.
**Validates: Requirements 4.2**

### Property 7: One outcome per call
*For any* sequence of calls sent to a side running a fixture package, the outcomes received have exactly the same multiset of ids as the calls sent.
**Validates: Requirements 2.2, 2.5**

### Property 8: Reflexivity
*For any* deterministic fixture package and any seed, comparing the package against itself yields zero mismatches.
**Validates: Requirements 4.3, 5.1**

### Property 9: Injected differences are found and shrunk
*For any* fixture pair that differs exactly on inputs satisfying a known predicate with density of at least 1 in 50, the comparison reports a counterexample that satisfies the predicate and still mismatches when replayed from its seed.
**Validates: Requirements 4.5**

### Property 10: Outcome matching is an equivalence relation
*For any* outcomes `x`, `y`, `z`, matching is reflexive, symmetric and transitive, and strict-mode matching implies non-strict matching.
**Validates: Requirements 4.3, 4.4, 4.6**

### Property 11: Verdict is total and monotone
*For any* combination of control, comparison, seeded-bug and exclusion inputs, `verdict` returns exactly one verdict; adding a mismatch, an exclusion or a failed control never moves the verdict toward `REVIVED`.
**Validates: Requirements 5.2, 6.5, 6.6, 7.2, 7.5**

### Property 12: Catch-rate arithmetic
*For any* list of mutant results, `0 ≤ catchRate ≤ 1`, `caught ≤ viable ≤ generated`, and non-viable mutants do not change the rate.
**Validates: Requirements 6.2, 6.4**

### Property 13: Reports never overclaim
*For any* valid report object, the rendered Markdown contains the case count and none of the banned words.
**Validates: Requirements 7.3, 7.4**

## Error handling

- All failures use `RevenantError` with codes such as `SIDE_START_FAILED`, `PACKAGE_LOAD_FAILED`, `PROBE_PROTOCOL`, `DOCKER_UNAVAILABLE`, `MODEL_INVALID`.
- A side that dies mid-run is restarted once per call; a second death on the same call is recorded as `timeout` for that side.
- Containers are tracked in a registry and removed in a `finally` block and on `SIGINT`/`SIGTERM`.
- Probe stdout noise from the package is discarded; only protocol lines are parsed, and a malformed protocol line is a `PROBE_PROTOCOL` error, never a mismatch.

## Testing strategy

- Properties 1 to 6 and 10 to 13 are pure and run everywhere.
- Properties 7 to 9 need Docker and use synthetic packages in `corpus/fixtures/`: `pure-math` (deterministic), `flaky` (uses `Math.random`, for the control), `drifted-a`/`drifted-b` (differ on a known predicate), `noisy` (logs to stdout), `slow` (exceeds the timeout), `throws` (various error types), `async-fn` (returns promises).
- One end-to-end example test runs `control`, `prove` and `mutate` on `pure-math` against a hand-made revived copy and checks the report against a snapshot with volatile fields removed.
