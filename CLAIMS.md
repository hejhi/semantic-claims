# Claims

A claim specifies a subject's semantics as observable behavior that can be proven with tests. Each claim states one distinct semantic truth about one coherent subject.

Claims use the subject's ordinary language without prescribing API or implementation details. Exact tokens such as status codes, event names, or protocol fields appear only when they are part of the semantics.

## Subjects

A subject is anything whose semantics can be expressed as observable behavior.

### The grammatical subject

A claim can be read like a sentence: a subject followed by a predicate. The subject names the thing whose semantics are being specified, and the predicate expresses those semantics as observable behavior:

```text
[The icon]                 [shows whether notifications are unread].
[Published search results] [give newer searches precedence].
[The claim explorer]       [lets maintainers filter claims by kind].
[Checkout compensation]    [releases payment before reporting failure].
```

The predicate describes the semantics without prescribing the API or implementation that realizes them. Different APIs and implementations can therefore satisfy the same claim.

### Subject boundaries

A subject can be as broad as a system or as narrow as an icon. Choose the narrowest thing that accurately has the observable behavior. Base the boundary on semantics rather than code structure.

### Naming a subject

Use a noun or noun phrase for the subject name. In “Published search results give newer searches precedence,” “published search results” is the subject and “give newer searches precedence” is the predicate; together they form the claim.

Use stable, ordinary language rather than the current private mechanism. “Published search results” is clearer than “promise callback,” and “the claim explorer” remains accurate after changing its menu, API, rendering strategy, or source files.

## Deciding whether a claim is warranted

Observable behavior is not automatically semantic. An implementation may expose behavior that is incidental or temporary.

A behavior warrants a claim when:

- it expresses the intended semantics of a coherent subject rather than API ceremony or implementation detail;
- changing or removing it would be a meaningful semantic change to the subject;
- an executable test can prove it at the same semantic level;
- it states distinct meaning that is not already specified by another claim.

If a candidate does not meet these criteria, it is not a Semantic Claim.

## Claim kinds

A claim is either an invariant or a scenario. A subject may have both, either, or neither.

### Invariants

An invariant is a constant, independent observable behavior of a subject. It remains true across relevant operations and does not depend on one particular sequence of events.

Invariants cover behavior that can be stated as a stable rule, boundary, postcondition, validity condition, or algebraic law.

A strong invariant has:

- one observable truth;
- stable, familiar terms;
- meaning independent of the current implementation;
- a falsifiable outcome;
- enough information to implement the behavior without reading the current code.

Prefer the semantic statement over call ceremony or private mechanism:

- Write “Both endpoints belong to the range,” not “`includes()` returns true for the stored minimum and maximum.”
- Write “Rejected input leaves the collection unchanged,” not “The validation branch returns before mutating the backing array.”

Use backticks only when a literal token is part of the observable behavior, such as an event name, status code, header name, or sentinel value.

#### Invariant example

```md
# Range

A range determines whether a value lies between two endpoints.

## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

Its proof creates a range and observes through its public behavior that both endpoint values belong to it. The proof does not inspect how the endpoints are stored or require a particular call sequence beyond what is necessary to make the observation.

After applying the shared [claim criteria](#deciding-whether-a-claim-is-warranted), a warranted observable behavior is an invariant when it is a standing truth independent of any particular event sequence.

### Scenarios

A scenario states observable behavior whose meaning depends on an ordered sequence of events.

Scenarios cover races, retries, cancellation, failure recovery, scheduling, disposal, and other interactions where changing the order changes the result.

A strong scenario has:

- one meaningful sequence;
- an event order that matters;
- an observable result;
- meaning independent of the current implementation;
- enough information to implement the behavior without reading the current code.

Use explicit temporal language such as “before,” “after,” “while,” “until,” and “once” when it clarifies the order. If a statement remains true outside the sequence, it is an invariant.

#### Scenario example

```md
# Published search results

Search results are published according to the order in which searches begin.

## §1 Search precedence

### §1.1 Newer searches supersede older results

After a newer search begins, completing an older search leaves the latest result unchanged.
```

Its proof starts an older search, starts a newer search, then controls their completion order and observes that the older completion cannot replace the newer result. The proof does not depend on real network timing or a particular cancellation mechanism.

After applying the shared [claim criteria](#deciding-whether-a-claim-is-warranted), a warranted observable behavior is a scenario when changing the event order can change the result and a deterministic proof can control that order and observe its outcome.

Proofs may use controlled clocks, promises, event logs, or test doubles to create the sequence. Those tools support the observation without becoming the subject of the claim.

## Claim documents

Each Markdown claim document is stored beside its subject's implementation and proofs:

- `name.invariants.md`
- `name.scenarios.md`
- `--name.invariants.md`
- `--name.scenarios.md`

`name` identifies the narrowest coherent subject. The claim kind in the filename applies to every claim in the document.

### Cross-cutting claims

A name beginning with `--` identifies a cross-cutting claim document. Its claims specify behavior that belongs to an interaction among multiple subjects and cannot be stated about any one of them alone. The interaction is the subject of each claim.

The document belongs at the subjects' narrowest common boundary. Its claims should not summarize or repeat local claims.

### Finding applicable claims

For work on one subject:

- begin with claim documents beside it;
- inspect ancestor directories up to the repository boundary for `--name` claim documents that may constrain it.

For work involving subjects in different directories, read the local claims for each subject and inspect their narrowest common directory and ancestors for cross-cutting claims.

Treat the documents found this way as candidate context. Read the subject named in each document and keep only the claims relevant to the work.

### Claim structure

Each claim document uses:

- `## §N` for a section;
- `### §N.M` for a claim.

Every section and claim has a unique identifier and a nonempty title. Each claim belongs to the section named by the first component of its identifier.

### Identifiers and order

Identifiers link claims, proofs, and references. They do not set reading order, priority, execution order, or dependencies. Read claims in document order; identifiers may contain count gaps or appear out of numeric order.

Give new claims any unused identifier within their section and place them where they read naturally. If an identifier changes, update its proofs and references.

Claim checkers must accept unique, correctly parented identifiers regardless of numeric sequence or document position.
