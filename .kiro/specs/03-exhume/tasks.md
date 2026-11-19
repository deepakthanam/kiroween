# Implementation Plan: Exhume

- [ ] 1. Freeze
  - [ ] 1.1 Implement `verifyIntegrity` and `safeExtract`
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 1.2 Implement `freeze`: download through the shared HTTP client, verify, extract, make read-only, record the tree hash in `run.json`; install the original's dependencies in a container with scripts disabled
    - _Requirements: 1.1, 1.4, 1.5_
  - [ ] 1.3 Write property tests
    - **Property 1: Extraction never escapes**
    - **Property 2: Integrity detects any change**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ] 2. Triage
  - [ ] 2.1 Implement `scanSource` with the Babel parser and the regular-expression fallback, and `triageVerdict`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ] 2.2 Write property tests
    - **Property 3: Banned modules are always flagged**
    - **Property 4: Triage verdict follows findings**
    - **Validates: Requirements 2.1, 2.3, 2.4**

- [ ] 3. Surface discovery
  - [ ] 3.1 Implement `selectNodeMajor` with the date-to-major table and `discoverSurface` using the harness side, with the adjacent-major fallback
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 3.2 Implement `validateModel`
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ] 3.3 Write property tests
    - **Property 5: Node major selection is total and in range**
    - **Property 6: Model validation is exact**
    - **Validates: Requirements 3.2, 5.1, 5.2, 5.3**

- [ ] 4. Agent runner
  - [ ] 4.1 Implement `AgentRunner`, `KiroCliRunner` (confirm headless flags with `kiro-cli chat --help`, keep them in one constant, enforce the timeout, capture the transcript) and the before/after hash check on `original/`
    - _Requirements: 4.1, 4.3_
  - [ ] 4.2 Implement `ReplayRunner` and `revenant bundle <runId>`
    - _Requirements: 6.1, 6.3_
  - [ ] 4.3 Write property tests
    - **Property 7: Replay is idempotent**
    - **Property 8: The original is untouched**
    - **Validates: Requirements 1.4, 6.1, 6.2**

- [ ] 5. Exhume stage
  - [ ] 5.1 Wire freeze, triage, discovery, the Coroner call, validation with one retry, example execution and events into `exhume()`
    - _Requirements: 4.1, 4.2, 5.4, 5.5, 5.6_
  - [ ] 5.2 Implement the CLI commands `exhume`, `triage`, `surface discover`, `surface validate`
    - _Requirements: 7.1, 7.2_

- [ ] 6. First live run
  - [ ] 6.1 Run the `coroner` agent on the `pure-math` fixture from Kiro chat as a sub-agent, review its spec and model, and tune the agent prompt in `.kiro/agents/coroner.md` if its output fails validation
    - _Requirements: 4.2, 5.2_
  - [ ] 6.2 Run `revenant exhume` headless on one corpus package and store the result as a replay bundle
    - _Requirements: 4.1, 6.3_

- [ ] 7. Checkpoint (Phase 3 gate): `pnpm verify` passes; at least three corpus packages are exhumed with valid models or refused with clear reasons; the corpus tracker is updated. Ask the user to review one reverse-engineered spec for accuracy before continuing.
