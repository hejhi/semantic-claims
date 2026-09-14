# Shared Semantic Claims Guidance

Use the requested subject's local claims and applicable ancestor `--` claim documents as context. The selected skill defines the scope of work; invoking one stage does not require completing the later stages.

Read only the references relevant to the task:

- [README.md](references/README.md) for an introduction or package usage
- [REFERENCE.md](references/REFERENCE.md) when authoring or changing claims, or resolving questions about the method or claim structure
- [FAQ.md](references/FAQ.md) for comparisons with TDD or acceptance criteria
- [EXAMPLES.md](references/EXAMPLES.md) when the need for a claim or its kind is uncertain
- [JAVASCRIPT.md](references/JAVASCRIPT.md) before writing or validating a JavaScript or TypeScript proof, or changing the checker

## Claim decision

Make the claim decision explicit when it affects the proposed work or helps resolve ambiguity: whether a claim is warranted and, if so, its subject, kind, observable behavior, and proof obligation. Do not append it mechanically to routine updates or completion summaries.

## Who decides semantics

The user decides what the subject is meant to do. An agent may investigate evidence, identify ambiguity, and propose claims and proofs. Code and tests show current behavior but do not establish intended behavior by themselves.

When the user has specified or accepted the intended behavior, proceed without a separate proposal or confirmation. Ask only when the intended behavior remains unresolved or you propose semantics the user has not authorized. When confirmation is needed, present the proposed claim wording and proof obligation before editing claim files. Work that preserves established semantics needs no confirmation.

## Method

A behavior warrants a claim when changing or removing it would affect an intended outcome an observer relies on and no existing claim already covers it. Specify every warranted observable behavior in scope, avoiding redundant claims. A standing truth is an invariant; behavior whose meaning depends on event order is a scenario. For a cross-cutting claim, name the interaction itself as the subject. If no claim is warranted, add none.

Write claims before their proofs and implementation. Keep each claim document beside its paired proof file and implementation, following the project's proof-linking conventions.

Write invariants as direct statements. For scenarios, prefer Given/When/Then when it makes the starting conditions, events, and outcome easier to follow. Don't force an invariant into this form or add an empty step just to use all three words.

Do not weaken or rewrite a claim merely to match its proof or implementation.

## Review

Review the claim, proof, and implementation as one semantic change. Check that every claim is warranted, follows the guidance for its kind, and uses the project's proof-linking rules. Check that different claims do not repeat the same observable behavior.

## Verify

Passing checks proves only what those checks test. Review the claim set and proof quality separately. For checker changes, exercise both valid and invalid invariant and scenario fixtures.
