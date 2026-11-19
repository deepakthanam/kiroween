# Design: The graveyard (API and web app)

## Overview

`apps/api` is a Fastify server over the pipeline and a SQLite index of runs. `apps/web` is a React single-page app. All run state in the UI comes from one pure reducer over the event stream, shared with the server so it can also compute snapshots. Replay and live runs differ only in where the events come from.

## Architecture

```
web (React) ──HTTP──▶ api (Fastify)
  useRunStream(id) ◀── SSE ── /api/runs/:id/events   ◀── events.jsonl (live tail | replay pacing)
  reduceRun(events)            /api/audit             ──▶ core audit (replay or live sources)
                               /api/runs (POST)       ──▶ queue ──▶ worker ──▶ pipeline.resurrect
                               /api/scoreboard        ──▶ corpus + reports
                               /api/runs/:id/{report,spec,diff}
```

## Components and interfaces

```ts
// core/run-view.ts  (pure, shared by api and web)
interface RunView {
  state: RunState; stage: "exhume" | "reanimate" | "prove" | null;
  rounds: number; cases: number; mismatches: number;
  control: "pending" | "passed" | "failed";
  seeded?: { generated: number; viable: number; caught: number; catchRate: number };
  counterexamples: CounterexampleView[];
  verdict?: { word: "REVIVED" | "PARTIAL" | "REFUSED"; reasons: ReasonCode[] };
  lastSeq: number;
}
const initialRunView: RunView;
function reduceRun(view: RunView, event: RunStreamEvent): RunView;   // ignores events with seq ≤ view.lastSeq

// core/queue.ts  (pure model of the live-run queue)
interface QueueState { running: string[]; waiting: string[]; maxRunning: number; maxWaiting: number }
function enqueue(q: QueueState, id: string): { q: QueueState; accepted: boolean };
function finish(q: QueueState, id: string): QueueState;   // promotes the head of waiting

// api/sse.ts
function eventsFrom(runDir: string, afterSeq: number, opts: { replay: boolean; speed: number }): AsyncIterable<RunStreamEvent>;
```

### API routes
| Method and path | Purpose |
|---|---|
| `POST /api/audit` | body: lockfile text; returns `AuditResult` (not stored) |
| `GET /api/audit/sample` | stored sample audit |
| `GET /api/runs` | list replay and recent live runs |
| `POST /api/runs` | start a live run `{ name, version }`; 409 if queue full, 429 if rate limited, 503 if live disabled |
| `GET /api/runs/:id` | run summary and current `RunView` snapshot |
| `GET /api/runs/:id/events` | SSE; honours `Last-Event-ID` and `?speed=` |
| `GET /api/runs/:id/report` `/spec` `/diff` | artefacts |
| `GET /api/scoreboard` | corpus results |
| `GET /health` | liveness |

### Web structure
`src/pages/`: `Graveyard`, `Run`, `Scoreboard`. `src/components/`: `Tombstone`, `TombstoneGrid`, `StageTimeline`, `ProofCounter`, `CounterexamplePanel`, `VerdictBanner`, `LockfileDrop`, `LiveRegion`. `src/hooks/useRunStream.ts` wraps `EventSource` and folds with `reduceRun`. Styles follow `.kiro/steering/ui-graveyard.md`.

### Live-run isolation
Request handlers never touch Docker. They write a job row; a separate worker process owns the Docker client and the pipeline. In the hosted demo the worker can be switched off entirely (`REVENANT_LIVE=0`), leaving a replay-only deployment.

### Deployment
Multi-stage Dockerfile: build all packages, copy `apps/web/dist` to be served by Fastify static, copy `runs/replay/` and `corpus/manifest.json`. Target any container host that gives a public HTTPS URL. Replay-only mode needs no Docker-in-Docker and no secrets, so it is the default for the judged URL; a live-enabled instance is optional.

## Data models

`RunStreamEvent`: `{ seq: number; at: string; type: "state" | "progress" | "mismatch" | "repair" | "seeded" | "verdict" | "log"; data: … }`, the same lines the pipeline writes to `events.jsonl`.

SQLite: `runs(id, name, version, kind, state, verdict, created_at, expires_at)`, `jobs(id, run_id, status, client_hash, created_at)`.

## Correctness Properties

### Property 1: Run view is a fold
*For any* sequence of valid run events, the view obtained by reducing them one at a time equals the view obtained by reducing any split of the sequence in two parts in order, and reducing a sequence with duplicated or already-seen events gives the same view as the de-duplicated sequence.
**Validates: Requirements 4.4**

### Property 2: Replay and live agree
*For any* recorded event sequence, the final view from replay pacing at any speed equals the final view from consuming the same events as a live tail.
**Validates: Requirements 4.3, 4.4**

### Property 3: Stream resume has no gaps or duplicates
*For any* event sequence and any cut point `k`, the events served to a client that read up to `k` and reconnected with `Last-Event-ID: k`, appended to the first `k`, equal the full sequence.
**Validates: Requirements 4.1, 4.2**

### Property 4: The queue respects its limits
*For any* sequence of enqueue and finish operations, `running.length ≤ maxRunning`, `waiting.length ≤ maxWaiting`, no id appears twice, accepted ids are served in arrival order, and an enqueue is rejected only when waiting is full.
**Validates: Requirements 5.1, 5.2**

### Property 5: Grid ordering
*For any* list of tombstones, the displayed order is a permutation sorted by score descending then name ascending, and applying a filter yields a subsequence of that order.
**Validates: Requirements 2.2**

### Property 6: Scoreboard arithmetic
*For any* list of corpus results, the three verdict counts sum to the number of rows and each equals the number of rows with that verdict.
**Validates: Requirements 6.1, 6.2**

### Property 7: Views never overclaim
*For any* reachable `RunView`, the text rendered by `VerdictBanner` and `ProofCounter` contains the case count when a verdict is present and none of the banned words.
**Validates: Requirements 3.6**

## Error handling

- API errors use one envelope: `{ error: { code, message } }` with matching HTTP status.
- The SSE endpoint sends a heartbeat comment every 15 seconds and closes with a final `end` event at a terminal state.
- The web app shows a reconnecting indicator on stream loss and resumes with `Last-Event-ID`.
- Upload errors keep the user's input and focus the error message.

## Testing strategy

- Properties 1, 4, 5, 6 are pure. Properties 2 and 3 run against the SSE module with an in-memory event source. Property 7 renders components with generated views.
- Playwright: sample graveyard loads; keyboard path from grid to run view; a replay run reaches `REVIVED` and shows the report link; a replay with a repair round shows the counterexample panel; reduced-motion run shows no animation; axe checks on the three pages.
