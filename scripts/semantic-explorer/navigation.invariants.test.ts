import { describe, expect, test } from 'bun:test';
import { buildExplorerModel } from './model.mjs';
import { createExplorerServer } from './server.mjs';
import { withFixture } from './test-fixture';

describe('§1 — Exploration lenses', () => {
  test('§1.1 — Users can explore semantics by subject, claim kind, cross-cutting status, and text', async () => {
    await withFixture(async (root) => {
      const explorer = await createExplorerServer({ root });
      try {
        const subjects = await fetch(explorer.url).then((response) =>
          response.text(),
        );
        expect(subjects).toContain('data-subject-id="src/orders"');
        expect(subjects).toContain('data-subject-id="src/--checkout"');

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

        const seams = await fetch(
          `${explorer.url}?ownership=seam`,
        ).then((response) => response.text());
        expect(seams).toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );
        expect(seams).not.toContain(
          'data-claim-title="Completed orders remain visible"',
        );

        const local = await fetch(
          `${explorer.url}?ownership=local`,
        ).then((response) => response.text());
        expect(local).toContain(
          'data-claim-title="Completed orders remain visible"',
        );
        expect(local).not.toContain(
          'data-claim-title="Accepted payment reaches order creation"',
        );
        expect(subjects).toContain('href="/?ownership=local"');

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
          `${explorer.url}?q=${encodeURIComponent('1.7')}`,
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
        expect(subjectSearch).toContain(
          'name="subject" value="src/orders"',
        );
        expect(subjectSearch).toContain(
          'data-clear-href="/?subject=src%2Forders&amp;view=claims"',
        );

        const model = await buildExplorerModel(root);
        const selectedClaim = model.claims.find(
          ({ title }) => title === 'Cancellation precedes reimbursement',
        );
        const detail = await fetch(
          `${explorer.url}?claim=${encodeURIComponent(selectedClaim!.key)}`,
        ).then((response) => response.text());
        expect(detail).toContain(
          'After an order is cancelled, reimbursement begins before its receipt is archived.',
        );
        expect(detail).toContain('src/orders.scenarios.md:5');
        expect(detail).toContain('src/orders.scenarios.test.mjs:2');
      } finally {
        await explorer.close();
      }
    });
  });
});
