# Semantic Claims Model

The Semantic Claims Model specifies a subject's semantics as observable behavior that can be proven with tests.

## Core relationship

The model connects three parts:

- A [claim](./CLAIMS.md) specifies intended semantics in plain language.
- A proof tests the observable behavior stated by a claim.
- An implementation realizes that behavior in software.

```text
claim -> proof -> implementation
```

The arrows represent semantic dependency and authoring order. A claim comes first, its proofs are based on that claim, and an implementation is written or changed to satisfy both. The arrows do not imply that each part occupies one file or that an existing implementation must be recreated.

### Claims

A claim specifies one warranted observable behavior of one coherent subject without prescribing private implementation.

The complete rules for subjects, observable behavior, claim criteria, claim kinds, and claim documents are in [CLAIMS.md](./CLAIMS.md).

### Proofs

A proof is an executable test linked to one claim. It exercises the conditions stated by the claim and observes the claimed outcome through the same supported boundary available to the claim's observers.

One claim may require several proofs or proof cases. Together, they must cover the conditions and outcomes expressed by the claim. The number of tests does not determine the number of claims.

A proof may use an API to reach and observe the subject. Calls, setup, fixtures, timing controls, and test doubles used for that purpose do not become semantics unless the claim includes them as observable requirements.

### Implementations

An implementation is the code that realizes a subject's claimed behavior. One claim may constrain several implementation files, and one implementation file may contribute to several claims.

An implementation satisfies a claim when it exhibits the claimed observable behavior. Verification also requires every proof for that claim to pass. Code structure and interfaces may change without a claim change when observers can still rely on the same claimed behavior.

## Proof requirements

Every claim must have at least one executable proof. Taken together, the proofs for a claim must:

- identify the claim unambiguously;
- exercise the conditions stated by the claim;
- observe every outcome required by the claim;
- use the same observation boundary described by the claim;
- fail when the tested implementation exhibits a plausible violation of the claim;
- run deterministically enough that a pass or failure can be attributed to the tested behavior.

A skipped, disabled, pending, or non-executable test does not prove a claim.

A passing proof establishes only the behavior exercised by that proof. It does not establish that the claim is complete, that every relevant case was tested, or that every warranted behavior has been claimed. Claim scope and proof adequacy are evaluated separately from test results.

## Semantic consistency

Claims, proofs, and implementations describe the same behavior in different forms. When they disagree, neither a passing implementation nor an existing test determines the intended semantics. The intended behavior must be decided before the affected artifacts are updated in model order.

A claim must not be weakened or rewritten merely to make a proof or implementation pass. A proof must not add behavior that its claim does not require; incidental test details are not additions to the semantic contract.

An intentional semantic change requires a claim change. An implementation change that preserves the claimed observable behavior does not.

## Project conventions

The model does not require a programming language, test framework, or proof-file syntax. Project conventions must define how:

- claim documents are paired with proof files;
- proofs identify their claims;
- missing, unknown, disabled, or ambiguous links are detected;
- proofs are executed and reported.

Regardless of those conventions:

- every claim has one or more executable proofs;
- every proof identifies exactly one claim;
- each proof applies to the same subject as its claim;
- missing or ambiguous claim-to-proof relationships are detectable.

Additional naming and test-structure rules may allow tooling to verify these relationships. [JAVASCRIPT.md](./JAVASCRIPT.md) defines the conventions and checker provided for JavaScript and TypeScript projects.

## Authoring workflow

For new or changed semantics:

1. The narrowest [subject](./CLAIMS.md#subjects) that has the behavior is identified.
2. Potentially applicable [local and cross-cutting claims](./CLAIMS.md#finding-applicable-claims) are read.
3. The intended observable behavior is decided and evaluated against the [claim criteria](./CLAIMS.md#deciding-whether-a-claim-is-warranted).
4. Every warranted claim in the current scope is written as an [invariant or scenario](./CLAIMS.md#claim-kinds).
5. Executable proofs are written from those claims. When the claimed behavior is absent or incorrect, the proofs must fail for that semantic reason.
6. The implementation is written or changed until the proofs pass.
7. Structural claim checks, executable proofs, and relevant project checks are run.
8. The claims, proofs, and implementation are reviewed together.

Ambiguity, overlap, or an unprovable claim found while writing a proof requires the claim and proof to be revised together before implementation continues.

## Existing implementations

Code, tests, documentation, incidents, and domain knowledge can provide evidence of existing behavior. None of those sources alone establishes that the behavior is intended semantics. Intended semantics must be resolved before claims are written, as described in [EXISTING-SYSTEMS.md](./EXISTING-SYSTEMS.md).

When intended semantics are already decided and an implementation already satisfies them, a new proof may pass immediately. The claim must still be written before that proof.

During a refactor that preserves semantics, claims remain unchanged. Proofs may change only as needed to observe the same behavior through the revised implementation.
