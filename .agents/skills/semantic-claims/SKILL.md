---
name: semantic-claims
description: Author and review Semantic Claims and their executable proofs. Use for claim decisions, claim changes, or claim-checker work.
---

# Semantic Claims

Use this skill when work requires deciding which observable behavior warrants a Semantic Claim or maintaining the relationship among claims, proofs, and implementation.

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

## Workflow

1. **Name and bound the subject.** Start from the change or concern identified by the user. Inspect the affected subject's local claims and any applicable ancestor `--` claim documents. Read only the evidence needed to understand that scope.
2. **Decide whether claims are warranted.** Express the subject's intended semantics as observable behavior. A behavior needs a claim when changing or removing it would affect an intended outcome an observer relies on and no existing claim already covers it. A standing truth is an invariant; behavior whose meaning depends on event order is a scenario. Specify every warranted observable behavior in scope, avoiding redundant claims. For a cross-cutting claim, name the interaction itself as the subject. If the behavior does not warrant a claim, add no claim and continue the requested work.
3. **Follow claim → proof → implementation.** Write or revise the claim first. Then repeat its identifiers and titles in the proof structure before implementing the behavior. Keep the claim, proof, and implementation colocated.
4. **Verify the result.** Run the structural checker, executable proofs, and relevant project checks. Confirm that each proof tests the observable behavior stated by its claim without depending on private implementation details. For implementation requests, continue through verification and fixes within the requested scope; a first implementation is not completion.

Write invariants as direct statements. For scenarios, prefer Given/When/Then when it makes the starting conditions, events, and outcome easier to follow. Don't force an invariant into this form or add an empty step just to use all three words.

Do not weaken or rewrite a claim merely to match its proof or implementation.

## Review

Review the claim, proof, and implementation as one semantic change. Check that every claim is warranted, follows the guidance for its kind, and uses the project's proof-linking rules. Check that different claims do not repeat the same observable behavior.

## Verify

Passing checks proves only what those checks test. Review the claim set and proof quality separately. For checker changes, exercise both valid and invalid invariant and scenario fixtures.
