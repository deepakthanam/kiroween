# Requirements: Proof of life (differential equivalence harness)

## Introduction

The harness is the core of Revenant. It runs an original package and a revived package in separate sandboxed containers, feeds both the same generated calls, and reports whether their outcomes match. It also checks itself: a control run (original against itself) and a seeded-bug run (does it catch deliberately injected changes). Everything else in the product depends on this being trustworthy, so it is built first.

## Glossary

- **Side**: one container running one version of a package (`original` or `revived`).
- **Probe**: a dependency-free ES5 script that runs inside a side, loads the package and executes calls.
- **Call**: `{ id, exportPath, args }`, one invocation of one export.
- **Outcome**: `{ id, kind: "return" | "throw" | "timeout", value?, errorName?, errorMessage? }`.
- **Codec**: the canonical encoding of JavaScript values used to transport and compare arguments and outcomes.
- **Surface model**: `surface.model.json`, which lists exports and an argument generator for each parameter.
- **Control**: a comparison of the original against a second instance of itself.
- **Mutant**: a copy of the revived package with one deliberate behaviour change.

## Requirements

### Requirement 1: Sandboxed sides

**User Story:** As a Revenant operator, I want untrusted package code to run in an isolated container, so that a malicious or broken package cannot affect the host or the network.

#### Acceptance Criteria

1. WHEN the harness starts a side THEN the system SHALL launch a container with no network, a 512 MB memory cap, a 1 CPU cap, a PID limit, a read-only root filesystem and the package mounted read-only.
2. WHEN a side is started for the original THEN the system SHALL select the Node major version from the run configuration, and WHEN started for the revived package THEN the system SHALL use the current LTS image.
3. IF a container fails to start or the package fails to load THEN the system SHALL return a typed error naming the side and the cause, and SHALL NOT report any comparison result.
4. WHEN a run ends for any reason THEN the system SHALL stop and remove every container it started.

### Requirement 2: Probe protocol

**User Story:** As a harness developer, I want a simple line protocol between host and probe, so that the same probe works on very old Node versions.

#### Acceptance Criteria

1. THE probe SHALL be a single file using ES5 syntax with no dependencies, and SHALL run on Node 4 and later.
2. WHEN the host sends a call as one JSON line THEN the probe SHALL reply with exactly one outcome line carrying the same `id`.
3. WHEN the called export returns THEN the outcome SHALL have kind `return` and the encoded value; WHEN it throws THEN the outcome SHALL have kind `throw`, the error constructor name and the message.
4. WHEN the called export returns a promise or thenable THEN the probe SHALL await it and report the settled result, marking the outcome `async: true`.
5. IF a call does not complete within the per-call timeout THEN the host SHALL record kind `timeout` for that call and restart that side before the next call.
6. WHEN the host sends a `list` request THEN the probe SHALL reply with every export path, its `typeof` and, for functions, its `length`.

### Requirement 3: Canonical codec

**User Story:** As a harness developer, I want values encoded without losing distinctions JSON cannot express, so that two outcomes compare equal only when the values really are the same.

#### Acceptance Criteria

1. THE codec SHALL encode `undefined`, `null`, booleans, finite numbers, `NaN`, `Infinity`, `-Infinity`, `-0`, BigInt, strings, arrays (including holes), plain objects (preserving key insertion order), Date, RegExp, Buffer and typed arrays, Map, Set, Error instances, functions (as a marker with name and length), symbols (as a marker with description) and cyclic references.
2. WHEN a supported value is encoded and then decoded THEN the result SHALL be structurally equal to the input, with `-0`, `NaN` and holes preserved.
3. WHEN two values are structurally equal THEN their encodings SHALL be byte-identical, and WHEN they are not structurally equal THEN their encodings SHALL differ.
4. THE probe-side ES5 encoder and the host-side encoder SHALL produce byte-identical output for the same value.
5. IF a value exceeds the configured depth or size limit THEN the codec SHALL encode a truncation marker and SHALL NOT throw.

