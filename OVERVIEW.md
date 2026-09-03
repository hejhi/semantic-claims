# Overview

See the [README](./README.md) for a run-through and a simple example.

## Motivation

Long before coding agents, people recorded important software intent across code, comments, tests, requirements, design documents, issue history, PRs, and memory. But that's important stuff—and recovering original intent of some given behavior or code from disparate sources is a painstaking and imprecise process.

We've all been there:

- _"Wait. Didn't this used to work? I swear this was in the original requirements."_
- _"Don't touch that code without first talking to X."_
- _"What in God's name is this and why would anyone do it like this."_

Coding agents compound this problem, churning out massive amounts of code, tests, and functionality rapidly. Specs quickly become stale and require a lot of discipline to maintain if they're to be the source of truth. They also tend to be overly verbose and lengthy, which takes up valuable context during an iteration if an agent needs to front-load it before beginning.

Semantic Claims attempts to deal with this by creating a method to:

- break down a spec or design into **subjects** of meaningful behavior
- create plain-language semantic contracts that specify that behavior as readable **claims**
- create test files that observe and **prove** that behavior
- colocate those artifacts with the subject's implementation

The process:

```
claim -> prove -> implement
```

Human engineers can use this model even without coding agents. It's useful when a team needs to define behavior clearly or make changes to intended behavior easy to review. Making a meaningful change to observable behavior should cause a test to fail, and a review of the subject's semantic contract and proofs. Separating claims from proofs means that updates to them require updates to both, **demanding intention and attention**.

It also allows the semantic contract to be originally defined by other people, such as designers or product managers, leaving less ambiguity for implementation.


See [this blog post](https://dev.to/hejhi/semantic-claims-conveying-intent-and-verifiable-context-to-humans-and-agents-50lo) for the process of arriving at this model.

## Goals

### Creating focused local context

When a semantic contract is verified and next to an implementation, anyone exploring the domain can get an immediate understanding of meaningful, intended behavior. Cross-cutting claims sitting above it can also be inspected for greater system-level reasoning. These claims and proofs can be explored entirely separately from code to get a quick understanding of semantics, terminology, APIs, and behavior.

### Clearer instructions

Claims and proofs around coherent subjects reduce ambiguity...for everyone. There's less to infer when fewer code paths need to be traced through for understanding.

Agents with higher intelligence can also author claims from technical designs, while delegating to less intelligent agents for writing proofs and implementations.

**Always remember: human guidance, oversight, and review is still a must!** 👍🌈🦄

### Clearer diffs

Changes to claims, proofs, and implementations appear brightly as a coherent unit.

### Semantics-first

Defining a subject and its semantic contract requires thinking about semantics before implementation, which provides a clarity downstream to proofs and implementation.

## Repository guide

- [REFERENCE.md](./REFERENCE.md): the detailed rules for claims, proofs, document structure, and the authoring workflow.
- [EXAMPLES.md](./EXAMPLES.md): claim-decision examples and borderline cases.
- [JAVASCRIPT.md](./JAVASCRIPT.md): the JavaScript and TypeScript conventions.
- [FAQ.md](./FAQ.md): common questions about Semantic Claims, TDD, and acceptance criteria.
- [`scripts/check-semantics.mjs`](./scripts/check-semantics.mjs) checks JavaScript and TypeScript claim-and-proof pairing.
- [`.agents/skills/semantic-claims`](./.agents/skills/semantic-claims): instructions for coding agents.
