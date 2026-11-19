# Implementation Plan: The graveyard

- [ ] 1. Shared pure logic in `packages/core`
  - [ ] 1.1 Implement `reduceRun` and `initialRunView`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.4_
  - [ ] 1.2 Implement the queue model (`enqueue`, `finish`), grid ordering and scoreboard totals
    - _Requirements: 2.2, 5.1, 5.2, 6.1, 6.2_
  - [ ] 1.3 Write property tests
    - **Property 1: Run view is a fold**
    - **Property 4: The queue respects its limits**
    - **Property 5: Grid ordering**
    - **Property 6: Scoreboard arithmetic**
    - **Validates: Requirements 2.2, 4.4, 5.1, 5.2, 6.1, 6.2**

- [ ] 2. API
  - [ ] 2.1 Scaffold Fastify with the error envelope, `/health`, SQLite schema and the run index built from `runs/replay/`
    - _Requirements: 8.1, 8.2_
  - [ ] 2.2 Implement `POST /api/audit` and `GET /api/audit/sample` with the size limit and no persistence of uploads
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 2.3 Implement the SSE endpoint with sequence ids, `Last-Event-ID` resume, replay pacing, `speed` and heartbeats
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 2.4 Implement run list, run summary, artefact and scoreboard routes
    - _Requirements: 3.4, 6.1_
  - [ ] 2.5 Write property tests
    - **Property 2: Replay and live agree**
    - **Property 3: Stream resume has no gaps or duplicates**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 3. Live runs
  - [ ] 3.1 Implement `POST /api/runs`, the job table, per-client rate limit and the disabled state when no API key is configured
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 3.2 Implement the separate worker process that owns Docker and calls `resurrect`, plus 24-hour artefact expiry
    - _Requirements: 5.2, 5.5, 8.3_

- [ ] 4. Web foundation
  - [ ] 4.1 Scaffold Vite + React, routing for the three pages, `tokens.css` from the UI steering file, fonts and the base layout
    - _Requirements: 7.1, 7.3_
  - [ ] 4.2 Implement `useRunStream` over `EventSource` with reconnect and `reduceRun`
    - _Requirements: 3.1, 4.2, 4.4_

- [ ] 5. Graveyard page
  - [ ] 5.1 Implement `LockfileDrop` (upload, paste, sample) with error handling that keeps input
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 5.2 Implement `Tombstone` with all six states and `TombstoneGrid` with ordering, filters and arrow-key navigation
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 6. Run page
  - [ ] 6.1 Implement `StageTimeline`, `ProofCounter`, `CounterexamplePanel` and the repair-round step
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 6.2 Implement `VerdictBanner`, artefact links and viewers for the spec, diff and report
    - _Requirements: 3.4, 3.6_
  - [ ] 6.3 Implement the rise animation with the reduced-motion alternative and the live region announcements
    - _Requirements: 3.5, 7.2_
  - [ ] 6.4 Write property test
    - **Property 7: Views never overclaim**
    - **Validates: Requirements 3.6**

- [ ] 7. Scoreboard page
  - [ ] 7.1 Implement the scoreboard table and totals
    - _Requirements: 6.1, 6.2_

- [ ] 8. Checkpoint: run the app locally against replay bundles; walk the keyboard path; ask the user to review the look against the UI steering file before polishing.

- [ ] 9. End-to-end and accessibility tests
  - [ ] 9.1 Write the Playwright tests listed in the design, including axe checks and the reduced-motion case
    - _Requirements: 2.4, 3.5, 7.1, 7.2, 7.3_
  - [ ] 9.2 Measure cold-load time for the initial page and fix anything over the budget
    - _Requirements: 7.4_

- [ ] 10. Deployment
  - [ ] 10.1 Write the multi-stage Dockerfile and a replay-only run configuration; verify the container starts with no secrets
    - _Requirements: 8.1, 8.2_
  - [ ] 10.2 Deploy to a public URL, confirm `/health`, the sample graveyard and one replay from a clean browser; record the URL in `README.md` and `docs/PROGRESS.md`
    - _Requirements: 8.1, 8.2_

- [ ] 11. Checkpoint (Phase 5 gate): `pnpm verify` and `pnpm test:e2e` pass; the public URL works in a private browser window with no credentials; the user has approved the visual design.
