# Implementation Plan: Graveyard

- [ ] 1. Lockfile parser in `packages/core`
  - [ ] 1.1 Implement `parseLockfile` and `serializeLockfile` for lockfile versions 2 and 3 with typed errors and the size limit
    - _Requirements: 1.1, 1.3, 1.4_
  - [ ] 1.2 Write property tests
    - **Property 1: Lockfile round trip**
    - **Property 2: Parser is total**
    - **Property 3: One entry per package version**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [ ] 2. Dead score and eligibility in `packages/core`
  - [ ] 2.1 Implement `deadScore` with the weight table as a single constant, and `eligibility`
    - _Requirements: 3.1, 3.4, 3.5, 4.1, 4.2_
  - [ ] 2.2 Implement candidate sorting
    - _Requirements: 4.3_
  - [ ] 2.3 Write property tests
    - **Property 4: Score bounds and determinism**
    - **Property 5: Older is never healthier**
    - **Property 6: Bad news never lowers the score**
    - **Property 7: Missing sources are flagged**
    - **Property 8: Candidate ordering is total and stable**
    - **Validates: Requirements 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.3**

- [ ] 3. HTTP client with record/replay
  - [ ] 3.1 Implement `createHttpClient` with the three modes, fixture hashing, token redaction, retry and the concurrency limiter
    - _Requirements: 2.3, 2.4_
  - [ ] 3.2 Write property test
    - **Property 10: Replay makes no network calls**
    - **Validates: Requirements 2.3**

- [ ] 4. Sources and audit
  - [ ] 4.1 Implement registry, OSV and GitHub sources returning `Source<T>`, with the 24-hour cache
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [ ] 4.2 Implement `audit()` and record fixtures for one small real lockfile
    - _Requirements: 2.1, 3.1, 4.1_
  - [ ] 4.3 Example test: the recorded audit returns the expected totals in replay mode
    - _Requirements: 2.3_

- [ ] 5. MCP server
  - [ ] 5.1 Implement the stdio server with the four tools, zod input schemas, output schemas and the summary content block
    - _Requirements: 5.1, 5.2, 5.4_
  - [ ] 5.2 Implement workspace path confinement
    - _Requirements: 5.3_
  - [ ] 5.3 Write property test and an in-memory transport example test
    - **Property 9: Path confinement**
    - **Validates: Requirements 5.2, 5.3**

- [ ] 6. CLI
  - [ ] 6.1 Implement `revenant audit` with table output, `--json` and `--fail-on-dead`
    - _Requirements: 6.1, 6.2_

- [ ] 7. Wire into Kiro
  - [ ] 7.1 Build the server, set `"disabled": false` for `graveyard` in `.kiro/settings/mcp.json`, and confirm the four tools appear in Kiro's MCP panel
    - _Requirements: 5.1_
  - [ ] 7.2 Use the tools from chat to audit this repository's own lockfile and choose the corpus: write `corpus/manifest.json` with about ten eligible `DEAD` packages and freeze their tarballs under `corpus/originals/`
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Checkpoint (Phase 2 gate): `pnpm verify` passes; `revenant audit` works on a real lockfile in live mode; the corpus manifest exists and the user has approved the package list. Log in `docs/KIRO_USAGE.md` what the MCP server made possible in chat.
