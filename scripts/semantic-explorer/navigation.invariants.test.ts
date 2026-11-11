import { describe, expect, test } from 'bun:test';
import { createExplorerServer } from './server.mjs';
import { withFixture } from './test-fixture';

describe('§1 — Exploration lenses', () => {
  test('§1.1 — The start page lists every subject', async () => {
    await withFixture(async (root) => {
      const explorer = await createExplorerServer({ root });
      try {
        const subjects = await fetch(explorer.url).then((response) =>
          response.text(),
        );
        expect(subjects).toContain('data-subject-id="src/orders"');
        expect(subjects).toContain('data-subject-id="src/--checkout"');
        expect(subjects).toContain('data-subject-id="src/temp/returns"');
      } finally {
        await explorer.close();
      }
    });
  });

  test('§1.2 — Selected filters show exactly the matching claims', async () => {
    await withFixture(async (root) => {
      const explorer = await createExplorerServer({ root });
      try {
        const subject = await fetch(
          `${explorer.url}?subject=${encodeURIComponent('src/orders')}`,
        ).then((response) => response.text());
        expect(subject).toContain(
          'data-claim-title="Completed orders remain visible"',
        );
        expect(subject).toContain(
          'data-claim-title="Cancellation precedes reimbursement"',
        );
        expect(subject).not.toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );

        const invariants = await fetch(
          `${explorer.url}?kind=invariant`,
        ).then((response) => response.text());
        expect(invariants).toContain(
          'data-claim-title="Completed orders remain visible"',
        );
        expect(invariants).not.toContain(
          'data-claim-title="Cancellation precedes reimbursement"',
        );

        const crossCutting = await fetch(
          `${explorer.url}?scope=cross-cutting`,
        ).then((response) => response.text());
        expect(crossCutting).toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );
        expect(crossCutting).not.toContain(
          'data-claim-title="Completed orders remain visible"',
        );

        const local = await fetch(
          `${explorer.url}?scope=local`,
        ).then((response) => response.text());
        expect(local).toContain(
          'data-claim-title="Completed orders remain visible"',
        );
        expect(local).not.toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );

        const search = await fetch(
          `${explorer.url}?q=${encodeURIComponent('rare semantic phrase')}`,
        ).then((response) => response.text());
        expect(search).toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );
        expect(search).not.toContain(
          'data-claim-title="Cancellation precedes reimbursement"',
        );

        const subjectMatch = await fetch(
          `${explorer.url}?q=${encodeURIComponent('checkout')}`,
        ).then((response) => response.text());
        expect(subjectMatch).toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );
        expect(subjectMatch).not.toContain(
          'data-claim-title="Completed orders remain visible"',
        );

        const identifierMatch = await fetch(
          `${explorer.url}?q=${encodeURIComponent(' 1.7 ')}`,
        ).then((response) => response.text());
        expect(identifierMatch).toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );
        expect(identifierMatch).not.toContain(
          'data-claim-title="Completed orders remain visible"',
        );

        const titleMatch = await fetch(
          `${explorer.url}?q=${encodeURIComponent('Cancellation precedes reimbursement')}`,
        ).then((response) => response.text());
        expect(titleMatch).toContain(
          'data-claim-title="Cancellation precedes reimbursement"',
        );
        expect(titleMatch).not.toContain(
          'data-claim-title="Completed orders remain visible"',
        );

        const subjectSearch = await fetch(
          `${explorer.url}?subject=${encodeURIComponent('src/orders')}&q=${encodeURIComponent('receipt')}`,
        ).then((response) => response.text());
        expect(subjectSearch).toContain(
          'data-claim-title="Completed orders remain visible"',
        );
        expect(subjectSearch).not.toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );
      } finally {
        await explorer.close();
      }
    });
  });

  test('§1.3 — An open claim shows its statement, proofs, and source', async () => {
    await withFixture(async (root) => {
      const explorer = await createExplorerServer({ root });
      try {
        const detail = await fetch(
          `${explorer.url}?claim=${encodeURIComponent('src/orders:invariant:1.1')}`,
        ).then((response) => response.text());
        expect(detail).toContain(
          'The order list SHALL include every completed order and its receipt.',
        );
        expect(detail).toContain('src/orders.invariants.md:5');
        expect(detail).toContain('src/orders.invariants.test.ts:2');
        expect(detail).toContain('src/orders.invariants.test.ts:3');
      } finally {
        await explorer.close();
      }
    });
  });
});
