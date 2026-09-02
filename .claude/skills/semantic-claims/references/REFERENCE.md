# Semantic Claims Reference

For a quick introduction, the basic workflow, and a complete example, start with the [README](./README.md). This reference contains the full rules for deciding what to claim, writing claims, proving them, and keeping claims, proofs, and implementations consistent.

## Claims

In software, **semantics** means the behavior or meaning of a program. This model focuses on intended semantics: what software is supposed to do.

A claim describes one observable, testable part of that behavior in plain language. Together, a subject's claims specify the parts of its intended semantics that are observable and testable. We call that set its **semantic contract**.

### Subjects

Every claim is about one thing, which we call the **subject**. The subject might be a system, function, component, protocol, user-interface element, or an interaction among several parts of a system.

Choose the smallest thing that has the whole behavior you want to describe. Base that choice on the behavior, not on how the code happens to be organized today.

Name the subject with a familiar noun or noun phrase from its domain. The name should still make sense if its internal implementation changes.

### Observable behavior

An **observer** is a user, caller, operator, or another part of the system that can tell which outcome occurred. The behavior is **observable** when the observer can do that through an interface they're expected to use.

The interface doesn't have to be public. One internal component can rely on another component's interface, so behavior at that boundary can be observable too. Private state and control flow aren't observable just because a test can inspect them.

An exact technical detail belongs in a claim only when it's been explicitly accepted as part of the intended observable behavior and changing it would affect an outcome an observer is meant to rely on. Don't claim a name, token, status code, or field merely because it's exposed, documented, returned, or easy to test. Prefer to describe behavior in a way that won't become stale when its implementation changes.

### Deciding whether a behavior needs a claim

Before writing a claim, decide what the subject is supposed to do.

Once you've identified an observable, testable behavior, write a claim when changing or removing it would affect an intended outcome an observer relies on. Don't add another claim if an existing one already requires the same result under the same conditions.

If the intended behavior isn't clear, don't write the claim yet. Resolve it first.

### Choosing what to cover

You don't need to describe every subject before claims become useful. For the work at hand, write one claim for every behavior that meets this test. Don't claim the same behavior twice.

When a behavior has no claim, that only means the model doesn't specify it. It doesn't mean the behavior is unimportant or safe to change.

### Writing a claim

Write a claim in plain language. Say when the behavior applies and what an observer can expect to happen.

Keep one behavior in each claim. If two behaviors could change independently, use separate claims. One claim can still need several proof cases.

### Choosing between invariants and scenarios

Every claim is either an **invariant** or a **scenario**:

- An invariant describes something that must be true whenever its stated conditions apply.
- A scenario describes what must happen when events occur in a particular order.

Ask whether changing the order of the relevant events could change the expected result. If it could, use a scenario. Otherwise, use an invariant.

Write invariants as direct statements. For scenarios, prefer **Given**, **When**, and **Then** when they make the starting conditions, events, and outcome easier to follow. Don't force an invariant into this form or add an empty step just to use all three words.

The order of setup steps in a test doesn't make a claim a scenario. The order has to matter to the behavior itself.

Limits, validity rules, and results that must always hold often make good invariants. Races, retries, cancellation, recovery, scheduling, cleanup, and lifecycle behavior often need scenarios. Words like “before” and “after” don't make a claim a scenario by themselves.

A subject may have invariant claims, scenario claims, or both.

## Claim documents

Keep invariant and scenario claims in separate documents. A subject with both kinds has two documents:

```text
name.invariants.md
name.scenarios.md
```

`name` is a stable, file-safe name for the subject. Keep each document beside the implementation and proofs for that subject.

### Cross-cutting claims

Some behavior depends on several subjects working together. When you can't accurately assign the whole behavior to one of them, use the interaction itself as the subject of a **cross-cutting claim**.

Cross-cutting claim documents start with `--`:

```text
--name.invariants.md
--name.scenarios.md
```

Put the document in the closest directory that contains files for every subject involved in the interaction. Include only behavior that belongs to the interaction. Keep each subject's own behavior in its local claim documents, and don't copy or summarize those local claims in the cross-cutting document.

### Document structure

A claim document has four parts:

1. An `#` heading with the subject's name in ordinary language.
2. An optional introduction that clarifies what the subject includes.
3. One or more `## §N Title` sections. We call each section a **claim set**, and it groups related claims.
4. One or more `### §N.M Title` claims. The text under each heading describes the required behavior.

A claim includes an identifier, title, and statement. Use a short, declarative title. Put the conditions and required result in the statement beneath it.

Only claims define required behavior. Introductions and claim-set headings provide context and organization. If a requirement matters on its own, put it in a claim.

Every section and claim identifier has to be unique within its document. The first number in a claim identifier refers to its section. For example, claim `§2.3` belongs to section `§2`.

Identifiers provide stable links among claims, proofs, and references. The document's layout determines reading order. Identifiers don't set priority, execution order, or dependencies, so they may contain gaps or appear out of numeric order.

Give a new claim any unused identifier in its section, then put it where it reads naturally. If you change an identifier or title, update every proof and reference that uses it.

## Proofs

A proof is an executable test of one claim. It should pass when the claimed behavior is present and fail when it isn't.

One claim might need several proofs, and one proof may cover several cases. Together, the proofs should test the whole claim.

A passing proof establishes only what it actually tests.

## Resolving disagreements

If the claim, proof, and implementation don't agree, first decide what the software is supposed to do.

If the intended behavior has changed, update the claim first. If it hasn't, leave the claim alone and fix the proof or implementation.

## Linking proofs to claims

Every proof identifies the claim it tests, and every claim has at least one proof. The link must be unambiguous, though different languages and test frameworks may represent it differently.

For JavaScript and TypeScript, follow the filenames and test structure in [JAVASCRIPT.md](./JAVASCRIPT.md). This repository's checker validates the links, while your test runner executes the proofs.

## Adding or changing behavior

For new work, the intended behavior may come from an accepted requirement, design, protocol, or explicit decision made during planning. Write the claim before the proof and implementation.

When you're adding or changing intended behavior:

1. Start with the subject of the new or changed behavior.
2. Read any existing claims for the subject and any cross-cutting claims that apply.
3. Decide the intended observable behavior and whether it needs a claim.
4. Write each claim as an invariant or scenario.
5. Write executable proofs from those claims. If the behavior is missing or wrong, the proofs must fail because of that behavior, not because the test setup is broken.
6. Write or change the implementation until the proofs pass.
7. Run the structural claim checks, executable proofs, and other relevant project checks.
8. Review the claims, proofs, and implementation together.

While writing a proof, you might find ambiguity, overlap, or behavior that can't be tested as written. Revise the claim and proof together before continuing with the implementation. If the intended behavior is still unclear, stop and resolve it first.

### Existing software

You can add claims to existing software incrementally. Start with the subject or change at hand. Give priority to behavior where a mistake would be costly or difficult to recover from, such as:

- public interfaces, external protocols, persisted data, and compatibility;
- authorization, accounting, and irreversible effects;
- retries, cancellation, concurrency, and lifecycle behavior;
- interactions and user or operator workflows involved in previous incidents.

Use requirements, protocols, user documentation, incident reports, code, tests, and firsthand product or domain knowledge to work out the intended behavior. Code and tests show what happens today, but they don't establish by themselves what should happen. Any source might be incomplete, stale, or wrong. When sources conflict, decide the intended behavior before writing a claim.

The current behavior might be intentional, accidental, temporary, wrong, or just an implementation detail.

The same workflow still applies: write the claim before writing a new proof, even when that proof will pass immediately.
