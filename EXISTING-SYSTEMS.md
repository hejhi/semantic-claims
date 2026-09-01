# Semantic Claims in Existing Systems

An existing system already has observable behavior, but that doesn't make every behavior part of its intended semantics. Some behavior is intentional, some is incidental, and some is simply a result many smaller choices in the current implementation.

Adoption can happen incrementally. An existing system doesn't need a complete claim inventory before Semantic Claims become useful.

## Incremental adoption

The sequence is:

```text
scope -> evidence -> classification -> claim criteria -> claim -> proof -> implementation
```

### 1. Choose a scope

Adoption can begin with a single subject, change, or incident. Claims are especially useful where accidental semantic changes would be costly or difficult to reconstruct:

- public interfaces and external protocols;
- persisted data and compatibility boundaries;
- authorization, accounting, and irreversible effects;
- retries, cancellation, concurrency, scheduling, and lifecycle behavior;
- interactions among independent subjects;
- user or operator workflows involved in previous incidents;
- observable behavior known only through maintainer memory.

Internal utilities and private mechanisms can wait, unless they have independently important observable behavior.

### 2. Gather evidence

Evidence may come from:

- public contracts, protocols, and standards;
- requirements and acceptance criteria;
- design decisions and user documentation;
- compatibility commitments;
- regulatory or operational obligations;
- incidents and bug reports;
- established user or operator workflows;
- maintainers and domain experts;
- tests and implementation.

Code and tests are evidence of current behavior, but they aren't, by themselves, a _definition_ of intended behavior.

For instance, many tests are designed around testing an implementation so that it works a certain way, and can catch a regression. But that doesn't necessarily convey the semantics of what it's testing, or the intent of why it does what it does.

Any source may also be incomplete or wrong. A stale document may conflict with the implementation, a test may encode an accident, and users may depend on behavior that was never intended. When sources disagree, a maintainer or domain expert needs to decide the intended outcome.

The worst case scenario is encoding the _wrong_ semantics into claims and proofs, or making claims not about the semantics at all.

### 3. Classify the behavior

Relevant behavior falls into one of three categories.

#### Intended semantics

The behavior is intentional, observable, and understood well enough to evaluate against the [claim criteria](./SEMANTICS.md#deciding-whether-a-semantic-claim-is-warranted).

#### Unresolved behavior

The system behaves this way today, but whether that behavior is intended semantics is unclear. Code or tests may contain evidence of the behavior without establishing its intent.

The behavior should remain unclaimed until someone with enough context decides whether to keep, change, or remove it.

#### Implementation detail

The behavior describes how the system currently produces an outcome rather than the observable outcome itself. Private helper order, cache organization, data structures, internal call counts, and equivalent algorithms usually belong here.

An implementation detail doesn't warrant a Semantic Claim unless the detail is itself part of the intended observable behavior.

### 4. Write claims and proofs

Only intended semantics should warrant a Semantic Claim. Intended behavior that doesn't meet the claim criteria should remain outside the model.

Warranted behavior follows the ordinary sequence:

```text
claim -> proof -> implementation
```

The claim is written as an invariant or scenario, followed by its executable proofs and then the implementation. All three can then be reviewed as a single unit.

Over time, maintainers record explicit semantic context for more subjects. Untouched areas don't need claims until a change or deliberate review reaches them.

## What an absent claim means

The absence of a claim means only that the behavior hasn't been specified through the Semantic Claims Model. It doesn't mean the behavior is unimportant or safe to change.

Before changing an unclaimed subject, _someone_ should still understand its intended behavior and decide whether the change warrants a claim.

Claim coverage is not like line or branch coverage. A percentage can't show whether every important semantic decision has been identified.

## Common changes

### Refactors

If the semantics remain unchanged, the claims remain unchanged. Proofs may need to change so they can observe the same behavior through the new implementation. But as long as the proof still verifies the semantic claim, the claim remains as is.

Uncertain behavior may need to remain unchanged during a refactor, but that temporary constraint doesn't automatically make it a Semantic Claim.

### Bug fixes and incidents

A failing implementation or test doesn't define the correction. Maintainers determine the intended outcome from the reported problem, user impact, requirements, protocol, or a new design decision.

When the resolution establishes warranted observable behavior, the claim precedes its proof and the fix.

### New behavior in an existing subject

New behavior follows the ordinary authoring workflow. Nearby behavior doesn't need to be exhaustively specified unless it constrains the change or is necessary to understand the subject.

## Cross-cutting claims

A claim is cross-cutting when its observable behavior belongs to an interaction among multiple local subjects and cannot be stated accurately about any one of them alone.

The claim still has a subject: the interaction itself. Its claim document begins with `--` and sits at the subjects' closest shared boundary. It's not designed to summarize or repeat other claims.

## Example: an existing serializer

Suppose an implementation and its snapshot tests show that a serializer:

- emits all required protocol fields;
- orders fields alphabetically;
- uses a particular buffer implementation.

These observations don't determine which behaviors warrant claims.

If the protocol requires the fields, their presence may warrant invariants. If signatures or consumers depend on alphabetical field order, that order may also warrant an invariant. If the order merely follows the current map implementation, it remains unresolved. The buffer choice is an implementation detail.

The snapshot records all three behaviors, but a maintainer should decide which ones are intended semantics.

## When evidence isn't enough

Some questions can't be answered from repository evidence alone. In which case, they remain design questions until a maintainer or domain expert decides the intended behavior.

The [Elephant-Goldfish model](./ELEPHANT-GOLDFISH.md) is one way to develop that context and test whether the resulting design stands on its own. Once the behavior is understood, Semantic Claims can specify it.
