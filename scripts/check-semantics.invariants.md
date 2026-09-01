# Semantic Claim Checker Invariants

The semantic claim checker determines whether named invariant and scenario claim documents satisfy the repository's claim-and-proof pairing rules.

## §1 Validation scope

### §1.1 Supported kind selections determine validation scope

With no kind selected, the checker validates both invariants and scenarios. Selecting one supported kind limits validation to that kind, while selecting both validates both. An invocation containing any unsupported argument is rejected and does not report validation as completed for any recognized arguments.

### §1.2 Every named claim document and proof has its counterpart

Validation fails when a recognized claim document or proof file lacks the same-name counterpart required for its claim kind.

### §1.3 TypeScript tests and JavaScript modules are equivalent proof formats

Each claim document pairs with exactly one `.test.ts`, `.test.mjs`, or `.test.js` proof file. Every format is validated by the same rules, while providing multiple formats for one claim document fails as ambiguous.

### §1.4 Validation covers recognized files throughout the project tree

Recognized claim documents and proofs beneath the working directory are included unless they belong to hidden, dependency, build-output, or coverage directories.

## §2 Claim document structure

### §2.1 Every claim document declares a complete identifier hierarchy

A claim document contains at least one uniquely identified, nonempty-titled section and at least one uniquely identified, nonempty-titled claim. Every claim identifier names a section declared by that claim document.

### §2.2 Every proof reproduces the declared structure and titles

Every `describe`, `it`, and `test` call in a proof is identified. Its identifier is declared by the paired claim document, every claim proof is nested beneath its matching section, and section and claim titles match the claim document exactly after structural syntax is excluded.

## §3 Proof coverage

### §3.1 Every declared section has proof coverage

Each section in a claim document has exactly one matching `describe` section in its proof file.

### §3.2 Every claim has at least one executable proof

Each claim has one or more matching executable tests. Additional tests may prove the same claim, but skipped and pending tests do not provide proof.

## §4 Validation results

### §4.1 Failure output includes every detected semantic mismatch

A failed check reports every discovered mismatch with the affected file and enough semantic context to locate the violated pairing rule.

### §4.2 Success output includes the number of checked pairs

A successful check reports how many named claim-document-and-proof pairs were validated for each checked claim kind.

### §4.3 The checker process succeeds only when selected validation passes

The checker process exits with status `0` when every selected validation passes and with a nonzero status when validation finds a semantic mismatch or the invocation is unsupported.
