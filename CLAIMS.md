# Claims

A claim specifies a subject's semantics as observable behavior that can be proven with tests. One claim covers one distinct behavior of one coherent subject.

A claim document contains one or more claims about the same subject. Together, a subject's claims form its semantic contract.

## Subjects

A subject is anything whose semantics can be expressed as observable behavior.

### The grammatical subject

A claim can be read like a sentence: a subject followed by a predicate. The subject names the thing whose semantics are being specified, and the predicate expresses those semantics as observable behavior:

```text
[The icon]                 [shows whether notifications are unread].
[Published search results] [give newer searches precedence].
[The claim explorer]       [supports filtering claims by kind].
[Checkout compensation]    [releases payment before reporting failure].
```

The predicate describes the behavior without prescribing the API or implementation that realizes it. Different APIs and implementations can therefore satisfy the same claim.

### Subject boundaries

A subject can be as broad as a system or as narrow as an icon. The selected subject is the narrowest subject to which the complete claim applies.

Subject boundaries are based on semantics rather than code structure. A subject may correspond to one function, several modules, a user-facing component, a protocol, or an interaction among otherwise independent subjects.

### Naming a subject

A subject name is a noun or noun phrase in the subject's ordinary language. In “Published search results give newer searches precedence,” “published search results” is the subject and “give newer searches precedence” is the predicate.

The name identifies the behaviorally meaningful subject rather than its current private mechanism. “Published search results” remains accurate if a promise callback is replaced; “promise callback” does not.

## Observable behavior

Behavior is observable when a user, caller, operator, or another subject can distinguish its outcome through a supported boundary.

Observable does not necessarily mean globally public or exported. A behavior may be internal to a system while remaining observable to another subject within that system. Private state or control flow does not become observable merely because a test can inspect it.

An API name, event token, status code, field, or other technical detail belongs in a claim only when an observer is meant to rely on that exact detail. Otherwise, the claim describes the outcome independently of the interface used to observe it.

## Deciding whether a claim is warranted

Current behavior is not automatically intended semantics. It may be incidental, temporary, erroneous, or an implementation detail.

A behavior warrants a claim when all of the following are true:

- The behavior has been explicitly identified as part of the subject's intended semantics.
- An observer can distinguish the behavior through a supported boundary.
- Changing or removing the behavior would meaningfully change an outcome that the observer is meant to rely on.
- The behavior can be stated without depending on the current private implementation.
- An executable test can prove the behavior at the same observation boundary.
- No other claim already specifies the same required outcome under the same conditions.

Repository evidence can support this decision, but code, tests, documentation, and incidents do not determine intent by themselves. No claim is created or changed for unresolved behavior; its intended semantics must be explicitly decided first.

### Scope and completeness

For the subject and change being specified, a complete claim set includes every warranted observable behavior and is the smallest non-overlapping set that does so.

This authoring goal does not establish that every intended behavior has been discovered. An absent claim means only that the behavior has not been specified through this model; it does not mean that the behavior is unimportant or safe to change.

## Writing claims

A claim:

- states one independently meaningful behavior;
- identifies the conditions under which the behavior applies;
- states an outcome an observer can distinguish;
- uses stable, familiar terms from the subject;
- remains meaningful without the current test API or private implementation;
- is precise enough for an executable proof to distinguish satisfaction from violation.

Implementation details may appear only when they are themselves part of the observable semantic contract.

### Claim boundaries

Several proof cases may be necessary to establish one claim. Test-case count does not determine claim count.

Separate claims are required for independently meaningful behaviors that can be understood and changed separately. A weaker claim must not repeat behavior already specified by a stronger claim, and one semantic rule must not be split into claims for each example used to prove it.

## Claim kinds

Every claim is either an invariant or a scenario. The distinction depends on whether event order is part of the semantics, not on whether a test performs several steps.

A subject may have invariants, scenarios, both, or neither.

### Invariants

An invariant states an observable condition that holds whenever its stated conditions apply. Its meaning does not depend on one particular ordering of events.

Boundaries, postconditions, validity rules, and algebraic laws are commonly invariants. A test may perform operations to create the relevant condition; those setup steps do not make the claim a scenario when their relative order is not part of the claimed meaning.

For example:

```md
# Range

A range determines whether a value lies between two endpoints.

## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

The proof creates a range and observes that both endpoint values belong to it. The storage of those endpoints and the particular method used to query the range are not part of the claim.

### Scenarios

A scenario states the observable outcome of an ordered sequence of events. The relative order is part of the semantics: changing that order can change the expected outcome.

Races, retries, cancellation, failure recovery, scheduling, disposal, and lifecycle behavior commonly require scenarios. Temporal language such as “before,” “after,” “while,” “until,” and “once” identifies the meaningful order when applicable.

For example:

```md
# Published search results

Search results are published according to the order in which searches begin.

## §1 Search precedence

### §1.1 Newer searches supersede older results

After a newer search begins, completing an older search leaves the latest result unchanged.
```

The proof controls the start and completion order and observes that an older completion cannot replace the newer result. Real network timing and a particular cancellation mechanism are not part of the claim.

If the expected behavior can be stated without making relative event order meaningful, it is an invariant rather than a scenario.

## Claim documents

A local claim document contains claims of one kind about one subject. A subject may therefore have both of these documents:

```text
name.invariants.md
name.scenarios.md
```

`name` is a stable, file-safe name for the subject. Each document is stored beside the implementation and proofs for that subject.

### Cross-cutting claims

A cross-cutting claim specifies behavior that belongs to an interaction among multiple local subjects and cannot be stated accurately about any one of them alone. The interaction is itself the subject.

Cross-cutting claim documents use a `--` prefix:

```text
--name.invariants.md
--name.scenarios.md
```

A cross-cutting document is stored in the closest directory containing the files for all participating subjects. Its claims must specify distinct behavior at their interaction rather than summarize, combine, or repeat local claims.

### Finding applicable claims

Applicable claims for one local subject include the claim documents beside its files and any relevant cross-cutting claim documents in ancestor directories up to the repository boundary.

Applicable claims for subjects in different directories include each subject's local claims and any relevant cross-cutting claims in their closest shared directory and its ancestors.

Only claims whose subjects and behavior apply to the work are relevant context.

### Document structure

A claim document has four structural levels:

1. An `#` heading names the subject in ordinary language.
2. An optional introduction clarifies the subject's scope without adding separate semantic requirements.
3. Each `## §N Title` section, or claim set, groups related claims.
4. Each `### §N.M Title` heading begins one claim; the text beneath it states the claimed observable behavior.

A claim consists of its identifier, title, and statement. The title is a concise declarative summary. The statement supplies the conditions and observable outcome needed to interpret and prove it.

Only claim entries specify required behavior. Subject introductions and section headings provide context and organization; any independently meaningful requirement belongs in its own claim.

### Identifiers and order

Every section and claim identifier must be unique within its document. The first component of a claim identifier identifies its parent section: claim `§2.3` belongs to section `§2`.

Identifiers link claims, proofs, and references. They do not set reading order, priority, execution order, or dependencies. Claims are read in document order; identifiers may contain gaps or appear out of numeric order.

A new claim uses any unused identifier within its section and occupies a natural position in the document. Any identifier or title change requires corresponding updates to every proof and reference that uses it.

The [Semantic Claims Model](./SEMANTICS.md) defines proof requirements. Proof-file and linking conventions may vary by project; [JAVASCRIPT.md](./JAVASCRIPT.md) defines the conventions supported by the JavaScript and TypeScript checker.
