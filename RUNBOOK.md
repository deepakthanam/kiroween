# Revenant: how to run this build in Kiro

This kit contains the plan and Kiro configuration for Revenant. It does not contain the product code: Kiro writes that, phase by phase, from the specs. You drive it with one orchestrator prompt.

## 1. What is in the kit

| Path | What it is | Kiro feature |
|---|---|---|
| `.kiro/steering/product.md`, `tech.md`, `structure.md` | Always-on project context | Steering (foundation files) |
| `.kiro/steering/resurrection-rules.md`, `kiro-evidence.md` | Always-on invariants and the usage-log habit | Steering |
| `.kiro/steering/testing.md`, `ui-graveyard.md` | Load only for matching files | Steering (`fileMatch`) |
| `.kiro/steering/orchestrate.md` | The master prompt, run as `/orchestrate` | Steering (`manual`) |
| `.kiro/specs/01…06/` | Requirements, design with correctness properties, tasks | Specs and property-based testing |
| `.kiro/hooks/*.json` + `scripts/hooks/` | Guardrails, formatting, tests, spec sync, journal | Hooks |
| `.kiro/agents/coroner.md`, `surgeon.md`, `witness.md` | Role agents with write permissions scoped by path | Custom agents |
| `.kiro/settings/mcp.json` | The graveyard MCP server (disabled until built) | MCP |
| `power/revenant-power/` | Installable power: manifest, MCP config, two skills | Powers |
| `crew-app/revenant-patrol/` | Crew app: manifest, agent, skill | Kiro Crew |
| `docs/KIRO_USAGE.md`, `docs/PROGRESS.md` | Usage log (becomes the write-up) and phase tracker | Submission evidence |

## 2. Prerequisites

- Kiro IDE, current release, signed in. Request the hackathon's Kiro credits before Dec 1, 12:00 pm PT.
- Kiro CLI (needed from Phase 3). Headless runs need a `KIRO_API_KEY`, which requires a paid Kiro plan.
- Kiro Crew (needed in Phase 6).
- Docker running locally. Node 24 and pnpm. Git and a GitHub account.

## 3. One-time setup

1. Create a **new public GitHub repository** with the **MIT licence** and clone it. The project must be new for the hackathon.
2. Copy everything from this kit into the repository root, including the hidden `.kiro` folder and `.gitignore`. Replace "Revenant authors" in `LICENSE` with your name.
3. Open the folder in Kiro IDE and trust the workspace (workspace agents load only in a trusted workspace).
4. Check that Kiro picked everything up, in the Kiro panel:
   - **Specs**: six specs, `01-proof-of-life` to `06-crew-patrol-and-power`.
   - **Agent steering**: eight files.
   - **Agent hooks**: nine hooks across four files. Four are disabled on purpose until Phase 0 installs the toolchain.
   - **Agents**: `coroner`, `surgeon`, `witness`.
   - **MCP servers**: `graveyard`, disabled.
5. Commit and push. Confirm on GitHub that `.kiro/` is in the repository and the licence shows in the About panel.

If the specs do not appear in the panel, or the property links in a design do not show, open that spec in a Spec session and ask Kiro to review and refine it. That makes Kiro register the spec itself, and it is also the right first step for the hackathon: see section 7.

## 4. Running the build

Work in **one new chat session per phase**. In each session, type:

```
/orchestrate
Start Phase 0.
```

If the slash command does not appear, use `#orchestrate Start Phase 0.` instead. Both load `.kiro/steering/orchestrate.md`.

Then, for each phase:

1. Let Kiro work to the phase's gate. For Phases 1 to 6 it executes the spec's `tasks.md`. You can also open `tasks.md` yourself and use **Run all tasks** or start tasks one at a time; Kiro runs independent tasks concurrently.
2. Property tests are generated and run as part of the tasks. This Correctness feature is available in the IDE, so run spec tasks in the IDE, not the CLI.
3. At the gate, Kiro reports the checks. Review them, then reply `gate approved`.
4. Commit and push. Start a new session for the next phase:

```
/orchestrate
Start Phase 1.
```

To pick up after a break: `/orchestrate` then `continue`. For a summary: `/orchestrate` then `status`.

### What happens in each phase

| Phase | You type | Kiro pieces exercised | Gate |
|---|---|---|---|
| 0 Bootstrap | `Start Phase 0.` | Chat-driven build, steering, hooks get enabled | `pnpm verify` passes, Docker images run |
| 1 Proof of life | `Start Phase 1.` | Spec, 13 properties, `witness` review, hooks | Shrunk counterexample on the drifted fixtures; catch rate reported |
| 2 Graveyard | `Start Phase 2.` | Spec, properties, MCP server enabled and used from chat | Live audit works; corpus chosen and approved |
| 3 Exhume | `Start Phase 3.` | Spec, `coroner` as sub-agent, then Kiro CLI headless | Three packages exhumed or refused |
| 4 Reanimate | `Start Phase 4.` | Spec, `surgeon` and `witness` sub-agents, CLI headless | Three `REVIVED`; one stored caught-and-repaired divergence |
| 5 Graveyard UI | `Start Phase 5.` | Spec, `fileMatch` UI steering, Playwright | Public URL works without credentials |
| 6 Crew and power | `Start Phase 6.` | Crew app, power, CLI in CI | Patrol ran twice; power activates in another project |
| 7 Submission | `Start Phase 7.` | Usage log becomes the write-up | You confirm URL, video, Devpost draft |

