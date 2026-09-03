# Semantic Claims Model

Semantic Claims is a simple way to keep meaningful software behavior understandable and testable as code changes.

It's designed to help people, coding agents, and sentient creatures maintain software together over time, and is influenced by TDD, invariants in code design, acceptance criteria, and Given/When/Then.

It's a three step workflow:

```text
claim -> prove -> implement
```

1. **claim**: describe meaningful observable behavior for a given subject in a plain-language Markdown document.
2. **prove**: write tests that exercise the claimed behavior.
3. **implement**: write the code until the proofs pass.

It produces three colocated artifacts. For example, in a TS codebase:

```text
search/
├── search-results.scenarios.md       <- the subject's claims
├── search-results.scenarios.test.ts  <- the subject's proofs
└── search-results.ts                 <- the subject itself
```

This keeps context, behavioral intent, and implementation together and up-to-date. If a proof test fails, it's a flag that meaningful observable behavior may have changed.

This repo also contains a skill and some tooling to help keep claims and proofs well-formed. For tooling, there's a JS/TS CLI-run checker verifying that claim documents and proof files have matching identifiers and titles. It uses the [JS and TS conventions](https://github.com/hejhi/semantic-claims/blob/main/JAVASCRIPT.md) to match claims with proofs and report structural mismatches.

## In practice

### Claim documents

Claim documents are well-formed Markdown describing the meaningful observable behavior of a given a [**subject**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#subjects) as a collection of claims.

A subject is conceptually broad, as there's no prescribed granularity of what claims can describe. A subject might be a system, component, protocol, or tiny shared helper, but it must have behavior that can be described, observed, and tested.

The below example shows `search/search-results.scenarios.md` claiming a single behavior:

```md
# Search results

## §1 Search precedence

### §1.1 Newer searches supersede older results

**Given** an older search is in progress,
**When** a newer search begins and the older search later completes,
**Then** the older result doesn't replace the latest result.
```

This is a (non-exhaustive) minimal, well-formed claim document:

1. `Search results` is the **subject** of the claims
2. `Search precedence` is a **claim set**, grouping one or more claims together
3. `Newer searches supersede...` is a single **claim**
4. The Given/When/Then statement is the behavior being claimed

There's no reference to code here; claim documents form a semantic contract of a given subject, which means it should be able to withstand implementation changes that don't touch semantics.

There are two kinds of claims:

- an [**invariant**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#claim-kinds) is a statement describing a single constant behavior
- a [**scenario**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#claim-kinds) describes behavior whose meaning depends on event order

Invariants are direct statements, while scenarios can be structured with Given/When/Then to make the conditions, events, and outcome easier to follow (it's not a requirement though, you do you).

**Cross-cutting** claims are available to describe behavior belonging to an interaction between multiple subjects. Here's the same example as before, with a new claim about the interaction between the search filter and published results:

```text
search/
├── --search-submission.scenarios.md
├── --search-submission.scenarios.test.ts
├── search-filter.ts
├── search-results.scenarios.md
├── search-results.scenarios.test.ts
└── search-results.ts
```

The cross-cutting claim sits in `search/`—the closest directory containing files for both subjects. Its `--` prefix distinguishes it from claims about either local subject.

### Proofs

Each claim doc has a paired **proof** file. A proof verifies each claim by exercising each observable behavior in a test. Following JS/TS conventions, the paired proof would be named `search/search-results.scenarios.test.ts`, which matches the section and claim titles from the claim document _exactly_:

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

## More

1. [OVERVIEW.md](https://github.com/hejhi/semantic-claims/blob/main/OVERVIEW.md): motivation and repo guide
2. [FAQ.md](https://github.com/hejhi/semantic-claims/blob/main/FAQ.md): common questions about Semantic Claims, TDD, and acceptance criteria
3. [REFERENCE.md](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md): the detailed rules for claims, proofs, document structure, and the authoring workflow
4. [EXAMPLES.md](https://github.com/hejhi/semantic-claims/blob/main/EXAMPLES.md): claim-decision examples and borderline cases
5. [JAVASCRIPT.md](https://github.com/hejhi/semantic-claims/blob/main/JAVASCRIPT.md): the JavaScript and TypeScript conventions

## Tooling

The repo also includes a [JS and TS claim checker and local Semantic Explorer](https://github.com/hejhi/semantic-claims/blob/main/scripts/check-semantics.mjs), plus [agent skills](https://github.com/hejhi/semantic-claims/tree/main/.agents/skills/semantic-claims) that can be used to help integrate the method into development workflows.

Fun fact! Semantic Claims were used to build the [validation scripts](https://github.com/hejhi/semantic-claims/tree/main/scripts), if you want to see the model in action.

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

Uninstall the package, remove its package scripts, and delete the copied skill if present (no claims or proofs will be harmed in the process):

```sh
npm uninstall semantic-claims
```
