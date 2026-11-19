# Requirements: Reanimate (upgrade, repair loop and full pipeline)

## Introduction

Reanimate makes an exhumed package work on the current Node LTS. The Surgeon agent edits a copy; deterministic guards check that the public API is unchanged and that the package loads; the Witness then runs the proof of life. If the Witness finds a divergence, the counterexample goes back to the Surgeon for a bounded number of repair rounds. This spec also assembles the three stages into one `resurrect` pipeline with a single run state machine.

## Glossary

- **Surface guard**: a deterministic comparison of the original and revived export surfaces.
- **Load check**: installing and loading the revived package on the current LTS inside a container.
- **Repair round**: one Surgeon fix attempt in response to a Witness counterexample.
- **Run state**: one of `QUEUED`, `EXHUMING`, `REANIMATING`, `PROVING`, `REPAIRING`, `REVIVED`, `PARTIAL`, `REFUSED`, `FAILED`.

## Requirements

### Requirement 1: Working copy

**User Story:** As a user, I want the upgrade done on a copy, so that the original remains available as the baseline.

#### Acceptance Criteria

1. WHEN reanimation starts THEN the system SHALL copy `original/` to `revived/` and initialise a git repository in `revived/` with the unmodified source as the first commit.
2. WHEN reanimation ends for any reason THEN the tree hash of `original/` SHALL equal the hash recorded at freeze time, and IF it does not THEN the run SHALL fail with `ORIGINAL_MODIFIED`.

### Requirement 2: Surgeon stage

**User Story:** As a user, I want the smallest set of changes that makes the package work today, so that the revived package is easy to review.

#### Acceptance Criteria

1. WHEN the working copy is ready THEN the system SHALL invoke the `surgeon` agent through the AgentRunner with the run directory as context.
2. WHEN the Surgeon finishes THEN `revived/RESURRECTION.md` and a `CHANGELOG.md` entry SHALL exist, and each change SHALL be committed in the `revived/` repository.
3. IF the agent exceeds its time budget (default 15 minutes) or exits with an error THEN the stage SHALL fail with `AGENT_FAILED`.

### Requirement 3: Surface guard

**User Story:** As a user, I want a mechanical check that the public API did not change, so that I do not rely on the agent's word.

#### Acceptance Criteria

1. WHEN the Surgeon stage or a repair round completes THEN the system SHALL discover the revived surface on the current LTS and compare it with `surface.actual.json`.
2. IF any export path is added, removed, changes kind or changes function length THEN the guard SHALL fail and list each difference.
3. IF the guard fails after the Surgeon stage THEN the system SHALL return the differences to the Surgeon as a repair round.

### Requirement 4: Load check and package metadata

**User Story:** As a user, I want the revived package to install and load cleanly, so that I can actually use it.

#### Acceptance Criteria

1. WHEN the guard passes THEN the system SHALL run `npm install --ignore-scripts` and load the package on the current LTS in a sandboxed container, and IF either step fails THEN it SHALL count as a failed round with the error returned to the Surgeon.
2. THE revived `package.json` SHALL have `name` equal to `@revenant/<original-name>` (with any original scope folded into the name), `version` equal to the next patch of the original version, and `engines.node` admitting the current LTS.
3. THE revived `package.json` SHALL NOT define `preinstall`, `install` or `postinstall` scripts.
4. WHEN the load check passes THEN the system SHALL query advisories for the revived dependency tree and record any that remain in the report.

### Requirement 5: Repair loop

**User Story:** As a user, I want divergences fed back and fixed automatically within limits, so that most packages finish without my involvement and none loop forever.

#### Acceptance Criteria

1. WHEN the proof of life reports a mismatch THEN the system SHALL write `handoff/counterexample-<n>.json` and invoke the Surgeon for a repair round.
2. THE system SHALL allow at most 3 repair rounds per run across guard failures, load failures and divergences combined.
3. WHEN a repair round completes THEN the system SHALL rerun the surface guard, the load check and the full proof of life with a new seed, and SHALL also replay every earlier counterexample.
4. IF the round limit is reached with a divergence outstanding THEN the run SHALL end `REFUSED` with reason `DIVERGENT_AFTER_REPAIR` and the report SHALL include every counterexample.
5. WHEN any earlier counterexample mismatches again after a later round THEN the system SHALL record a regression event.

### Requirement 6: Run state machine

**User Story:** As a developer, I want one well-defined state machine for a run, so that the API, UI and patrol all agree on what is happening.

#### Acceptance Criteria

1. THE run state SHALL change only through the transitions listed in the design, and any other event SHALL be rejected without changing state.
2. WHEN a run reaches `REVIVED`, `PARTIAL`, `REFUSED` or `FAILED` THEN it SHALL accept no further transitions.
3. WHEN the state changes THEN the system SHALL append an event to `events.jsonl` with a monotonically increasing sequence number.
4. WHEN a run exceeds the overall time limit (default 30 minutes) THEN it SHALL move to `FAILED` with reason `TIMEOUT` and all its containers SHALL be removed.

### Requirement 7: Outputs

**User Story:** As a user, I want a reviewable result, so that I can adopt the revived package with confidence.

#### Acceptance Criteria

1. WHEN a run ends `REVIVED` or `PARTIAL` THEN the system SHALL write `revived.diff` (unified diff from original to revived), the equivalence report and a `SUMMARY.md` linking them.
2. WHEN `revived.diff` is applied to a copy of the original THEN the result SHALL equal the revived tree, excluding `node_modules` and `.git`.
3. WHERE a `GITHUB_TOKEN` and target repository are configured THE system SHALL push the revived repository to a branch and open a pull request whose body is `SUMMARY.md`.

### Requirement 8: Command line

**User Story:** As a developer, I want one command for the whole thing, so that the demo and the patrol are simple.

#### Acceptance Criteria

1. THE CLI SHALL provide `revenant reanimate <runDir>`, `revenant guard <runDir>`, `revenant load-check <runDir>` and `revenant resurrect <name@version>`.
2. WHEN `resurrect` runs THEN it SHALL execute exhume, reanimate and prove in order, print the verdict and exit 0 for `REVIVED`, 1 for `PARTIAL`, 2 for `REFUSED` and 3 for `FAILED`.
3. WHEN `--replay <bundle>` is given THEN `resurrect` SHALL use the `ReplayRunner` for all agent stages.
