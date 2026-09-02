# Examples

These examples cover the decisions required by the Semantic Claims Model. They are exhaustive with respect to the decision process, not the kinds of software behavior that may be claimed.

Each classification assumes the stated intent. The same current behavior may warrant a claim in one system and remain unclaimed in another because maintainers intend different semantic contracts.

Warranted examples include the complete Markdown claim document. Proof obligations remain independent of any language or test framework; [JAVASCRIPT.md](./JAVASCRIPT.md) shows how JavaScript and TypeScript projects link these documents to executable proofs.

## Warranted claims

### A boundary rule is an invariant

**Context:** A range includes both endpoints.

- **Observer:** caller querying membership
- **Kind:** invariant

`range.invariants.md`:

```md
# Range

## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

**Proof obligation:** Construct ranges with different endpoints and observe that each endpoint is included.

The result is intended, observable, meaningful, independently stated, provable, and distinct. Test setup has an order, but changing that order does not change the rule.

### A postcondition is an invariant

**Context:** A collection rejects records whose identifiers are already present.

- **Observer:** caller reading the collection after rejection
- **Kind:** invariant

`collection.invariants.md`:

```md
# Collection

## §1 Duplicate rejection

### §1.1 Rejected duplicates leave the collection unchanged

Rejecting a record whose identifier is already present leaves the accepted contents unchanged.
```

**Proof obligation:** Record the accepted contents, attempt a duplicate insertion, and observe the same contents afterward.

The attempted insertion precedes the observation, but relative order among competing events is not part of the semantics. “Validation runs before insertion” would describe one private mechanism, not this invariant.

### An exact protocol value can be an invariant

**Context:** Clients distinguish expired credentials through a documented response status.

- **Observer:** protocol client
- **Kind:** invariant

`authentication-responses.invariants.md`:

```md
# Authentication responses

## §1 Expired credentials

### §1.1 Expired credentials are rejected with status `401`

An expired credential receives status `401`.
```

**Proof obligation:** Submit an expired credential and observe status `401` at the protocol boundary.

The exact token belongs in the claim because clients are meant to rely on it. An internal exception class does not.

### Superseding work is a scenario

**Context:** Two searches may overlap, and the older search may finish last.

- **Observer:** result consumer
- **Kind:** scenario

`published-search-results.scenarios.md`:

```md
# Published search results

## §1 Search precedence

### §1.1 Newer searches supersede older results

After a newer search begins, completing an older search leaves the latest result unchanged.
```

**Proof obligation:** Start two searches, control both completion orders, and observe that the older completion never replaces the newer result.

Start and completion order determine the expected result. Real network timing, cancellation, and promise handling are implementation details.

### Arrival-order precedence is a scenario

**Context:** Equally ranked results must retain the order in which they arrive.

- **Observer:** result consumer
- **Kind:** scenario

`published-ranked-results.scenarios.md`:

```md
# Published ranked results

## §1 Equal-rank order

### §1.1 Equal-ranked results retain arrival order

When equally ranked results arrive in sequence, they are published in that order.
```

**Proof obligation:** Supply equal-ranked results in different arrival orders and observe the corresponding published order.

This is a scenario, not an invariant, because reversing the meaningful event order reverses the required output.

### A repeated effect is a scenario

**Context:** A client retries a payment request after losing the first response.

- **Observer:** client and account holder
- **Kind:** scenario

`payment-request-processing.scenarios.md`:

```md
# Payment request processing

## §1 Repeated requests

### §1.1 An accepted request establishes the outcome of its retries

After a payment request is accepted, retrying the same request returns its established outcome without creating another charge.
```

**Proof obligation:** Accept a request, retry the same request identity, and observe one charge and the established outcome.

The retry has meaning only after the first request has been accepted. Internal delivery-attempt count is not part of this claim.

### Compensation can be cross-cutting

**Context:** Checkout coordinates payment authorization and order persistence. Authorization succeeds, but order persistence fails.

- **Observer:** checkout caller and payment client
- **Kind:** scenario
- **Placement:** cross-cutting

`--checkout-compensation.scenarios.md`:

```md
# Checkout compensation

