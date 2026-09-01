# Invariant Claims

An invariant is a **constant, independent** observable behavior of a subject. It remains true across relevant operations and does not depend on one particular sequence of events.

Invariants cover behavior that can be stated as a stable rule, boundary, postcondition, validity condition, or algebraic law.

Invariant claim documents follow the shared [claim-document structure](./SEMANTICS.md#claim-structure) and [proof obligations](./SEMANTICS.md#proof-conventions).

## Example: Markdown form

```md
# Range Invariants

A range determines whether a value lies between two endpoints.

## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

The opening paragraph names the subject and its role. Sections group related claims. Each claim title is a complete, declarative statement.

## Proof obligation

The proof creates a range and observes through its public behavior that both endpoint values belong to it. It doesn't inspect how the endpoints are stored or require a particular call sequence beyond what is necessary to make the observation.

How that proof is represented and linked depends on the language and test framework. See the [JavaScript and TypeScript example](./JAVASCRIPT.md#invariant-example).

## Writing invariants

A strong invariant has:

- one observable truth;
- stable, familiar terms;
- meaning independent of the current implementation;
- a falsifiable outcome;
- enough information to implement the behavior without reading the current code.

Prefer the semantic statement over call ceremony or private mechanism:

- Write “Both endpoints belong to the range,” not “`includes()` returns true for the stored minimum and maximum.”
- Write “Rejected input leaves the collection unchanged,” not “The validation branch returns before mutating the backing array.”

Use backticks only when a literal token is part of the observable contract, such as an event name, status code, header name, or sentinel value.

## Deciding whether an invariant is warranted

After applying the shared [claim criteria](./SEMANTICS.md#deciding-whether-a-semantic-claim-is-warranted), a warranted observable behavior is an invariant when it is a standing truth independent of any particular event sequence.