## 5. Using each Kiro piece by hand

**Custom agents.** Ask in chat: "Use the `witness` sub-agent to review `packages/harness/src/differential.ts`." From the CLI: `kiro-cli --agent witness`. The agents' `permissions` rules limit where each can write; `witness` cannot edit package source at all.

**Hooks.** They fire on changes the agent makes, not on your manual edits. `protect-originals` blocks any write to frozen originals. `kiro-dir-stays-committed` fails if `.gitignore` ever excludes `.kiro`. Two hooks use agent prompts and cost credits (`properties-follow-requirements`, `new-module-needs-a-property`); the rest are shell commands and cost nothing. Disable any hook by setting `"enabled": false`.

**MCP.** After Phase 2 task 7.1, the `graveyard` server is enabled. Try: "Use the graveyard tools to audit this repository's lockfile." To open the config: Command Palette → **Kiro: Open workspace MCP config (JSON)**.

**Kiro CLI headless** (Phases 3 and 4, and CI):
```
export KIRO_API_KEY=ksk_...
kiro-cli chat --no-interactive --agent coroner --trust-tools=read,write,shell "Exhume runs/<runId>"
```
Confirm flags with `kiro-cli chat --help`; the pipeline keeps them in one constant.

**Power** (Phase 6). Powers panel → **Add Custom Power** → **Import power from a folder** → choose `power/revenant-power`. Then, in another project, ask "is anything in my lockfile dead?".

**Crew app** (Phase 6). With the Crew gateway running:
```
curl -X POST http://localhost:5476/api/apps/install \
  -H 'Content-Type: application/json' \
  -d '{"source": "/absolute/path/to/crew-app/revenant-patrol"}'
```
Build the app's `mcp/` and `ui/dist/` bundles first (Phase 6 task 3.2 and 3.3).

**Kiro Web** (optional). If you can access it, hand it one self-contained task from a repository branch, such as Phase 6 task 6.1, and note the experience in the usage log. It is not required.

## 6. Things I could not confirm from the documentation

Check these as you go; the specs already contain tasks to do so.

1. **Workspace MCP config path.** The kit uses `.kiro/settings/mcp.json`. If Kiro does not show the `graveyard` server, open the workspace config from the Command Palette and paste the content there.
2. **Hand-written specs and the Correctness UI.** The docs describe Kiro extracting properties itself during the design phase. If property links do not appear for these files, run a Spec session per spec and ask Kiro to refine the design.
3. **Task and property formatting.** `tasks.md` and the "Property N / Validates" blocks follow the layout Kiro generates, but I did not find a formal format reference.
4. **`plugin.json` schema URL** for the power. The MCP schema URL is documented; the plugin one is inferred by analogy. Phase 6 task 5.1 checks it.
5. **Crew details**: the agent file schema inside an app, how relative MCP paths resolve from the installed copy, and `permissions.api`. Phase 6 tasks 2.1 and 3.2 check them.
6. **Selecting a custom agent in the IDE chat.** The docs I read cover the CLI picker and sub-agent use; asking Kiro to delegate to a named sub-agent is the documented route.
7. **Hook STDIN field names** for file and task events. The scripts read the whole event defensively, so they work whatever the field names are.

## 7. A note on the hackathon rules

Judges score how thoroughly Kiro was used, and the write-up asks how you structured specs with Kiro. These specs are a starting draft written outside Kiro. Before each phase, open that phase's spec in a Spec session, have Kiro review it against the steering files, and accept or reject its changes. Log what it changed in `docs/KIRO_USAGE.md`. That makes the specs yours and Kiro's, and gives you real material for the write-up.

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Hook errors mentioning `pnpm` or `prettier` before Phase 0 | Toolchain not installed yet | Leave those hooks disabled until Phase 0 step 5 |
| `protect-originals` blocks a legitimate write | The path contains `corpus/originals/` or `runs/<id>/original/` | Write to `runs/<id>/revived/` instead; the rule is intentional |
| Agent keeps looping on type errors at the end of each turn | `typecheck-on-stop` feeding errors back | Fix the errors, or disable that hook temporarily |
| `graveyard` server fails to start | Not built, or still `"disabled": true` | `pnpm build`, then enable it in the MCP config |
| Headless CLI asks to log in | `KIRO_API_KEY` not set in that shell | Export it; check your plan includes API keys |
| Docker tests skipped | `DOCKER` environment variable not set | `DOCKER=1 pnpm verify` |