## §1 Persistence failure

### §1.1 Failed persistence releases payment before checkout reports failure

After payment authorization succeeds, if order persistence fails, the authorization is released before checkout reports failure.
```

**Proof obligation:** Control authorization success and persistence failure, then observe that release precedes the reported checkout failure.

Neither payment authorization nor order persistence has this complete behavior alone. The interaction is the subject, so the claim belongs in `--checkout-compensation.scenarios.md` at the closest directory containing both local subjects. Local claims must not repeat this rule.

## Behaviors that do not warrant claims

Each example below fails at least one [claim criterion](./CLAIMS.md#deciding-whether-a-claim-is-warranted). Concerns outside this boundary remain outside Semantic Claims.

### Intended semantics are unresolved

**Candidate:** The current serializer emits fields alphabetically.

The order is observable, but repository evidence does not establish whether consumers may rely on it. No claim is warranted until a maintainer decides. If signatures require canonical alphabetical order, that accepted requirement may warrant an invariant.

### No supported observer can distinguish the mechanism

**Candidate:** A private cache is cleared whenever source data changes.

Cache invalidation is not observable outside the private mechanism. A freshness guarantee at the subject's supported boundary may warrant a claim; the cache operation does not.

### No meaningful outcome depends on the detail

**Candidate:** A diagnostic message currently ends with a period.

The punctuation is visible, but no supported consumer relies on it. It does not warrant a claim. If automation parses the exact message or law requires exact wording, the accepted text becomes part of the semantic contract.

### The statement prescribes implementation

**Candidate:** Validation runs before insertion.

The statement fixes private control flow. The observable postcondition—for example, “Rejected duplicates leave the collection unchanged”—may warrant a claim independently of validation order.

**Candidate:** The service stores records in PostgreSQL.

The storage choice is architecture, not necessarily observable behavior. A supported PostgreSQL protocol, transaction behavior, or compatibility promise may warrant a claim at its observable boundary.

### The outcome is not falsifiable

**Candidate:** Search results appear quickly.

“Quickly” does not identify a testable outcome. A defined latency threshold under a defined environment may warrant a claim if maintainers intend it as a service promise.

### Another claim already specifies the behavior

**Existing claim:** Both endpoints belong to the range.

**Candidate:** The lower endpoint belongs to the range.

The candidate repeats behavior already required by the stronger claim. It may be another proof case, but it is not a distinct claim.

## Choosing invariant or scenario

The number of test steps does not determine claim kind. Relative event order does.

| Behavior | Kind | Reason |
| --- | --- | --- |
| Rejected input leaves accepted state unchanged. | Invariant | Rejection establishes a postcondition; no competing event order changes its meaning. |
| The configured retry limit bounds total attempts. | Invariant | The bound holds whenever that configuration applies. |
| Equal-ranked results retain arrival order. | Scenario | Reversing arrival order reverses the required result. |
| An older completion cannot replace a newer search result. | Scenario | Start and completion order determine the required result. |
| Closing a modal returns focus to its invoking control. | Scenario | The required outcome depends on focus, opening, and closing in that order. |

Temporal words alone do not make a scenario. “After rejection, accepted state is unchanged” can still express an invariant when event order is only test setup. Conversely, a standing policy may require a scenario when its meaning depends on which event occurred first.

## Choosing the subject and placement

### Use the narrowest accurate subject

**Behavior:** An unread indicator becomes visible when unread notifications exist.

- `Notification icon` is accurate if only the icon makes this promise.
- `Navigation menu` is too broad if its other elements are irrelevant.
- `Notification state store` is inaccurate if it names the private mechanism rather than the observed indicator.

### Use a local claim when one subject has the complete behavior

“Expired credentials are rejected with status `401`” belongs to authentication responses. Other components may help produce the response, but the complete observable behavior can be stated about that one subject.

### Use a cross-cutting claim only for interaction behavior

“Failed order persistence releases payment before checkout reports failure” cannot be stated completely about payment authorization or order persistence alone. Checkout compensation is the interaction subject.

A cross-cutting document must not summarize local payment and order claims. If it merely restates their local outcomes without specifying additional interaction behavior, it overlaps and should remain local.

## Choosing claim and proof boundaries

### One claim may need several proof cases

“Both endpoints belong to the range” may be proved with lower-endpoint and upper-endpoint cases across representative ranges. Those cases establish one boundary rule.

### One subject may need several claims

A retry controller may separately promise:

- The configured limit bounds total attempts.
- After an operation succeeds, a later operation begins with the initial retry delay.

The limit and reset behavior can be understood and changed independently, so they are separate claims even if one test fixture exercises both.

### One proof identifies one claim

A test may share setup with tests for other claims, but each executable proof identifies one claim and asserts that claim's behavior. Shared setup does not merge the claims.

### Implementation structure does not determine claim count

Several files may realize one claim, and one file may help realize several claims. Claims are split by distinct observable semantics, not by functions, files, branches, or test cases.

### A passing test may still fail to prove its claim

For stale search results, a test that asserts only that both requests complete does not prove precedence. The proof must control the meaningful completion order and observe which result remains published. A failure caused by setup, syntax, or an unrelated exception also does not demonstrate the claimed distinction.

## Scope and completeness

Suppose a change concerns published search results and maintainers identify two warranted behaviors in that scope: newer searches take precedence, and cancelled searches never publish. Both belong in the scoped claim set.

That claim set does not establish that every semantic behavior of search, cancellation, or the larger application has been discovered. Unclaimed behavior remains unspecified through this model rather than implicitly safe to change.

## Technical details at the semantic boundary

Technical details warrant claims only when an observer is meant to rely on them.

| Detail | Warranted example | Unwarranted example |
| --- | --- | --- |
| Package entry point | Consumers are promised `./search` as a supported import path. | A build test merely checks that package output matches configuration. |
| Error wording | Automation parses an exact message, or required user-facing text must match exactly. | The wording is editable diagnostic copy. |
| Serialized field order | Order defines a signature, canonical representation, or byte protocol. | Consumers treat fields as unordered and current order is incidental. |
| Performance threshold | A defined service level is promised and can be tested under defined conditions. | A benchmark records an exploratory goal or environment-sensitive comparison. |
| Log event | Another system consumes a documented event schema and condition. | Maintainers read free-form diagnostic text. |
| API or protocol token | Callers rely on a documented status, header, field, event, or sentinel. | The token names a private helper, exception, or event with no supported observer. |

## Existing systems and changes

### Current behavior is evidence, not intent

If implementation and tests both alphabetize serialized fields but no requirement establishes the order, the behavior remains unresolved. A maintainer decides whether to preserve, change, or remove it before a claim is written.

### A bug report does not define the correction

“The old search result replaced the new one” identifies an observed failure. Maintainers must still decide whether older work is blocked as soon as newer work starts or only after newer work completes. Each decision produces a different scenario.

### A refactor does not create a claim

Replacing linear search with an index creates no claim when results and every promised ordering rule remain unchanged. Existing claims remain in force; proofs may change only to observe the same behavior through the new implementation.

### New semantics require a claim first

If maintainers add a promise that cancelled work can never publish, that accepted behavior is evaluated independently, written as a claim, proved, and then implemented.

## Complete decision sequence

For each candidate behavior:

1. Name the narrowest subject to which the complete behavior applies.
2. Identify the observer and supported observation boundary.
3. Determine whether a maintainer has accepted the behavior as intended semantics.
4. Determine whether changing it would meaningfully change an outcome the observer may rely on.
5. Remove private implementation and unsupported interface details from the statement.
6. Confirm that an executable proof can distinguish satisfaction from violation at the same boundary.
7. Check that no existing claim specifies the same outcome under the same conditions.
8. Classify the claim as an invariant or scenario according to whether relative event order is semantic.
9. Place it locally when one subject has the complete behavior; use `--` only when the interaction among several subjects is itself the subject.
10. Split claims by independently meaningful behavior and proof cases by the evidence needed to establish each claim.

A candidate is not ready to become a claim while its observer, intended status, meaningful outcome, implementation-independent wording, proof obligation, or distinctness remains unresolved.
