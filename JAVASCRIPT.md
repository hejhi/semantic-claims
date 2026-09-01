# JavaScript and TypeScript Conventions

In JavaScript and TypeScript projects, each claim document pairs with one proof file. Section and claim headings are repeated as test titles, giving the checker a direct link between the claim and its executable proofs.

The checker verifies that link. The project's test runner executes the proofs.

## File pairs

A claim document and its proof use the same name:

| Claim document        | Proof file                                            |
| --------------------- | ----------------------------------------------------- |
| `name.invariants.md`  | `name.invariants.test.ts`, `.test.mjs`, or `.test.js` |
| `name.scenarios.md`   | `name.scenarios.test.ts`, `.test.mjs`, or `.test.js`  |

Cross-cutting claim documents follow the same pattern with a `--` prefix:

```text
--name.invariants.md
--name.invariants.test.ts
```

Each claim document has exactly one proof file. Providing both a TypeScript and JavaScript proof for the same document makes the pair ambiguous.

JavaScript proof files use ESM. The supported proof extensions are `.test.ts`, `.test.mjs`, and `.test.js`.

## Linking claims to tests

A section heading maps to a `describe` title. A claim heading maps to an `it` or `test` title.

Given this claim document:

```md
## §1 Endpoint inclusion

### §1.1 Both endpoints belong to the range

A value equal to either endpoint is included.
```

Its proof repeats the identifiers and titles:

```ts
describe('§1 Endpoint inclusion', () => {
  it('§1.1 Both endpoints belong to the range', () => {
    const range = createRange(2, 5);

    expect(range.includes(2)).toBe(true);
    expect(range.includes(5)).toBe(true);
  });
});
```

The wording after each identifier must match exactly. A separator such as `—`, `-`, or `:` may appear between the identifier and title in either file; the separator itself is not part of the title.

The claim proof belongs inside the `describe` block for its section. Several tests can prove the same claim by repeating its identifier and title.

Skipped and pending tests do not count as proofs. Test titles must be literal strings, because computed or interpolated titles cannot be linked reliably.

Every `describe`, `it`, and `test` call inside a named proof file is treated as part of the claim structure. Ordinary tests therefore belong in separate test files.

## Checking the links

The checker verifies:

- that every claim document has one proof file, and every proof file has one claim document;
- that section and claim identifiers exist and have titles;
- that proof titles match their claim headings;
- that each claim proof appears under the correct section;
- that every claim has at least one executable proof.

It does not run the proofs or decide whether they test the claimed behavior adequately. Those checks remain separate:

```text
semantic-claims     -> checks claim-to-proof links
project test runner -> executes proofs
```

Running `semantic-claims` checks invariants and scenarios. `semantic-claims invariants` and `semantic-claims scenarios` check one kind at a time.

The package README contains installation instructions, package scripts, and current runtime support.
