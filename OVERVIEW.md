# Overview

With the Semantic Claims Model, people and coding agents specify observable software behavior in plain language and prove it with tests. Claims and proofs become shared context for later implementation, maintenance, and review.

See the [README](./README.md) for run-through and a simple example.

## Motivation

Long before coding agents, people recorded important software intent across code, comments, tests, requirements, design documents, issue history, and memory. Whether it's doing a context transfer, brain dump, or front-loading context into a fresh agent chat, that context must come together at some point before someone can confidently change existing behavior. The less this context has been preserved, the more stale it gets, and the more documented behavior conflicts in subtle ways across multiple sources, the less confident _anyone_ can be about the original intent and meaning of something.

We've all been there:

- "Wait. Didn't this used to work? I swear this was in the original requirements."
- "Don't touch that code without first talking to X."
- "What in God's name is this and why would anyone do it like this."

Coding agents compound this problem, making it more visible and immediate. An agent can produce a convincing change quickly while relying on many small incorrect assumptions or incomplete context; tests are only as good as the understanding of the writer; engineers, designers, and product people can only hold so much context in their _own_ head at one time. Massive prose specs and design documents take up-front context, need to be maintained if they're to remain the source of truth, and when they intersect in functionality, there's a lot of room for subtle discrepencies and ambiguity.

Semantic Claims was designed to help with this by baking essential semantics and intent into the fabric of the code itself, with the perspective that what's good for humans is good for agents.

Human engineers can use this model without coding agents. It's useful whenever a team needs to define behavior clearly or make semantic changes easy to review. Making a meaningful change to observable behavior should cause a test to fail, prompting an analysis of the original claim to understand whether it's an intentional change or not. Separating claims from proofs means that updates to them require updates to both, **demanding intention and attention**.

## What this project provides

The current tooling in this repository is alpha and supports JavaScript and TypeScript.

### Focused local context

A contributor can begin with the claims and proofs beside the subject, then read cross-cutting claims from shared directories when the work spans several subjects. This limits context gathering or up-front context stuffing without hiding relevant behavior.

### Clearer instructions for coding agents

An agent receives plain-language behavior and executable expectations before implementation. It needs fewer assumptions about intent and can verify its work against an agreed result. Agents with higher intelligence with human oversight can author claims from technical designs, while delegating to agents with lower-intelligence to write proofs and implementations aligning with the claims.

### Visible semantic changes

In version tracking, creating and updating claims, proofs, and implementations for a semantic change appear in one reviewable diff. Reviewers can spot a changed test or implementation that lacks a corresponding claim update, or an implementation that no longer aligns semantically to claims or tests that haven't been updated appropriately.

### Explicit purpose for important tests

Stable identifiers connect each claim to its proofs. A reader can see why a test exists and detect missing, stale, or unrelated proof coverage.

### Shared vocabulary

Claims use the ordinary language of their subject, and require thinking about semantics up-front, before implementation. Planning, implementation, testing, and review can refer to the same behavior in the same terms.

### Independence from a particular agent or language

Claims are Markdown and proofs are ordinary tests. Different languages and test frameworks can use different file conventions while preserving the same claim-to-proof relationship.

## Repository guide

- [SEMANTICS.md](./SEMANTICS.md): the model, proofs, and authoring workflow.
- [CLAIMS.md](./CLAIMS.md): [subjects](./CLAIMS.md#subjects), [claim criteria](./CLAIMS.md#deciding-whether-a-claim-is-warranted), [invariants](./CLAIMS.md#invariants), [scenarios](./CLAIMS.md#scenarios), and [claim documents](./CLAIMS.md#claim-documents).
- [EXAMPLES.md](./EXAMPLES.md): claim-decision examples and borderline cases.
- [EXISTING-SYSTEMS.md](./EXISTING-SYSTEMS.md): incremental adoption in existing systems.
- [JAVASCRIPT.md](./JAVASCRIPT.md): the JavaScript and TypeScript conventions.
- [FAQ.md](./FAQ.md): common questions about Semantic Claims, TDD, and acceptance criteria.
- [ELEPHANT-GOLDFISH.md](./ELEPHANT-GOLDFISH.md): using Semantic Claims within the Elephant-Goldfish development process.
- [`scripts/check-semantics.mjs`](./scripts/check-semantics.mjs) checks JavaScript and TypeScript claim-and-proof pairing.
- [`.agents/skills/semantic-claims`](./.agents/skills/semantic-claims): instructions for coding agents.
