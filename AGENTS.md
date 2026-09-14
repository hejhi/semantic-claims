# AGENTS.md

This repository defines the Semantic Claims Model: a method for connecting behavioral claims to executable proofs and the implementations that satisfy them.

## Task context

Read the documents relevant to the task:

- [README.md](./README.md) for an introduction or package usage
- [OVERVIEW.md](./OVERVIEW.md) for motivation and rationale
- [REFERENCE.md](./REFERENCE.md) for method changes and claim structure
- [FAQ.md](./FAQ.md) for comparisons with TDD or acceptance criteria
- [EXAMPLES.md](./EXAMPLES.md) for claim decisions and borderline cases
- [JAVASCRIPT.md](./JAVASCRIPT.md) for JavaScript or TypeScript proof and checker changes

Use the [`semantic-claims`](./.agents/skills/semantic-claims) skill when creating, editing, auditing, or reviewing claims or claim documents, or when changing their checker.

## Core model

```text
claim -> proof -> implementation
```

A claim is a plain-language statement of observable meaning. A proof is an executable test of that meaning. The implementation must satisfy the claim and pass the proof.

Do not infer a new claim from an existing implementation. First understand the subject and decide whether its observable behavior expresses intended semantics that warrant a claim.

## Working rules

- Use the ordinary domain language of the subject.
- Specify every warranted observable behavior of the subject, avoiding redundant claims.
- Use a `--name` claim document only for distinct behavior at the interaction among multiple local subjects, never to summarize or repeat their claims.
- Keep implementation details out of claims unless they are themselves observable behavior.
- Write or update claims for every warranted observable behavior before their proofs and implementation.
- Keep each claim document beside the code and tests it describes.
- In JavaScript and TypeScript proof files, repeat every section and claim title exactly.
- Treat the claim, proof, and implementation as one reviewable semantic change.
- Run `bun run sync:skills` after changing the method documents so the skill's generated references stay current.
- Preserve unrelated user work.

## Verification

For documentation and skill edits, check the changed instructions, links, and any affected generated references. For code changes, run the narrowest relevant checks first, followed by the repository's full available checks. For checker changes, verify valid and invalid fixtures, including exact title matching for both invariants and scenarios.
