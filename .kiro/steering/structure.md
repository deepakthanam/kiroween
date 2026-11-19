---
inclusion: always
---
# Project structure

```
.
├── .kiro/                    # specs, steering, hooks, agents, settings (always committed)
├── packages/
│   ├── core/                 # pure logic: codec, lockfile parser, dead score, verdict, state machine
│   ├── harness/              # differential runner, probe, control, mutator, report
│   ├── graveyard-mcp/        # MCP server over registry, OSV, GitHub
│   ├── pipeline/             # exhume, reanimate, prove orchestration and AgentRunner
│   └── cli/                  # `revenant` command
├── apps/
│   ├── api/                  # Fastify + SSE + SQLite
│   └── web/                  # the graveyard UI
├── power/revenant-power/     # Kiro power (plugin.json, skills, mcp.json)
├── crew-app/revenant-patrol/ # Kiro Crew app (app.json, agents, skills, ui, backend)
├── corpus/
│   ├── manifest.json         # the fixed list of abandoned packages
│   ├── originals/            # frozen tarballs and extractions (read-only)
│   └── fixtures/             # tiny synthetic packages for harness tests
├── fixtures/http/            # recorded registry, OSV and GitHub responses
├── runs/                     # per-run artefacts (gitignored except `runs/replay/`)
├── scripts/hooks/            # scripts called by .kiro/hooks
└── docs/                     # KIRO_USAGE.md, PROGRESS.md, architecture notes
```

## Rules
- `packages/core` imports nothing from other workspace packages and nothing that does I/O.
- Dependency direction: `core` ← `harness`, `graveyard-mcp` ← `pipeline` ← `cli`, `api` ← `web` (web talks to api over HTTP only).
- `corpus/originals/**` and `runs/*/original/**` are read-only for every agent and every script. A hook blocks writes.
- Each run writes only under `runs/<runId>/`: `original/`, `revived/`, `spec/`, `surface.actual.json`, `surface.model.json`, `events.jsonl`, `equivalence-report.json`, `equivalence-report.md`.
- Stored demo runs live in `runs/replay/<name>/` and are committed.
- File names: kebab-case. Types and React components: PascalCase. One React component per file.
- Tests: `x.test.ts` for examples, `x.prop.test.ts` for properties, beside the module.
