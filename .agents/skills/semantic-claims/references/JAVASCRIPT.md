# JavaScript and TypeScript Conventions

These conventions define how the `semantic-claims` checker links Markdown claim documents to JavaScript and TypeScript proof files. They supplement the model's [detailed reference](../SKILL.md).

The file pairing, identifiers, exact titles, and test structure below are required when using the supplied checker.

## File pairing

Each claim document pairs with exactly one proof file in the same directory. The files share the same name through the claim kind:

- `name.invariants.md` pairs with `name.invariants.test.ts`, `name.invariants.test.mjs`, or `name.invariants.test.js`.
- `name.scenarios.md` pairs with `name.scenarios.test.ts`, `name.scenarios.test.mjs`, or `name.scenarios.test.js`.

`name` must contain at least one character. Exactly one supported proof extension may exist for a claim document; multiple matching proof files are ambiguous. A proof file without its matching claim document is also invalid.

Cross-cutting claim documents use the same pairing rule and retain their `--` prefix:

```text
--filtered-search.invariants.md
--filtered-search.invariants.test.ts
```

These conventions apply to ESM JavaScript and TypeScript projects.

## Claim document structure

A claim document follows the format defined in the [reference](../SKILL.md#document-structure), including a system heading and a statement for every claim.

For structural validation, the checker recognizes section and claim headings outside fenced code blocks:

```md
# Account service

An email address is *registered* if an account uses the email address.

## §1 Password reset

### §1.1 A reset request sends a reset link

WHEN a password reset is requested for a registered email address, the account service SHALL send a reset link to the email address.
```

Each document must contain:

- a `#` heading with its system's name;
- at least one `## §N Title` section with a nonempty title;
- at least one `### §N.M Title` claim with a nonempty title;
- a unique identifier for every section and claim;
- a declared section whose identifier matches the first component of each claim identifier.

For example, claim `§2.3` belongs to section `§2`.

A claim document contains no backtick, in its headings, introduction, or statements.

Each claim statement must match an [EARS pattern](../SKILL.md#claim-kinds) of its document's kind. The checker rejects a statement that breaks one of these rules, applied outside code spans:

- every statement is nonempty and contains `SHALL`;
- the words before the first `SHALL` end with `the` and the claim document's `#` heading, ignoring capitalization, where `the` begins the statement or follows `, ` or `THEN `;
- outside its system name, a statement contains `where`, `while`, `when`, `if`, `then`, and `shall` only as uppercase keywords, and never contains `whenever`;
- outside its system name, a statement uses `exactly` or `each` in place of `only`;
- a statement follows `[WHERE <feature>, ][WHILE <state>, ][WHEN <trigger>, | IF <trigger>, THEN ]the <system name> SHALL <system response>`, where each slot is nonempty and contains none of the keywords `WHERE`, `WHILE`, `WHEN`, `IF`, `THEN`, and `SHALL`;
- an invariant statement contains neither `WHEN` nor `IF`, and a scenario statement contains one of them.

## Proof structure

A proof repeats each section identifier and title in a `describe` call. Each claim identifier and title appears in an `it` or `test` call nested inside the matching `describe` call.

For `account-service.scenarios.md`:

```md
# Account service

An email address is *registered* if an account uses the email address.

## §1 Password reset

### §1.1 A reset request sends a reset link

WHEN a password reset is requested for a registered email address, the account service SHALL send a reset link to the email address.
```

The paired `account-service.scenarios.test.ts` contains:

```ts
describe('§1 Password reset', () => {
  it('§1.1 A reset request sends a reset link', async () => {
    const sent: unknown[] = [];
    const service = createAccountService({
      accounts: ['ada@example.com'],
      send: (message) => sent.push(message),
    });

    await service.requestPasswordReset('ada@example.com');

    expect(sent).toContainEqual({ to: 'ada@example.com', resetLink: expect.any(String) });
  });
});
```

The checker applies these rules:

- Every `describe`, `it`, and `test` call in a recognized proof file must contain a recognized identifier and a nonempty title.
- Each section appears in exactly one `describe` call.
- Each claim appears in one or more executable `it` or `test` calls within its section.
- Repeated tests for one claim use the same identifier and title.
- Proof identifiers must exist in the paired claim document.
- Titles must match the paired Markdown headings exactly.

The structural separator between an identifier and title may be whitespace, `—`, `–`, `--`, `-`, or `:`. The separator is not part of the title and may differ between the claim document and proof.

Titles must be string literals or template literals without substitutions. Computed and interpolated titles cannot be linked. Calls marked with `.skip` or `.todo`, including calls inside a skipped or pending `describe`, do not count as executable proofs.

All `describe`, `it`, and `test` calls in a recognized proof file belong to its claim structure. Tests that do not prove claims belong in other test files.

## Validation scope

The validation command accepts zero, one, or both claim kinds:

```text
semantic-claims [invariants] [scenarios]
```

With no kind argument, both invariants and scenarios are checked. One kind argument limits validation to that kind. Both kinds may be supplied in either order. Any unsupported argument rejects the invocation before validation begins.

Validation starts at the current working directory and includes recognized files in its descendant directories. Directories whose names begin with `.` are skipped, as are `coverage`, `dist`, and `node_modules` directories.

A successful check exits with status `0` and reports the number of validated pairs for each selected kind. A structural mismatch or unsupported invocation produces a nonzero status.

## Validation boundary

The checker verifies file pairing, identifier hierarchy, title equality, proof nesting, statement patterns, and the presence of executable proof entries. It does not execute tests, inspect assertions, decide whether a statement's meaning matches its kind beyond its pattern, or decide whether a proof establishes its claim.

Complete verification therefore includes both commands:

```text
semantic-claims     -> validates claim-to-proof structure
project test runner -> executes proofs
```

Installation, package scripts, and supported runtimes are documented in the package README.
