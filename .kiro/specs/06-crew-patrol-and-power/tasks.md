# Implementation Plan: Graveyard patrol and Revenant power

- [ ] 1. Patrol logic in `packages/core`
  - [ ] 1.1 Implement `planPatrol` and `renderSummary`
    - _Requirements: 2.2, 2.3, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3_
  - [ ] 1.2 Write property tests
    - **Property 1: Newly dead is a set difference**
    - **Property 2: Patrol is idempotent**
    - **Property 3: Queue limits and exclusions**
    - **Property 4: Errors do not erase memory**
    - **Property 5: Summary counts match the record**
    - **Validates: Requirements 2.2, 2.3, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3**

- [ ] 2. Crew app backend
  - [ ] 2.1 Read the current Kiro Crew app documentation (manifest reference, backend, storage, UI mount contract). Correct `crew-app/revenant-patrol/app.json` where it differs, including `permissions.api`, and note each correction in `docs/KIRO_USAGE.md`
    - _Requirements: 1.1_
  - [ ] 2.2 Implement `backend/server.mjs` with the routes in the design, zod validation and the chosen storage
    - _Requirements: 2.3, 2.4, 2.5, 5.2_
  - [ ] 2.3 Example tests for the routes with an in-memory store
    - _Requirements: 2.4, 3.2_

- [ ] 3. Crew app agent, skill and bundles
  - [ ] 3.1 Finalise `agents/patrol.json` and `skills/graveyard-patrol/SKILL.md` against the backend routes
    - _Requirements: 2.1, 4.1_
  - [ ] 3.2 Add the build script that produces `mcp/graveyard.mjs` as a single file and confirm how Crew resolves the MCP command path from the installed copy
    - _Requirements: 1.3_
  - [ ] 3.3 Implement the dashboard page bundle exporting `mount()`: watched repositories, last ten patrols, add/remove, run now, verdict links
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 4. Install and verify in Crew (manual checklist; record results)
  - [ ] 4.1 Install the app from the local path; confirm the agent, cron job and dashboard page are registered
    - _Requirements: 1.2_
  - [ ] 4.2 Add this repository and one sample project as watched repositories; trigger the patrol; confirm the summary message and the patrol record
    - _Requirements: 2.1, 2.4, 4.1_
  - [ ] 4.3 Trigger the patrol again with no changes; confirm a one-line summary and nothing queued
    - _Requirements: 3.1, 4.3_
  - [ ] 4.4 Capture the screen recording of the patrol message arriving, for the demo video

- [ ] 5. Revenant power
  - [ ] 5.1 Decide how the power starts the graveyard server outside this repository and update `power/revenant-power/mcp.json`; check `plugin.json` against the current powers documentation (or run Kiro's Power Builder over the folder) and correct it
    - _Requirements: 6.1_
  - [ ] 5.2 Finalise the two skills
    - _Requirements: 6.3, 6.4_
  - [ ] 5.3 Install the power from the folder in the Kiro IDE in a different project; ask "is anything in my lockfile dead?" and confirm activation and tool use; record the result
    - _Requirements: 6.2_

- [ ]* 6. Continuous integration
  - [ ]* 6.1 Add `.github/workflows/graveyard.yml` with the audit job
    - _Requirements: 7.1_
  - [ ]* 6.2 Add the conditional headless Kiro CLI job that comments on the pull request
    - _Requirements: 7.2_

- [ ] 7. Checkpoint (Phase 6 gate): `pnpm verify` passes; the Crew app patrol has run end to end at least twice; the power activates in a second project; `docs/KIRO_USAGE.md` has entries for Crew, powers and the CLI.
