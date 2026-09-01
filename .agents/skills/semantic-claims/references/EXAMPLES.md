# Semantic Claim Decision Examples

Use these examples to decide whether observable behavior warrants a Semantic Claim and, when it does, whether to write an invariant or scenario. Apply them with the criteria in [SEMANTICS.md](./SEMANTICS.md). The model does not prescribe what to do when no Semantic Claim is warranted.

The same observable behavior may warrant a claim in one product but not another. The deciding question is which behavior maintainers intend to guarantee, not what the current implementation happens to do.

## How to use these examples

For a candidate behavior, first ask:

1. Would removing it create a meaningful regression?
2. Is it observable outside the private mechanism that produces it?
3. Is it part of the subject's intended public behavior?
4. Can an executable proof observe it at the same level of abstraction?
5. Would a plain-language claim make the intended meaning clearer than tests alone?

If every answer is yes, the observable behavior probably warrants a Semantic Claim. A standing truth is an invariant; behavior whose meaning depends on an ordered sequence is a scenario. If an answer is no, do not add a Semantic Claim. The model does not prescribe what to do instead.

A useful tie-breaker is:

> Would a competent fresh implementer be reasonably likely to omit or alter this behavior without the claim, and would that constitute a real regression?

Use Semantic Claims for the smallest non-overlapping set of observable behaviors that need an explicit semantic description. The model does not prescribe practices for other concerns.

## Warranted invariants

### Rejected input preserves accepted state

**Context:** A collection accepts only records with unique identifiers. A rejected insertion must not disturb records already accepted.

**Classification**

- Semantic Claim warranted: yes
- Claim kind: invariant
- Subject: the collection
- Observable behavior: rejecting a duplicate leaves the collection's accepted contents unchanged
- Proof obligation: attempt a duplicate insertion and observe the public contents before and after rejection

**Candidate claim:**

> Rejected duplicates leave the collection unchanged.

This is a standing postcondition. A future implementation might validate after mutating, partially update an index, or replace the storage mechanism entirely. The private validation order is irrelevant; the unchanged public contents are the claimed semantics.

By contrast, “validation runs before insertion” is not a claim. It describes one mechanism, and an implementation can satisfy the invariant without retaining that order.

### Equal-ranked results retain arrival order

**Context:** Maintainers guarantee predictable ordering when multiple results have the same rank.

**Classification**

- Semantic Claim warranted: yes
- Claim kind: invariant
- Subject: ranked results
- Observable behavior: results with equal rank appear in the order they arrived
- Proof obligation: add equal-ranked results in multiple orders and observe their published order

**Candidate claim:**

> Equally ranked results retain their arrival order.

The ordering is observable, intentional, and meaningful to consumers. The proof cases may cover several ranks and insertion orders, but those cases prove one semantic rule rather than creating a separate claim for every example.

If no ordering guarantee exists for ties, the database's current return order does not create a claim. A test that fixes that incidental order would preserve an implementation accident.

### A protocol rejection uses a defined status

**Context:** Clients distinguish an expired credential from other authorization failures using a documented status code.

**Classification**

- Semantic Claim warranted: yes
- Claim kind: invariant
- Subject: authentication responses
- Observable behavior: an expired credential is rejected with the defined status
- Proof obligation: present an expired credential through the public protocol and observe the response status

**Candidate claim:**

> Expired credentials are rejected with status `401`.

Although the claim contains a technical token, that token is part of the observable protocol contract. This differs from naming the internal exception class or validation function, which clients cannot observe and implementations need not preserve.

## Warranted scenarios

### A retried operation does not repeat its effect

**Context:** A client may retry a payment request after losing the first response. Repeating the same request identity must not charge the customer twice.

**Classification**

- Semantic Claim warranted: yes
- Claim kind: scenario
- Subject: payment request processing
- Observable behavior: retrying an already accepted request returns its established outcome without creating another charge
- Proof obligation: accept a request, retry the same identity, and observe both the returned outcome and recorded charges

**Candidate claim:**

> After a payment request is accepted, retrying the same request returns its established outcome without creating another charge.

The order is essential: the meaning depends on an accepted request existing before the retry. This is more than a general assertion that request identifiers are unique.

