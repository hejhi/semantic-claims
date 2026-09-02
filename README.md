# Semantic Claims Model

With the Semantic Claims Model, important software behavior remains understandable and testable as code changes.

It's for anyone (people, coding agents, sentient animals) building, maintaining, extending, or needing to understand software over time. Its influences include TDD, invariants in code design, and Gherkin-style acceptance criteria.

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

There's also tooling provided to help keep claims and proofs well-formed. At the moment, there's a JS/TS CLI-run checker verifying that claim documents and proof files have matching identifiers and titles. It uses the [JS and TS conventions](./JAVASCRIPT.md) to match claims with proofs and report structural mismatches.

This simple method:

- greatly improves the ability to onboard and reason through a codebase
- provides surgical context needed for implementations
- colocates and encodes intent as actual test coverage
- provides a semantic layer on top of regular TDD without displacing it

It also makes work easier to delegate to agents by giving them well-formed semantics _before_ implementation. A good strategy is to:
- write claims with an expert agent first, get alignment, then commit them
- have an implementation agent write the proofs off those claims, then write the implementation
- review the diff with the expert to spot any changes to the committed claims, which should be bright and obvious

Rinse and repeat, iterating on the claims and locking them each time before handing them off to implementation agents. This makes it easier to review for one agent, and easier to implement for the other.

However, Semantic Claims are only as useful as their claims and proofs. A claim can still be ambiguous, and a test can still fail to prove what it claims. Regardless, the plain-language step encourages deciding observable semantics up front, which is especially useful when delegating implementation work later.

## In practice

### Claims

**Claim documents** use plain-language claims to describe the meaningful observable behavior of a single [**subject**](./CLAIMS.md#subjects). A subject can be anything whose semantics can be expressed as observable behavior. Together, its claims form its semantic contract.

Side note: "subject" may sound ambiguous, but it was loosely inspired by grammar: a subject followed by a predicate. The subject names the thing whose semantics are being specified, and the predicate expresses those semantics as observable behavior. Together, they form a claim.

In this example, the subject is `Search results`, and its claim document is `search/search-results.scenarios.md`.

This example claims one meaningful observable behavior:

```md
# Search results

## §1 Search precedence

### §1.1 Newer searches supersede older results

After a newer search begins, completing an older search leaves the latest result unchanged.
```

This demonstrates a (non-exhaustive) minimal, well-formed claim document:

1. `Search results` is the **subject** of the claims.
2. `Search precedence` is a **claim set**, grouping one or more claims together.
3. `Newer searches supersede...` is a single **claim**.
4. `After a newer search begins...` is the **observable behavior** being claimed.

There aren't any code references in the above, as claims are about testable observable behavior that doesn't become stale rather than implementation details like API shapes that might change.

When paired with proofs, claims allow implementations for a given subject to change _without needing to adjust underlying semantics_. As long as the observable behavior remains the same, the claim itself doesn't need to change.

There are two kinds of claims:

- An [**invariant**](./CLAIMS.md#invariants) is a statement describing a single constant behavior.
- A [**scenario**](./CLAIMS.md#scenarios) describes behavior whose meaning depends on event order.

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

1. [OVERVIEW.md](./OVERVIEW.md): motivation and repo guide.
2. [FAQ.md](./FAQ.md): common questions about Semantic Claims, TDD, and acceptance criteria.
3. [SEMANTICS.md](./SEMANTICS.md): the model, proofs, and authoring workflow.
4. [CLAIMS.md](./CLAIMS.md): [subjects](./CLAIMS.md#subjects), [claim criteria](./CLAIMS.md#deciding-whether-a-claim-is-warranted), [invariants](./CLAIMS.md#invariants), [scenarios](./CLAIMS.md#scenarios), and [claim documents](./CLAIMS.md#claim-documents).
5. [EXAMPLES.md](./EXAMPLES.md): claim-decision examples and borderline cases.
6. [EXISTING-SYSTEMS.md](./EXISTING-SYSTEMS.md): incremental adoption without inferring claims from implementation.
7. [JAVASCRIPT.md](./JAVASCRIPT.md): the JavaScript and TypeScript conventions.
8. [ELEPHANT-GOLDFISH.md](./ELEPHANT-GOLDFISH.md): using Semantic Claims within the Elephant-Goldfish development process.

## Tooling

The repo also includes a [JS and TS claim checker and local Semantic Explorer](./scripts/check-semantics.mjs), plus [agent skills](./.agents/skills/semantic-claims) that can be used to help integrate the method into development workflows.

Fun fact: Semantic Claims were used to build the [validation scripts](./scripts), if you want to see the model in action.

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

The [JS and TS conventions](./JAVASCRIPT.md) define the supported filenames and the exact links between claims and proofs.

The commands `semantic-claims invariants` and `semantic-claims scenarios` are also available when only one claim kind needs checking.

### Explore claims

Start the Semantic Explorer from the project root:

```sh
npm run explore:semantics
```

The command checks the claim links, starts a read-only local server, and prints the URL. The explorer is a nice little dashboard that groups claims by subject and supports filtering by claim kind, cross-cutting status, and text. Restart it to pick up file changes.

![Semantic Explorer showing claims grouped by subject](./assets/semantic-explorer.png)

### Add an agent skill

This repository includes equivalent project-local skills for Codex and Claude Code. Copy the complete directory for the agent you use into the same path in your project:

- Codex: `.agents/skills/semantic-claims/`
- Claude Code: `.claude/skills/semantic-claims/`

The skill guides the agent through identifying subjects, investigating observable behavior, proposing claims and proofs, and implementing semantics that you have accepted. Keeping the skill in the project makes its instructions versioned and visible in ordinary Git review.

### Remove it

Uninstall the package, remove its package scripts, and delete the copied skill if present:

```sh
npm uninstall semantic-claims
```

Any authored claim documents and proofs are safe, and won't be touched if uninstalled.
