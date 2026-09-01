# Scenario Claims

A scenario states observable behavior whose meaning depends on an ordered sequence of events.

Scenarios cover races, retries, cancellation, failure recovery, scheduling, disposal, and other interactions where changing the order changes the result.

Scenario claim documents follow the shared [claim-document structure](./SEMANTICS.md#claim-structure) and [proof obligations](./SEMANTICS.md#proof-conventions).

## Example: Markdown form

```md
# Search Scenarios

Search results are published according to the order in which searches begin.

## §1 Search precedence

### §1.1 Newer searches supersede older results

After a newer search begins, completing an older search leaves the latest result unchanged.
```

A scenario claim should name both the meaningful order and the observable outcome.

## Proof obligation

The proof starts an older search, starts a newer search, then controls their completion order and observes that the older completion cannot replace the newer result. It doesn't depend on real network timing or a particular cancellation mechanism.

How that proof is represented and linked depends on the language and test framework. See the [JavaScript and TypeScript example](./JAVASCRIPT.md#scenario-example).

## Writing scenarios

A strong scenario has:

- one meaningful sequence;
- an event order that matters;
- an observable result;
- meaning independent of the current implementation;
- enough information to implement the behavior without reading the current code.

It should use explicit temporal language such as “before,” “after,” “while,” “until,” and “once” when it clarifies the order.

If a statement remains true outside the sequence, it is an invariant.

## Deciding whether a scenario is warranted

After applying the shared [claim criteria](./SEMANTICS.md#deciding-whether-a-semantic-claim-is-warranted), a warranted observable behavior is a scenario when changing the event order can change the result and a deterministic proof can control that order and observe its outcome.

Proofs may use controlled clocks, promises, event logs, or test doubles to create the sequence. Those tools should support the observation without becoming the subject of the claim.