The number of internal delivery attempts is a separate concern. Unless maintainers guarantee that number to callers, it does not warrant a Semantic Claim.

### Newer work supersedes an older completion

**Context:** Two searches can be in progress simultaneously, and the older one may finish last.

**Classification**

- Semantic Claim warranted: yes
- Claim kind: scenario
- Subject: published search results
- Observable behavior: an older completion cannot replace results for a newer search
- Proof obligation: start two searches, complete the older one last, and observe the published result

**Candidate claim:**

> After a newer search begins, completing an older search leaves the latest result unchanged.

The proof must control the meaningful order rather than merely wait for real network timing. A debounce interval, promise implementation, or cancellation mechanism may change without redefining the scenario.

### Closing a modal restores the user's place

**Context:** Opening a modal moves keyboard focus into it. When the modal closes, keyboard users must be able to continue from the control that opened it.

**Classification**

- Semantic Claim warranted: yes
- Claim kind: scenario
- Subject: modal focus behavior
- Observable behavior: closing the modal restores focus to its invoking control
- Proof obligation: focus the invoking control, open and close the modal, and observe the active element

**Candidate claim:**

> When a modal closes, focus returns to the control that opened it.

This behavior matters to an observable user workflow. The focus-trap library, stored element reference, and event-handler arrangement are implementation details.

### Failed checkout compensation is cross-cutting

**Context:** A checkout coordinates separate payment authorization and order persistence subjects. Payment authorization defines how funds are reserved and released. Order persistence defines whether an order is durably recorded. The observable outcome when authorization succeeds but persistence fails cannot be stated about either local subject alone.

**Classification**

- Semantic Claim warranted: yes
- Claim kind: scenario
- Placement: cross-cutting (`--`)
- Subject: checkout compensation across payment authorization and order persistence
- Observable behavior: checkout releases an authorization before reporting failure when the order cannot be persisted
- Proof obligation: authorize payment, make order persistence fail, and observe that release occurs before checkout reports failure

At the narrowest common boundary of the two subjects, the claim document might be named `--checkout-compensation.scenarios.md`:

```md
# Checkout Compensation Scenarios

Checkout compensation preserves the customer's payment state when an authorized checkout cannot create its order.

## §1 Persistence failure

### §1.1 Failed order persistence releases payment before checkout reports failure

After payment authorization succeeds, if order persistence fails, the authorization is released before checkout reports failure.
```

The proof controls authorization success and persistence failure, records the externally observable release and checkout result, and establishes that release precedes the reported failure. It does not require a particular transaction library, message transport, retry loop, or service topology.

This is a scenario because the authorization, persistence failure, release, and reported outcome have a meaningful order. It is cross-cutting because the compensation rule belongs to their interaction. Local payment claims may define what releasing an authorization means, and local order claims may define what failed persistence preserves, but neither should repeat this end-to-end rule.

## Concerns that do not warrant claims

### A package exports its entry points

**Context:** A build test imports each configured package entry to catch packaging mistakes.

**Classification**

- Semantic Claim warranted: no
- Subject: package assembly
- Observable behavior: configured entry points can be imported

The existing test may verify only that packaging agrees with configuration. Unless a particular entry point is part of the intended public interface and its behavior needs a claim, maintainers gain little by repeating the export list as claims. How maintainers check package assembly is outside Semantic Claims.

The user-visible capability reached through an entry point may warrant a claim. “The package exports `./search`” and “search results never publish stale work” answer different questions.

### A private cache invalidates on mutation

**Context:** An implementation caches a derived value and invalidates the cache when its private data changes.

**Classification**

- Semantic Claim warranted: no
- Subject: the cache implementation
- Observable behavior: none beyond the already claimed public result

If the public result is already claimed to reflect current data, cache invalidation is one way to satisfy that claim. A separate cache claim would couple semantic meaning to an optimization.

If callers can actually observe stale data for a documented period, that freshness policy—not the cache mechanism—may warrant its own invariant or scenario.

## Proof cases without additional claims

### Several examples exercise one boundary rule

**Context:** A range proof checks its lower endpoint, upper endpoint, interior values, and values outside the range.

