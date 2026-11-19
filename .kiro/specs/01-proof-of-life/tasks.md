# Implementation Plan: Proof of life

- [ ] 1. Canonical codec in `packages/core`
  - [ ] 1.1 Implement `encode`, `decode` and `structurallyEqual` for every value kind in Requirement 3.1, with depth and size limits
    - _Requirements: 3.1, 3.2, 3.5_
  - [ ] 1.2 Write property tests for the codec
    - **Property 1: Codec round trip**
    - **Property 2: Encoding is a faithful equality**
    - **Property 4: Codec never throws**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

- [ ] 2. Surface model and generators
  - [ ] 2.1 Define the zod schema for `SurfaceModel` and the generator vocabulary in `core/surface-model.ts`
    - _Requirements: 4.1_
  - [ ] 2.2 Implement `compile(gen)` to fast-check arbitraries and `validatorFor(gen)` in `harness/arbitraries.ts`
    - _Requirements: 4.1, 4.2_
  - [ ] 2.3 Write property tests
    - **Property 5: Generators honour the model**
    - **Property 6: Seed determinism**
    - **Validates: Requirements 4.1, 4.2**

- [ ] 3. Probe
  - [ ] 3.1 Write `probe.js` in ES5 with `list` and `call`, promise handling and the protocol channel that package output cannot corrupt
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  - [ ] 3.2 Write `codec.es5.js` and embed it in the probe at build time
    - _Requirements: 3.4_
  - [ ] 3.3 Write the cross-encoder property test, loading the ES5 encoder in the host process
    - **Property 3: Host and probe encoders agree**
    - **Validates: Requirements 3.4**

- [ ] 4. Sides
  - [ ] 4.1 Implement `startSide` with the Docker flags from the design, id correlation, per-call timeout, restart and guaranteed cleanup
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.5_
  - [ ] 4.2 Create the synthetic fixture packages in `corpus/fixtures/`
    - _Requirements: 1.3, 2.4, 2.5_
  - [ ] 4.3 Write the container-backed property test
    - **Property 7: One outcome per call**
    - **Validates: Requirements 2.2, 2.5**

- [ ] 5. Checkpoint: run `pnpm verify`; confirm a manual `list` and `call` round trip against `pure-math` on `node:8` and `node:24`. Ask the user if anything is unclear.

- [ ] 6. Differential comparison
  - [ ] 6.1 Implement outcome matching (normal and strict) in `core`
    - _Requirements: 4.3, 4.4, 4.6_
  - [ ] 6.2 Implement `runDifferential` with `fc.asyncProperty`, per-export statistics and shrunk counterexample capture
    - _Requirements: 4.1, 4.5, 4.7_
  - [ ] 6.3 Write property tests
    - **Property 8: Reflexivity**
    - **Property 9: Injected differences are found and shrunk**
    - **Property 10: Outcome matching is an equivalence relation**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 5.1**

- [ ] 7. Control run
  - [ ] 7.1 Implement `runControl` using two separate original sides; wire the `NONDETERMINISTIC` refusal
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ] 7.2 Example test: `flaky` fixture is refused, `pure-math` passes
    - _Requirements: 5.2_

- [ ] 8. Seeded-bug check
  - [ ] 8.1 Implement `mutator.ts` with the fixed operator set and seed-deterministic selection
    - _Requirements: 6.1_
  - [ ] 8.2 Implement `runSeeded`: viability filter, per-mutant comparison with reduced runs, catch-rate computation
    - _Requirements: 6.2, 6.3, 6.4_
  - [ ] 8.3 Write property test
    - **Property 12: Catch-rate arithmetic**
    - **Validates: Requirements 6.2, 6.4**

- [ ] 9. Verdict and report
  - [ ] 9.1 Implement the pure `verdict` function and reason codes
    - _Requirements: 5.2, 6.5, 6.6, 7.2, 7.5_
  - [ ] 9.2 Implement the report schema, JSON writer and Markdown renderer with the banned-word check
    - _Requirements: 7.1, 7.3, 7.4_
  - [ ] 9.3 Write property tests
    - **Property 11: Verdict is total and monotone**
    - **Property 13: Reports never overclaim**
    - **Validates: Requirements 5.2, 6.5, 6.6, 7.2, 7.3, 7.4, 7.5**

- [ ] 10. CLI commands
  - [ ] 10.1 Implement `revenant control`, `prove` and `mutate` with flags, exit codes and `events.jsonl` output
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 10.2 End-to-end example test on `pure-math` with a hand-made revived copy
    - _Requirements: 7.1, 8.2_

- [ ] 11. Checkpoint (Phase 1 gate): `pnpm verify` passes with Docker available; the `drifted` fixture pair yields a shrunk counterexample; the seeded-bug check on `pure-math` reports a catch rate. Have the `witness` agent review `differential.ts`, `verdict.ts` and matching code for anything that could pass without behaviours matching. Record results in `docs/PROGRESS.md` and ask the user to confirm the gate.
