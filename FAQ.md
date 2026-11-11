# Frequently Asked Questions

## Is the Semantic Claims Model the same as TDD?

The authoring order is the same: a statement of required behavior, then a test, then the implementation. The difference is that every proof test links to a claim, and the claim states the required behavior independently of any test.

Semantic Claims does not replace other tests. Tests that link to no claim are stored in other test files. Semantic Claims and TDD can be used together.

## Are claims just acceptance criteria?

No. Claims can be derived from acceptance criteria, and a claim can serve as an acceptance criterion.

The set of acceptance criteria can include design constraints, implementation constraints, and delivery requirements. A claim states only an intended behavior that a test can decide from finite runs.

Semantic Claims and acceptance criteria can be used together.
