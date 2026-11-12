---
name: semantic-claims
description: Decide, author, prove, implement, and review Semantic Claims. Use when defining intended behavior, writing claim documents or proof tests, implementing claimed behavior, reviewing claims, proofs, and implementation, including claim-checker failures, or migrating claims after an upgrade.
---

# Semantic Claims

Within the scope requested by the user, begin by identifying logical [systems](#definitions) warranting semantic claims, and read each system's claims and the cross-cutting claims that include it.

Thoughtfully and methodically enumerate or revise the semantics of each system as per the rules in [claims](#claims). If revising claims, follow the guidelines for [adjusting semantics](#adjusting-semantics) as well.

Read [EXAMPLES.md](references/EXAMPLES.md) and [AMBIGUITY.md](references/AMBIGUITY.md) before the first claim-document edit, and [JAVASCRIPT.md](references/JAVASCRIPT.md) before writing a JavaScript or TypeScript proof or changing the checker.

## Who decides semantics

The user decides what each system is meant to do. An agent may investigate evidence, identify ambiguity, and propose claims and proofs.

Ask if and only if a behavior in the requested scope is undecided or a proposed behavior has not been authorized by the user. When asking, present the proposed claim statement and proof obligation before editing the affected claims.

## Stages

A request for claims, proofs, or a review completes only that stage. A request for new or changed behavior includes the claims and proofs it needs, written before the implementation.

- **Claims:** Change a conforming statement only when it differs from the intended behavior. Revise a claim if its response is false under the intended behavior in any case of its condition, including every alternative and boundary value. Report each claim's proof obligation, and each claim decision that changes the proposed work or resolves an ambiguity.
- **Proofs:** Write executable proofs under the rules in [Proofs](#proofs). If the behavior is missing or wrong, each proof must fail at an assertion of the claim's response, after its setup has succeeded. Fix setup failures and report them separately from assertion failures. Leave claims unchanged in a proof-only request, and report each statement that a test cannot evaluate.
- **Implementation:** Change the implementation until every claim's proof passes, then review the change and fix each finding within the requested scope.
- **Review:** Report a finding for each failed check below, with its location and observable consequence, ordered by severity, and state every limit on verification. If there are no findings, say so. Leave files unchanged unless the user also requests fixes.

### Review checks

1. **Warrant:** Every characteristic in scope that warrants a claim under [Choosing when and how to write Semantic Claims](#choosing-when-and-how-to-write-semantic-claims) has one, and every claim is warranted.
2. **Meaning:** The claim's statement, its title, and the definitions it uses state meaning under [Claims specify meaning](#claims-specify-meaning).
3. **System:** The claim's system satisfies [Definitions](#definitions) and [Cross-cutting claims](#cross-cutting-claims).
4. **Kind:** The claim is in a document of the kind that [Claim kinds](#claim-kinds) assigns it.
5. **Statement:** The statement matches a pattern of its kind.
6. **Clarity:** The statement and the definitions it uses have one reading under [AMBIGUITY.md](references/AMBIGUITY.md).
7. **Document:** The document satisfies [Document structure](#document-structure).
8. **Truth:** The response is true under the intended behavior in every case of the condition.
9. **Proof:** The proof satisfies [Proofs](#proofs) and the project's proof-linking conventions.
10. **Implementation:** The implementation satisfies every claim.

## Verify

After every change, run the structural checker and the proofs. In a claim-only request, run the checker and resolve every statement error; missing-proof errors remain until proofs are written. A passing structural check demonstrates structural conformance only. For checker changes, run valid and invalid fixtures of both claim kinds.

## Migrations

[migrations/](migrations/) contains one directive per release that changes the claim format, named by that release. To migrate a project after an upgrade, apply, in version order, every directive for a release newer than the one the project used before the upgrade. If that release is unknown, ask the user. If the checker rejects claim documents that passed before an upgrade, migrate them before any other claim work.

<!-- Generated from REFERENCE.md by "bun run sync:skills". Edit REFERENCE.md instead of the text below. -->

_For an introduction and example, start with [README](https://github.com/hejhi/semantic-claims/blob/main/README.md). These are conventions for writing claims and proofs. The checker requires this document format as well as the [JavaScript and TypeScript proof conventions](references/JAVASCRIPT.md)._

Semantic Claims provides a way to specify, prove, and preserve the **public semantics** of any given system.

## Definitions

Semantic Claims defines:

- **Public semantics** as the intentional, observable characteristics of a given system
- **Intentional** as characteristics that are not implied or side-effects
- **Observable** as characteristics that can be proven by a test exercising only the public interface of the system
- **System** as any coherent encapsulation of code with public semantics that _warrant specification_

As Semantic Claims is _only_ interested in public semantics, when the word "semantics" is used here and elsewhere, it's referring specifically to public semantics as described above.

## Purpose

The purpose of applying Semantic Claims to a system is to:

- protect meaningful and intentional characteristics over time from accidental drift through code changes, refactors, and cleanups
- encourage an intentional, semantics-first approach to design, testing, implementation, and refactors
- provide accurate, valuable context on intentionality for maintainers over time
- make semantic changes conspicuous during code reviews

## Claims

Claims are organized in structured Markdown documents called **claim documents**, which are detailed semantic specifications for a given system.

### Claims specify meaning

Claims specify what a system does without specifying solutions or implementation mechanics. They are semantic requirements from which anyone could plausibly reconstruct the system in a myriad of ways, while proving it behaves as specified.

A part of a system that the system's consumers use, such as the protocol of an API, belongs to the system's interface. Every other part of the system belongs to its implementation mechanics, whether a claim names the part in code or in plain words.

Red flags of implementation mechanics:

- backticks, including literal code values such as `true`, `null`, or `0`
- referencing or specifying data structures, methods, or properties
- keywords like "returns", "calls", "callback", "arguments", "passes", "invokes", or anything describing functional orchestration

A claim should be specified in plain language without code references at all. For instance, instead of specifying "WHILE `isOpen()` returns `true`", specify "WHILE open".

A characteristic that cannot be stated without implementation mechanics does not warrant a claim, as defined in [Choosing when and how to write Semantic Claims](#choosing-when-and-how-to-write-semantic-claims).

### Claim kinds

A claim is either an **invariant** or a **scenario**, with each getting their own respective document. Scenarios cannot be mixed into invariant documents or vice-versa.

Every claim in a document is a single sentence following the EARS pattern (Easy Approach to Requirements Syntax). The EARS keywords `WHERE`, `WHILE`, `WHEN`, `IF`, `THEN`, and `SHALL` are written in uppercase, in this order:

`[WHERE <feature>, ][WHILE <state>, ][WHEN <trigger>, | IF <trigger>, THEN ]the <system name> SHALL <system response>.`

Each clause narrows the cases that the claim applies to: `WHERE` selects systems by a feature, `WHILE` selects states of the system, and `WHEN` or `IF` selects an event, narrowing the state further with conditions on what the event acts on, as in "IF an *unpaid* order is marked for shipment".

Rules for Semantic Claims:
- Each bracketed clause is optional
- A `WHERE` clause states an optional **feature** in the present tense: a characteristic, such as a configuration, that the system either has or lacks throughout the system's existence.
- A `WHILE` clause states a **state**: a condition on the system that can change during the system's existence.
- A `WHEN` clause states a **trigger**: an event that occurs during a system's existence. A condition on what the event acts on, such as the input of a request, is part of the trigger.
- An `IF … THEN` clause states a trigger that is an unwanted event, such as a failure or an invalid input.
- Each keyword may only appear a single time per claim (unless it is part of the system name itself).
- Keywords and conditional logic must never appear in a claim's prose, such as "...shows the fallback content **when** the source...".
- Negative statements in claims are not permitted after a `SHALL`; claims are phrased positively. A response that a system performing no action satisfies, such as leaving a state unchanged or sending zero messages, states an **absence**. Systems can "not do" an unlimited number of behaviors, so a response that states an absence names the part of the system's state that stays unchanged, or the event that occurs zero times, and applies from the trigger through the response in a scenario, in each state that satisfies the condition in an invariant, or over an interval that the claim states.
- Multiple `SHALL` clauses is not permitted.
- Each claim has one response. Two responses that a test can verify separately are two claims, while responses that form one outcome, such as two outputs in a required order, are one response.
- Avoid words where placement can cause ambiguity, like "only", preferring words like "exactly" or "each" (read [AMBIGUITY.md](references/AMBIGUITY.md)).

An **invariant** claim describes a single, observable characteristic that must always be true, or always true under a specified condition:

- `The <system name> SHALL <system response>.`
- `WHILE <state>, the <system name> SHALL <system response>.`
- `WHERE <feature>, the <system name> SHALL <system response>.`
- `WHERE <feature>, WHILE <state>, the <system name> SHALL <system response>.`

Rules:

An invariant claim begins with `The`, `WHILE`, or `WHERE`. It can _never_ include `WHEN` or `Whenever`.

An invariant can never refer to a prior or future state, which means it cannot state when an event happened, or specify when the system should run, react, or respond. This means invariants do not work for events, such as requests, creation, or notifications the system sends. Invariants also can't include `IF` for the same reason, as `IF` can only be used in the form of `IF ... THEN`, where `IF` introduces a trigger, and `THEN` introduces the response.

A **scenario** claim describes the triggering of an observable characteristic:

- `WHEN <trigger>, the <system name> SHALL <system response>.`
- `IF <trigger>, THEN the <system name> SHALL <system response>.`
- `WHILE <state>, WHEN <trigger>, the <system name> SHALL <system response>.`
- `WHERE <feature>, ` may begin any of these.

A scenario _must_ contain a `<trigger>`, introduced by `WHEN` or `IF`. Scenarios beginning with `WHERE` or `WHILE` are acceptable, as long as a `WHEN` or `IF` clause follows them.

Scenarios specify _when_ the system should run, whereas invariants deal only with _present (or constant) state_.

For example, in `WHILE the shop is closed, WHEN a paid order is marked for shipment, …`, the `WHILE` condition is evaluated **while** the trigger occurs (as in, before the system's response), thus the ordering of `WHILE`, `WHEN`, and `SHALL`, where `SHALL` describes the system response.

In every pattern, `<system name>` is the _exact name_ in the claim document's `#` heading (ignoring capitalization).

### Cross-cutting claims

A **cross-cutting claim** cannot describe only a single system; the system of a cross-cutting claim is the interaction among multiple systems.

A claim document's filename starts with `--` if its claims are cross-cutting. A cross-cutting claim document is stored in the lowest common ancestor directory of the files of every system in the interaction. For instance:

```text
search/
├── --filtered-search.invariants.md
├── --filtered-search.invariants.test.ts
├── search-filter.ts
├── search-results.invariants.md
├── search-results.invariants.test.ts
└── search-results.ts
```

### Document structure

A claim document has four parts:

1. An `#` heading with the system's name.
2. An optional introduction defining terminology used in claims.
3. One or more `## §N Title` sections.
4. One or more `### §N.M Title` claims. The text under each heading is the claim's statement.

Neither the introduction nor a section heading should contain statements that belong in claims. If a claim uses a term with a meaning specific to the system, it should be defined in the introduction.

Every section and claim identifier is unique within its document. The first number in a claim identifier is the number of its section.

Identifiers link claims, proofs, and references to each other. They _do not_ impose priority, order, or dependencies. They may contain gaps or appear out of numeric order.

As identifiers provide linkage, a change to an identifier or title requires the same change in every proof and reference that is linked to it.

## Proofs

Claims must be **provable** through one or more tests that exercise _only_ the system's public API. These proofs are tests colocated with the claim document they prove.

Every claim document has a paired proof file in the same directory. Inside the proof file, every claim proof is a set of executable tests that are linked to the claim. Languages and test frameworks may represent that link differently, provided each test links to exactly one claim.

A passing claim proof _must_ fully and non-ambiguously prove the claim it references using the system's public API.

## Choosing when and how to write Semantic Claims

Semantic Claims describes [meaning, not mechanism](#claims-specify-meaning). That should guide every decision, including:

- when Semantic Claims should be applied to a system
- what characteristics of the system warrant claims
- what EARS keywords and language should be used to write a claim

Apply Semantic Claims to systems with _observable characteristics that warrant claims_. A claim is _warranted_ when it is:

1. intentional: it should be a _deliberate_ part of a system's semantics, not implied or side-effects
2. meaningful: it can be specified _without needing to specify mechanism or implementation_
3. provable: it should be provable using the system's _publicly available interface_

In a perfect world, Semantic Claims should be warranted for all observable characteristics of a system. In reality, and particularly when applying Semantic Claims to existing implementations, systems may have observable characteristics that exist solely for implementation purposes; such characteristics do not warrant claims. Either way, going through the exercise of Semantic Claims can be valuable in uncovering ambiguities, implied characteristics, and other issues with encapsulation or responsibilities.

## Troubleshooting

Claims are only as good as their proofs, and vice-versa. Weak claims and proofs are ambiguous, unclear, or contradictory (within themselves or each other).

### Weak semantic claims

Claims should never include or reference [implementation details](#claims-specify-meaning). If claims are updated frequently, it can indicate leaks of implementation into the claims. Claims should be able to withstand refactors if system behavior does not change.

While unintentionally changing system behavior _should_ fail a proof, it is always important to concretely understand _why_ a proof failed. It might be a straightforward violation of the proof. It also could be that the claim ambiguous, and the change is actually a valid interpretation of what it states. Or, maybe it is a proof issue, where the proof is not specific enough in what it proves. In other words, always understand the root cause of a proof failure before deciding which action is the correct one to take.

More nefarious, however, is proofs _not_ failing when they should, or the description of a proof not matching what it actually tests, which can allow implementations to drift from claims without notice.

### Other issues

If implementation updates are consistently driving claim or proof changes, while it may be an indicator of weak claims or proofs, it may also indicate:

- **workflow issues**: the implementation was approached without reading and understanding the claims first, or there was an _intentional_ change to existing semantics in the wrong order, as [claims should always be updated first, proofs second, and implementation last](#adjusting-semantics)
- **implementation issues**: the claims are correct, but not provable without relying on internal details

## Adjusting semantics

Adjustments to a system's semantics should always be done with care and intention. When it has been decided that semantics must be updated, the correct order to follow is:

1. adjust claims _before_ touching any code
2. adjust the proofs accordingly; they should _fail_ if a core semantic has truly changed
3. adjust the implementation to make the proof pass

This is TDD, with the difference that adjustments to claims come first to drive the proof tests. Regardless, the implementation comes last, and should flip the proof from red to green.

### Existing software

Semantic claims can be added to existing software, though it should be done incrementally. First, start by mapping out the systems where claims are the most obvious, then start to write claim docs, followed by proofs. This will help to delineate between intentional and unintentional behaviors and states that already exist in the implementation.

Requirements, protocols, user documentation, incident reports, and firsthand product or domain knowledge should be used as evidence of intended behavior. Those should be reconciled with code and tests, which should be treated skeptically as a record of _current_ behavior, but not necessarily _intentional_.
