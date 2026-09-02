# JavaScript and TypeScript Conventions

These conventions define how the `semantic-claims` checker links Markdown claim documents to JavaScript and TypeScript proof files. They supplement the [Semantic Claims Model](./SEMANTICS.md).

The checker validates structural links, while the project's test runner executes the proofs.

## File pairing

Each claim document pairs with exactly one proof file in the same directory. The files share the same name through the claim kind:

| Claim document | Paired proof file |
| --- | --- |
| `name.invariants.md` | `name.invariants.test.ts`, `name.invariants.test.mjs`, or `name.invariants.test.js` |
| `name.scenarios.md` | `name.scenarios.test.ts`, `name.scenarios.test.mjs`, or `name.scenarios.test.js` |

`name` must contain at least one character. Exactly one supported proof extension may exist for a claim document; multiple matching proof files are ambiguous. A proof file without its matching claim document is also invalid.

Cross-cutting claim documents use the same pairing rule and retain their `--` prefix:

```text
--checkout-compensation.scenarios.md
--checkout-compensation.scenarios.test.ts
```

These conventions apply to ESM JavaScript and TypeScript projects. Supported proof-file extensions are `.test.ts`, `.test.mjs`, and `.test.js`.

## Claim document structure

A claim document follows the format defined in [CLAIMS.md](./CLAIMS.md#document-structure), including a subject heading and a statement for every claim.

For structural validation, the checker recognizes section and claim headings outside fenced code blocks:

```md
## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

Each document must contain:

- at least one `## §N Title` section with a nonempty title;
- at least one `### §N.M Title` claim with a nonempty title;
- a unique identifier for every section and claim;
- a declared section whose identifier matches the first component of each claim identifier.

For example, claim `§2.3` belongs to section `§2`.

## Proof structure

A proof repeats each section identifier and title in a `describe` call. Each claim identifier and title appears in an `it` or `test` call nested inside the matching `describe` call.

For `range.invariants.md`:

```md
# Range

## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

The paired `range.invariants.test.ts` contains:

```ts
describe('§1 Endpoint inclusion', () => {
  it('§1.1 Both endpoints belong to the range', () => {
    const range = createRange(2, 5);

    expect(range.includes(2)).toBe(true);
    expect(range.includes(5)).toBe(true);
  });
});
```

The checker applies these rules:

- Every `describe`, `it`, and `test` call in a named proof file must contain a recognized identifier and a nonempty title.
- Each section appears in exactly one `describe` call.
- Each claim appears in one or more executable `it` or `test` calls within its section.
- Repeated tests for one claim use the same identifier and title.
- Proof identifiers must exist in the paired claim document.
- Titles must match the paired Markdown headings exactly.

The structural separator between an identifier and title may be whitespace, `—`, `–`, `--`, `-`, or `:`. The separator is not part of the title and may differ between the claim document and proof.

Titles must be string literals or template literals without substitutions. Computed and interpolated titles cannot be linked. Calls marked with `.skip` or `.todo`, including calls inside a skipped or pending `describe`, do not count as executable proofs.

All `describe`, `it`, and `test` calls in a named proof file belong to its claim structure. Tests that do not prove claims belong in other test files.

## Validation scope

The validation command accepts zero, one, or both claim kinds:

```text
semantic-claims [invariants] [scenarios]
```

With no kind argument, both invariants and scenarios are checked. One kind argument limits validation to that kind. Both kinds may be supplied in either order. Any unsupported argument rejects the invocation before validation begins.

Validation starts at the current working directory and includes recognized files in its descendant directories. Directories whose names begin with `.` are skipped, as are `coverage`, `dist`, and `node_modules` directories.

A successful check exits with status `0` and reports the number of validated pairs for each selected kind. A structural mismatch or unsupported invocation produces a nonzero status.

## Validation boundary

The checker verifies file pairing, identifier hierarchy, title equality, proof nesting, and the presence of executable proof entries. It does not execute tests, inspect assertions, or decide whether a proof establishes its claim.

Complete verification therefore includes both commands:

```text
semantic-claims     -> validates claim-to-proof structure
project test runner -> executes proofs
```

Installation, package scripts, and supported runtimes are documented in the package README.
