# Requirements: Graveyard patrol (Kiro Crew app) and Revenant power

## Introduction

Two ways to put Revenant where developers already work. The **graveyard patrol** is a Kiro Crew app: every night it audits the lockfiles of watched repositories, notices packages that have newly become dead, queues resurrections and reports what it did. The **Revenant power** packages the audit and resurrection workflow, with the graveyard MCP server, so any Kiro user can install it and ask "is anything in my lockfile dead?".

## Glossary

- **Watched repository**: a local path registered with the patrol whose lockfile is audited.
- **Patrol state**: the stored result of the previous patrol for each watched repository.
- **Newly dead**: a package version that is `DEAD` and eligible in this patrol and was not in the previous patrol's dead set for the same repository.

## Requirements

### Requirement 1: Crew app package

**User Story:** As a Crew user, I want to install the patrol as an app, so that I get its agent, schedule and dashboard page in one step.

#### Acceptance Criteria

1. THE app SHALL have an `app.json` manifest with name, version, display name, description, one agent, one skill, the graveyard MCP server, one cron job, one dashboard page and a backend.
2. WHEN the app is installed from the repository path THEN Crew SHALL register the `patrol` agent, the cron job and the dashboard page without manual steps.
3. THE app SHALL bundle its own build of the graveyard MCP server and its UI bundle so that it works from the installed copy.

### Requirement 2: Nightly patrol

**User Story:** As a developer, I want my dependencies checked while I am away, so that I learn about dead packages without doing anything.

#### Acceptance Criteria

1. WHEN the cron job fires THEN the `patrol` agent SHALL audit the lockfile of each watched repository using the graveyard MCP tools.
2. WHEN the audit completes THEN the system SHALL compute the newly dead packages for each repository from the current audit and the stored patrol state.
3. FOR EACH newly dead eligible package, up to a per-patrol limit (default 3), THE system SHALL queue a resurrection through the Revenant API or CLI.
4. WHEN the patrol finishes THEN the system SHALL store the new patrol state and a patrol record with counts, queued runs and any errors.
5. IF a watched repository has no lockfile or the audit fails THEN the patrol SHALL record the error for that repository and continue with the others.

### Requirement 3: Idempotence

**User Story:** As a developer, I want repeated patrols to be quiet, so that I am not told the same thing every night.

#### Acceptance Criteria

1. WHEN a patrol runs twice with no change in any lockfile or vitals THEN the second patrol SHALL queue no resurrections and report no newly dead packages.
2. THE system SHALL never queue a resurrection for a `name@version` that already has a run in a non-failed state.

### Requirement 4: Patrol report

**User Story:** As a developer, I want a short message I can read in chat, so that I know what happened overnight.

#### Acceptance Criteria

1. WHEN a patrol finishes THEN the agent SHALL post a summary containing: repositories checked, newly dead packages by name, resurrections queued, verdicts of runs finished since the last patrol, and errors.
2. THE counts in the summary SHALL equal the lengths of the corresponding lists in the patrol record.
3. WHEN nothing changed THEN the summary SHALL be a single line saying so.

### Requirement 5: Dashboard page

**User Story:** As a developer, I want to see patrol history in the Crew dashboard, so that I can review it later.

#### Acceptance Criteria

1. THE dashboard page SHALL list watched repositories with their dead counts and the last ten patrol records.
2. THE dashboard page SHALL allow adding and removing a watched repository path and running a patrol now.
3. WHEN a queued resurrection has finished THEN the page SHALL show its verdict and link to its report.

### Requirement 6: Revenant power

**User Story:** As a Kiro user, I want to install Revenant as a power, so that Kiro knows how to audit and resurrect packages in my projects.

#### Acceptance Criteria

1. THE power SHALL consist of a `plugin.json` manifest with name, version, description, author and keywords, an `mcp.json` for the graveyard server and at least two skills, each with a `SKILL.md` that has `name` and `description` front matter.
2. WHEN a user installs the power from the folder and mentions one of its keywords THEN Kiro SHALL activate it and the graveyard tools SHALL be available.
3. THE `audit-lockfile` skill SHALL instruct the agent to call the audit tool, present dead packages with reasons, and offer resurrection only for eligible candidates.
4. THE `resurrect-package` skill SHALL instruct the agent to run the pipeline, never to edit the original, and to report the verdict using the product's vocabulary and honesty rule.

### Requirement 7: Headless and continuous integration

**User Story:** As a team, I want the audit in CI, so that a pull request that adds a dead dependency is flagged.

#### Acceptance Criteria

1. THE repository SHALL include a GitHub Actions workflow that runs `revenant audit --fail-on-dead` on pull requests that change a lockfile.
2. WHERE a `KIRO_API_KEY` secret is configured THE workflow SHALL also run the Kiro CLI in headless mode to comment a short explanation of each newly dead package on the pull request.
