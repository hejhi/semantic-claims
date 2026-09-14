# Semantic Claims Model

Semantic Claims is a simple way to keep software semantics understandable and testable as code changes.

It's designed to help people, coding agents, and sentient creatures build and maintain software together over time.

## Links

1. [OVERVIEW.md](https://github.com/hejhi/semantic-claims/blob/main/OVERVIEW.md): motivation and rationale
2. [FAQ.md](https://github.com/hejhi/semantic-claims/blob/main/FAQ.md): common questions about Semantic Claims, TDD, and acceptance criteria
3. [REFERENCE.md](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md): the detailed rules for claims, proofs, document structure, and the authoring workflow
4. [EXAMPLES.md](https://github.com/hejhi/semantic-claims/blob/main/EXAMPLES.md): claim-decision examples and borderline cases
5. [JAVASCRIPT.md](https://github.com/hejhi/semantic-claims/blob/main/JAVASCRIPT.md): the JavaScript and TypeScript conventions

## Introduction

Semantic Claims is very similar to TDD (one could call it STDD, though not my _favorite_ acronym), with the difference being that the tests are driven by, and linked to, semantics.

[**Semantics**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#semantics) are the **intended observable behaviors** of whatever is being built. These behaviors are organized under named [**subjects**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#subjects), which represent a coherent and complete set of intended observable behaviors. They then pass through a three-step workflow:

```text
claim  ->  prove  ->  implement
          └────────────────────┘
             Just like TDD 🎉
```

Breaking down the steps:

1. **claim**: state the intended observable behavior in a well-formed Markdown file
2. **prove**: write tests that prove the implementation exhibits the claimed behavior
3. **implement**: write or update the implementation until the proofs pass

This produces three colocated artifacts. For example, in a TS codebase:

```text
src/
├── range.invariants.md       <- the subject's semantic claims
├── range.invariants.test.ts  <- the subject's semantic proofs
└── range.ts                 <- the subject itself
```

If a proof unexpectedly fails, use its claim to check the intended outcome before changing the proof or implementation.

## In practice

### Claim documents

Claim documents are well-formed Markdown files that enumerate a subject's intended observable behaviors. In this example, a numeric range includes both endpoints.

The claim document from above (`src/range.invariants.md`) contains a single claim:

```md
# Range

## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

This is a (non-exhaustive) minimal, well-formed claim document:

1. `Range` is the **subject** (semantic scope) of the claims
2. `Endpoint inclusion` is a **claim set**, grouping one or more claims together
3. `Both endpoints belong to the range` is a single **claim**
4. `A value equal to either endpoint is included.` is the claim's statement

Implementation changes that preserve the claimed behavior should not require claim edits. If routine implementation changes require new claim wording or a new subject name, check whether you have described a private mechanism or chosen an incomplete scope.

### Proofs

Each claim document has one paired **proof** file containing tests of its claimed behaviors. In this JS/TS example, the paired proof is named `src/range.invariants.test.ts`, and its tests repeat the section and claim titles _exactly_:

```ts
describe('§1 Endpoint inclusion', () => {
  it('§1.1 Both endpoints belong to the range', () => {
    const range = createRange(2, 5);

    expect(range.includes(2)).toBe(true);
    expect(range.includes(5)).toBe(true);
  });
});
```

The colocation and matching structure allow tools like the checker provided in this package to verify links between well-structured claims and proofs, as well as catch issues like missing proofs.

### Claim kinds and scope

There are two kinds of claims:

- an [**invariant**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#claim-kinds) states semantics that remain true whenever its conditions apply
- a [**scenario**](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#claim-kinds) states semantics whose expected result depends on event order

Invariants are direct statements, while scenarios can be structured with Given/When/Then to make the conditions, events, and outcomes easier to follow (it's not a requirement though—you do you).

**Cross-cutting claims** are a way to scope and specify semantics belonging to an interaction between multiple subjects. For example, a claim about the interaction between a search filter and published results can be placed alongside both subjects:

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

## Design and planning

Use Semantic Claims within your existing design and planning process:

| Activity | Question |
| --- | --- |
| Design exploration | What should we build, for whom, and which tradeoffs should we accept? |
| Claiming | Which intended observable behaviors warrant claims, and how do we state them precisely? |
| Implementation planning | How will we build and verify those behaviors? |

You can draft claims during design, write them after design decisions are settled, or add them to existing software once its intended behavior is established. Claiming requires clear intent for the behavior in scope; a separate design phase is optional.

When working with an agent in planning mode, use the conversation to explore design, draft claim wording, and plan implementation. Claims don't need to exist before planning begins. Revisit proposed claims and design decisions as needed while assessing feasibility. When execution begins, write or update the accepted claim documents before their proofs and implementation.

Keep useful design rationale and implementation steps in your design notes or plan. Maintain the claims alongside the code as the record of intended behavior after the planned work is complete.

## Tooling

The repo also includes a [JS and TS claim checker and local Semantic Explorer](https://github.com/hejhi/semantic-claims/blob/main/scripts/check-semantics.mjs), plus [agent skills](https://github.com/hejhi/semantic-claims/tree/main/.agents/skills) that can be used to help integrate the method into development workflows.

Fun fact! Semantic Claims were used to build the [validation scripts](https://github.com/hejhi/semantic-claims/tree/main/scripts), if you want to see the model in action.

You can install the (alpha) checker as a dev dependency:

```sh
npm install --save-dev semantic-claims@alpha
```

It supports Node 22 and newer. I've also used it successfully in a pnpm monorepo, but ymmv.

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

### Install the agent skills

The four Semantic Claims skills follow the open [Agent Skills specification](https://agentskills.io). Select a skill in your agent's skill picker or mention it by name:

| Skill | Purpose |
| --- | --- |
| `semantic-claims-claim` | Decide and author warranted claims. |
| `semantic-claims-prove` | Write and run executable proofs for accepted claims. |
| `semantic-claims-implement` | Implement the claimed behavior and verify it. |
| `semantic-claims-review` | Review claims, proofs, and implementation together. |

Each skill completes the requested stage. They share one copy of the method guidance and references, included with `semantic-claims-claim`.

From a project root, install all four into `.agents/skills`:

```sh
npx semantic-claims@alpha skill install
```

You can provide a different skills directory:

```sh
npx semantic-claims@alpha skill install /path/to/skills
```

If no directory is specified, installation, update, and removal use `.agents/skills`. Each skill has its own named subdirectory.

Run the corresponding command from the project root, or pass the same explicit directory, to update all four skills to the version provided by the selected package release. Update also restores missing skills and migrates the previous single `semantic-claims` skill to the four new entries:

```sh
npx semantic-claims@alpha skill update
npx semantic-claims@alpha skill update /path/to/skills
```

Remove the skills in the same way:

```sh
npx semantic-claims@alpha skill remove
npx semantic-claims@alpha skill remove /path/to/skills
```

Installation refuses to replace any existing entry with one of the four skill names or the legacy `semantic-claims` name. Update and removal verify the identity of every affected entry before changing anything. Other skills are left unchanged.

### Remove it

Uninstall the checker package and remove its package scripts if present (no claims or proofs will be harmed in the process):

```sh
npm uninstall semantic-claims
```