### Requirement 4: Differential comparison

**User Story:** As a user, I want the original and revived package compared on many generated inputs, so that I get evidence about whether behaviour was preserved.

#### Acceptance Criteria

1. WHEN a comparison runs with a surface model, a case count N and a seed THEN the system SHALL generate N calls for each modelled export using fast-check arbitraries compiled from the model.
2. WHEN the same surface model, N and seed are used again THEN the system SHALL generate the identical sequence of calls.
3. THE system SHALL treat two outcomes as matching only if their kinds are equal and, for `return`, their encoded values are byte-identical, and, for `throw`, their error constructor names are equal.
4. WHERE strict mode is enabled THE system SHALL also require error messages to be equal.
5. WHEN a mismatch is found THEN the system SHALL shrink it and report the minimal call, both outcomes, the seed and the fast-check path.
6. IF either side reports `timeout` for a call and the other does not THEN the system SHALL treat it as a mismatch.
7. WHEN the comparison finishes THEN the system SHALL report, per export, the cases run and the mismatches found.

### Requirement 5: Control run

**User Story:** As a user, I want the harness to refuse packages whose output is not deterministic, so that noise is never reported as a behaviour change.

#### Acceptance Criteria

1. WHEN a proof of life starts THEN the system SHALL first compare the original against a second, separate instance of the original.
2. IF the control finds any mismatch THEN the system SHALL set the verdict to `REFUSED` with reason `NONDETERMINISTIC`, record the offending export and call, and SHALL NOT run the original-versus-revived comparison.
3. WHEN the control passes THEN the report SHALL record the number of control cases run.

### Requirement 6: Seeded-bug check

**User Story:** As a user, I want to know how sensitive the comparison is, so that I can judge how much a clean result is worth.

#### Acceptance Criteria

1. WHEN a comparison finds no mismatch THEN the system SHALL generate up to M mutants of the revived package using a fixed set of mutation operators.
2. WHEN a mutant fails to load or fails the API surface check THEN the system SHALL discard it and count it as non-viable.
3. FOR EACH viable mutant THE system SHALL run the comparison against the original and mark the mutant caught if any mismatch is found.
4. THE system SHALL report catch rate as caught divided by viable mutants, together with the three counts (generated, viable, caught).
5. IF there are viable mutants and the catch rate is below the configured threshold (default 0.6) THEN the verdict SHALL be `PARTIAL` with reason `WEAK_ORACLE`.
6. IF there are no viable mutants THEN the verdict SHALL be `PARTIAL` with reason `NO_VIABLE_MUTANTS`.

### Requirement 7: Report and verdict

**User Story:** As a user, I want a report I can read and a machine-readable version, so that I can trust and audit the result.

#### Acceptance Criteria

1. WHEN a proof of life finishes THEN the system SHALL write `equivalence-report.json` conforming to the report schema and `equivalence-report.md` rendered from it.
2. THE verdict SHALL be computed by a single pure function from the control result, comparison result, seeded-bug result and exclusions.
3. THE report SHALL state the result as evidence over the number of generated cases and SHALL NOT contain the words "proof", "proven", "guaranteed" or "identical".
4. THE report SHALL list every excluded export with its reason code.
5. IF any export is excluded THEN the verdict SHALL be at most `PARTIAL`.

### Requirement 8: Command line

**User Story:** As a developer or agent, I want to run each harness step from the command line, so that it can be scripted and used by the Witness agent.

#### Acceptance Criteria

1. THE CLI SHALL provide `revenant control <runDir>`, `revenant prove <runDir>` and `revenant mutate <runDir>`, each accepting `--runs`, `--seed` and `--strict`.
2. WHEN a command completes THEN it SHALL exit 0 for `REVIVED`-eligible results, 1 for a mismatch, 2 for `REFUSED` and 3 for an operational error.
3. WHEN a command runs THEN it SHALL append progress events to `<runDir>/events.jsonl`, one JSON object per line.
