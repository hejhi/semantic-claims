# Semantic Claims Model

With the Semantic Claims Model, important software behavior remains understandable and testable as code changes.

It's for anyone (people, coding agents, sentient animals) who build, maintain, extend, or need to understand software over time. Its influences include TDD, invariants in code design, and Gherkin-style acceptance criteria.

There's three pieces to it:

```text
claim -> proof -> implementation
```

## Claims and proofs

### Claims

**Claims** are Markdown documents claiming the observable behavior of a given subject.

For example, suppose a newer search must take precedence over an older search still in progress. In a claim document named `search.scenarios.md`, that behavior can be _claimed_:

```md
# Search filter

## §1 Search precedence

### §1.1 Newer searches supersede older results

After a newer search begins, completing an older search leaves the latest result unchanged.
```

Breaking down the anatomy of the claim document:

1. `Search filter` is the [**subject**](./SUBJECTS.md) of claims.
2. `Search precedence` is a **claim set** grouping one or more claims together
3. `Newer searches supersede...` is a **claim**
4. `After a newer search begins...` is the **observable behavior** being claimed

Claims do _not_ describe APIs, libraries, or implementation details—notice there's no code references in the claim document above. Claims _only_ specify semantics that can be expressed as observable behavior. This allows implementations to change without needing to constantly adjust underlying semantics—as long as the observable behavior remains the same, the claim itself doesn't need to change; only the proof might.

There are two kinds of claims:

- An **invariant** describes a constant truth.
- A **scenario** describes behavior whose meaning depends on event order.

There is also another type of claim, known as **cross-cutting**, for when observable behavior exists between multiple subjects. Cross-cutting claim documents get placed at the closest shared boundary, and prefixed with `--` (for example, `--name.invariants.md`).

### Proofs

Each claim document has a paired **proof** file. A proof tests each claim by actually exercising each observable behavior in the claim document. Following JS/TS conventions, the paired proof would be named `search.scenarios.test.ts`, which match the section and claim titles from the claim document _exactly_:

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

Note: This repository includes [JS and TS conventions](./JAVASCRIPT.md) that work with a provided checker, which verifies in a project that shared identifiers and matching titles connect each claim to its proof, and flags any mismatches.

Claims and proofs should be colocated with a subject's implementation.

## Method

Revisiting this:

```text
claim -> proof -> implementation
```

That's also the intended _sequence_ for authoring, which follows a TDD-like method:

1. **claim**: write the claims for a subject
2. **prove**: write the proofs for the claims
3. **implement**: write the implementation to fit the proof

It's expected that, when following this order, proofs should fail until the implementation is actually written—also TDD-like.

The set of all three—claims, proofs, and implementation—form a discrete unit of context and unambiguous intent that gets colocated with the implementation.

## Explore the repo

1. [OVERVIEW.md](./OVERVIEW.md): motivation and repo guide.
2. [FAQ.md](./FAQ.md): common questions about Semantic Claims, TDD, and acceptance criteria.
3. [SEMANTICS.md](./SEMANTICS.md): the shared method.
4. [SUBJECTS.md](./SUBJECTS.md): what claims are about.
5. [INVARIANTS.md](./INVARIANTS.md): standing claims.
6. [SCENARIOS.md](./SCENARIOS.md): ordered claims.
7. [EXAMPLES.md](./EXAMPLES.md): claim-decision examples and borderline cases.
8. [EXISTING-SYSTEMS.md](./EXISTING-SYSTEMS.md): incremental adoption without inferring claims from implementation.
9. [JAVASCRIPT.md](./JAVASCRIPT.md): the JavaScript and TypeScript conventions.
10. [ELEPHANT-GOLDFISH.md](./ELEPHANT-GOLDFISH.md): using Semantic Claims within the Elephant-Goldfish development process.

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

Proofs are just normal tests and should run when you run your tests as usual.

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

There's also an [agent skill](./.agents/skills/semantic-claims) available at `.agents/skills/semantic-claims/`. You can copy that directory to the location used by your project's coding agent.

### Remove it

Uninstall the package, remove its package scripts, and delete the copied skill if present:

```sh
npm uninstall semantic-claims
```

Any authored claim documents and proofs are safe, and won't be touched if uninstalled.
