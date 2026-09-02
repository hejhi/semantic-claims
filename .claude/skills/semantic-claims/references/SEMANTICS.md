# Semantic Claims Model

The Semantic Claims Model is a way to specify a subject's semantics as observable behavior that can be proven with tests.

## The model

- A [subject](./CLAIMS.md#subjects) has semantics expressed as observable behavior.
- A [claim](./CLAIMS.md) is a plain-language statement of those semantics as an invariant or scenario.
- A proof is an executable test of that behavior.
- An implementation is the code that realizes the behavior.

The sequence is:

```text
claim -> proof -> implementation
```

This resembles TDD: claims first, followed by failing proofs, followed by implementations that make them pass.

## Proofs

A proof is an executable test of the observable behavior specified by a claim. It observes the subject at the same semantic level as the claim and should fail when the implementation no longer realizes those semantics.

A proof may use an API to reach and observe the subject, but its call sequence and setup do not become semantics merely because the test contains them. Proofs should not depend on private implementation details.

One claim may have multiple proofs or proof cases. Test-case count does not determine claim count, and ordinary tests do not all need claims.

## Implementations

An implementation must satisfy all applicable claims and pass their proofs. Its code, structure, and API can change as long as the same observable behavior remains.

When semantics change intentionally, the claim should be updated first, followed by its failing proof, and then the implementation that makes the proof pass. All three can then be reviewed together as one semantic change.

## Proof conventions

No specific programming language, test framework, or test-file syntax is required. For each project, maintainers decide:

- which test files contain proofs;
- how a proof refers to the section and claim it proves;
- how missing, unknown, disabled, or ambiguous links are detected;
- how those tests are run and their results reported.

Regardless of those conventions, the same relationships apply:

- Every declared claim has at least one executable proof.
- Every proof includes an unambiguous reference to the claim it proves.
- A proof is associated with the same subject and section as its claim.
- Disabled, skipped, or pending tests do not prove a claim.
- Multiple executable tests may prove one claim.
- Missing, unknown, and ambiguous relationships between claims and proofs are detectable.

Projects may add file-naming or test-structure rules so a checker can verify these relationships.

[JAVASCRIPT.md](./JAVASCRIPT.md) contains the JavaScript and TypeScript conventions, and the npm package includes a checker for them.

## Authoring workflow

When adding or changing semantics:

1. Identify the [subjects](./CLAIMS.md#subjects) that need distinct semantics.
2. Review the [local and cross-cutting claims](./CLAIMS.md#finding-applicable-claims) that already apply.
3. Express the semantics as observable behavior and apply the [claim criteria](./CLAIMS.md#deciding-whether-a-claim-is-warranted).
4. If a claim is warranted, choose an [invariant or scenario](./CLAIMS.md#claim-kinds) and write the smallest non-overlapping claim set.
5. Write or update the executable proofs following the project's claim-and-proof conventions.
6. Implement the behavior.
7. Run any claim checker, the proofs, and relevant project checks.
8. Review the claims, proofs, and implementation together.

Changing an implementation alone does not mean its semantics changed. Claims only need to be updated when the semantics change.

Do not infer claims from an implementation or weaken a claim merely to match a proof or implementation.
