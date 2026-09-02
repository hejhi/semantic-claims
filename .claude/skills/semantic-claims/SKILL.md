---
name: semantic-claims
description: Apply the Semantic Claims Model to decide, write, revise, or review a subject's semantics as observable invariant or scenario claims with executable proofs. Also use for claim-checker failures.
---

# Semantic Claims

Use this skill when work requires deciding which observable behavior warrants a Semantic Claim or maintaining the relationship among claims, proofs, and implementation.

Always read:

- [SEMANTICS.md](references/SEMANTICS.md)
- [CLAIMS.md](references/CLAIMS.md)

Then read only what the work requires:

- [FAQ.md](references/FAQ.md) for comparisons with TDD or acceptance criteria
- [EXAMPLES.md](references/EXAMPLES.md) when the need for a claim or its kind is uncertain
- [EXISTING-SYSTEMS.md](references/EXISTING-SYSTEMS.md) before applying the model to an existing or partly specified system
- [JAVASCRIPT.md](references/JAVASCRIPT.md) before writing or validating a JavaScript or TypeScript proof

## Claim decision

During planning or review, make this decision explicit when it affects the proposed work or helps resolve ambiguity:

- Semantic Claim warranted: yes or no
- Claim kind, if warranted: invariant or scenario
- Subject:
- Observable behavior:
- Proof obligation:

Do not append this decision mechanically to routine updates or completion summaries.

## Who decides semantics

The maintainer decides the subject's intended semantics. An agent may investigate evidence, identify ambiguity, and propose claims and proofs, but it does not decide what the subject is meant to do.

Ask for confirmation only when proposing new semantics or changing existing semantics. Do not ask again when the maintainer has already specified or accepted the behavior. Audits, reviews, checker changes, proof repairs, and implementation work need no confirmation when existing claims remain unchanged.

If you find that a claim may need to change, show the proposed change as a draft before editing the claim file.

Confirmation happens in the ordinary conversation.

## Workflow

1. **Name and bound the subject.** Start from the change or concern identified by the maintainer. Inspect the affected subject's local claims and any applicable ancestor `--` claim documents. Read only the evidence needed to understand that scope.
2. **Decide whether claims are warranted.** Express the subject's intended semantics as observable behavior and apply the claim criteria. A standing truth is an invariant; behavior whose meaning depends on event order is a scenario. If the behavior does not warrant a claim, add no claim and do not prescribe what the project should do instead.
3. **Prepare one proposal.** Use the smallest non-overlapping claim set that specifies every warranted observable behavior found in the investigation. Include each subject, claim kind, wording, and proof obligation. For a cross-cutting claim, name the interaction itself as the subject.
4. **Confirm proposed semantics.** When confirmation is needed, present the proposal before editing claim files and ask one natural question such as, “Does this look right?”
5. **Follow claim → proof → implementation.** Write or revise the claim first. Then repeat its identifiers and titles in the proof structure before implementing the behavior.
6. **Verify the result.** Run the structural checker, executable proofs, and relevant project checks. Confirm that each proof tests the observable behavior stated by its claim without depending on private implementation details.

When the request already specifies or accepts the intended semantics, begin at the appropriate step without asking for confirmation again.

Do not weaken or rewrite a claim merely to match its proof or implementation.

## Review

Review the claim, proof, and implementation as one semantic change. Apply the claim criteria, the guidance for the relevant claim kind, and the project's proof-linking rules. Check that different claims do not repeat the same observable behavior.

## Verify

Passing checks proves only what those checks test. Review the claim set and proof quality separately. For checker changes, exercise both valid and invalid invariant and scenario fixtures.
