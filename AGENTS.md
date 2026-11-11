# AGENTS.md

This repository defines the Semantic Claims Model: a method for connecting behavioral claims to executable proofs and the implementations that satisfy them.

## Task context

Read the documents relevant to the task:

- [README.md](./README.md) for an introduction or package usage
- [REFERENCE.md](./REFERENCE.md) for method changes and claim structure
- [FAQ.md](./FAQ.md) for comparisons with TDD or acceptance criteria
- [EXAMPLES.md](./EXAMPLES.md) for claim decisions and borderline cases
- [AMBIGUITY.md](./AMBIGUITY.md) for words and constructs that make a claim ambiguous
- [JAVASCRIPT.md](./JAVASCRIPT.md) for JavaScript or TypeScript proof and checker changes

Use the [Semantic Claims skill](./.agents/skills/semantic-claims) for claim decisions and authoring, proof tests, implementation and checker changes, and semantic reviews and checker failures.

## Core model

```text
claim -> proof -> implementation
```

A claim states the meaning of one intentional, observable characteristic of a system, as defined in [REFERENCE.md](./REFERENCE.md#claims). A proof is the set of executable tests of that rule. The implementation must satisfy the claim and pass the proof.

Do not infer a new claim from an existing implementation. First understand the system and decide whether its observable behavior expresses intended semantics that warrant a claim, as defined in [Choosing when and how to write Semantic Claims](./REFERENCE.md#choosing-when-and-how-to-write-semantic-claims).

## Working rules

- Write every claim statement under the rules in [Claim kinds](./REFERENCE.md#claim-kinds).
- Specify every warranted observable behavior of the system, avoiding redundant claims.
- Use a `--name` claim document only for distinct behavior at the interaction among multiple local systems, never to summarize or repeat their claims.
- State every claim as meaning, as defined in [Claims specify meaning](./REFERENCE.md#claims-specify-meaning).
- Write or update claims for every warranted observable behavior before their proofs and implementation.
- Keep each claim document beside the code and tests it describes.
- In JavaScript and TypeScript proof files, repeat every section and claim title exactly.
- Treat the claim, proof, and implementation as one reviewable semantic change.
- Run `bun run sync:skills` after changing `REFERENCE.md`, `EXAMPLES.md`, `JAVASCRIPT.md`, `AMBIGUITY.md`, or the skill's `SKILL.md`, which contains generated text from `REFERENCE.md` after its marker.
- Preserve unrelated user work.

## Verification

For documentation and skill edits, check the changed instructions, links, and any affected generated references. For code changes, run the narrowest relevant checks first, followed by the repository's full available checks. For checker changes, verify valid and invalid fixtures, including exact title matching for both invariants and scenarios.
