# Frequently Asked Questions

## Is the Semantic Claims Model the same as TDD?

The influences behind the Semantic Claims Model include TDD, invariants in code design, and Gherkin-style acceptance criteria, but the model isn't the same as any one of them. However, Semantic Claims and TDD work well together.

The workflow of Semantic Claims is already TDD-like:

```text
claim → failing proof → implementation
```

The distinction is what comes before the test. TDD uses tests to specify behavior before implementation. With Semantic Claims, a plain-language description of what a part of the system should do comes first—much like acceptance criteria—followed by tests as executable proofs of that behavior. This keeps the intended behavior independent of the test API and implementation.

When intended behavior is added or changed, the claim precedes its proof and implementation.

Additionally:

- One claim may require several proof cases.
- Ordinary tests do not all need claims.
- A cross-cutting claim may specify behavior that belongs to an interaction rather than one local subject.

The resulting workflow has an explicit decision about intended behavior before TDD:

```text
decide intended behavior → claim → proof → implementation
```

A useful test is whether the claim would remain meaningful after replacing the test API and implementation. If so, it records information that the test alone may not preserve. If it merely paraphrases test code, implementation, or APIs, it is ceremony.

## Are claims just acceptance criteria?

Claims can serve as acceptance criteria, but the terms aren't perfectly interchangeable.

The simplest distinction is that acceptance criteria define when a piece of work is acceptable. A Semantic Claim specifies part of a subject's intended observable behavior.

Acceptance criteria are usually attached to a feature, issue, or change and describe its required outcomes. The same work item may also include:

- design or implementation constraints
- delivery requirements
- one-time migration conditions
- manual verification steps

A Semantic Claim belongs to a subject rather than a work item. It includes _only_ observable behavior that can be proven with tests. Its executable proofs remain after the original work is complete.

For example:

> **Given** a modal was opened from a control,
>
> **When** the modal closes,
>
> **Then** focus returns to that control.

This could be both an acceptance criterion for a modal feature and a Semantic Claim about modal focus behavior.

By contrast:

```text
"Implement the modal using the existing focus-trap library."
```

That may be a valid implementation requirement for the work, but not a Semantic Claim because it prescribes implementation rather than observable behavior.

Acceptance criteria can therefore provide candidate claims, but only the portions that specify warranted observable behavior become claims. The rest remain requirements of the particular work. Semantic Claims and acceptance criteria are complementary, but not interchangeable.
