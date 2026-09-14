# Frequently Asked Questions

## Is the Semantic Claims Model the same as TDD?

You _could_ argue Semantic Claims is a style of test driven development, but really the tests are driven by and linked to claims. They're also a bit more structured in how they're written, and serve a very specific purpose. The authoring flow is similar though, in that you author claims first, then write proof tests, then write implementation. I suppose it'd be called claim driven development though, if anything, as the proofs are really there specifically to enforce the semantic contract established by claims.

Saying that, Semantic Claims doesn't seek to be a replacement for all tests; it serves a pretty narrow purpose. I think it's fair to say that Semantic Claims and TDD are complementary, though.

## Are claims just acceptance criteria?

Claims can serve as acceptance criteria or be inferred or derived from them, but they're not interchangeable.

Acceptance criteria is broader, while claims specify meaningful, observable behavior only. Acceptance criteria might include things like design or implementation constraints, delivery requirements, etc.

So, like TDD, Semantic Claims and acceptance criteria are complementary, but not the same.
