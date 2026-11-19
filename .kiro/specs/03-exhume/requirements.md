# Requirements: Exhume (freeze, triage and reverse-engineer)

## Introduction

Exhume prepares one dead package for resurrection. It downloads and freezes the original, decides whether Revenant should attempt it at all, discovers the real API surface by loading the package in its old runtime, and has the Coroner agent write a reverse-engineered spec and a surface model. Deterministic checks validate everything the agent writes; nothing downstream trusts agent output that has not passed them.

## Glossary

- **Run directory**: `runs/<runId>/`, holding all artefacts for one resurrection.
- **Actual surface**: `surface.actual.json`, the exports reported by the probe's `list` command.
- **Surface model**: `surface.model.json`, written by the Coroner, describing how to generate arguments for each export.
- **Triage**: static checks that decide eligibility before any agent runs.
- **AgentRunner**: the interface that executes a named Kiro custom agent with a prompt; implemented by `KiroCliRunner` (headless Kiro CLI) and `ReplayRunner` (stored outputs).

## Requirements

### Requirement 1: Freeze the original

**User Story:** As a user, I want the original package captured exactly as published, so that the comparison baseline can be trusted.

#### Acceptance Criteria

1. WHEN a run starts for `name@version` THEN the system SHALL download the tarball named in the registry metadata and verify it against `dist.integrity`.
2. IF the integrity check fails THEN the system SHALL stop the run with `INTEGRITY_MISMATCH` and SHALL NOT extract the tarball.
3. WHEN extracting THEN the system SHALL reject any entry whose resolved path is outside the target directory, any symlink or hardlink, and any device file.
4. WHEN extraction completes THEN the system SHALL make `runs/<runId>/original/` read-only and record a content hash of the tree in `run.json`.
5. WHEN the original's dependencies are needed to load it THEN the system SHALL install them with install scripts disabled, inside a container.

### Requirement 2: Triage

**User Story:** As a user, I want Revenant to decline unsuitable packages early, so that I do not wait for a run that cannot produce a trustworthy result.

#### Acceptance Criteria

1. WHEN the package source requires or imports `fs`, `net`, `http`, `https`, `dgram`, `child_process`, `cluster`, `worker_threads` or `vm` THEN triage SHALL mark the run `REFUSED` with reason `SIDE_EFFECTS` and list the file and line.
2. WHEN the package contains a native addon or install scripts THEN triage SHALL mark the run `REFUSED` with reason `NATIVE_ADDON` or `INSTALL_SCRIPTS`.
3. WHEN the source references `Math.random`, `Date.now`, `new Date()` with no arguments, `process.hrtime`, timers or `process.env` THEN triage SHALL record a warning with file and line and SHALL NOT refuse on that basis alone.
4. WHEN triage refuses a run THEN the system SHALL write the reasons to `run.json` and SHALL NOT invoke any agent.

### Requirement 3: Discover the actual surface

**User Story:** As a developer, I want the export list taken from the running package, so that the model is checked against ground truth and not against an agent's reading.

#### Acceptance Criteria

1. WHEN triage passes THEN the system SHALL load the package in a sandboxed side using the selected old Node major and write `surface.actual.json` with every export path, kind and function length, walking nested plain objects to depth 3.
2. THE system SHALL select the old Node major from the package's `engines` field when present, and otherwise from its publish date using a fixed date-to-major table.
3. IF the package fails to load on the selected major THEN the system SHALL try the adjacent majors once each, and IF none load THEN it SHALL refuse the run with `ORIGINAL_UNLOADABLE`.

### Requirement 4: Reverse-engineered spec

**User Story:** As a user, I want a readable spec of what the dead package does, so that I can understand it and review the resurrection.

#### Acceptance Criteria

1. WHEN the surface is discovered THEN the system SHALL invoke the `coroner` agent through the AgentRunner with the run directory as its working context.
2. WHEN the Coroner finishes THEN `runs/<runId>/spec/requirements.md`, `runs/<runId>/spec/design.md` and `runs/<runId>/surface.model.json` SHALL exist.
3. IF the agent exceeds its time budget (default 10 minutes) or exits with an error THEN the system SHALL mark the stage failed with `AGENT_FAILED` and keep partial outputs for inspection.

### Requirement 5: Validate the agent's output

**User Story:** As a user, I want agent output checked mechanically, so that a hallucinated export or a skipped function cannot slip through.

#### Acceptance Criteria

1. WHEN validating THEN the system SHALL reject a surface model that fails its schema.
2. WHEN validating THEN the system SHALL require every function export in the actual surface to be either modelled or excluded with a reason code, and SHALL reject any modelled or excluded path that is not in the actual surface.
3. WHEN validating THEN the system SHALL require each modelled export's parameter count to be at least the actual function length.
4. WHEN the model contains examples THEN the system SHALL execute each example against the original side and record its outcome, and IF an example cannot be encoded THEN it SHALL be dropped with a warning.
5. IF validation fails THEN the system SHALL return the errors to the Coroner for one retry, and IF the retry also fails THEN the stage SHALL fail with `MODEL_INVALID`.
6. WHEN validation passes THEN the system SHALL emit an `exhumed` event carrying counts of modelled and excluded exports.

### Requirement 6: Replayable stages

**User Story:** As a maintainer, I want agent stages replayable from stored outputs, so that CI and the hosted demo do not need Kiro credits or network access.

#### Acceptance Criteria

1. WHEN the AgentRunner is `ReplayRunner` THEN the system SHALL copy stored agent outputs for that run into place and SHALL make no agent call.
2. WHEN a stage is replayed twice from the same stored outputs THEN the resulting artefacts SHALL be byte-identical apart from timestamps.
3. WHEN a live agent stage completes successfully THEN the system SHALL be able to store its outputs as a replay bundle with `revenant bundle <runId>`.

### Requirement 7: Command line

**User Story:** As a developer or agent, I want each step runnable on its own, so that I can debug and so the agents can call the checks.

#### Acceptance Criteria

1. THE CLI SHALL provide `revenant exhume <name@version>`, `revenant triage <runDir>`, `revenant surface discover <runDir>` and `revenant surface validate <runDir>`.
2. WHEN `surface validate` fails THEN it SHALL print each error with the export path and exit 1.
