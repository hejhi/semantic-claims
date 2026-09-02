# Semantic Claims Model

With the Semantic Claims Model, important software behavior remains understandable and testable as code changes.

It's for anyone (people, coding agents, sentient animals) building, maintaining, extending, or needing to understand software over time. Its influences include TDD, invariants in code design, acceptance criteria, and given/when/then.

There are three parts to it. For any given subject with observable behavior:

```text
claim -> prove -> implement
```

Steps:

1. **claim**: describe meaningful observable behavior for a given subject in a plain-language Markdown document.
2. **prove**: write tests that exercise the claimed behavior.
3. **implement**: write the code until the proofs pass.

This workflow produces three artifacts, kept together with the subject they describe. For example, in a JS or TS project, that might look like:

```text
search/
├── search-results.scenarios.md
├── search-results.scenarios.test.ts
└── search-results.ts
```

The Markdown file contains the claims, the test file the executable proofs, and the implementation itself. This way, as a codebase grows, intent remains colocated and up-to-date with implementations. If a proof fails, it should prompt a review of the three artifacts—it's a flag that meaningful observable behavior may have changed.

There's also tooling provided to help keep claims and proofs well-formed. At the moment, there's a JS/TS CLI-run checker verifying that claim documents and proof files have matching identifiers and titles. It uses the [JS and TS conventions](https://github.com/hejhi/semantic-claims/blob/main/JAVASCRIPT.md) to match claims with proofs and report structural mismatches.

This simple method:

- greatly improves the ability to onboard and reason through a codebase
- provides surgical context needed for implementations
- colocates and encodes intent as actual test coverage
- provides a plain-language layer on top of regular TDD without displacing it

It also makes work easier to delegate to agents by giving them explicit descriptions of intended behavior _before_ implementation. A good strategy is to:
- write claims with an expert agent first, get alignment, then commit them
- have an implementation agent write the proofs off those claims, then write the implementation
- review the diff with the expert to spot any changes to the committed claims, which should be bright and obvious

Rinse and repeat, iterating on the claims and locking them each time before handing them off to implementation agents. This makes it easier to review for one agent, and easier to implement for the other.

However, Semantic Claims are only as useful as their claims and proofs. A claim can still be ambiguous, and a test can still fail to prove what it claims. Regardless, the plain-language step encourages deciding intended observable behavior up front, which is especially useful when delegating implementation work later.

## In practice

### Claim documents

Claim documents are well-formed Markdown files written in plain language that describe meaningful observable behavior through claims. A claim describes the observable behavior of something. We call that thing its [**subject**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#subjects). A subject might be a system, function, component, protocol, user-interface element, or an interaction among several parts of a system.

In the below example, the subject is `Search results`, and its claim document is `search/search-results.scenarios.md`. This example claims one observable behavior:

```md
# Search results

## §1 Search precedence

### §1.1 Newer searches supersede older results

**Given** an older search is in progress,
**When** a newer search begins and the older search later completes,
**Then** the older result doesn't replace the latest result.
```

This demonstrates a (non-exhaustive) minimal, well-formed claim document:

1. `Search results` is the **subject** of the claims.
2. `Search precedence` is a **claim set**, grouping one or more claims together.
3. `Newer searches supersede...` is a single **claim**.
4. The Given/When/Then statement is the **observable behavior** being claimed.

There aren't any code references in the above, as claims are about testable observable behavior that doesn't become stale rather than implementation details like API shapes that might change.

When paired with proofs, claims allow implementations for a given subject to change _without needing to adjust underlying semantics_. As long as the observable behavior remains the same, the claim itself doesn't need to change.

There are two kinds of claims:

- An [**invariant**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#choosing-between-invariants-and-scenarios) is a statement describing a single constant behavior.
- A [**scenario**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#choosing-between-invariants-and-scenarios) describes behavior whose meaning depends on event order.

Write invariants as direct statements. For scenarios, Given/When/Then often makes the conditions, events, and outcome easier to follow.

There are also **cross-cutting** claims for observable behavior that belongs to an interaction among multiple subjects rather than any one subject alone. For example, a claim about the interaction between the search filter and published results would extend the same tree like this:

```text
search/
├── --search-submission.scenarios.md
├── --search-submission.scenarios.test.ts
├── search-filter.ts
├── search-results.scenarios.md
├── search-results.scenarios.test.ts
└── search-results.ts
```

The cross-cutting claim sits in `search/`, the closest directory containing files for both subjects. Its `--` prefix distinguishes it from claims about either local subject.

### Proofs

Each claim document has a paired **proof** file. A proof verifies each claim by exercising each observable behavior in a test. Following JS/TS conventions, the paired proof would be named `search/search-results.scenarios.test.ts`, which matches the section and claim titles from the claim document _exactly_:

```ts
describe('§1 Search precedence', () => {
  it('§1.1 Newer searches supersede older results', () => {
    const older = searches.start();
    const newer = searches.start();

    older.resolve('older');
    expect(searches.latest()).not.toBe('older');

    newer.resolve('newer');
    expect(searches.latest()).toBe('newer');
  });
});
```

Claims and proofs get colocated with the implementation for the subject.

## Explore the repo

1. [OVERVIEW.md](https://github.com/hejhi/semantic-claims/blob/main/OVERVIEW.md): motivation and repo guide.
2. [FAQ.md](https://github.com/hejhi/semantic-claims/blob/main/FAQ.md): common questions about Semantic Claims, TDD, and acceptance criteria.
3. [REFERENCE.md](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md): the detailed rules for claims, proofs, document structure, and the authoring workflow.
4. [EXAMPLES.md](https://github.com/hejhi/semantic-claims/blob/main/EXAMPLES.md): claim-decision examples and borderline cases.
5. [JAVASCRIPT.md](https://github.com/hejhi/semantic-claims/blob/main/JAVASCRIPT.md): the JavaScript and TypeScript conventions.
6. [ELEPHANT-GOLDFISH.md](https://github.com/hejhi/semantic-claims/blob/main/ELEPHANT-GOLDFISH.md): using Semantic Claims within the Elephant-Goldfish development process.

## Tooling

The repo also includes a [JS and TS claim checker and local Semantic Explorer](https://github.com/hejhi/semantic-claims/blob/main/scripts/check-semantics.mjs), plus [agent skills](https://github.com/hejhi/semantic-claims/tree/main/.agents/skills/semantic-claims) that can be used to help integrate the method into development workflows.

Fun fact: Semantic Claims were used to build the [validation scripts](https://github.com/hejhi/semantic-claims/tree/main/scripts), if you want to see the model in action.

You can install the (alpha) checker as a dev dependency:

```sh
npm install --save-dev semantic-claims@alpha
```

It was tested with single-package ESM JS/TS projects running Node 22 or 24, though I've used it successfully in a pnpm monorepo as well, but ymmv.

Add commands for checking claims and opening the explorer:

```json
{
  "scripts": {
    "check:semantics": "semantic-claims",
    "explore:semantics": "semantic-claims explore"
  }
}
```

The checker verifies the links between claim documents and proof files, including their identifiers, titles, and test structure:

```sh
npm run check:semantics
```

Proofs are just normal tests and should run as part of your test harness.

The [JS and TS conventions](https://github.com/hejhi/semantic-claims/blob/main/JAVASCRIPT.md) define the supported filenames and the exact links between claims and proofs.

The commands `semantic-claims invariants` and `semantic-claims scenarios` are also available when only one claim kind needs checking.

### Explore claims

Start the Semantic Explorer from the project root:

```sh
npm run explore:semantics
```

The command checks the claim links, starts a read-only local server, and prints the URL. The explorer is a nice little dashboard that groups claims by subject and supports filtering by claim kind, cross-cutting status, and text. Restart it to pick up file changes.

![Semantic Explorer showing claims grouped by subject](https://raw.githubusercontent.com/hejhi/semantic-claims/main/assets/semantic-explorer.png)

### Add an agent skill

This repository includes equivalent project-local skills for Codex and Claude Code. Copy the complete directory for the agent you use into the same path in your project:

- Codex: `.agents/skills/semantic-claims/`
- Claude Code: `.claude/skills/semantic-claims/`

The skill guides the agent through identifying subjects, investigating observable behavior, proposing claims and proofs, and implementing behavior you've accepted. Keeping the skill in the project makes its instructions versioned and visible in ordinary Git review.

### Remove it

Uninstall the package, remove its package scripts, and delete the copied skill if present:

```sh
npm uninstall semantic-claims
```

Any authored claim documents and proofs are safe, and won't be touched if uninstalled.
