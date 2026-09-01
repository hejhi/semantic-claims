# Semantic Claims Model

The Semantic Claims Model is a way to specify a **subject's semantics** as **observable behavior** that can be **proven with tests**.

## The model

- A [subject](./SUBJECTS.md) has semantics expressed as observable behavior.
- A claim is a plain-language statement of those semantics as observable behavior, taking the shape of either an [invariant](./INVARIANTS.md) or [scenario](./SCENARIOS.md).
- A proof is an executable test of that behavior.

The **implementation** of a subject must satisfy the claim and pass the proof.

The sequence is:

```text
claim -> proof -> implementation
```

This resembles TDD: claims first, followed by failing proofs, followed by implementations that make them pass.

## Claims

A Semantic Claim specifies one distinct semantic truth about one coherent subject. Every claim has one or more executable proofs (as tests).

Claims use the subject's ordinary language and describe behavior **without prescribing API or implementation details**. Exact tokens such as status codes, event names, or protocol fields appear _only_ when they should be part of the semantics.

A subject's **observable behaviors** are described in claim documents, which can be:

- **invariants**: individual behavioral laws that should remain constant
- **scenarios**: behaviors whose meaning depends on ordered events

A subject can have both, either, or none at all; sometimes observable behavior is not really semantic in nature, and that's fine too.

See [INVARIANTS.md](./INVARIANTS.md) and [SCENARIOS.md](./SCENARIOS.md) for their respective authoring guidance.

## Deciding whether a Semantic Claim is warranted

Observable behavior is not automatically semantic. An implementation may expose behavior that is incidental or temporary.

A behavior warrants a Semantic Claim when:

- it expresses the intended semantics of a coherent subject rather than API ceremony or implementation detail;
- changing or removing it would be a meaningful semantic change to the subject;
- an executable test can prove it at the _same_ semantic level;
- it states distinct meaning that is not already specified by another claim.

If a candidate doesn't meet these criteria, then it ain't a semantic claim.

## Claim documents

Each Markdown claim document is stored beside its implementation and proofs for its subject:

- `name.invariants.md`
- `name.scenarios.md`
- `--name.invariants.md`
- `--name.scenarios.md`

`name` identifies the narrowest coherent subject.

A name beginning with `--` identifies a cross-cutting claim document. Its claims specify behavior that belongs to an interaction among multiple subjects and can't be stated about any one of them alone. The interaction is the subject of each claim. The document belongs at the subjects' narrowest common boundary and shouldn't summarize or repeat local claims.

### Finding applicable claims

For work on one subject:

- begin with claim documents beside it
- inspect ancestor directories up to the repository boundary for `--name` claim documents that may constrain it

For work involving subjects in different directories, read the local claims for each subject and inspect their narrowest common directory and ancestors for cross-cutting claims.

Treat the documents found this way as candidate context. Read the subject named in each document and keep only the claims relevant to the work.

## Claim structure

Each claim document uses:

- `## §N` for a section;
- `### §N.M` for a claim.

Every section and claim has a unique identifier and a nonempty title. Each claim belongs to the section named by the first component of its identifier.

### Identifiers and order

Identifiers link claims, proofs, and references. They don't set reading order, priority, execution order, or dependencies. Read claims in document order; identifiers themselves may contain count gaps or appear out of numeric order, which is totally fine.

Give new claims any unused identifier within its section and place it where it reads naturally. If an identifier changes, update its proofs and references.

Claim checkers must accept unique, correctly parented identifiers regardless of numeric sequence or document position.

## Proofs

A proof is an executable test of the observable behavior specified by a claim. It observes the subject at the same semantic/abstraction level as the claim and should fail when the implementation no longer realizes those semantics.

A proof may use an API to reach and observe the subject, but its call sequence and setup do not become semantics merely because the test contains them. Proofs shouldn't depend on private implementation details.

One claim may have multiple proofs or proof cases. Test-case count does not determine claim count, and not all tests need to be proofs—you can have proofs, but also have your own unit, integration, component, etc tests; these don't replace those.

## Implementations

The implementation must satisfy all claims and proofs. Its code, structure, and API can change as long as the same observable behavior remains.

If a semantics change is intentional, the claim should be updated first, followed by its failing proof, and then finally the implementation updated to make the proof pass (like TDD). All three can then be reviewed together as one semantic change and unit of work.

## Proof conventions

No specific programming language, test framework, or test-file syntax is required. For each project, maintainers decide:

- which test files contain proofs;
- how a proof refers to the section and claim it proves;
- how missing, unknown, disabled, or ambiguous links are detected;
- how those tests are run and their results reported.

Regardless of those conventions, the same relationships must hold:

- Every declared claim has at least one executable proof.
- Every proof includes an unambiguous reference to the claim it proves.
- A proof is associated with the same subject and section as its claim.
- Disabled, skipped, or pending tests do not prove a claim.
- Multiple executable tests may prove one claim.
- Missing, unknown, and ambiguous relationships between claims and proofs are detectable.

Projects may add file-naming or test-structure rules so a checker can verify these relationships.

[JAVASCRIPT.md](./JAVASCRIPT.md) contains the JavaScript and TypeScript conventions, and the npm package includes a checker for them.

## Authoring workflow

When adding or changing semantics:

1. decompose work into subjects that need distinct semantics
2. review local and cross-cutting claims that already apply.
3. express the semantics as observable behavior and decide whether a Semantic Claim is warranted.
4. If warranted, choose an invariant or scenario and write the smallest non-overlapping claim set.
5. Write or update the executable proofs following the project's claim-and-proof conventions.
6. Implement the behavior.
7. Run any claim checker, the proofs, and relevant project checks.
8. Review the claims, proofs, and implementation together.

Changing implementation alone doesn't mean semantics changed—claims only need to be updated when the semantics themselves change.

Finally, if possible, don't infer claims from an implementation, or weaken a claim merely to match a proof or implementation.
