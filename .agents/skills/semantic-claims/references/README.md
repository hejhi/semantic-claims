# Semantic Claims Model

Semantic Claims is a simple way to keep software semantics understandable and testable as code changes.

It's designed to help people, coding agents, and sentient creatures build and maintain software together over time.

## Links

1. [OVERVIEW.md](https://github.com/hejhi/semantic-claims/blob/main/OVERVIEW.md): motivation and repo guide
2. [FAQ.md](https://github.com/hejhi/semantic-claims/blob/main/FAQ.md): common questions about Semantic Claims, TDD, and acceptance criteria
3. [REFERENCE.md](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md): the detailed rules for claims, proofs, document structure, and the authoring workflow
4. [EXAMPLES.md](https://github.com/hejhi/semantic-claims/blob/main/EXAMPLES.md): claim-decision examples and borderline cases
5. [JAVASCRIPT.md](https://github.com/hejhi/semantic-claims/blob/main/JAVASCRIPT.md): the JavaScript and TypeScript conventions

## Introduction

Semantic Claims is very similar to TDD (one could call it STDD, though not my _favorite_ acronym), with the difference being that the tests are driven by, and linked to, semantics.

[**Semantics**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#semantics) are defined here as the **intended observable behaviors** of whatever is being built. Semantic Claims encourages breaking down implementation candidates (as in, something specified by designs, specs, requirements, etc) into coherent semantic scopes called [**subjects**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#subjects), which are specified through claims, and tested through proofs, in a three-step workflow:

```text
claim  ->  prove  ->  implement
          └────────────────────┘
             Just like TDD 🎉
```

Breaking down the steps:

1. **claim**: state an intended observable behavior in order to specify it as a semantic
2. **prove**: write tests that prove the implementation exhibits the claimed behavior
3. **implement**: write or update the implementation until the proofs pass

The proof tests verify that an implementation aligns with its semantics, ideally leading to legible, well-scoped implementations of predefined, intentional, observable behaviors.

This produces three colocated artifacts. For example, in a TS codebase:

```text
search/
├── search-results.scenarios.md       <- the subject's semantic claims
├── search-results.scenarios.test.ts  <- the subject's semantic proofs
└── search-results.ts                 <- the subject itself
```

Semantic Claims and implementations live together with the proofs that connect them. If a proof unexpectedly fails, it's a flag that an important behavior may have changed in unexpected ways, and the Semantic Claims can help provide valuable context to understand the _intention_ of the original behavior while debugging it.

## In practice

### Claim documents

Claim documents are well-formed Markdown files that enumerate a subject's intended observable behaviors as Semantic Claims. There's no prescribed granularity for a subject—it could be scoped to anything from a system or protocol to a component or small shared helper. The primary criterion is that it's _semantically coherent_ in scope, and can be clearly named.

The below example shows the claim document from above (`search/search-results.scenarios.md`) claiming a single behavior:

```md
# Search results

## §1 Search precedence

### §1.1 Newer searches supersede older results

**Given** an older search is in progress,
**When** a newer search begins and the older search later completes,
**Then** the older result doesn't replace the latest result.
```

This is a (non-exhaustive) minimal, well-formed claim document:

1. `Search results` is the **subject** (semantic scope) of the claims
2. `Search precedence` is a **claim set**, grouping one or more claims together
3. `Newer searches supersede...` is a single **claim**
4. The scenario's Given/When/Then statement specifies the behavior being claimed

There are no references to code; claim documents specify behaviors, which means claims should be able to withstand implementation changes that don't affect semantics. If you find that every small change to an implementation requires updating its Semantic Claims or subject name, it's worth revising the claims to make sure it's not describing the implementation, or re-scoping the subject to be more coherent.

There are two kinds of claims:

- an [**invariant**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#claim-kinds) states semantics that remain true whenever its conditions apply
- a [**scenario**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#claim-kinds) states semantics whose expected result depends on event order

Invariants are direct statements, while scenarios can be structured with Given/When/Then to make the conditions, events, and outcomes easier to follow (it's not a requirement though—you do you).

**Cross-cutting claims** are a way to scope and specify semantics belonging to an interaction between multiple subjects. Here's the same example as before, with a new claim about the interaction between the search filter and published results:

```text
search/
├── --search-submission.scenarios.md       <- new!
├── --search-submission.scenarios.test.ts  <- new!
├── search-filter.ts
├── search-results.scenarios.md
├── search-results.scenarios.test.ts
└── search-results.ts
```

The cross-cutting claim sits in `search/`—the closest directory containing files for both subjects. Its `--` prefix distinguishes it from claims about either local subject.

### Proofs

Each claim document has a paired **proof** file. A proof verifies a claim document by testing each behavior. Following JS/TS conventions, the paired proof would be named `search/search-results.scenarios.test.ts`, which matches the section and claim titles from the claim document _exactly_:

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

The colocation and matching structure allow tools like the checker provided in this package to verify links between well-structured claims and proofs, as well as catch issues like missing proofs.

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

### Install the agent skill

The Semantic Claims skill follows the open [Agent Skills specification](https://agentskills.io). Choose a skills directory supported by your agent, then install the skill there:

```sh
cd /path/to/skills
npx semantic-claims@alpha skill install
```

You can provide the skills directory instead of changing directories:

```sh
npx semantic-claims@alpha skill install /path/to/skills
```

The command installs the skill as `/path/to/skills/semantic-claims`. It does not detect or configure an agent.

Run the corresponding command from the same directory, or pass that directory again, to update the skill to the version provided by the selected package release:

```sh
npx semantic-claims@alpha skill update
npx semantic-claims@alpha skill update /path/to/skills
```

Remove the skill in the same way:

```sh
npx semantic-claims@alpha skill remove
npx semantic-claims@alpha skill remove /path/to/skills
```

Installation refuses to replace an existing `semantic-claims` entry. Update and removal accept only an entry whose `SKILL.md` identifies it as the Semantic Claims skill, and leave neighboring skills alone.

### Remove it

Uninstall the checker package and remove its package scripts if present (no claims or proofs will be harmed in the process):

```sh
npm uninstall semantic-claims
```
