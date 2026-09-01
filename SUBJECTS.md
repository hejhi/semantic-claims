# Subjects

A subject is anything whose semantics can be expressed as observable behavior.

## The grammatical subject

A claim can be read like a sentence: a subject followed by a predicate. The subject names the thing whose semantics are being specified, and the predicate expresses those semantics as observable behavior:

```text
[The icon]                 [shows whether notifications are unread].
[Published search results] [give newer searches precedence].
[The claim explorer]       [lets maintainers filter claims by kind].
[Checkout compensation]    [releases payment before reporting failure].
```

The predicate describes the semantics **without prescribing the API or implementation that realizes them**. Different APIs and implementations can therefore satisfy the same claim.

## Subject boundaries

A subject can be as broad as a system or as narrow as an icon. Choose the narrowest thing that accurately has the observable behavior. Base the boundary on semantics rather than code structure.

## Naming a subject

Use a noun or noun phrase for the subject name. In “Published search results give newer searches precedence,” “published search results” is the subject and “give newer searches precedence” is the predicate; together they form the claim.

Use stable, ordinary language rather than the current private mechanism. “Published search results” is clearer than “promise callback,” and “the claim explorer” is still accurate after changing its menu, API, rendering strategy, or source files.
