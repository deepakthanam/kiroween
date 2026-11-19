# Revenant

Revenant brings abandoned npm packages back to life and produces evidence that the revived version behaves like the original.

1. **Exhume**: reverse-engineer the dead package into a spec.
2. **Reanimate**: upgrade it to the current Node LTS without changing its public API.
3. **Proof of life**: run original and revived side by side in sandboxed containers on the same generated inputs and compare outcomes.

Built with Kiro for Kiroween 2026 (Resurrection category).

## Status

This repository starts as a build kit: the plan, specs and Kiro configuration. The product code is written by Kiro from the specs. See [RUNBOOK.md](RUNBOOK.md) for how to run the build, and `docs/PROGRESS.md` for where it stands.

## Where the Kiro pieces live

| Piece | Path |
|---|---|
| Specs | `.kiro/specs/` |
| Steering | `.kiro/steering/` |
| Hooks | `.kiro/hooks/`, `scripts/hooks/` |
| Custom agents | `.kiro/agents/` |
| MCP config | `.kiro/settings/mcp.json` |
| Power | `power/revenant-power/` |
| Crew app | `crew-app/revenant-patrol/` |
| Usage log | `docs/KIRO_USAGE.md` |

## Licence

MIT. See [LICENSE](LICENSE).
