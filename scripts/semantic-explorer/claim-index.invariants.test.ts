import { describe, expect, test } from 'bun:test';
import { buildExplorerModel } from './model.mjs';
import { withFixture } from './test-fixture';

describe('§1 — Claims and proofs', () => {
  test('§1.1 — Every named claim appears once under its subject', async () => {
    await withFixture(async (root) => {
      const model = await buildExplorerModel(root);

      expect(model.subjects.map(({ id }) => id)).toEqual([
        'src/--checkout',
        'src/orders',
        'src/temp/returns',
      ]);
      expect(model.claims).toHaveLength(4);
      expect(new Set(model.claims.map(({ key }) => key)).size).toBe(4);

      const invariant = model.claims.find(
        ({ kind }) => kind === 'invariant',
      );
      expect(invariant).toMatchObject({
        id: '1.1',
        kind: 'invariant',
        seam: false,
        subjectId: 'src/orders',
        title: 'Completed orders remain visible',
        statement:
          'The completed order remains visible while its receipt is prepared.',
        claimDocument: {
          line: 5,
          path: 'src/orders.invariants.md',
        },
      });

      const seam = model.claims.find(({ seam }) => seam);
      expect(seam).toMatchObject({
        kind: 'scenario',
        subjectId: 'src/--checkout',
        title: 'Accepted payment reaches order creation',
      });
    });
  });

  test('§1.2 — Every claim lists exactly its matching executable proofs', async () => {
    await withFixture(async (root) => {
      const model = await buildExplorerModel(root);
      const invariant = model.claims.find(
        ({ kind }) => kind === 'invariant',
      );
      const cancellation = model.claims.find(
        ({ title }) => title === 'Cancellation precedes reimbursement',
      );

      expect(invariant?.proofs).toEqual([
        { line: 2, path: 'src/orders.invariants.test.ts' },
        { line: 3, path: 'src/orders.invariants.test.ts' },
      ]);
      expect(cancellation?.proofs).toEqual([
        { line: 2, path: 'src/orders.scenarios.test.mjs' },
      ]);
      expect(
        cancellation?.proofs.some(({ path: proofPath }) =>
          proofPath.includes('invariants'),
        ),
      ).toBe(false);
    });
  });
});
