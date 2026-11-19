# Requirements: Graveyard (lockfile audit and MCP server)

## Introduction

The graveyard finds the dead packages in a project. It parses a lockfile, gathers "vitals" for each package from the npm registry, the OSV advisory database and optionally GitHub, and scores how dead each one is. The same logic is exposed three ways: the `revenant audit` command, the HTTP API, and an MCP server that any Kiro agent can call.

## Glossary

- **Vitals**: facts about a package version: last publish date, deprecation notice, `engines`, repository, advisory list, repository archived flag, install scripts, native addon indicators.
- **Dead score**: an integer from 0 to 100 computed from vitals. `DEAD` is 70 or more, `DYING` is 40 to 69, `ALIVE` is below 40.
- **Candidate**: a `DEAD` package that also passes the eligibility rules for resurrection.

## Requirements

### Requirement 1: Lockfile parsing

**User Story:** As a developer, I want to give Revenant my lockfile, so that it knows every package I depend on.

#### Acceptance Criteria

1. WHEN given an npm `package-lock.json` with `lockfileVersion` 2 or 3 THEN the system SHALL return one entry per unique `name@version` with its resolved URL, integrity hash, and whether it is a direct or transitive dependency.
2. WHEN a lockfile model is serialized and parsed again THEN the system SHALL return an equal model.
3. IF the input is not valid JSON, is not a supported lockfile version or is larger than 20 MB THEN the system SHALL return a typed error and SHALL NOT throw an untyped exception.
4. WHEN the same package version appears at several paths THEN the system SHALL report it once and list all paths.

### Requirement 2: Vitals collection

**User Story:** As a developer, I want up-to-date facts about each package, so that the dead score reflects reality.

#### Acceptance Criteria

1. WHEN vitals are requested for a package THEN the system SHALL fetch registry metadata and OSV advisories for that exact version.
2. WHERE a `GITHUB_TOKEN` is configured and the repository is on GitHub THE system SHALL fetch the repository's archived flag.
3. WHEN `REVENANT_FIXTURES` is `replay` THEN the system SHALL make no network calls and SHALL serve recorded responses, and IF a recording is missing THEN it SHALL return a typed `FIXTURE_MISSING` error.
4. THE system SHALL cache vitals for 24 hours and SHALL limit concurrent upstream requests to 8.
5. IF an upstream source fails THEN the system SHALL return the vitals it has with that source marked `unavailable` and SHALL NOT fail the whole audit.

### Requirement 3: Dead score

**User Story:** As a developer, I want one number and plain reasons per package, so that I can see at a glance what is dead and why.

#### Acceptance Criteria

1. THE dead score SHALL be computed by a pure function of the vitals and a reference date, returning an integer from 0 to 100 and a list of reason codes.
2. WHEN all other vitals are equal THEN an older last-publish date SHALL NOT produce a lower score.
3. WHEN all other vitals are equal THEN adding an unpatched advisory, a deprecation notice or an archived repository SHALL NOT produce a lower score.
4. WHEN a source is `unavailable` THEN the score SHALL be computed from the remaining sources and the reasons SHALL include `INCOMPLETE_VITALS`.
5. THE system SHALL classify 70 and above as `DEAD`, 40 to 69 as `DYING` and below 40 as `ALIVE`.

### Requirement 4: Eligibility

**User Story:** As a developer, I want to know which dead packages Revenant can attempt, so that I do not start runs that will be refused.

#### Acceptance Criteria

1. WHEN a package has a `gypfile`, a `binding.gyp`, or `preinstall`, `install` or `postinstall` scripts THEN the system SHALL mark it ineligible with reason `NATIVE_ADDON` or `INSTALL_SCRIPTS`.
2. WHEN a package's unpacked size exceeds 2 MB or it has more than 200 files THEN the system SHALL mark it ineligible with reason `TOO_LARGE`.
3. THE system SHALL return candidates sorted by dead score descending, then name ascending.

### Requirement 5: MCP server

**User Story:** As a Kiro user, I want agents to query the graveyard directly, so that they can reason about my dependencies without leaving the editor.

#### Acceptance Criteria

1. THE MCP server SHALL expose the tools `audit_lockfile`, `package_vitals`, `list_advisories` and `resurrection_candidates` over stdio.
2. WHEN a tool is called with input that fails its schema THEN the server SHALL return a tool error describing the invalid field and SHALL keep running.
3. WHEN `audit_lockfile` is called with a path THEN the server SHALL only read files inside the workspace root it was started in.
4. THE tool results SHALL be JSON matching published output schemas, with a short human-readable summary as the first content block.

### Requirement 6: Command line

**User Story:** As a developer, I want to audit from the terminal, so that I can use it in scripts and CI.

#### Acceptance Criteria

1. WHEN `revenant audit <lockfile>` runs THEN the system SHALL print a table of `DEAD` and `DYING` packages with score and reasons, and SHALL support `--json`.
2. WHEN the audit finds at least one `DEAD` package and `--fail-on-dead` is set THEN the command SHALL exit 1.
