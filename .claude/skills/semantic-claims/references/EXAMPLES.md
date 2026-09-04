# Examples

These examples demonstrate representative decisions in the Semantic Claims Model. Each classification assumes the stated intent; the same current behavior may warrant a claim in one system and remain unclaimed in another.

Proof obligations are independent of any language or test framework. [JAVASCRIPT.md](./JAVASCRIPT.md) defines how JavaScript and TypeScript projects link claim documents to executable proofs.

## Warranted claims

### A boundary rule is an invariant

**Context:** A range includes both endpoints.

`range.invariants.md`:

```md
# Range

## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

**Proof obligation:** Construct ranges with different endpoints and observe that each endpoint is included.

Changing test setup order does not change this rule, so it is an invariant. The lower and upper endpoints are proof cases for one boundary rule, not separate claims.

### A repeated effect is a scenario

**Context:** A client retries a payment request after losing the first response.

`payment-request-processing.scenarios.md`:

```md
# Payment request processing

## §1 Repeated requests

### §1.1 An accepted request establishes the outcome of its retries

**Given** a payment request has been accepted,
**When** the client retries the same request,
**Then** it receives the established outcome without creating another charge.
```

**Proof obligation:** Accept a request, retry the same request identity, and observe one charge and the established outcome.

The retry has meaning only after the first request has been accepted, so this is a scenario. Internal delivery-attempt counts are implementation details.

### Compensation can be cross-cutting

**Context:** Checkout coordinates payment authorization and order persistence. Authorization succeeds, but order persistence fails.

`--checkout-compensation.scenarios.md`:

```md
# Checkout compensation

## §1 Persistence failure

### §1.1 Failed persistence releases payment before checkout reports failure

**Given** payment authorization has succeeded,
**When** order persistence fails,
**Then** the authorization is released before checkout reports failure.
```

**Proof obligation:** Control authorization success and persistence failure, then observe that release precedes the reported checkout failure.

Neither payment authorization nor order persistence has this complete behavior alone. The interaction is the subject, so the claim is cross-cutting and belongs at the closest directory containing both local subjects.

### An exact protocol value can be claimed

**Context:** Clients distinguish expired credentials through a documented response status.

`authentication-responses.invariants.md`:

```md
# Authentication responses

## §1 Expired credentials

### §1.1 Expired credentials are rejected with status `401`

An expired credential receives status `401`.
```

**Proof obligation:** Submit an expired credential and observe status `401` at the protocol boundary.

The exact status belongs in the claim because clients rely on it. A private exception class would not.

## Behaviors that do not warrant claims

### Intended semantics are unresolved

**Candidate:** The current serializer emits fields alphabetically.

The order is observable, but current behavior alone does not establish that consumers may rely on it. If signatures require canonical alphabetical order, that accepted requirement may warrant an invariant.

### The candidate describes a private mechanism

**Candidate:** A private cache is cleared whenever source data changes.

The cache operation is an implementation detail. A freshness guarantee at the subject's supported boundary may warrant a claim instead.

### No meaningful outcome depends on the detail

**Candidate:** A diagnostic message currently ends with a period.

The punctuation is visible, but no supported consumer relies on it. Exact wording may warrant a claim if automation parses it or an accepted requirement fixes the text.

### The outcome is not testable as written

**Candidate:** Search results appear quickly.

“Quickly” does not identify a testable outcome. A defined latency threshold under a defined environment may warrant a claim if it is an intended service promise.

### Another claim already specifies the behavior

**Existing claim:** Both endpoints belong to the range.

**Candidate:** The lower endpoint belongs to the range.

The candidate is a proof case for the existing boundary rule, not a distinct claim.

## Borderline comparisons

| Candidate | Decision |
| --- | --- |
| Validation runs before insertion. | Do not claim private control flow; claim the observable rejection outcome if warranted. |
| The service stores records in PostgreSQL. | Do not claim an architecture choice unless a supported protocol or compatibility promise makes it observable. |
| Equal-ranked results retain arrival order. | Scenario: reversing arrival order reverses the required result. |
| Rejected input leaves accepted state unchanged. | Invariant: rejection establishes a postcondition without competing event order. |
| Closing a modal returns focus to its invoking control. | Scenario: the result depends on focus, opening, and closing in that order. |
