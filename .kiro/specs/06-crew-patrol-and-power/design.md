# Design: Graveyard patrol and Revenant power

## Overview

Both packages are thin. The patrol's decisions (what is newly dead, what to queue, what to say) are pure functions in `packages/core`; the Crew agent gathers audits with MCP tools and calls a small backend that applies those functions and stores state. The power is documentation plus configuration around the existing MCP server and CLI.

Starter files for both already exist in `crew-app/revenant-patrol/` and `power/revenant-power/`. Treat them as drafts: check each against the current Kiro Crew manifest reference and the Kiro powers documentation, and correct them where the documentation differs.

## Crew app

```
crew-app/revenant-patrol/
├── app.json
├── agents/patrol.json           # Kiro agent config; tools: read, shell, @graveyard
├── skills/graveyard-patrol/SKILL.md
├── mcp/graveyard.mjs            # single-file build of packages/graveyard-mcp (built, committed)
├── backend/server.mjs           # Node HTTP server: patrol state, records, watched repos
├── ui/src/…  → ui/dist/index.mjs  # dashboard page bundle exporting mount() (built, committed)
└── package.json                 # build script produces mcp/ and ui/dist/
```

### Backend routes (served under the app's route base)
| Method and path | Purpose |
|---|---|
| `GET /health` | health check |
| `GET /repos`, `POST /repos`, `DELETE /repos/:id` | watched repositories |
| `POST /patrols` | body: `{ audits: { repoId, audit | error }[] }`; computes newly dead, queues runs, stores record; returns the record |
| `GET /patrols?limit=10` | patrol history |
| `POST /patrols/run-now` | asks Crew to run the cron job's message immediately, if the Crew API allows it; otherwise returns instructions |

State is stored with the app-scoped storage Crew provides, or a JSON file in the app's data directory if that API is not available. Decide in task 2.1 after reading the Crew app documentation.

### Patrol flow
1. Cron fires with the message in `app.json`; Crew starts the `patrol` agent.
2. The agent follows `skills/graveyard-patrol/SKILL.md`: `GET /repos`, then `audit_lockfile` per repository via the graveyard MCP server.
3. The agent posts all audits to `POST /patrols`. The backend runs `planPatrol` (pure) and queues resurrections by calling the Revenant API (`REVENANT_API_URL`) or, if unset, spawning `revenant resurrect`.
4. The agent formats the returned record with `renderSummary` rules from the skill and posts it to the conversation.

```ts
// core/patrol.ts  (pure)
interface PatrolInput { previous: Record<RepoId, PkgKey[]>; current: Record<RepoId, AuditResult | { error: string }>; activeRuns: PkgKey[]; limit: number }
interface PatrolPlan { newlyDead: Record<RepoId, PkgKey[]>; toQueue: PkgKey[]; nextState: Record<RepoId, PkgKey[]>; errors: { repoId: RepoId; error: string }[] }
function planPatrol(input: PatrolInput): PatrolPlan;
function renderSummary(record: PatrolRecord): string;
```

Rules inside `planPatrol`: `newlyDead[r] = deadEligible(current[r]) \ previous[r]`; `toQueue` is the de-duplicated union across repositories, minus `activeRuns`, ordered by score, truncated to `limit`; for a repository whose audit errored, `nextState[r] = previous[r]` (do not forget what was known).

## Power

```
power/revenant-power/
├── plugin.json
├── mcp.json                      # graveyard server
└── skills/
    ├── audit-lockfile/SKILL.md
    └── resurrect-package/SKILL.md
```

The power's `mcp.json` must start the server without depending on this repository's layout. Publish `packages/graveyard-mcp` so `npx` can run it, or document a one-line global install in the power's onboarding skill. Decide in task 5.1.

## Continuous integration

`.github/workflows/graveyard.yml`: on pull requests touching `**/package-lock.json`, install, build the CLI, run `revenant audit --fail-on-dead --json`. A second job, conditional on the `KIRO_API_KEY` secret, runs `kiro-cli chat --no-interactive` with read-only trusted tools and a prompt asking for a short explanation of each newly dead package, then posts it as a pull-request comment.

## Correctness Properties

### Property 1: Newly dead is a set difference
*For any* previous state and current audits, `newlyDead[r]` equals the eligible dead set of the current audit minus the previous dead set for `r`, contains no duplicates, and is empty for a repository whose audit errored.
**Validates: Requirements 2.2, 2.5**

### Property 2: Patrol is idempotent
*For any* patrol input, running `planPatrol` again with `previous` set to the first plan's `nextState` and the same `current` yields no newly dead packages and an empty queue.
**Validates: Requirements 3.1**

### Property 3: Queue limits and exclusions
*For any* patrol input, `toQueue` has no duplicates, has length at most `limit`, contains no key present in `activeRuns`, and every key in it appears in some repository's `newlyDead`.
**Validates: Requirements 2.3, 3.2**

### Property 4: Errors do not erase memory
*For any* patrol input in which a repository's audit errored, `nextState` for that repository equals its previous state and the error is listed exactly once.
**Validates: Requirements 2.5**

### Property 5: Summary counts match the record
*For any* patrol record, every number in `renderSummary`'s output equals the length of the corresponding list in the record, and a record with nothing new renders as a single line.
**Validates: Requirements 4.1, 4.2, 4.3**

## Error handling

- The backend validates every request body with zod and returns the shared error envelope.
- Failure to queue one resurrection is recorded in the patrol record and does not stop the others.
- If the graveyard MCP server fails to start inside Crew, the skill tells the agent to report that and stop, not to guess at package health.

## Testing strategy

- Properties 1 to 5 are pure tests in `packages/core`.
- Backend routes get example tests with an in-memory store.
- The Crew app and the power are verified manually with the checklists in the tasks, because they depend on the Crew gateway and the Kiro IDE.
