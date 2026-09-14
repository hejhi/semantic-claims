# Overview

See the [README](./README.md) for the walkthrough, examples, package usage, and repository links.

## Motivation

Long before coding agents, people recorded important software intent across code, comments, tests, requirements, design documents, issue history, PRs, and memory. But that's important stuff—and recovering original intent of some given behavior or code from disparate sources is a painstaking and imprecise process.

We've all been there:

- _"Wait. Didn't this used to work? I swear this was in the original requirements."_
- _"Don't touch that code without first talking to X."_
- _"What in God's name is this and why would anyone do it like this."_

Coding agents compound this problem, churning out massive amounts of code, tests, and functionality rapidly. Specs quickly become stale and require a lot of discipline to maintain if they're to be the source of truth. They also tend to be overly verbose and lengthy, which takes up valuable context during an iteration if an agent needs to front-load it before beginning.

These issues motivated the development of Semantic Claims as a way to experiment with localizing and linking meaningful context to tests and implementation.

See [this blog post](https://dev.to/hejhi/semantic-claims-conveying-intent-and-verifiable-context-to-humans-and-agents-50lo) for the process of arriving at this model.

## Goals

### Focused local context

By keeping claims and proofs beside the implementation, contributors can inspect the intended behavior relevant to their task without reading every project requirement. They can also inspect applicable cross-cutting claims to understand behavior at interactions among subjects.

### Reviewable changes

Reviewers can compare a changed claim with its proof and implementation in the same diff. They can assess whether the intended behavior changed and whether the tests exercise that behavior.

### Explicit intent

Writing claims before proofs and implementation requires contributors to settle the intended outcome before selecting test cases or implementation details. Current behavior alone is insufficient evidence of intent.

People still decide which behavior is intended and review whether the claims and proofs describe and test it adequately.