**Classification**

- Semantic Claim warranted: yes, for the boundary rule
- Claim kind: one invariant with multiple proof cases
- Subject: the range
- Observable behavior: both endpoints belong to the range
- Proof obligation: exercise both endpoints and representative non-endpoint values as needed

The proof may be table-driven and contain many cases. Test-case count does not determine claim count. Add a separate claim only when a case expresses another independently meaningful rule.

## Project decisions outside Semantic Claims

### The service uses a particular storage system

**Context:** Maintainers use an architecture document to record that a service uses PostgreSQL and why they chose it.

**Classification**

- Semantic Claim warranted: no
- Subject: service architecture
- Observable behavior: none necessarily

The decision may be important for maintainers, deployment, or operations without being observable behavior the implementation must preserve. It therefore does not warrant a Semantic Claim; how maintainers record the decision is outside this method.

If maintainers guarantee compatibility with PostgreSQL clients, transaction semantics, or a published query interface, state and prove that observable behavior rather than claiming the hidden technology choice.

## Changes that do not create new claims

### A helper is renamed during a refactor

**Context:** A private helper receives a clearer name while all observable behavior remains unchanged.

**Classification**

- Semantic Claim warranted: no
- Subject: private implementation organization
- Observable behavior: none

The code change does not create new semantic meaning. Existing proofs should continue to establish the subject's behavior.

### Equivalent algorithms replace one another

**Context:** A linear search is replaced by an index while results and their promised ordering remain unchanged.

**Classification**

- Semantic Claim warranted: no new claim
- Subject: lookup implementation
- Observable behavior: unchanged

The implementation may change freely beneath existing claims. The chosen algorithm does not become observable semantics merely because performance motivated the refactor.

## Borderline behavior

### A retry limit is configurable

**Context:** Operators can set a maximum retry count, and the current deployment uses three attempts.

**Classification**

- Semantic Claim warranted: maybe for configurability; no for the current configured value
- Claim kind, if warranted: invariant
- Subject: retry configuration
- Observable behavior: depends on whether operators are promised control of the limit
- Proof obligation, if warranted: set the retry limit and observe that the resulting attempts do not exceed it

“This deployment retries three times” does not by itself warrant a claim. “The configured retry limit bounds the number of attempts” may warrant an invariant if operator control is an intentional, stable observable interface.

### Exact error wording

Exact wording warrants a claim when another participant relies on it as a supported interface—for example, a command-line message parsed by external automation or legally required user-facing text. The literal wording is then part of the intended observable behavior.

When wording is merely today's copy, it does not warrant a claim. Prefer claiming the semantic distinction—such as which input is rejected and what state remains—over freezing prose accidentally.

### Serialized field order

Field order warrants a claim when it affects a canonical representation, signature, byte-for-byte protocol, or another consumer-visible contract. A proof should observe that representation through the public serialization boundary.

When consumers treat fields as unordered and the current order comes from object construction, the order does not warrant a claim.

### Performance thresholds

A performance threshold may warrant a claim when it is a genuine user-facing or protocol-level promise and can be proved deterministically at the same abstraction level. The claim should state the observable service level, not the internal optimization used to meet it.

Exploratory goals, comparative improvements, and environment-sensitive measurements do not warrant Semantic Claims merely because they can be measured. A benchmark failure alone does not automatically establish a semantic regression.

### Log messages

A log message warrants a claim when it is a supported machine-consumed event or an operational contract on which another system depends. In that case, claim the event's observable schema and conditions.

Diagnostic wording intended only for maintainers does not ordinarily warrant a claim. Incidental punctuation and phrasing should not become semantic commitments through snapshot tests alone.

## Review questions

When claim decisions differ, reviewers can make the disagreement concrete:

- Who observes this behavior?
- What user, client, operator, or protocol outcome changes if it disappears?
- Is that outcome intentional or merely present today?
- Would an implementation using a different mechanism still need to preserve it?
- Can the proof observe the behavior without inspecting private state?
- Does another claim already preserve the same meaning?
- Would the intent remain clear without a claim?

Do not maximize claim coverage. Specify every warranted observable behavior with the smallest coherent set of non-overlapping claims.
