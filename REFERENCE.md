# Semantic Claims Reference

For a quick introduction, basic workflow, and complete example, start with the [README](./README.md).

## Subjects

A subject is a cohesive scope of meaningful software behavior that can be described, observed, and tested. There's no prescribed granularity; a subject might be a system, protocol, component, or tiny shared helper. Its name should remain valid despite implementation changes.

## Claims

A claim describes one meaningful, observable, testable behavior of a subject in plain language. Claims are grouped in claim sets, within a claim document, which as a whole forms a subject's semantic contract.

Claims should be written using terminology already established by the subject. They should include when the behavior applies, and what an observer can expect to happen.

Access to private implementation details does not by itself make them observable behavior.

### Claim kinds

Every claim is either an **invariant** or a **scenario**:

- An invariant describes something that must be true whenever its stated conditions apply.
- A scenario describes what must happen when events occur in a particular order.

If changing the order of the relevant events could change the expected result, it's a scenario. Otherwise, it's an invariant.

Invariants are direct statements. Scenarios are better structured as Given/When/Then when they make the starting conditions, events, and outcome easier to follow. However, they needn't be forced into it if it doesn't provide additional clarity over plain prose.

The order of setup steps in a test doesn't make a claim a scenario. The order has to matter to the behavior itself.

A subject may have invariant claims, scenario claims, or both.

Invariant and scenario claims should be separate documents. A subject can have both claim kinds:

```text
name.invariants.md
name.scenarios.md
```

Regardless of kind, claim documents should be colocated with subject proofs and implementation.

### Cross-cutting claims

Some behavior depends on several subjects working together. When the behavior can't be wholly assigned to a single subject, the interaction itself is the subject of a **cross-cutting claim**.

Cross-cutting claim documents start with `--`:

```text
--name.invariants.md
--name.scenarios.md
```

The document is placed in the closest directory that contains files for every subject involved in the interaction, and should include only behavior that belongs to the interaction. Each local subject's own behavior belongs in its local claim documents, and shouldn't be copied or summarized in the cross-cutting document.

### Deciding whether a behavior needs a claim

The first step is making sure the subject's behavior is clear, meaningful, and observable. A claim should be written when changing or removing the behavior would affect an intended outcome an observer relies on. If an existing claim already requires the same result under the same conditions, don't add another one.

### Document structure

A claim document has a specific structure consisting of four parts:

1. An `#` heading with the subject's name in ordinary language.
2. An optional introduction that clarifies what the subject includes.
3. One or more `## §N Title` sections. We call each section a claim set, and it groups related claims.
4. One or more `### §N.M Title` claims. The text under each heading describes the required behavior.

Each claim includes an identifier, title, and statement. The title should be short and declarative, with conditions and results in a statement beneath it.

Only claims define required behavior. Introductions and claim-set headings provide context and organization. If a requirement matters on its own, it belongs in a claim.

Every section and claim identifier has to be unique within its document. The first number in a claim identifier refers to its section. For example, claim `§2.3` belongs to section `§2`.

Identifiers provide stable links among claims, proofs, and references. The document's layout determines reading order. Identifiers don't set priority, execution order, or dependencies, so they may contain gaps or appear out of numeric order.

A new claim should take any unused identifier in its section, and then be put where it reads naturally. If an identifier or title needs to change, every proof and reference that uses it should be updated too.

## Proofs

Every claim is verified by one or more executable tests that form the claim’s proof. Each test must link unambiguously to the claim, though languages and test frameworks may represent that link differently.

For JavaScript and TypeScript, the filename and test structure conventions are detailed in [JAVASCRIPT.md](./JAVASCRIPT.md). This repo's checker validates the links, while project test runners are responsible for executing proofs.

## Resolving disagreements

If the claim, proof, and implementation don't agree, it should first be determined what the software's supposed to do.

If the intended behavior has changed, the claim should be updated first. If it hasn't, the claim should be left alone and the proof or implementation fixed.

## Adding or changing behavior

For new work, the intended behavior may come from an accepted requirement, design, protocol, or explicit decision made during planning. The claim should be written before the proof and implementation.

When adding or changing intended behavior:

1. start with the subject of the new or changed behavior
2. read any existing claims for the subject and any cross-cutting claims that apply
3. decide the intended observable behavior and whether it needs a claim
4. write each claim as an invariant or scenario
5. write executable proofs from those claims. If the behavior is missing or wrong, the proofs must fail because of that behavior, not because the test setup is broken
6. write or change the implementation until the proofs pass
7. run the structural claim checks, executable proofs, and other relevant project checks
8. review the claims, proofs, and implementation together

While writing a proof, ambiguity, overlap, or behavior might surface that can't be tested as written; in that case, the claim and proof should be revised together before continuing with the implementation. If the intended behavior is still unclear, stop and resolve it first.

### Existing software

Claims can be added to existing software incrementally, starting with the subject or change at hand. Priority should be given to behavior where a mistake would be costly or difficult to recover from, such as:

- public interfaces, external protocols, persisted data, and compatibility;
- authorization, accounting, and irreversible effects;
- retries, cancellation, concurrency, and lifecycle behavior;
- interactions and user or operator workflows involved in previous incidents.

Requirements, protocols, user documentation, incident reports, code, tests, and firsthand product or domain knowledge can be used to work out intended behavior. Code and tests show what happens today, but don't establish by themselves what should happen. Any source might be incomplete, stale, or wrong. When sources conflict, the intended behavior should be decided before writing a claim. The current behavior might be intentional, accidental, temporary, wrong, or just an implementation detail; either way, the same workflow still applies: the claim should always be written before a new proof, even when that proof will pass immediately.
