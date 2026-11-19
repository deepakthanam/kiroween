---
inclusion: always
---
# Tech stack and commands

## Stack
- **Language**: TypeScript 5, `strict: true`, ES modules. No `any`; use `unknown` and narrow.
- **Runtime**: Node 24 LTS on the host and in the "new side" container.
- **Monorepo**: pnpm workspaces.
- **Tests**: Vitest. Property-based tests with `fast-check`. E2E with Playwright.
- **Validation**: `zod` at every boundary (CLI args, HTTP bodies, MCP tool inputs, files written by agents).
- **Sandbox**: Docker. Official `node:<major>` images for old runtimes.
- **API**: Fastify, server-sent events for run progress.
- **Storage**: SQLite via `better-sqlite3`. Run artefacts on disk under `runs/<runId>/`.
- **Web**: Vite + React + TypeScript. Plain CSS with custom properties (no UI kit).
- **MCP**: `@modelcontextprotocol/sdk`, stdio transport.
- **Agent stages**: Kiro CLI in headless mode behind an `AgentRunner` interface, with a `ReplayRunner` for CI and the hosted demo.

## Root scripts (create in Phase 0, keep these names)
| Script | Does |
|---|---|
| `pnpm verify` | lint, typecheck, all unit and property tests |
| `pnpm verify:quick` | typecheck only (used by the Stop hook) |
| `pnpm test:prop` | property tests only |
| `pnpm test:e2e` | Playwright |
| `pnpm revenant <cmd>` | run the CLI from source |
| `pnpm dev` | API + web in watch mode |
| `pnpm build` | build all packages |

## External services
- npm registry: `https://registry.npmjs.org/<name>`
- OSV advisories: `POST https://api.osv.dev/v1/query`
- GitHub REST (optional, `GITHUB_TOKEN`): repository archived status, pull requests.

All three go through one `HttpClient` with record/replay: `REVENANT_FIXTURES=record|replay|live` (default `replay` in tests and CI).

## Environment variables
`KIRO_API_KEY` (headless agent runs), `GITHUB_TOKEN` (optional), `REVENANT_FIXTURES`, `REVENANT_DATA_DIR` (default `./runs`), `REVENANT_MAX_CONCURRENT_RUNS` (default 1).

Never write secrets to files, logs, run artefacts or reports.

## Sandbox rules (every container, no exceptions)
`--network none --memory 512m --cpus 1 --pids-limit 128 --read-only` with the package mounted read-only and a tmpfs for `/tmp`. Per-call timeout 2 s, per-run timeout 10 min.

## Conventions
- Pure logic lives in `packages/core` with no I/O imports. I/O lives behind interfaces.
- Functions that agents' output passes through must validate with zod and fail closed.
- Errors: typed `RevenantError` with a `code` from one shared enum. No thrown strings.
- Prefer small modules with one exported responsibility; property tests sit next to the module as `*.prop.test.ts`.
- Do not add a dependency without a one-line justification in the PR description or task note.
- Verify Kiro CLI flags against `kiro-cli chat --help` before hard-coding them.
