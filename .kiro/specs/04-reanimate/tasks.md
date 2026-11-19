# Implementation Plan: Reanimate

- [ ] 1. Run state machine in `packages/core`
  - [ ] 1.1 Implement `transition`, round accounting and sequence numbering exactly as in the design diagram
    - _Requirements: 5.2, 5.4, 6.1, 6.2, 6.3_
  - [ ] 1.2 Write property tests, using fast-check model-based commands for the loop
    - **Property 3: Only legal transitions change state**
    - **Property 4: Terminal states are final**
    - **Property 5: The repair loop terminates**
    - **Property 6: Sequence numbers are strictly increasing**
    - **Validates: Requirements 5.2, 5.4, 6.1, 6.2, 6.3**

- [ ] 2. Guards and naming in `packages/core`
  - [ ] 2.1 Implement `compareSurfaces`, `nextPatch` and `revivedName`
    - _Requirements: 3.1, 3.2, 4.2_
  - [ ] 2.2 Write property tests
    - **Property 1: Surface guard is exact**
    - **Property 2: Version and name rules**
    - **Validates: Requirements 3.1, 3.2, 4.2**

- [ ] 3. Working copy, diff and load check
  - [ ] 3.1 Implement the working-copy setup with the git repository in `revived/`, and the end-of-run hash check on `original/`
    - _Requirements: 1.1, 1.2_
  - [ ] 3.2 Implement `makeDiff` and `applyDiff`
    - _Requirements: 7.1, 7.2_
  - [ ] 3.3 Implement `loadCheck` in a sandboxed container, the `package.json` rule checks and the advisory query for the revived tree
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ] 3.4 Write property test
    - **Property 7: Diff round trip**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 4. Reanimate orchestration
  - [ ] 4.1 Implement `reanimate()`: Surgeon call, guard, load check, proof of life via the harness, handoff files, repair rounds with counterexample replay and regression events
    - _Requirements: 2.1, 2.2, 2.3, 3.3, 5.1, 5.3, 5.5_
  - [ ] 4.2 Implement `FakeAgentRunner` with prepared patches and write example tests for: clean pass, API break then fix, divergence then fix, divergence never fixed
    - _Requirements: 3.3, 5.1, 5.2, 5.4_
  - [ ] 4.3 Enforce the overall timeout with cancellation of agents and containers
    - _Requirements: 6.4_

- [ ] 5. Full pipeline
  - [ ] 5.1 Implement `resurrect()` joining exhume, reanimate and prove, writing `SUMMARY.md`
    - _Requirements: 7.1, 8.2_
  - [ ] 5.2 Implement CLI commands `reanimate`, `guard`, `load-check`, `resurrect` with `--replay` and exit codes
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 5.3 Write property tests
    - **Property 8: The original survives the whole pipeline**
    - **Property 9: Exit code matches verdict**
    - **Validates: Requirements 1.2, 8.2**

- [ ]* 6. Pull request output
  - [ ]* 6.1 Push the revived repository to a branch and open a pull request with `SUMMARY.md` as the body when a token and target are configured
    - _Requirements: 7.3_

- [ ] 7. Live runs on the corpus
  - [ ] 7.1 From Kiro chat, run the `surgeon` then the `witness` as sub-agents on one exhumed corpus package; watch one full repair round; tune `.kiro/agents/surgeon.md` if it breaks a rule
    - _Requirements: 2.1, 5.1_
  - [ ] 7.2 Run `revenant resurrect` headless across the corpus; store every finished run as a replay bundle; update the corpus tracker with revived, partial or refused per package
    - _Requirements: 8.2, 8.3_

- [ ] 8. Checkpoint (Phase 4 gate): `pnpm verify` passes; at least three corpus packages finish `REVIVED` with reports, and at least one stored run shows the Witness catching a divergence that the Surgeon then repaired. If fewer than three revive, cut the corpus to five and tell the user before moving on. Record every counterexample found in `docs/KIRO_USAGE.md`.
