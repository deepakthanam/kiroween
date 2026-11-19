# Design: Graveyard (lockfile audit and MCP server)

## Overview

Pure logic (parser, score, eligibility, sorting) lives in `packages/core`. I/O (HTTP client with record/replay, cache) lives in `packages/graveyard-mcp/src/sources`. The MCP server, the CLI command and the API route are thin adapters over one `audit()` function.

## Architecture

```
lockfile text ──▶ parseLockfile (core) ──▶ entries
entries ──▶ collectVitals (sources: registry, osv, github; cache; limiter) ──▶ vitals[]
vitals ──▶ deadScore (core) + eligibility (core) ──▶ AuditResult
AuditResult ──▶ MCP tool | CLI table | HTTP JSON
```

## Components and interfaces

```ts
// core/lockfile.ts
interface LockEntry { name: string; version: string; resolved?: string; integrity?: string; direct: boolean; paths: string[] }
function parseLockfile(text: string): Result<LockEntry[], RevenantError>;
function serializeLockfile(entries: LockEntry[]): string;   // lockfileVersion 3, used for the round-trip property

// core/vitals.ts
type Source<T> = { status: "ok"; data: T } | { status: "unavailable"; error: string };
interface Vitals {
  name: string; version: string;
  registry: Source<{ lastPublish: string; deprecated?: string; engines?: string; repository?: string; unpackedSize?: number; fileCount?: number; scripts: string[]; gypfile: boolean }>;
  advisories: Source<{ id: string; severity?: string; fixedIn?: string }[]>;
  github: Source<{ archived: boolean }> | { status: "skipped" };
}

// core/dead-score.ts
function deadScore(v: Vitals, now: Date): { score: number; state: "DEAD" | "DYING" | "ALIVE"; reasons: ReasonCode[] };
function eligibility(v: Vitals): { eligible: boolean; reasons: ReasonCode[] };

// graveyard-mcp/src/http.ts
interface HttpClient { getJson(url: string): Promise<unknown>; postJson(url: string, body: unknown): Promise<unknown> }
function createHttpClient(mode: "live" | "record" | "replay", fixtureDir: string): HttpClient;

// graveyard-mcp/src/audit.ts
function audit(lockfileText: string, deps: { http: HttpClient; now: Date }): Promise<AuditResult>;
```

### Dead score (additive, capped at 100)
| Signal | Points |
|---|---|
| Years since last publish | 8 per full year, max 40 |
| Deprecation notice present | 25 |
| Repository archived | 20 |
| Unpatched advisories (no `fixedIn` reachable in same major) | 10 each, max 30 |
| `engines` excludes current LTS | 10 |

The table is a constant in one file so it can be tuned in one place; the properties below hold for any non-negative weights.

### MCP tools
| Tool | Input | Output |
|---|---|---|
| `audit_lockfile` | `{ path?: string; content?: string }` (exactly one) | `AuditResult` |
| `package_vitals` | `{ name: string; version: string }` | `Vitals` with score |
| `list_advisories` | `{ name: string; version: string }` | advisory list |
| `resurrection_candidates` | `{ path?: string; content?: string; limit?: number }` | sorted candidates |

Path inputs are resolved and must stay inside the server's working directory after symlink resolution.

## Data models

`AuditResult`: `{ generatedAt, totals: { packages, dead, dying, alive }, packages: Array<LockEntry & { score, state, reasons, eligible, eligibilityReasons }> }`.

Fixtures: `fixtures/http/<sha256(method + url + body)>.json` containing `{ request, status, body }`. Tokens are never recorded.

## Correctness Properties

### Property 1: Lockfile round trip
*For any* generated list of lock entries with unique `name@version`, `parseLockfile(serializeLockfile(entries))` equals the entries.
**Validates: Requirements 1.1, 1.2**

### Property 2: Parser is total
*For any* string, `parseLockfile` returns either entries or a typed error and never throws.
**Validates: Requirements 1.3**

### Property 3: One entry per package version
*For any* lockfile in which the same `name@version` appears at several paths, the result contains it exactly once and its `paths` contains every occurrence.
**Validates: Requirements 1.4**

### Property 4: Score bounds and determinism
*For any* vitals and reference date, `deadScore` returns an integer from 0 to 100, the state matches the thresholds, and calling it twice returns the same result.
**Validates: Requirements 3.1, 3.5**

### Property 5: Older is never healthier
*For any* vitals and any two publish dates `d1 ≤ d2`, the score with `d1` is greater than or equal to the score with `d2`.
**Validates: Requirements 3.2**

### Property 6: Bad news never lowers the score
*For any* vitals, adding an unpatched advisory, a deprecation notice or the archived flag does not lower the score.
**Validates: Requirements 3.3**

### Property 7: Missing sources are flagged
*For any* vitals with at least one `unavailable` source, the reasons include `INCOMPLETE_VITALS` and the score equals the score computed with that source's signals absent.
**Validates: Requirements 2.5, 3.4**

### Property 8: Candidate ordering is total and stable
*For any* list of candidates, the sorted output is a permutation of the input ordered by score descending then name ascending, and sorting twice gives the same order.
**Validates: Requirements 4.3**

### Property 9: Path confinement
*For any* path string, including ones with `..`, absolute paths and encoded separators, `audit_lockfile` either reads a file inside the workspace root or returns an error.
**Validates: Requirements 5.3**

### Property 10: Replay makes no network calls
*For any* sequence of requests in replay mode, the client performs zero network operations and returns either the recording or `FIXTURE_MISSING`.
**Validates: Requirements 2.3**

## Error handling

- Upstream failures become `Source.status = "unavailable"`; the audit still completes.
- HTTP 429 and 5xx responses are retried twice with backoff, then marked unavailable.
- MCP tool handlers catch every error and return a tool error result; the process never exits on a bad call.

## Testing strategy

- Properties 1 to 8 are pure. Property 9 uses a temp directory tree. Property 10 uses a client with a network spy.
- One recorded audit of a real small lockfile is committed under `fixtures/http/` and used for an example test of the full path, including the MCP server over an in-memory transport.
