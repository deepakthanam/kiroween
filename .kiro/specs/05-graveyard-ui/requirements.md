# Requirements: The graveyard (API and web app)

## Introduction

The graveyard is what judges and users see. A user uploads a lockfile and gets a graveyard with a tombstone for each dead package. Opening a tombstone shows its resurrection: the three stages, the proof-of-life counter, any counterexample, and the final verdict with the report. Because judges will not wait through a long run, the app opens on stored resurrections that replay instantly, and offers one live run at a time with a time cap.

## Glossary

- **Replay run**: a stored run from `runs/replay/` played back from its `events.jsonl`.
- **Live run**: a run executed on the server on request.
- **Run view state**: the UI state derived by folding a run's events in order.

## Requirements

### Requirement 1: Audit a lockfile

**User Story:** As a visitor, I want to upload or paste my lockfile, so that I can see which of my dependencies are dead.

#### Acceptance Criteria

1. WHEN a visitor uploads or pastes a lockfile THEN the system SHALL return the audit and display one tombstone per `DEAD` package and a count of `DYING` and `ALIVE` packages.
2. IF the lockfile is invalid or larger than 20 MB THEN the system SHALL show a specific error and keep the visitor's input.
3. THE system SHALL offer a "try the sample graveyard" action that loads a stored audit without any upload.
4. THE system SHALL NOT store uploaded lockfiles beyond the request that audits them.

### Requirement 2: Tombstone grid

**User Story:** As a visitor, I want to scan the graveyard quickly, so that I can pick a package to look at.

#### Acceptance Criteria

1. THE grid SHALL show each tombstone's package name, version, last publish year, dead score, primary reason and current state.
2. THE grid SHALL be ordered by dead score descending then name ascending, and SHALL offer filters for eligible-only and by state.
3. WHEN a tombstone has a stored replay run THEN it SHALL be marked as watchable.
4. THE grid SHALL be fully operable by keyboard, with arrow-key movement between tombstones and Enter to open.

### Requirement 3: Run view

**User Story:** As a visitor, I want to watch a resurrection stage by stage, so that I understand what Revenant did and why I should trust it.

#### Acceptance Criteria

1. WHEN a run is opened THEN the system SHALL show the stage timeline, the current state and elapsed time, updating from the run's event stream.
2. WHILE the proof of life is running THE system SHALL show cases run, mismatches, control status and, when available, seeded-bug catch rate.
3. WHEN a mismatch event arrives THEN the system SHALL show the counterexample panel with the shrunk input, both outcomes and the seed, and SHALL show the subsequent repair round as a distinct step.
4. WHEN the run reaches a terminal state THEN the system SHALL show the verdict word, reason codes, a link to the equivalence report, the reverse-engineered spec and the diff.
5. WHEN the verdict is `REVIVED` THEN the tombstone SHALL play the rise animation once, and WHERE reduced motion is requested THE system SHALL change state without animation.
6. THE run view SHALL describe results as evidence over the number of cases and SHALL NOT use the words "proof", "proven" or "guaranteed".

### Requirement 4: Event stream

**User Story:** As a developer, I want one event stream format for live and replay runs, so that the UI has a single code path.

#### Acceptance Criteria

1. THE API SHALL serve a run's events as server-sent events, each with its sequence number as the event id.
2. WHEN a client reconnects with `Last-Event-ID` THEN the API SHALL resume from the next sequence number with no gaps and no duplicates.
3. WHEN serving a replay run THEN the API SHALL emit the stored events in order, compressing real gaps between events to at most 1.5 seconds, and SHALL support a `speed` parameter.
4. THE run view state SHALL be computed only by folding events through one reducer, for both live and replay runs.

### Requirement 5: Live runs

**User Story:** As a visitor, I want to start a real resurrection, so that I can see it is not staged.

#### Acceptance Criteria

1. WHEN a visitor starts a live run for an eligible package THEN the system SHALL enqueue it and show its queue position.
2. THE system SHALL execute at most `REVENANT_MAX_CONCURRENT_RUNS` live runs at once and SHALL hold at most 5 queued runs, rejecting further requests with a clear message.
3. THE system SHALL limit each client address to 3 live-run requests per hour.
4. IF the server has no `KIRO_API_KEY` configured THEN the system SHALL disable the live-run control and explain that only replays are available.
5. WHEN a live run finishes THEN the system SHALL keep its artefacts for 24 hours and then delete them.

### Requirement 6: Scoreboard

**User Story:** As a visitor, I want an honest summary across the corpus, so that I can see how often Revenant succeeds and refuses.

#### Acceptance Criteria

1. THE system SHALL show a scoreboard of the corpus with counts of `REVIVED`, `PARTIAL` and `REFUSED` runs and, for each package, its verdict, cases run and catch rate.
2. THE scoreboard counts SHALL equal the number of rows with each verdict.

### Requirement 7: Accessibility and quality

**User Story:** As any visitor, I want the app to be usable and fast, so that the theme never gets in the way.

#### Acceptance Criteria

1. THE app SHALL meet WCAG 2.1 AA contrast for text and SHALL never convey state by colour alone.
2. THE app SHALL announce stage changes and verdicts through a live region.
3. THE app SHALL be usable at 360 px width and at 200% zoom.
4. THE initial page SHALL be interactive within 2.5 seconds on a mid-range laptop with a cold cache, with the sample graveyard requiring no further network round trip beyond the first API call.

### Requirement 8: Deployment

**User Story:** As the submitter, I want one public URL that works without credentials, so that judges can test it.

#### Acceptance Criteria

1. THE project SHALL build into a single container image serving the API and the static web app, with `/health` returning 200.
2. THE image SHALL contain the replay bundles and SHALL run fully in replay mode with no secrets configured.
3. WHERE live runs are enabled THE deployment SHALL provide Docker access to the run sandbox without exposing the Docker socket to request handlers.
